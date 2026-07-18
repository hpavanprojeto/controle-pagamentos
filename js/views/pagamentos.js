import { listarPorStatus, salvarProcedimento, excluirProcedimento, buscarProcedimento } from "../db.js";
import { cartaoProcedimento, estadoVazio } from "../components.js";
import { STATUS_PAGAMENTO } from "../fontePagadora.js";
import { ligarCartoesComAcoes } from "../cardInteracoes.js";
import { escapar, agoraISO } from "../util.js";
import { mostrarToast } from "../toast.js";
import { gerarPdfRelatorio } from "../pdfExport.js";
import { compartilharArquivo } from "../compartilhar.js";

function semAcento(texto) {
  return (texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export async function render(app) {
  let filtro = "Pendente";
  let termoBusca = "";

  app.innerHTML = `
    <div class="tela">
      <div class="topo">
        <button class="botao-voltar" onclick="location.hash='#/'">‹</button>
        <h1>Pagamentos</h1>
      </div>
      <div class="segmentado" id="segmentado-filtro">
        ${STATUS_PAGAMENTO.map((s) => `<button type="button" data-status="${s}" class="${s === filtro ? "ativo" : ""}">${s}</button>`).join("")}
      </div>
      <div class="campo" style="margin-top:14px">
        <input type="search" id="campo-busca-paciente" placeholder="Buscar por nome do paciente">
      </div>
      <div id="lista" style="margin-top:8px"></div>
    </div>
  `;

  let gruposAtuais = new Map();

  async function carregar() {
    let lista = await listarPorStatus(filtro);
    lista.sort((a, b) => (a.data || "").localeCompare(b.data || ""));

    if (termoBusca) {
      const termo = semAcento(termoBusca);
      lista = lista.filter((p) => semAcento(p.paciente).includes(termo));
    }

    const area = app.querySelector("#lista");

    if (lista.length === 0) {
      area.innerHTML = termoBusca
        ? estadoVazio("🔍", "Nada encontrado", `Sem resultados para "${termoBusca}" em ${filtro.toLowerCase()}.`)
        : estadoVazio("💰", "Nada por aqui", "Nenhum procedimento com esse status.");
      gruposAtuais = new Map();
      return;
    }

    gruposAtuais = agrupar(lista);
    area.innerHTML = montarHtmlGrupos(gruposAtuais);

    area.querySelectorAll("[data-exportar-fonte]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const fonte = btn.dataset.exportarFonte;
        const itens = gruposAtuais.get(fonte) || [];
        const blob = gerarPdfRelatorio(fonte, filtro, itens);
        const nomeArquivo = `relatorio-${fonte.replace(/\s+/g, "-").toLowerCase()}-${filtro.toLowerCase()}.pdf`;
        await compartilharArquivo(blob, nomeArquivo, "application/pdf");
      });
    });

    ligarCartoesComAcoes(area, {
      aoExcluir: async (id) => {
        await excluirProcedimento(id);
        mostrarToast("Procedimento excluído.");
        carregar();
      },
      aoAlternarStatus: async (id, novoStatus) => {
        const procedimento = await buscarProcedimento(id);
        if (!procedimento) return;
        procedimento.status = novoStatus;
        procedimento.atualizadoEm = agoraISO();
        await salvarProcedimento(procedimento);
        mostrarToast(novoStatus === "Pago" ? "Marcado como pago." : "Marcado como pendente.");
        carregar();
      },
    });
  }

  app.querySelectorAll("#segmentado-filtro button").forEach((btn) =>
    btn.addEventListener("click", () => {
      filtro = btn.dataset.status;
      app.querySelectorAll("#segmentado-filtro button").forEach((b) => b.classList.toggle("ativo", b === btn));
      carregar();
    })
  );

  app.querySelector("#campo-busca-paciente").addEventListener("input", (e) => {
    termoBusca = e.target.value.trim();
    carregar();
  });

  await carregar();
}

function agrupar(lista) {
  const grupos = new Map();
  for (const p of lista) {
    const chave = p.fontePagadora || "Sem fonte pagadora definida";
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(p);
  }
  return grupos;
}

function montarHtmlGrupos(grupos) {
  const chavesOrdenadas = [...grupos.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return chavesOrdenadas
    .map((chave) => {
      const itens = grupos.get(chave);
      return `
        <div class="cabecalho-grupo">
          <span class="titulo">${escapar(chave)}</span>
          <span class="contagem">${itens.length}</span>
          <button type="button" class="botao-exportar-pdf" data-exportar-fonte="${escapar(chave)}">📄 PDF</button>
        </div>
        ${itens.map((p) => cartaoProcedimento(p, { acaoRapida: true, comExclusao: true })).join("")}
      `;
    })
    .join("");
}
