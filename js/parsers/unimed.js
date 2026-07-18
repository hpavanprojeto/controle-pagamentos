import { extrairCodigosDoTexto } from "./extrairCodigos.js";

/**
 * Relatório de Cirurgia da Unimed: hospital Unimed sempre recebe da
 * Unimed, então convênio não é necessário identificar.
 */
export async function interpretarUnimed(texto) {
  const avisos = [];

  const paciente = extrairPaciente(texto);
  const data = extrairData(texto);
  const codigos = await extrairCodigosDoTexto(texto);
  const carteiraBeneficiario = extrairCarteira(texto);

  if (!paciente) avisos.push("Não consegui identificar o paciente automaticamente — confira o nome.");
  if (!data) avisos.push("Não consegui identificar a data automaticamente — confira a data.");
  if (codigos.length === 0) avisos.push("Não identifiquei nenhum código de procedimento — adicione manualmente.");
  if (!carteiraBeneficiario) avisos.push("Não consegui identificar a carteira do beneficiário — confira.");

  return {
    paciente,
    hospital: "Unimed",
    convenio: "",
    fontePagadora: "Unimed",
    data,
    codigos,
    carteiraBeneficiario,
    avisos,
  };
}

/**
 * Formato típico: "Carteira do Beneficiário: 00410010010207674     - Nro do Protocolo da Guia:"
 */
export function extrairCarteira(texto) {
  const m = texto.match(/carteira[^\n\d]{0,40}?(\d[\d\s]{3,30}\d)/i);
  if (!m) return null;
  const digitos = m[1].replace(/\s+/g, "");
  return digitos.length >= 5 ? digitos : null;
}

function extrairPaciente(texto) {
  const linha = texto.split("\n").find((l) => /paciente/i.test(l));
  if (!linha) return null;

  // Formato típico: "Paciente: 000195607 / DMJ5465 - IRIS GUBERT - Leito: 609 B"
  // O nome fica no trecho entre o primeiro " - " e o " - Leito".
  const partes = linha.split(/\s-\s/);
  const indiceLeito = partes.findIndex((p) => /leito/i.test(p));
  if (indiceLeito > 0) {
    return limparNome(partes[indiceLeito - 1]);
  }
  if (partes.length > 1) {
    return limparNome(partes[1]);
  }

  const simples = linha.match(/paciente\s*[:.]?\s*(.+)/i);
  if (simples) return limparNome(simples[1].split(/\s{2,}/)[0]);

  return null;
}

function limparNome(bruto) {
  const limpo = bruto
    .replace(/[^A-Za-zÀ-ÿ\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  return limpo.length >= 3 ? limpo : null;
}

function extrairData(texto) {
  const m = texto.match(/data\s*[:.]?\s*(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})/i);
  if (!m) return null;
  const [, dia, mes, ano] = m;
  return `${ano}-${mes}-${dia}`;
}
