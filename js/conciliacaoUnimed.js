import { extrairLinhasDoInforme } from "./parsers/informeProducao.js";
import { listarProcedimentos } from "./db.js";

// Consulta em consultório é um atendimento separado do procedimento —
// não deve contar como pagamento nem aparecer na conciliação de forma alguma.
const CODIGO_CONSULTA = "10101012";

/**
 * Cruza o informe pela carteira do beneficiário com os procedimentos Unimed
 * já salvos e, pra cada procedimento cuja carteira aparece no informe,
 * mostra código a código se foi pago (e com a quantidade certa) ou não —
 * não basta bater a carteira, cada código do procedimento é conferido
 * separadamente, porque o mesmo beneficiário pode ter mais de um
 * procedimento, e nem sempre um informe traz todos os códigos de uma vez.
 */
export async function analisarInforme(textoInforme) {
  const linhas = extrairLinhasDoInforme(textoInforme).filter((l) => l.codigo !== CODIGO_CONSULTA);

  const porCarteira = new Map();
  for (const l of linhas) {
    if (!porCarteira.has(l.carteira)) porCarteira.set(l.carteira, []);
    porCarteira.get(l.carteira).push(l);
  }

  const todos = await listarProcedimentos();
  const resultado = [];

  for (const p of todos) {
    if (p.fontePagadora !== "Unimed" || !p.carteiraBeneficiario) continue;

    const linhasDaCarteira = porCarteira.get(p.carteiraBeneficiario);
    if (!linhasDaCarteira) continue;

    const porCodigo = new Map();
    for (const l of linhasDaCarteira) {
      if (!porCodigo.has(l.codigo)) porCodigo.set(l.codigo, []);
      porCodigo.get(l.codigo).push(l);
    }

    const codigosRegistrados = new Set((p.codigos || []).map((c) => c.codigo));

    const codigosVerificados = (p.codigos || []).map((c) => {
      const linhasBatendo = porCodigo.get(c.codigo) || [];
      const quantidadePaga = linhasBatendo.reduce((soma, l) => soma + (l.qtd || 0), 0);
      return {
        codigo: c.codigo,
        descricaoOficial: c.descricaoOficial,
        quantidadeRegistrada: c.quantidade,
        quantidadePaga,
        pago: linhasBatendo.length > 0,
        completo: linhasBatendo.length > 0 && quantidadePaga >= c.quantidade,
        linhas: linhasBatendo,
      };
    });

    const totalmentePago = codigosVerificados.length > 0 && codigosVerificados.every((c) => c.completo);

    // Linhas desse beneficiário no informe que não correspondem a nenhum
    // código deste procedimento — normalmente uma consulta em consultório
    // ou outro atendimento, que não deve ser confundido com o procedimento.
    const linhasNaoRelacionadas = linhasDaCarteira.filter((l) => !codigosRegistrados.has(l.codigo));

    resultado.push({ procedimento: p, codigosVerificados, totalmentePago, linhasNaoRelacionadas });
  }

  return resultado;
}
