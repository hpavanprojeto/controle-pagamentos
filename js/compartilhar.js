import { mostrarToast } from "./toast.js";

/**
 * Compartilha um arquivo pelo menu nativo do iOS (Gmail, WhatsApp, Mensagens,
 * Arquivos, AirDrop, etc.). Se o navegador não suportar compartilhar arquivos,
 * cai para download direto (vai para o app Arquivos).
 */
export async function compartilharArquivo(blob, nomeArquivo, mimeType) {
  const arquivo = new File([blob], nomeArquivo, { type: mimeType || blob.type });

  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo] });
      return true;
    } catch (err) {
      if (err.name !== "AbortError") mostrarToast("Não consegui abrir o menu de compartilhamento.");
      return false;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}
