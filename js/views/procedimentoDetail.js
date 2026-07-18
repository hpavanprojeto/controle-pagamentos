import { buscarProcedimento, salvarProcedimento, excluirProcedimento } from "../db.js";
import { escapar, formatarDataCurta, agoraISO, confirmarExclusaoDigitandoNome } from "../util.js";
import { formatarCodigo } from "../cbhpm.js";
import { STATUS_PAGAMENTO } from "../fontePagadora.js";
import { mostrarToast } from "../toast.js";
import { ativarZoomFoto } from "../zoomFoto.js";
import { compartilharArquivo } from "../compartilhar.js";

export async function render(app, params) {
  const procedimento = await buscarProcedimento(params.id);
  if (!procedimento) {
    app.innerHTML = `<div class="tela"><p>Procedimento não encontrado.</p></div>`;
    return;
  }

  let fotoDataUrl = null;
  if (procedimento.fotoBlob) {
    fotoDataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(procedimento.fotoBlob);
    });
  }

  app.innerHTML = `
    <div class="tela">
      <div class="topo">
        <button class="botao-voltar" onclick="history.back()">‹</button>
        <h1>${escapar(procedimento.paciente)}</h1>
      </div>

      ${
        fotoDataUrl
          ? `<img src="${fotoDataUrl}" id="foto-procedimento" style="width:100%;border-radius:12px;margin-bottom:10px;max-height:260px;object-fit:cover;cursor:pointer">
             <button class="botao-secundario" id="btn-compartilhar-foto" style="margin-bottom:20px">📤 Compartilhar / Salvar foto</button>`
          : ""
      }

      <div class="secao-titulo">Dados</div>
      <div class="item-codigo">
        <p><strong>Hospital:</strong> ${escapar(procedimento.hospital)}</p>
        ${procedimento.convenio ? `<p><strong>Convênio:</strong> ${escapar(procedimento.convenio)}</p>` : ""}
        <p><strong>Fonte pagadora:</strong> ${escapar(procedimento.fontePagadora)}</p>
        ${
          procedimento.carteiraBeneficiario
            ? `<p><strong>Carteira do beneficiário:</strong> ${escapar(procedimento.carteiraBeneficiario)}</p>`
            : ""
        }
        ${
          procedimento.fontePagadora === "Tacchimed" && (procedimento.pacote === true || procedimento.pacote === false)
            ? `<p><strong>Pacote:</strong> ${procedimento.pacote ? "Sim 📦" : "Não"}</p>`
            : ""
        }
        <p><strong>Data:</strong> ${formatarDataCurta(procedimento.data)}</p>
      </div>

      <div class="secao-titulo">Status de pagamento</div>
      <div class="segmentado" id="segmentado-status">
        ${STATUS_PAGAMENTO.map((s) => `<button type="button" data-status="${s}" class="${procedimento.status === s ? "ativo" : ""}">${s}</button>`).join("")}
      </div>

      <div class="secao-titulo">Códigos</div>
      <div class="lista-codigos">
        ${procedimento.codigos
          .map(
            (c) => `
          <div class="item-codigo">
            <div class="codigo">${formatarCodigo(c.codigo)}</div>
            <div class="descricao">${escapar(c.descricaoOficial)}</div>
            <div style="font-size:13px;color:var(--cor-texto-secundario)">Quantidade: ${c.quantidade}</div>
          </div>`
          )
          .join("")}
      </div>

      ${
        procedimento.observacoes
          ? `<div class="secao-titulo">Observações</div><p>${escapar(procedimento.observacoes)}</p>`
          : ""
      }

      <div class="barra-inferior">
        <button class="botao-texto" id="btn-editar">Editar</button>
        <button class="botao-primario" style="background:var(--cor-perigo)" id="btn-excluir">Excluir</button>
      </div>
    </div>
  `;

  app.querySelectorAll("#segmentado-status button").forEach((btn) =>
    btn.addEventListener("click", async () => {
      procedimento.status = btn.dataset.status;
      procedimento.atualizadoEm = agoraISO();
      await salvarProcedimento(procedimento);
      app.querySelectorAll("#segmentado-status button").forEach((b) => b.classList.toggle("ativo", b === btn));
      mostrarToast("Status atualizado.");
    })
  );

  app.querySelector("#btn-compartilhar-foto")?.addEventListener("click", async () => {
    await compartilharOuBaixarFoto(procedimento.fotoBlob, procedimento.paciente);
  });

  app.querySelector("#foto-procedimento")?.addEventListener("click", () => {
    abrirFotoEmTelaCheia(fotoDataUrl, procedimento.fotoBlob, procedimento.paciente);
  });

  app.querySelector("#btn-editar").addEventListener("click", () => {
    location.hash = `#/editar/${procedimento.id}`;
  });

  app.querySelector("#btn-excluir").addEventListener("click", async () => {
    if (!confirmarExclusaoDigitandoNome(procedimento.paciente)) {
      mostrarToast("Exclusão cancelada.");
      return;
    }
    await excluirProcedimento(procedimento.id);
    mostrarToast("Procedimento excluído.");
    location.hash = "#/procedimentos";
  });
}

function abrirFotoEmTelaCheia(fotoDataUrl, fotoBlob, nomePaciente) {
  const overlay = document.createElement("div");
  overlay.className = "overlay-foto";
  overlay.innerHTML = `
    <button class="botao-fechar-foto" id="btn-fechar-foto-cheia" aria-label="Fechar">✕</button>
    <img src="${fotoDataUrl}" alt="Foto do procedimento">
    <div class="barra-foto-cheia">
      <button class="botao-secundario" id="btn-compartilhar-foto-cheia">📤 Compartilhar / Salvar foto</button>
      <p style="text-align:center;font-size:12px;color:var(--cor-texto-secundario);margin-top:10px">
        Dica: toque e segure a foto para salvar direto na galeria
      </p>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector("#btn-fechar-foto-cheia").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector("#btn-compartilhar-foto-cheia").addEventListener("click", () => {
    compartilharOuBaixarFoto(fotoBlob, nomePaciente);
  });

  ativarZoomFoto(overlay.querySelector("img"), overlay);
}

async function compartilharOuBaixarFoto(fotoBlob, nomePaciente) {
  const nomeArquivo = `foto-${(nomePaciente || "procedimento").replace(/\s+/g, "-").toLowerCase()}.jpg`;
  await compartilharArquivo(fotoBlob, nomeArquivo, fotoBlob.type || "image/jpeg");
}
