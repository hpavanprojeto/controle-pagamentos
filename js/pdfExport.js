import { formatarCodigo } from "./cbhpm.js";
import { formatarDataCurta } from "./util.js";

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
    const linhaSub = [p.hospital, p.convenio].filter(Boolean).join(" · ");
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
