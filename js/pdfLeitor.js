function caminhoAbsoluto(caminhoRelativo) {
  return new URL(caminhoRelativo, document.baseURI).href;
}

function garantirWorkerConfigurado() {
  if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = caminhoAbsoluto("vendor/pdfjs/pdf.worker.min.js");
  }
}

/**
 * Extrai o texto de um PDF (Blob/File), inteiramente no aparelho. Diferente
 * da foto+OCR, aqui o PDF tem uma camada de texto real (não é imagem
 * escaneada), então a extração é exata — sem ruído de reconhecimento.
 */
export async function lerTextoDoPdf(arquivoOuBlob) {
  garantirWorkerConfigurado();
  const dados = await arquivoOuBlob.arrayBuffer();
  const documento = await window.pdfjsLib.getDocument({ data: dados }).promise;

  let textoCompleto = "";
  for (let i = 1; i <= documento.numPages; i++) {
    const pagina = await documento.getPage(i);
    const conteudo = await pagina.getTextContent();
    textoCompleto += conteudo.items.map((item) => item.str).join(" ") + "\n";
  }
  return textoCompleto;
}
