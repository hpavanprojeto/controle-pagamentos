let workerPromise = null;
let callbackDeProgresso = null;

function caminhoAbsoluto(caminhoRelativo) {
  return new URL(caminhoRelativo, document.baseURI).href;
}

function obterWorker() {
  if (!workerPromise) {
    workerPromise = window.Tesseract.createWorker("por", 1, {
      workerPath: caminhoAbsoluto("vendor/tesseract/worker.min.js"),
      corePath: caminhoAbsoluto("vendor/tesseract/tesseract-core.wasm.js"),
      langPath: caminhoAbsoluto("vendor/tesseract/lang-data"),
      gzip: false,
      logger: (m) => {
        if (callbackDeProgresso && m.status === "recognizing text") callbackDeProgresso(m.progress);
      },
    }).then(async (worker) => {
      // PSM 6 = trata a página como um bloco único de texto, lido de forma
      // mais linear. Formulários com tabelas/grades (como o RGO do Tacchini)
      // confundem o modo automático padrão, que tenta detectar colunas e
      // acaba pulando células inteiras da tabela.
      await worker.setParameters({ tessedit_pageseg_mode: "6" });
      return worker;
    });
  }
  return workerPromise;
}

/**
 * Reconhece o texto de uma imagem (Blob/File). Roda inteiramente no
 * aparelho, sem enviar a foto para nenhum servidor.
 */
export async function lerTextoDaImagem(imagemBlob, aoProgredir) {
  const worker = await obterWorker();
  callbackDeProgresso = aoProgredir || null;
  try {
    const {
      data: { text },
    } = await worker.recognize(imagemBlob);
    return text;
  } finally {
    callbackDeProgresso = null;
  }
}
