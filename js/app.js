import { registrarRota, iniciarRouter } from "./router.js";
import { render as renderHome } from "./views/home.js";
import { render as renderEscolherOrigem } from "./views/escolherOrigem.js";
import { render as renderNovoProcedimento } from "./views/novoProcedimento.js";
import { render as renderProcedimentos } from "./views/procedimentos.js";
import { render as renderProcedimentoDetail } from "./views/procedimentoDetail.js";
import { render as renderPagamentos } from "./views/pagamentos.js";
import { render as renderConfiguracoes } from "./views/configuracoes.js";
import { render as renderMeusCodigos } from "./views/meusCodigosView.js";

registrarRota("/", renderHome);
registrarRota("/novo", renderEscolherOrigem);
registrarRota("/novo/manual", renderNovoProcedimento);
registrarRota("/editar/:id", renderNovoProcedimento);
registrarRota("/procedimentos", renderProcedimentos);
registrarRota("/procedimentos/:id", renderProcedimentoDetail);
registrarRota("/pagamentos", renderPagamentos);
registrarRota("/configuracoes", renderConfiguracoes);
registrarRota("/meus-codigos", renderMeusCodigos);

iniciarRouter();

if ("serviceWorker" in navigator) {
  // updateViaCache: "none" evita que o próprio arquivo sw.js (e os módulos
  // que ele importa) fiquem presos no cache HTTP do navegador/iOS — sem
  // isso, o app podia continuar rodando uma versão antiga mesmo depois de
  // fechar e reabrir, porque o navegador respondia com um sw.js desatualizado.
  const registroPromise = navigator.serviceWorker
    .register("sw.js", { updateViaCache: "none" })
    .catch((err) => {
      console.error("Falha ao registrar service worker:", err);
    });

  async function checarAtualizacao() {
    const registro = await registroPromise;
    registro?.update();
  }

  window.addEventListener("load", checarAtualizacao);

  // PWA instalada raramente é "recarregada" — normalmente só volta do
  // segundo plano. Checar de novo quando a tela volta a ficar visível
  // aumenta a chance de pegar uma atualização sem precisar forçar nada.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checarAtualizacao();
  });

  let jaRecarregou = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (jaRecarregou) return;
    jaRecarregou = true;
    location.reload();
  });
}
