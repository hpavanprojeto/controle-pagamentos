let cache = null;
let porCodigo = null;

async function carregar() {
  if (cache) return cache;
  const resp = await fetch("data/pacotesTacchini.json");
  cache = await resp.json();
  porCodigo = new Map(cache.map((item) => [item.codigo, item]));
  return cache;
}

/**
 * Tabela fixa dos códigos de "Pacote" cobrados pelo Tacchini (não fazem
 * parte da CBHPM — são um acordo comercial próprio do hospital). Como a
 * lista é pequena e muda raramente, fica embutida aqui em vez de depender
 * só do texto "Pacote" aparecer legível na foto.
 */
export async function buscarPacote(codigoBruto) {
  await carregar();
  const codigo = (codigoBruto || "").replace(/\D/g, "");
  return porCodigo.get(codigo) || null;
}

export async function todosOsPacotes() {
  await carregar();
  return cache;
}
