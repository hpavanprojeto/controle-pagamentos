import { buscarPorCodigo } from "../cbhpm.js";
import { buscarPacote } from "../pacotes.js";

const TOKEN_8_RE = /\b[\dOoIlSsBb]{8}\b/g;
const TOKEN_6_RE = /\b[\dOoIlSsBb]{6}\b/g;
const MAPA_DIGITOS = { O: "0", o: "0", I: "1", l: "1", S: "5", s: "5", B: "8", b: "8" };

function normalizarToken(token) {
  return token.replace(/[OoIlSsBb]/g, (c) => MAPA_DIGITOS[c]);
}

/**
 * Varre o texto reconhecido em busca de:
 * 1) sequências de 8 dígitos que correspondam a um código real da tabela
 *    CBHPM (o nome sempre vem da tabela oficial, nunca da descrição escrita
 *    no relatório);
 * 2) códigos de 6 dígitos da tabela fixa de "Pacotes" do Tacchini (ex:
 *    447141 = Pacote Biópsia Renal) — reconhecidos mesmo que a palavra
 *    "Pacote" não apareça legível na foto, porque a tabela é pequena e
 *    conhecida de antemão;
 * 3) como último recurso, qualquer linha com a palavra "Pacote" que não
 *    bateu com a tabela fixa (pacote novo/desconhecido), usando a
 *    descrição escrita no relatório mesmo.
 * Também tenta achar a quantidade, seja pelo padrão "(X2)" (usado nos
 * relatórios da Unimed) seja por um número isolado logo após o código
 * (coluna "Nr. Vezes" do MV/Tacchini).
 */
export async function extrairCodigosDoTexto(texto) {
  const encontrados = new Map();
  const linhas = texto.split("\n");

  for (const linha of linhas) {
    await varrerToken(linha, TOKEN_8_RE, buscarPorCodigo, encontrados);
    await varrerToken(linha, TOKEN_6_RE, buscarPacote, encontrados);

    if (/pacote/i.test(linha)) {
      const infoPacote = extrairInfoPacote(linha);
      if (infoPacote && !(infoPacote.codigo && encontrados.has(infoPacote.codigo))) {
        const chave = infoPacote.codigo || `pacote:${infoPacote.descricao}`;
        if (!encontrados.has(chave)) {
          encontrados.set(chave, {
            codigo: infoPacote.codigo || "PACOTE",
            descricaoOficial: infoPacote.descricao,
            quantidade: 1,
            identificadoAutomaticamente: true,
          });
        }
      }
    }
  }

  return [...encontrados.values()];
}

async function varrerToken(linha, regex, buscarFn, encontrados) {
  regex.lastIndex = 0;
  let m;
  while ((m = regex.exec(linha))) {
    const codigo = normalizarToken(m[0]);
    const item = await buscarFn(codigo);
    if (!item) continue;

    const resto = linha.slice(m.index + m[0].length);
    const quantidade = extrairQuantidade(resto);

    if (!encontrados.has(codigo)) {
      encontrados.set(codigo, {
        codigo,
        descricaoOficial: item.descricao,
        quantidade: quantidade || 1,
        identificadoAutomaticamente: true,
      });
    } else if (quantidade) {
      encontrados.get(codigo).quantidade = quantidade;
    }
  }
}

/** Detecta se o texto do relatório indica um procedimento cobrado como pacote. */
export function contemPacote(texto) {
  if (/pacote/i.test(texto)) return true;
  return /\b44714[012]\b/.test(texto.replace(/[OoIlSsBb]/g, (c) => MAPA_DIGITOS[c]));
}

function extrairQuantidade(textoAposCodigo) {
  const padraoX = textoAposCodigo.match(/\(\s*[Xx]\s*(\d{1,2})\s*\)/);
  if (padraoX) return parseInt(padraoX[1], 10);

  const numeroIsolado = textoAposCodigo.match(/^[\s\-–—:]*\D*?\b([1-9])\b\s*$/);
  if (numeroIsolado) return parseInt(numeroIsolado[1], 10);

  return null;
}

function extrairInfoPacote(linha) {
  const mCodigo = linha.match(/\b(\d{5,7})\b/);
  const codigo = mCodigo ? mCodigo[1] : null;

  const mDescricao = linha.match(/pacote[\s\S]*$/i);
  let descricao = mDescricao
    ? mDescricao[0]
        .replace(/\.{2,}/g, "")
        .replace(/\s{2,}\d+\s*$/, "")
        .replace(/\b\d{5,7}\b/, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";
  if (descricao.length < 4) descricao = codigo ? `Pacote ${codigo}` : "";
  if (!descricao) return null;
  descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1);

  return { codigo, descricao };
}
