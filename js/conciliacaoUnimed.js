import { extrairLinhasDoInforme } from "./parsers/informeProducao.js";
import { listarProcedimentos } from "./db.js";

/**
 * Cruza as linhas do informe (carteira + código) com os procedimentos
 * Unimed ainda pendentes que têm a mesma carteira e o mesmo código —
 * não basta bater a carteira, porque o mesmo beneficiário pode ter mais
 * de um procedimento em datas diferentes.
 */
export async function encontrarCandidatosDePagamento(textoInforme) {
  const linhas = extrairLinhasDoInforme(textoInforme);
  const porChave = new Map();
  for (const l of linhas) {
    const chave = `${l.carteira}|${l.codigo}`;
    if (!porChave.has(chave)) porChave.set(chave, []);
    porChave.get(chave).push(l);
  }

  const todos = await listarProcedimentos();
  const candidatos = [];

  for (const p of todos) {
    if (p.fontePagadora !== "Unimed" || p.status !== "Pendente" || !p.carteiraBeneficiario) continue;

    const linhasBatendo = [];
    for (const c of p.codigos || []) {
      const chave = `${p.carteiraBeneficiario}|${c.codigo}`;
      if (porChave.has(chave)) linhasBatendo.push(...porChave.get(chave));
    }

    if (linhasBatendo.length > 0) {
      candidatos.push({ procedimento: p, linhasBatendo });
    }
  }

  return candidatos;
}
