import { escapar, formatarDataCurta } from "./util.js";

export function cartaoProcedimento(p, opcoes = {}) {
  const { acaoRapida = false, comExclusao = false } = opcoes;
  const selo = p.status === "Pago" ? "pago" : "pendente";
  const mostrarPacote = p.fontePagadora === "Tacchimed" && (p.pacote === true || p.pacote === false);

  const cartao = `
    <div class="cartao-procedimento" data-id="${p.id}">
      <div class="linha-topo">
        <span class="paciente">${escapar(p.paciente)}</span>
        <span class="selo ${selo}">${escapar(p.status)}</span>
      </div>
      <div class="sub">${escapar(p.hospital)} · ${escapar(p.fontePagadora)}</div>
      <div class="data">
        ${formatarDataCurta(p.data)}
        ${mostrarPacote ? `<span class="selo-pacote ${p.pacote ? "sim" : "nao"}">${p.pacote ? "📦 Pacote" : "Avulso"}</span>` : ""}
      </div>
      ${
        acaoRapida
          ? `<button type="button" class="botao-acao-rapida" data-marcar-id="${p.id}" data-marcar-para="${p.status === "Pago" ? "Pendente" : "Pago"}">
              ${p.status === "Pago" ? "↺ Marcar como Pendente" : "✓ Marcar como Pago"}
            </button>`
          : ""
      }
    </div>
  `;

  if (!comExclusao) return cartao;

  return `
    <div class="swipe-item" data-swipe-id="${p.id}">
      <div class="swipe-fundo-excluir" data-excluir-id="${p.id}" data-excluir-nome="${escapar(p.paciente)}">🗑️ Excluir</div>
      <div class="swipe-conteudo">${cartao}</div>
    </div>
  `;
}

export function estadoVazio(icone, titulo, descricao) {
  return `
    <div class="vazio">
      <div class="icone">${icone}</div>
      <div>${titulo}</div>
      <p style="font-size:13px">${descricao}</p>
    </div>
  `;
}
