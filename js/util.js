export function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

export function gerarId() {
  return crypto.randomUUID();
}

export function agoraISO() {
  return new Date().toISOString();
}

export function formatarDataCurta(isoDate) {
  if (!isoDate) return "—";
  const [ano, mes, dia] = isoDate.split("-");
  if (!ano) return "—";
  return `${dia}/${mes}/${ano}`;
}

export function hojeISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

export function blobParaBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function base64ParaBlob(dataUrl) {
  const resp = await fetch(dataUrl);
  return resp.blob();
}

/**
 * Exclusão de procedimento é irreversível e apaga a conferência do laudo,
 * então em vez de um simples "OK/Cancelar" (fácil de confirmar sem
 * pensar), pede pra digitar o nome do paciente antes de apagar.
 */
export function confirmarExclusaoDigitandoNome(nomePaciente) {
  const digitado = prompt(`Para excluir, digite o nome do paciente:\n"${nomePaciente}"`);
  if (digitado === null) return false;
  return digitado.trim().toUpperCase() === (nomePaciente || "").trim().toUpperCase();
}
