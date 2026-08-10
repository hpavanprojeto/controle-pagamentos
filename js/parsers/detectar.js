/**
 * Identifica qual modelo de relatório foi fotografado, procurando pelo
 * nome do hospital no texto reconhecido.
 */
export function detectarModelo(texto) {
  const maiusculo = texto.toUpperCase();
  if (maiusculo.includes("TACCHINI")) return "tacchini";
  if (maiusculo.includes("UNIMED")) return "unimed";
  return null;
}
