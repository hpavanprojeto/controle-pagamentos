const rotas = [];

export function registrarRota(padrao, manipulador) {
  const nomesParametros = [];
  const regex = new RegExp(
    "^" +
      padrao.replace(/:[^/]+/g, (m) => {
        nomesParametros.push(m.slice(1));
        return "([^/]+)";
      }) +
      "$"
  );
  rotas.push({ regex, nomesParametros, manipulador });
}

async function resolver() {
  const hash = location.hash.replace(/^#/, "") || "/";
  for (const rota of rotas) {
    const match = hash.match(rota.regex);
    if (match) {
      const params = {};
      rota.nomesParametros.forEach((nome, i) => (params[nome] = decodeURIComponent(match[i + 1])));
      const app = document.getElementById("app");
      app.scrollTop = 0;
      window.scrollTo(0, 0);
      await rota.manipulador(app, params);
      return;
    }
  }
  navegar("/");
}

export function navegar(caminho) {
  if (location.hash.replace(/^#/, "") === caminho) {
    resolver();
  } else {
    location.hash = caminho;
  }
}

export function iniciarRouter() {
  window.addEventListener("hashchange", resolver);
  resolver();
}
