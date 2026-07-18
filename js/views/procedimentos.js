import { listarProcedimentos } from "../db.js";
import { cartaoProcedimento, estadoVazio } from "../components.js";
import { ligarNavegacaoSimples } from "../cardInteracoes.js";

function semAcento(texto) {
  return (texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export async function render(app) {
  app.innerHTML = `
    <div class="tela">
      <div class="topo">
        <button class="botao-voltar" onclick="location.hash='#/'">‹</button>
        <h1>Procedimentos</h1>
      </div>
      <div class="campo">
        <input type="search" id="campo-busca" placeholder="Buscar por paciente, hospital, convênio ou código">
      </div>
      <div id="lista"></div>
    </div>
  `;

  const todos = await listarProcedimentos();
  const area = app.querySelector("#lista");
  const campo = app.querySelector("#campo-busca");

  function desenhar() {
    const termo = semAcento(campo.value.trim());

    if (!termo) {
      area.innerHTML = todos.length
        ? todos.map((p) => cartaoProcedimento(p)).join("")
        : estadoVazio("📋", "Nenhum procedimento ainda", 'Toque em "Novo Procedimento" na tela inicial para começar.');
      return;
    }

    const filtrados = todos.filter((p) => {
      const campos = [p.paciente, p.hospital, p.convenio, p.fontePagadora, ...p.codigos.map((c) => c.codigo), ...p.codigos.map((c) => c.descricaoOficial)];
      return campos.some((c) => semAcento(c).includes(termo));
    });

    area.innerHTML = filtrados.length
      ? filtrados.map((p) => cartaoProcedimento(p)).join("")
      : estadoVazio("🔍", "Nada encontrado", `Sem resultados para "${campo.value}".`);
  }

  campo.addEventListener("input", desenhar);
  desenhar();
  ligarNavegacaoSimples(area);
}
