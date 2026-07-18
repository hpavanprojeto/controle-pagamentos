import { listarProcedimentos, salvarProcedimento } from "./db.js";
import { blobParaBase64, base64ParaBlob } from "./util.js";
import { mostrarToast } from "./toast.js";
import { compartilharArquivo } from "./compartilhar.js";

export async function exportarBackup() {
  const procedimentos = await listarProcedimentos();

  const paraExportar = await Promise.all(
    procedimentos.map(async (p) => ({
      ...p,
      fotoBase64: p.fotoBlob ? await blobParaBase64(p.fotoBlob) : null,
      fotoBlob: undefined,
    }))
  );

  const pacote = {
    app: "controle-de-pagamentos",
    versao: 1,
    exportadoEm: new Date().toISOString(),
    procedimentos: paraExportar,
  };

  const blob = new Blob([JSON.stringify(pacote)], { type: "application/json" });
  const dataFormatada = new Date().toISOString().slice(0, 10);
  await compartilharArquivo(blob, `backup-controle-pagamentos-${dataFormatada}.json`, "application/json");
}

export async function importarBackup(arquivo) {
  const texto = await arquivo.text();
  const pacote = JSON.parse(texto);

  if (!pacote || !Array.isArray(pacote.procedimentos)) {
    throw new Error("Arquivo de backup inválido.");
  }

  let importados = 0;
  for (const item of pacote.procedimentos) {
    const { fotoBase64, ...resto } = item;
    const procedimento = { ...resto };
    if (fotoBase64) {
      procedimento.fotoBlob = await base64ParaBlob(fotoBase64);
    }
    await salvarProcedimento(procedimento);
    importados++;
  }

  mostrarToast(`${importados} procedimento(s) importado(s).`);
  return importados;
}
