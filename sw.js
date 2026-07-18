const CACHE_VERSION = "v29";
const CACHE_NAME = `controle-pagamentos-${CACHE_VERSION}`;

const ARQUIVOS_PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/app.js",
  "./js/router.js",
  "./js/db.js",
  "./js/cbhpm.js",
  "./js/pacotes.js",
  "./js/meusCodigos.js",
  "./js/fontePagadora.js",
  "./js/util.js",
  "./js/toast.js",
  "./js/components.js",
  "./js/backup.js",
  "./js/compartilhar.js",
  "./js/pdfExport.js",
  "./js/cardInteracoes.js",
  "./js/ocr.js",
  "./js/pdfLeitor.js",
  "./js/conciliacaoUnimed.js",
  "./js/draftStore.js",
  "./js/zoomFoto.js",
  "./js/parsers/detectar.js",
  "./js/parsers/unimed.js",
  "./js/parsers/tacchini.js",
  "./js/parsers/extrairCodigos.js",
  "./js/parsers/informeProducao.js",
  "./js/views/home.js",
  "./js/views/escolherOrigem.js",
  "./js/views/novoProcedimento.js",
  "./js/views/seletorCBHPM.js",
  "./js/views/procedimentos.js",
  "./js/views/procedimentoDetail.js",
  "./js/views/pagamentos.js",
  "./js/views/configuracoes.js",
  "./js/views/meusCodigosView.js",
  "./js/views/conciliarInforme.js",
  "./data/cbhpm.json",
  "./data/pacotesTacchini.json",
  "./data/meusCodigos.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// Arquivos grandes do motor de OCR: tenta pré-carregar, mas uma falha aqui
// não deve impedir o app de instalar. Se faltar algum, ele é buscado e
// cacheado normalmente na primeira vez que a leitura de foto for usada.
const ARQUIVOS_OCR = [
  "./vendor/tesseract/tesseract.min.js",
  "./vendor/tesseract/worker.min.js",
  "./vendor/tesseract/tesseract-core.wasm.js",
  "./vendor/tesseract/tesseract-core.wasm",
  "./vendor/tesseract/lang-data/por.traineddata",
  "./vendor/jspdf/jspdf.umd.min.js",
  "./vendor/pdfjs/pdf.min.js",
  "./vendor/pdfjs/pdf.worker.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ARQUIVOS_PRECACHE);
      await Promise.allSettled(ARQUIVOS_OCR.map((url) => cache.add(url)));
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((respostaCache) => {
      if (respostaCache) return respostaCache;

      return fetch(event.request)
        .then((respostaRede) => {
          const copia = respostaRede.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          return respostaRede;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
