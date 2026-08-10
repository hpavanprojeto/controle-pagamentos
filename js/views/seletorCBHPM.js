import { pesquisar, formatarCodigo } from "../cbhpm.js";
import { listarGrupos } from "../meusCodigos.js";
import { escapar } from "../util.js";

export async function abrirSeletorCBHPM(aoSelecionar) {
  const overlay = document.createElement("div");
  overlay.className = "overlay-modal";
  overlay.innerHTML = `
    <div class="tela">
      <div class="topo">
        <button class="botao-voltar" id="btn-fechar-seletor">Cancelar</button>
        <h1>Tabela CBHPM</h1>
      </div>
      <div class="campo">
        <input type="search" id="campo-busca-cbhpm" placeholder="Código ou nome do procedimento" autofocus>
      </div>
      <div id="resultados-cbhpm" class="lista-resultados-busca"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const campoBusca = overlay.querySelector("#campo-busca-cbhpm");
  const areaResultados = overlay.querySelector("#resultados-cbhpm");

  function fechar() {
    overlay.remove();
  }

  overlay.querySelector("#btn-fechar-seletor").addEventListener("click", fechar);

  async function mostrarGruposRapidos() {
    const categorias = await listarGrupos();
    areaResultados.innerHTML = `
      <p style="padding:14px 14px 4px;color:var(--cor-texto-secundario);font-size:13px">
        Digite para buscar, ou toque num grupo abaixo pra adicionar os códigos dele de uma vez:
      </p>
      ${categorias
        .map(
          (cat) => `
        <div class="secao-titulo" style="padding-left:14px">${escapar(cat.categoria)}</div>
        ${cat.grupos
          .map(
            (g, i) => `
          <button type="button" class="resultado-busca" data-grupo="${escapar(cat.categoria)}|${i}">
            <div style="font-weight:700">${escapar(g.nome)}</div>
            <div class="codigo">${g.codigos.map((c) => formatarCodigo(c.codigo)).join(" + ")}</div>
          </button>`
          )
          .join("")}
      `
        )
        .join("")}
    `;

    areaResultados.querySelectorAll("[data-grupo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [nomeCategoria, indice] = btn.dataset.grupo.split("|");
        const cat = categorias.find((c) => c.categoria === nomeCategoria);
        const grupo = cat.grupos[Number(indice)];
        for (const c of grupo.codigos) {
          aoSelecionar({ codigo: c.codigo, descricao: c.descricaoOficial });
        }
        fechar();
      });
    });
  }

  let timeoutBusca = null;
  campoBusca.addEventListener("input", () => {
    clearTimeout(timeoutBusca);
    timeoutBusca = setTimeout(async () => {
      const termo = campoBusca.value.trim();
      if (!termo) {
        await mostrarGruposRapidos();
        return;
      }
      const resultados = await pesquisar(termo);
      if (resultados.length === 0) {
        areaResultados.innerHTML = `<p style="padding:14px;color:var(--cor-texto-secundario)">Nenhum resultado.</p>`;
        return;
      }
      areaResultados.innerHTML = resultados
        .map(
          (r) => `
        <button type="button" class="resultado-busca" data-codigo="${r.codigo}">
          <div class="codigo">${formatarCodigo(r.codigo)}</div>
          <div>${escapar(r.descricao)}</div>
        </button>`
        )
        .join("");

      areaResultados.querySelectorAll("[data-codigo]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const item = resultados.find((r) => r.codigo === btn.dataset.codigo);
          aoSelecionar(item);
          fechar();
        });
      });
    }, 150);
  });

  await mostrarGruposRapidos();
}
