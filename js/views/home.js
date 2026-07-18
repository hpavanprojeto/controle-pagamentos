export async function render(app) {
  app.innerHTML = `
    <div class="tela">
      <div class="topo">
        <h1>Controle de Pagamentos</h1>
      </div>

      <button class="botao-grande" id="btn-novo">
        <span class="icone">＋</span>
        <span>Novo Procedimento</span>
      </button>

      <div class="grade-acessos">
        <a class="cartao-acesso" href="#/procedimentos">
          <span class="icone">📋</span> Procedimentos <span class="seta">›</span>
        </a>
        <a class="cartao-acesso" href="#/pagamentos">
          <span class="icone">💰</span> Pagamentos <span class="seta">›</span>
        </a>
        <a class="cartao-acesso" href="#/meus-codigos">
          <span class="icone">🗂️</span> Meus Códigos <span class="seta">›</span>
        </a>
        <a class="cartao-acesso" href="#/configuracoes">
          <span class="icone">⚙️</span> Configurações <span class="seta">›</span>
        </a>
      </div>
    </div>
  `;

  app.querySelector("#btn-novo").addEventListener("click", () => {
    location.hash = "#/novo";
  });
}
