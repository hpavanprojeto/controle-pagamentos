import { extrairCodigosDoTexto, contemPacote } from "./extrairCodigos.js";

/**
 * Tela do MV (Tacchini): Tacchini + Tacchimed = Tacchimed.
 * Tacchini + qualquer outro convênio (inclusive SUS) = Hospital Tacchini.
 */
export async function interpretarTacchini(texto) {
  const avisos = [];

  const paciente = extrairPaciente(texto);
  const convenio = extrairConvenio(texto);
  const data = extrairData(texto);
  const codigos = await extrairCodigosDoTexto(texto);
  const pacote = contemPacote(texto);

  if (!paciente) avisos.push("Não consegui identificar o paciente automaticamente — confira o nome.");
  if (!convenio) avisos.push("Não consegui identificar o convênio automaticamente — confira antes de salvar.");
  if (!data) avisos.push("Não consegui identificar a data automaticamente — confira a data.");
  if (codigos.length === 0) avisos.push("Não identifiquei nenhum código de procedimento — adicione manualmente.");
  if (pacote && codigos.length > 1) {
    avisos.push(
      "Identifiquei um código de pacote junto com outros códigos — se o pagamento é só pelo pacote, remova os demais códigos da lista."
    );
  } else if (pacote) {
    avisos.push("Identifiquei um código de pacote — confira se a marcação \"Pacote\" está correta.");
  }

  const fontePagadora = convenio ? (convenio.toUpperCase().includes("TACCHIMED") ? "Tacchimed" : "Hospital Tacchini") : null;

  return {
    paciente,
    hospital: "Tacchini",
    convenio: convenio || "",
    fontePagadora,
    data,
    codigos,
    pacote,
    avisos,
  };
}

/** Corta o valor capturado assim que aparece o próximo rótulo colado ("Palavra:") ou espaço duplo. */
function cortarNoProximoRotulo(valor) {
  const corte = valor.search(/\s{2,}|\b[A-ZÀ-ÿ][a-zà-ÿ]{2,}\s*[:.]/);
  return corte > 1 ? valor.slice(0, corte) : valor;
}

function extrairPaciente(texto) {
  const m = texto.match(/cliente\s*[:.]?\s*\d+[\d/\w]*\s+([A-ZÀ-ÿ][A-ZÀ-ÿ\s]{3,60})/i);
  if (!m) return null;
  const valor = m[1].split(/\bdata\b/i)[0];
  return limparNome(valor);
}

function limparNome(bruto) {
  const limpo = bruto
    .split("\n")[0]
    .replace(/[^A-Za-zÀ-ÿ\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  return limpo.length >= 3 ? limpo : null;
}

function extrairConvenio(texto) {
  const m = texto.match(/conv[eéê]nio\s*[:.]?\s*([^\n]{2,60})/i);
  if (!m) return null;

  const valor = cortarNoProximoRotulo(m[1]).trim();

  return valor.length >= 2 ? valor.toUpperCase() : null;
}

function extrairData(texto) {
  const comRotulo = texto.match(/data\s*in[ií]cio\s*[:.]?\s*(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})/i);
  const m = comRotulo || texto.match(/(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})/);
  if (!m) return null;
  const [, dia, mes, ano] = m;
  return `${ano}-${mes}-${dia}`;
}
