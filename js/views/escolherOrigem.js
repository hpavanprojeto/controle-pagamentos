import { lerTextoDaImagem } from "../ocr.js";
import { detectarModelo } from "../parsers/detectar.js";
import { interpretarUnimed } from "../parsers/unimed.js";
import { interpretarTacchini } from "../parsers/tacchini.js";
import { definirRascunho } from "../draftStore.js";
import { gerarId, hojeISO } from "../util.js";
import { mostrarToast } from "../toast.js";

export async function render(app) {
  app.innerHTML = `
    <div class="tela">
      <div class="topo">
        <button class="botao-voltar" id="btn-cancelar">Cancelar</button>
        <h1>Novo Procedimento</h1>
      </div>

      <label class="botao-grande" style="margin-bottom:16px">
        <span class="icone">📷</span>
        <span>Tirar foto ou escolher da galeria</span>
        <input type="file" accept="image/*" id="input-foto" style="display:none">
      </label>
      <p style="text-align:center;color:var(--cor-texto-secundario);font-size:13px;margin-top:-6px">
        O app tenta ler os dados automaticamente do relatório da Unimed ou da tela do MV (Tacchini)
      </p>

      <div style="text-align:center;margin:22px 0;color:var(--cor-texto-secundario);font-size:13px">ou</div>

      <button class="botao-secundario" id="btn-manual">✍️ Preencher manualmente</button>
    </div>
  `;

  app.querySelector("#btn-cancelar").addEventListener("click", () => {
    location.hash = "#/";
  });

  app.querySelector("#btn-manual").addEventListener("click", () => {
    location.hash = "#/novo/manual";
  });

  app.querySelector("#input-foto").addEventListener("change", async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    await processarFoto(app, arquivo);
  });
}

async function processarFoto(app, arquivo) {
  mostrarCarregando(app, "Lendo o relatório...");

  try {
    const texto = await lerTextoDaImagem(arquivo, (progresso) => {
      atualizarCarregando(app, `Lendo o relatório... ${Math.round(progresso * 100)}%`);
    });

    const modelo = detectarModelo(texto);
    let interpretado;

    if (modelo === "unimed") {
      interpretado = await interpretarUnimed(texto);
    } else if (modelo === "tacchini") {
      interpretado = await interpretarTacchini(texto);
    } else {
      interpretado = {
        paciente: null,
        hospital: "",
        convenio: "",
        fontePagadora: null,
        data: null,
        codigos: [],
        avisos: ["Não reconheci o modelo do relatório (Unimed ou Tacchini). Preencha os dados manualmente."],
      };
    }

    definirRascunho({
      id: gerarId(),
      paciente: interpretado.paciente || "",
      hospital: interpretado.hospital || "",
      convenio: interpretado.convenio || "",
      fontePagadora: interpretado.fontePagadora || "",
      carteiraBeneficiario: interpretado.carteiraBeneficiario || "",
      data: interpretado.data || hojeISO(),
      status: "Pendente",
      origem: "foto",
      observacoes: "",
      codigos: interpretado.codigos,
      fotoBlob: arquivo,
      pacote: interpretado.pacote || false,
      avisos: interpretado.avisos,
      textoOcr: texto,
    });

    location.hash = "#/novo/manual";
  } catch (err) {
    console.error(err);
    mostrarToast("Não consegui ler a foto. Tente novamente ou preencha manualmente.");
    location.hash = "#/novo";
  }
}

function mostrarCarregando(app, mensagem) {
  app.innerHTML = `
    <div class="tela" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;text-align:center">
      <div style="font-size:40px;margin-bottom:16px">🔎</div>
      <p id="texto-carregando">${mensagem}</p>
      <p style="font-size:12px;color:var(--cor-texto-secundario);margin-top:8px">Isso roda no seu aparelho, sem internet.</p>
    </div>
  `;
}

function atualizarCarregando(app, mensagem) {
  const el = app.querySelector("#texto-carregando");
  if (el) el.textContent = mensagem;
}
