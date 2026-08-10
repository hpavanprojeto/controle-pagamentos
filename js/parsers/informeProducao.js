/**
 * Informe de Produção da Unimed: tabela com colunas
 * MÊS/ANO [EMPRESA] COOPERADO CPF NATUREZA DATA-REALIZAÇÃO CARTEIRA CÓDIGO
 * DESCRIÇÃO QTD VALOR GLOSA. Não tem o nome do paciente — só a carteira do
 * beneficiário, que é o que usamos pra cruzar com os procedimentos já
 * salvos no app.
 *
 * A extração do PDF junta o texto de cada célula com espaço, sem garantir
 * que uma linha da tabela vire uma linha de texto (nomes longos quebram em
 * mais de uma linha). Por isso, em vez de dividir por linha, procuramos
 * "âncoras" (data + carteira + código) direto no texto corrido — essa
 * sequência de 3 campos é específica o suficiente pra não dar falso positivo
 * em CPF, CNPJ ou valores em R$.
 *
 * Depois da âncora vem a descrição (só texto, sem dígitos nos relatórios
 * reais conferidos) e então QTD, VALOR e GLOSA — os 3 primeiros números que
 * aparecem já são esses campos, mesmo que sobre lixo de outra linha depois
 * (nome do próximo cooperado, CPF etc.) por causa da extração célula-a-célula.
 */
export function extrairLinhasDoInforme(texto) {
  const ANCORA = /(\d{4}-\d{2}-\d{2})\s+(\d{15,25})\s+(\d{6,9})\b/g;
  const ancoras = [...texto.matchAll(ANCORA)];
  const linhas = [];

  for (let i = 0; i < ancoras.length; i++) {
    const m = ancoras[i];
    const inicioResto = m.index + m[0].length;
    const fimResto = i + 1 < ancoras.length ? ancoras[i + 1].index : texto.length;
    const resto = texto.slice(inicioResto, fimResto);

    const mNumeros = resto.match(/(\d+)\s+([\d.,]+)\s+([\d.,]+)/);

    linhas.push({
      data: m[1],
      carteira: m[2],
      codigo: m[3],
      descricao: mNumeros ? resto.slice(0, mNumeros.index).replace(/\s+/g, " ").trim() : resto.trim(),
      qtd: mNumeros ? Number(mNumeros[1]) : null,
      valor: mNumeros ? mNumeros[2] : null,
      glosa: mNumeros ? mNumeros[3] : null,
    });
  }

  return linhas;
}
