import { buscarPorCodigo } from "./cbhpm.js";

let cache = null;

async function carregar() {
  if (cache) return cache;
  const resp = await fetch("data/meusCodigos.json");
  cache = await resp.json();
  return cache;
}

/** Lista de categorias com os grupos de código, já com o nome oficial CBHPM de cada código. */
export async function listarGrupos() {
  const dados = await carregar();
  const categorias = [];

  for (const [categoria, grupos] of Object.entries(dados)) {
    const gruposComDescricao = await Promise.all(
      grupos.map(async (g) => ({
        nome: g.nome,
        codigos: await Promise.all(
          g.codigos.map(async (codigo) => {
            const item = await buscarPorCodigo(codigo);
            return { codigo, descricaoOficial: item?.descricao || "(código não encontrado na base)" };
          })
        ),
      }))
    );
    categorias.push({ categoria, grupos: gruposComDescricao });
  }

  return categorias;
}
