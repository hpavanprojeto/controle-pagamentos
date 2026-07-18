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
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((registro) => {
        // Força checar por uma versão nova a cada abertura do app, em vez de
        // depender do intervalo padrão do navegador (que pode levar até 24h).
        registro.update();
      })
      .catch((err) => {
        console.error("Falha ao registrar service worker:", err);
      });
  });

  let jaRecarregou = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (jaRecarregou) return;
    jaRecarregou = true;
    location.reload();
  });
}
