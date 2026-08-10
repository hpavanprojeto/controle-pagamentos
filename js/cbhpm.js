let cache = null;
let porCodigo = null;

async function carregar() {
  if (cache) return cache;
  const resp = await fetch("data/cbhpm.json");
  cache = await resp.json();
  porCodigo = new Map(cache.map((item) => [item.codigo, item]));
  return cache;
}

export function normalizarCodigo(bruto) {
  return (bruto || "").replace(/\D/g, "");
}

export function formatarCodigo(codigo) {
  if (!codigo || codigo.length !== 8) return codigo;
  const d = codigo;
  return `${d[0]}.${d[1]}${d[2]}.${d[3]}${d[4]}.${d[5]}${d[6]}-${d[7]}`;
}

function semAcento(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export async function buscarPorCodigo(codigoBruto) {
  await carregar();
  return porCodigo.get(normalizarCodigo(codigoBruto)) || null;
}

export async function pesquisar(texto) {
  await carregar();
  const termo = (texto || "").trim();
  if (!termo) return [];

  if (/^\d+$/.test(termo)) {
    return cache.filter((item) => item.codigo.startsWith(termo)).slice(0, 100);
  }

  const termoNormalizado = semAcento(termo);
  return cache
    .filter((item) => semAcento(item.descricao).includes(termoNormalizado))
    .slice(0, 100);
}

export async function totalDeCodigos() {
  await carregar();
  return cache.length;
}
