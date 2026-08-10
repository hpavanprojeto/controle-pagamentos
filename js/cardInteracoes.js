import { confirmarExclusaoDigitandoNome } from "./util.js";

const LIMIAR_ABERTURA = -44;
const DESLOCAMENTO_ABERTO = -84;

/**
 * Cliques simples nos cartões (listas sem swipe, ex: Procedimentos e Pesquisa).
 */
export function ligarNavegacaoSimples(container) {
  container.addEventListener("click", (e) => {
    const cartao = e.target.closest(".cartao-procedimento");
    if (!cartao) return;
    location.hash = `#/procedimentos/${cartao.dataset.id}`;
  });
}

/**
 * Cartões com swipe-to-delete (arrastar para a esquerda revela "Excluir", com
 * confirmação antes de apagar) e botão de ação rápida (marcar como pago/pendente).
 * Usado na tela de Pagamentos.
 */
export function ligarCartoesComAcoes(container, { aoExcluir, aoAlternarStatus }) {
  container.querySelectorAll(".botao-acao-rapida").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      aoAlternarStatus(btn.dataset.marcarId, btn.dataset.marcarPara);
    });
  });

  container.querySelectorAll(".swipe-fundo-excluir").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.excluirId;
      const nome = btn.dataset.excluirNome;
      if (!confirmarExclusaoDigitandoNome(nome)) return;
      await aoExcluir(id);
    });
  });

  container.querySelectorAll(".swipe-item").forEach((item) => {
    ativarSwipe(item);
  });
}

function ativarSwipe(item) {
  const conteudo = item.querySelector(".swipe-conteudo");
  let inicioX = 0;
  let deslocamentoAtual = 0;
  let arrastando = false;
  let aberto = false;

  function aplicarTransform(valor, comTransicao) {
    conteudo.style.transition = comTransicao ? "transform 0.18s ease" : "none";
    conteudo.style.transform = `translateX(${valor}px)`;
  }

  item.addEventListener(
    "touchstart",
    (e) => {
      inicioX = e.touches[0].clientX;
      arrastando = true;
      aplicarTransform(aberto ? DESLOCAMENTO_ABERTO : 0, false);
    },
    { passive: true }
  );

  item.addEventListener(
    "touchmove",
    (e) => {
      if (!arrastando) return;
      const deltaX = e.touches[0].clientX - inicioX;
      const base = aberto ? DESLOCAMENTO_ABERTO : 0;
      deslocamentoAtual = Math.max(DESLOCAMENTO_ABERTO, Math.min(0, base + deltaX));
      aplicarTransform(deslocamentoAtual, false);
    },
    { passive: true }
  );

  item.addEventListener("touchend", () => {
    arrastando = false;
    if (deslocamentoAtual <= LIMIAR_ABERTURA) {
      aplicarTransform(DESLOCAMENTO_ABERTO, true);
      aberto = true;
    } else {
      aplicarTransform(0, true);
      aberto = false;
    }
  });

  conteudo.querySelector(".cartao-procedimento").addEventListener("click", (e) => {
    if (aberto) {
      e.preventDefault();
      aplicarTransform(0, true);
      aberto = false;
      return;
    }
    if (e.target.closest(".botao-acao-rapida")) return;
    const cartao = e.target.closest(".cartao-procedimento");
    location.hash = `#/procedimentos/${cartao.dataset.id}`;
  });
}
