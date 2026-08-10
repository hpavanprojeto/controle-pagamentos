import { listarGrupos } from "../meusCodigos.js";
import { formatarCodigo } from "../cbhpm.js";
import { escapar } from "../util.js";

export async function render(app) {
  app.innerHTML = `
    <div class="tela">
      <div class="topo">
        <button class="botao-voltar" onclick="location.hash='#/'">‹</button>
        <h1>Meus Códigos</h1>
      </div>
      <p style="font-size:13px;color:var(--cor-texto-secundario);margin-top:-8px;margin-bottom:20px">
        Combinações de código que você usa com frequência, organizadas por método.
      </p>
      <div id="lista"></div>
    </div>
  `;

  const categorias = await listarGrupos();
  const area = app.querySelector("#lista");

  area.innerHTML = categorias
    .map(
      (cat) => `
      <div class="secao-titulo">${escapar(cat.categoria)}</div>
      ${cat.grupos
        .map(
          (g) => `
        <div class="item-codigo" style="margin-bottom:10px">
          <div class="descricao" style="font-weight:700;margin-bottom:6px">${escapar(g.nome)}</div>
          ${g.codigos
            .map(
              (c) => `
            <div style="font-size:13px;margin-bottom:2px">
              <span class="codigo">${formatarCodigo(c.codigo)}</span> — ${escapar(c.descricaoOficial)}
            </div>`
            )
            .join("")}
        </div>`
        )
        .join("")}
    `
    )
    .join("");
}
