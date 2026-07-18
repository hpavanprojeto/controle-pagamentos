import { contarProcedimentos } from "../db.js";
import { totalDeCodigos } from "../cbhpm.js";
import { exportarBackup, importarBackup } from "../backup.js";
import { mostrarToast } from "../toast.js";
import { lerTextoDoPdf } from "../pdfLeitor.js";
import { encontrarCandidatosDePagamento } from "../conciliacaoUnimed.js";
import { abrirConciliacaoInforme } from "./conciliarInforme.js";

export async function render(app) {
  const totalProcedimentos = await contarProcedimentos();
  const totalCbhpm = await totalDeCodigos();

  app.innerHTML = `
    <div class="tela">
      <div class="topo">
        <button class="botao-voltar" onclick="location.hash='#/'">‹</button>
        <h1>Configurações</h1>
      </div>

      <div class="secao-titulo">Dados</div>
      <div class="item-codigo">
        <p><strong>Procedimentos cadastrados:</strong> ${totalProcedimentos}</p>
        <p><strong>Tabela CBHPM:</strong> ${totalCbhpm} códigos</p>
      </div>

      <div class="secao-titulo">Backup</div>
      <p style="font-size:13px;color:var(--cor-texto-secundario)">
        Os dados ficam salvos apenas neste iPhone. Não há sincronização automática com a nuvem —
        faça backup regularmente para não correr risco de perda de dados.
      </p>
      <button class="botao-secundario" id="btn-exportar" style="margin-top:10px">⬇️ Exportar backup</button>
      <label class="botao-secundario" style="display:block;text-align:center;margin-top:10px">
        ⬆️ Importar backup
        <input type="file" accept="application/json" id="input-importar" style="display:none">
      </label>

      <div class="secao-titulo">Conciliar pagamentos (Unimed)</div>
      <p style="font-size:13px;color:var(--cor-texto-secundario)">
        Importe o informe de produção da Unimed (PDF) e o app marca sozinho como pagos os
        procedimentos pendentes cuja carteira do beneficiário e código aparecem no informe.
      </p>
      <label class="botao-secundario" style="display:block;text-align:center;margin-top:10px">
        📄 Importar informe de produção (PDF)
        <input type="file" accept="application/pdf" id="input-informe" style="display:none">
      </label>
      <p id="erro-informe" style="font-size:12px;color:var(--cor-perigo);margin-top:8px;word-break:break-word"></p>

      <div class="secao-titulo">Sobre</div>
      <div class="item-codigo">
        <p>Versão 1.0 — cadastro manual</p>
        <p style="font-size:13px;color:var(--cor-texto-secundario)">Funciona 100% offline. Todos os dados permanecem apenas neste aparelho.</p>
      </div>
    </div>
  `;

  app.querySelector("#btn-exportar").addEventListener("click", async () => {
    await exportarBackup();
    mostrarToast("Backup exportado.");
  });

  app.querySelector("#input-importar").addEventListener("change", async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    if (!confirm("Importar este backup? Procedimentos com o mesmo ID serão substituídos.")) return;
    try {
      await importarBackup(arquivo);
      render(app);
    } catch (err) {
      mostrarToast("Erro ao importar: " + err.message);
    }
  });

  app.querySelector("#input-informe").addEventListener("change", async (e) => {
    const arquivo = e.target.files[0];
    e.target.value = "";
    if (!arquivo) return;

    const areaErro = app.querySelector("#erro-informe");
    areaErro.textContent = "";
    mostrarToast("Lendo o informe...");
    try {
      const texto = await lerTextoDoPdf(arquivo);
      const candidatos = await encontrarCandidatosDePagamento(texto);

      if (candidatos.length === 0) {
        mostrarToast("Nenhum procedimento pendente da Unimed bateu com esse informe.");
        return;
      }

      abrirConciliacaoInforme(candidatos, () => render(app));
    } catch (err) {
      console.error(err);
      mostrarToast("Não consegui ler esse PDF.");
      areaErro.textContent = `Detalhe técnico (pra me mandar): ${err.name || ""}: ${err.message || err}`;
    }
  });
}
