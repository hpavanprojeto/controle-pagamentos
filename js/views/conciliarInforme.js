import { escapar, formatarDataCurta, agoraISO } from "../util.js";
import { formatarCodigo } from "../cbhpm.js";
import { salvarProcedimento } from "../db.js";
import { mostrarToast } from "../toast.js";

export function abrirConciliacaoInforme(candidatos, aoConcluir) {
  const overlay = document.createElement("div");
  overlay.className = "overlay-modal";
  overlay.innerHTML = `
    <div class="tela">
      <div class="topo">
        <button class="botao-voltar" id="btn-fechar-conciliacao">Cancelar</button>
        <h1>Confirmar pagamentos</h1>
      </div>
      <p style="font-size:13px;color:var(--cor-texto-secundario)">
        ${candidatos.length} procedimento(s) pendente(s) da Unimed batem com esse informe
        (mesma carteira e mesmo código). Desmarque o que não quiser marcar como pago.
      </p>
      <div id="lista-candidatos"></div>
      <div class="barra-inferior">
        <button class="botao-primario" id="btn-confirmar-conciliacao">Marcar como pago</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const lista = overlay.querySelector("#lista-candidatos");
  lista.innerHTML = candidatos
    .map(
      (cand, i) => `
    <label class="item-codigo" style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px">
      <input type="checkbox" data-check="${i}" checked style="margin-top:4px">
      <div>
        <div style="font-weight:700">${escapar(cand.procedimento.paciente)}</div>
        <div style="font-size:13px;color:var(--cor-texto-secundario)">${formatarDataCurta(cand.procedimento.data)}</div>
        ${cand.linhasBatendo
          .map(
            (l) => `
          <div style="font-size:13px;margin-top:4px">
            <span class="codigo">${formatarCodigo(l.codigo)}</span>${l.valor ? ` — R$ ${escapar(l.valor)}` : ""}
          </div>`
          )
          .join("")}
      </div>
    </label>`
    )
    .join("");

  function fechar() {
    overlay.remove();
  }

  overlay.querySelector("#btn-fechar-conciliacao").addEventListener("click", fechar);

  overlay.querySelector("#btn-confirmar-conciliacao").addEventListener("click", async () => {
    const selecionados = candidatos.filter((_, i) => overlay.querySelector(`[data-check="${i}"]`).checked);

    if (selecionados.length === 0) {
      fechar();
      return;
    }

    for (const cand of selecionados) {
      cand.procedimento.status = "Pago";
      cand.procedimento.atualizadoEm = agoraISO();
      await salvarProcedimento(cand.procedimento);
    }

    fechar();
    mostrarToast(`${selecionados.length} procedimento(s) marcado(s) como pago.`);
    aoConcluir?.();
  });
}
