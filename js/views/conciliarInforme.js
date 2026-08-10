import { escapar, formatarDataCurta, agoraISO, parseValorBR, formatarValorBR } from "../util.js";
import { formatarCodigo } from "../cbhpm.js";
import { salvarProcedimento } from "../db.js";
import { mostrarToast } from "../toast.js";
import { gerarPdfConciliacao } from "../pdfExport.js";
import { compartilharArquivo } from "../compartilhar.js";

function iconeCodigo(c) {
  if (c.completo) return "✅";
  if (c.pago) return "⚠️";
  return "❌";
}

function valorPagoDoCodigo(c) {
  return c.linhas.reduce((soma, l) => soma + parseValorBR(l.valor), 0);
}

function textoCodigo(c) {
  if (c.completo) {
    const qtd = c.quantidadeRegistrada > 1 ? ` — qtd ${c.quantidadePaga}/${c.quantidadeRegistrada}` : "";
    return `pago${qtd} — R$ ${formatarValorBR(valorPagoDoCodigo(c))}`;
  }
  if (c.pago) {
    return `pago parcialmente — qtd ${c.quantidadePaga}/${c.quantidadeRegistrada} — R$ ${formatarValorBR(valorPagoDoCodigo(c))}`;
  }
  return "não encontrado neste informe";
}

export function abrirConciliacaoInforme(resultados, aoConcluir) {
  const acionaveis = resultados.filter((r) => r.procedimento.status !== "Pago");

  const overlay = document.createElement("div");
  overlay.className = "overlay-modal";
  overlay.innerHTML = `
    <div class="tela">
      <div class="topo">
        <button class="botao-voltar" id="btn-fechar-conciliacao">Cancelar</button>
        <h1>Conciliação Unimed</h1>
      </div>
      <p style="font-size:13px;color:var(--cor-texto-secundario)">
        ${resultados.length} procedimento(s) com a carteira do beneficiário encontrada nesse informe.
        Confira código a código e desmarque o que não quiser marcar como pago.
      </p>
      <div id="lista-candidatos"></div>
      <div class="barra-inferior" style="display:flex;flex-direction:column;gap:8px">
        <button class="botao-secundario" id="btn-relatorio-conciliacao">📄 Gerar relatório (o que bateu e o que não bateu)</button>
        <button class="botao-primario" id="btn-confirmar-conciliacao">Marcar selecionados como pago</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const lista = overlay.querySelector("#lista-candidatos");
  lista.innerHTML = resultados
    .map((r, i) => {
      const jaEstaPago = r.procedimento.status === "Pago";
      const codigosHtml = r.codigosVerificados
        .map(
          (c) => `
        <div style="font-size:13px;margin-top:4px">
          ${iconeCodigo(c)} <span class="codigo">${formatarCodigo(c.codigo)}</span> — ${escapar(c.descricaoOficial)}
          <div style="color:var(--cor-texto-secundario);margin-left:20px">${textoCodigo(c)}</div>
        </div>`
        )
        .join("");

      const notaNaoRelacionadas =
        r.linhasNaoRelacionadas.length > 0
          ? `<div style="font-size:12px;color:var(--cor-texto-secundario);margin-top:6px;font-style:italic">
              Outras linhas dessa carteira no informe (não correspondem a nenhum código deste procedimento):
              ${r.linhasNaoRelacionadas.map((l) => `${escapar(l.descricao)} — R$ ${escapar(l.valor || "?")}`).join("; ")}
            </div>`
          : "";

      return `
      <label class="item-codigo" style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px">
        ${
          jaEstaPago
            ? `<span style="margin-top:4px">✔️</span>`
            : `<input type="checkbox" data-check="${i}" ${r.totalmentePago ? "checked" : ""} style="margin-top:4px">`
        }
        <div>
          <div style="font-weight:700">${escapar(r.procedimento.paciente)}</div>
          <div style="font-size:13px;color:var(--cor-texto-secundario)">
            ${formatarDataCurta(r.procedimento.data)} · Carteira: ${escapar(r.procedimento.carteiraBeneficiario)} ·
            ${jaEstaPago ? "já estava marcado como pago" : r.procedimento.status}
          </div>
          ${codigosHtml}
          ${notaNaoRelacionadas}
        </div>
      </label>`;
    })
    .join("");

  function fechar() {
    overlay.remove();
  }

  overlay.querySelector("#btn-fechar-conciliacao").addEventListener("click", fechar);

  overlay.querySelector("#btn-relatorio-conciliacao").addEventListener("click", async () => {
    const blob = gerarPdfConciliacao(resultados);
    await compartilharArquivo(blob, "conciliacao-unimed.pdf", "application/pdf");
  });

  overlay.querySelector("#btn-confirmar-conciliacao").addEventListener("click", async () => {
    const selecionados = acionaveis.filter((r) => {
      const i = resultados.indexOf(r);
      return overlay.querySelector(`[data-check="${i}"]`)?.checked;
    });

    if (selecionados.length === 0) {
      fechar();
      return;
    }

    for (const r of selecionados) {
      r.procedimento.status = "Pago";
      r.procedimento.atualizadoEm = agoraISO();
      await salvarProcedimento(r.procedimento);
    }

    fechar();
    mostrarToast(`${selecionados.length} procedimento(s) marcado(s) como pago.`);
    aoConcluir?.();
  });
}
