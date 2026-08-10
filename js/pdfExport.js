import { formatarCodigo } from "./cbhpm.js";
import { formatarDataCurta, parseValorBR, formatarValorBR } from "./util.js";

const MARGEM = 15;
const LARGURA_UTIL = 210 - MARGEM * 2;
const ALTURA_PAGINA = 297;
const LIMITE_INFERIOR = 280;

/**
 * Gera um PDF simples listando os procedimentos de uma fonte pagadora e
 * status específicos — pensado pra imprimir/conferir/enviar por e-mail,
 * não como documento fiscal.
 */
export function gerarPdfRelatorio(fontePagadora, status, procedimentos) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGEM;

  function novaLinha(altura = 6) {
    y += altura;
    if (y > LIMITE_INFERIOR) {
      doc.addPage();
      y = MARGEM;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Controle de Pagamentos", MARGEM, y);
  novaLinha(8);

  doc.setFontSize(12);
  doc.text(`Fonte pagadora: ${fontePagadora}`, MARGEM, y);
  novaLinha(6);
  doc.text(`Status: ${status}`, MARGEM, y);
  novaLinha(6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, MARGEM, y);
  doc.setTextColor(0);
  novaLinha(4);

  doc.setDrawColor(200);
  doc.line(MARGEM, y, MARGEM + LARGURA_UTIL, y);
  novaLinha(8);

  const ordenados = [...procedimentos].sort((a, b) => (a.data || "").localeCompare(b.data || ""));

  for (const p of ordenados) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${formatarDataCurta(p.data)} — ${p.paciente}`, MARGEM, y);
    novaLinha(5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    const linhaSub = [p.hospital, p.convenio, p.carteiraBeneficiario ? `Carteira: ${p.carteiraBeneficiario}` : null]
      .filter(Boolean)
      .join(" · ");
    if (linhaSub) {
      doc.text(linhaSub, MARGEM, y);
      novaLinha(5);
    }
    if (p.fontePagadora === "Tacchimed" && (p.pacote === true || p.pacote === false)) {
      doc.text(p.pacote ? "Pacote" : "Avulso", MARGEM, y);
      novaLinha(5);
    }
    doc.setTextColor(0);

    for (const c of p.codigos || []) {
      const linha = `  ${formatarCodigo(c.codigo)}  ${c.descricaoOficial}  (qtd: ${c.quantidade})`;
      const quebradas = doc.splitTextToSize(linha, LARGURA_UTIL - 4);
      for (const parte of quebradas) {
        doc.text(parte, MARGEM + 2, y);
        novaLinha(5);
      }
    }

    novaLinha(3);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Total: ${ordenados.length} procedimento(s)`, MARGEM, y);

  return doc.output("blob");
}

/**
 * Gera um PDF com o resultado da conciliação de um informe de produção da
 * Unimed: pra cada procedimento cuja carteira apareceu no informe, lista
 * código a código o que bateu (com valor pago) e o que não bateu.
 */
export function gerarPdfConciliacao(resultados) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGEM;

  function novaLinha(altura = 6) {
    y += altura;
    if (y > LIMITE_INFERIOR) {
      doc.addPage();
      y = MARGEM;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Conciliação Unimed", MARGEM, y);
  novaLinha(8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, MARGEM, y);
  doc.setTextColor(0);
  novaLinha(4);

  doc.setDrawColor(200);
  doc.line(MARGEM, y, MARGEM + LARGURA_UTIL, y);
  novaLinha(8);

  const ordenados = [...resultados].sort((a, b) => (a.procedimento.data || "").localeCompare(b.procedimento.data || ""));

  for (const r of ordenados) {
    const p = r.procedimento;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${formatarDataCurta(p.data)} — ${p.paciente}`, MARGEM, y);
    novaLinha(5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Carteira: ${p.carteiraBeneficiario || "—"} · Status: ${p.status}`, MARGEM, y);
    doc.setTextColor(0);
    novaLinha(5);

    for (const c of r.codigosVerificados) {
      const valorPago = c.linhas.reduce((soma, l) => soma + parseValorBR(l.valor), 0);
      let situacao;
      if (c.completo) situacao = `bateu — R$ ${formatarValorBR(valorPago)}`;
      else if (c.pago) situacao = `bateu parcialmente (qtd ${c.quantidadePaga}/${c.quantidadeRegistrada}) — R$ ${formatarValorBR(valorPago)}`;
      else situacao = "não bateu — não encontrado nesse informe";

      const marcador = c.completo ? "[OK]" : c.pago ? "[PARCIAL]" : "[NAO]";
      const linha = `  ${marcador} ${formatarCodigo(c.codigo)}  ${c.descricaoOficial}  —  ${situacao}`;
      const quebradas = doc.splitTextToSize(linha, LARGURA_UTIL - 4);
      for (const parte of quebradas) {
        doc.text(parte, MARGEM + 2, y);
        novaLinha(5);
      }
    }

    if (r.linhasNaoRelacionadas.length > 0) {
      doc.setFontSize(8);
      doc.setTextColor(120);
      const nota = `Outras linhas dessa carteira no informe (não correspondem a nenhum código deste procedimento): ${r.linhasNaoRelacionadas
        .map((l) => `${l.descricao} — R$ ${l.valor || "?"}`)
        .join("; ")}`;
      const quebradas = doc.splitTextToSize(nota, LARGURA_UTIL - 4);
      for (const parte of quebradas) {
        doc.text(parte, MARGEM + 2, y);
        novaLinha(4);
      }
      doc.setTextColor(0);
      doc.setFontSize(9);
    }

    novaLinha(3);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Total: ${ordenados.length} procedimento(s)`, MARGEM, y);

  return doc.output("blob");
}
