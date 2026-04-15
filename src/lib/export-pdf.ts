import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BalancoData } from './parsers/balanco-parser';
import type { DREData } from './parsers/dre-parser';
import type { BalanceteData } from './parsers/balancete-parser';
import { formatBRL, formatPercent } from './format-brl';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

const C = {
  bgDark: [10, 14, 26] as const,
  bgCard: [17, 24, 39] as const,
  blue: [59, 130, 246] as const,
  green: [16, 185, 129] as const,
  red: [239, 68, 68] as const,
  yellow: [245, 158, 11] as const,
  purple: [139, 92, 246] as const,
  white: [255, 255, 255] as const,
  gray: [156, 163, 175] as const,
  muted: [107, 114, 128] as const,
  border: [31, 41, 55] as const,
  altRow: [13, 18, 30] as const,
};

type RGB = readonly [number, number, number];

interface ExportOptions {
  empresa?: string;
  cnpj?: string;
  periodo?: string;
}

export async function exportarPDF(
  options: ExportOptions,
  balanco: BalancoData | null,
  dre: DREData | null,
  balancete: BalanceteData | null,
) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const m = 15;
  const cw = pw - m * 2;
  let y = 0;

  const empresa = options.empresa || balanco?.empresa || dre?.empresa || 'Dashboard Contábil';
  const cnpj = options.cnpj || balanco?.cnpj || dre?.cnpj || '';
  const periodo = options.periodo || balanco?.periodo || dre?.periodo || '';

  // ── helpers ──

  function fmtBRL(v: number | undefined | null): string {
    return formatBRL(v);
  }

  function fmtPct(v: number): string {
    return v.toFixed(2).replace('.', ',') + '%';
  }

  function addHeader(titulo: string) {
    pdf.setFillColor(...C.bgDark);
    pdf.rect(0, 0, pw, 28, 'F');
    pdf.setFillColor(...C.blue);
    pdf.rect(0, 28, pw, 1, 'F');
    pdf.setTextColor(...C.blue);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(titulo, m, 13);
    pdf.setTextColor(...C.gray);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const hoje = new Date().toLocaleDateString('pt-BR');
    pdf.text(`${cnpj ? `CNPJ: ${cnpj}` : ''}${periodo ? ` • ${periodo}` : ''} • Gerado em: ${hoje}`, m, 20);
    y = 35;
  }

  function addFooter(pageNum: number) {
    pdf.setTextColor(...C.muted);
    pdf.setFontSize(7);
    pdf.text('Gerado por ContábilView', m, ph - 8);
    pdf.text(`Página ${pageNum}`, pw - m - 15, ph - 8);
  }

  function checkPage(needed: number) {
    if (y + needed > ph - 20) {
      addFooter(pdf.getNumberOfPages());
      pdf.addPage();
      y = 15;
    }
  }

  function drawKPI(x: number, w: number, label: string, valor: string, sub: string, color: RGB) {
    pdf.setFillColor(...C.bgCard);
    pdf.roundedRect(x, y, w, 22, 3, 3, 'F');
    pdf.setDrawColor(...C.border);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, w, 22, 3, 3, 'S');
    pdf.setTextColor(...C.muted);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label, x + 4, y + 6);
    pdf.setTextColor(...color);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(valor, x + 4, y + 14);
    pdf.setTextColor(...C.gray);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(sub, x + 4, y + 19);
  }

  function sectionTitle(t: string) {
    checkPage(15);
    pdf.setFillColor(...C.bgCard);
    pdf.roundedRect(m, y, cw, 8, 2, 2, 'F');
    pdf.setTextColor(...C.white);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(t, m + 4, y + 5.5);
    y += 12;
  }

  function drawBar(label: string, value: number, maxVal: number, color: RGB) {
    checkPage(10);
    const barMaxW = 80;
    const barW = maxVal > 0 ? (Math.abs(value) / maxVal) * barMaxW : 0;
    pdf.setTextColor(...C.gray);
    pdf.setFontSize(7);
    pdf.text(label, m + 2, y + 3);
    const bx = m + 55;
    const barColor = value < 0 ? C.red : color;
    pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
    pdf.roundedRect(bx, y - 2, Math.max(barW, 2), 5, 1, 1, 'F');
    const txtColor = value < 0 ? C.red : C.white;
    pdf.setTextColor(txtColor[0], txtColor[1], txtColor[2]);
    pdf.setFontSize(7);
    pdf.text(fmtBRL(value), bx + barMaxW + 3, y + 3);
    y += 9;
  }

  function drawDonut(cx: number, cy: number, r: number, data: { label: string; value: number; color: RGB }[]) {
    const total = data.reduce((s, d) => s + Math.abs(d.value), 0);
    if (total === 0) return;
    let start = -Math.PI / 2;
    const ir = r * 0.55;
    data.forEach(item => {
      const sweep = (Math.abs(item.value) / total) * Math.PI * 2;
      const segs = Math.max(Math.ceil(sweep / 0.1), 3);
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= segs; i++) {
        const a = start + (sweep * i) / segs;
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
      }
      for (let i = segs; i >= 0; i--) {
        const a = start + (sweep * i) / segs;
        pts.push({ x: cx + Math.cos(a) * ir, y: cy + Math.sin(a) * ir });
      }
      pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
      for (let i = 1; i < pts.length - 1; i++) {
        pdf.triangle(pts[0].x, pts[0].y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, 'F');
      }
      start += sweep;
    });
    // legend
    let ly = cy + r + 8;
    data.forEach(item => {
      const pct = ((Math.abs(item.value) / total) * 100).toFixed(1);
      pdf.setFillColor(...item.color);
      pdf.rect(cx - r, ly - 2, 3, 3, 'F');
      pdf.setTextColor(...C.gray);
      pdf.setFontSize(6);
      pdf.text(`${item.label} (${pct}%)`, cx - r + 5, ly + 1);
      ly += 6;
    });
  }

  const tableStyles = {
    theme: 'plain' as const,
    styles: { fillColor: C.bgCard as any, textColor: C.gray as any, fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: C.bgDark as any, textColor: C.blue as any, fontStyle: 'bold' as const, fontSize: 8 },
    alternateRowStyles: { fillColor: C.altRow as any },
    margin: { left: m, right: m },
  };

  // ═══════════════════════════════════════════
  // BALANÇO
  // ═══════════════════════════════════════════
  let pageCount = 0;

  if (balanco?.ativo) {
    const b = balanco;
    const ac = b.ativo.circulante.total || 0;
    const pc = b.passivo.circulante.total || 0;
    const at = b.ativo.total || ac;
    const pl = b.passivo.patrimonioLiquido.total || 0;
    const est = b.ativo.circulante.estoques || 0;

    addHeader(`${empresa} — Balanço Patrimonial`);

    const kw = (cw - 9) / 4;
    drawKPI(m, kw, 'AC / PC', pc > 0 ? (ac / pc).toFixed(2) : 'N/A', 'Liquidez Corrente', C.blue);
    drawKPI(m + kw + 3, kw, '(AC-Est)/PC', pc > 0 ? ((ac - est) / pc).toFixed(2) : 'N/A', 'Liquidez Seca', C.green);
    drawKPI(m + (kw + 3) * 2, kw, 'PC / AT', at > 0 ? fmtPct((pc / at) * 100) : '0%', 'Endividamento', C.yellow);
    drawKPI(m + (kw + 3) * 3, kw, 'PL / AT', at > 0 ? fmtPct((pl / at) * 100) : '0%', 'Participação PL', C.purple);
    y += 27;

    sectionTitle('Composição do Ativo Circulante');
    const donutData = [
      { label: 'Clientes', value: b.ativo.circulante.clientes, color: C.green },
      { label: 'Disponível', value: b.ativo.circulante.disponivel?.total || 0, color: C.blue },
      { label: 'Estoques', value: est, color: C.purple },
      { label: 'Outros Créditos', value: b.ativo.circulante.outrosCreditos, color: C.yellow },
    ].filter(d => d.value > 0);
    drawDonut(m + 35, y + 25, 20, donutData);
    y += 65;

    sectionTitle('Ativo');
    checkPage(60);
    autoTable(pdf, {
      ...tableStyles,
      startY: y,
      head: [['Descrição', 'Saldo']],
      body: [
        ['ATIVO CIRCULANTE', fmtBRL(ac)],
        ['  Disponível', fmtBRL(b.ativo.circulante.disponivel?.total)],
        ['    Caixa', fmtBRL(b.ativo.circulante.disponivel?.caixa)],
        ['    Bancos', fmtBRL(b.ativo.circulante.disponivel?.bancos)],
        ['    Aplicações Financeiras', fmtBRL(b.ativo.circulante.disponivel?.aplicacoes)],
        ['  Clientes', fmtBRL(b.ativo.circulante.clientes)],
        ['  Outros Créditos', fmtBRL(b.ativo.circulante.outrosCreditos)],
        ['  Estoques', fmtBRL(est)],
        ['TOTAL ATIVO', fmtBRL(at)],
      ],
      columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right', cellWidth: 50 } },
      didParseCell: (data: any) => {
        const txt = data.row.raw?.[0] || '';
        if (txt.startsWith('ATIVO') || txt.startsWith('TOTAL')) {
          data.cell.styles.textColor = C.white;
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    y = (pdf as any).lastAutoTable.finalY + 5;

    sectionTitle('Passivo + Patrimônio Líquido');
    checkPage(50);
    autoTable(pdf, {
      ...tableStyles,
      startY: y,
      head: [['Descrição', 'Saldo']],
      body: [
        ['PASSIVO CIRCULANTE', fmtBRL(pc)],
        ['  Fornecedores', fmtBRL(b.passivo.circulante.fornecedores)],
        ['  Obrigações Tributárias', fmtBRL(b.passivo.circulante.obrigacoesTributarias)],
        ['  Obrigações Trabalhistas', fmtBRL(b.passivo.circulante.obrigacoesTrabalhistas)],
        ['  Outras Obrigações', fmtBRL(b.passivo.circulante.outrasObrigacoes)],
        ['PATRIMÔNIO LÍQUIDO', fmtBRL(pl)],
        ['  Capital Social', fmtBRL(b.passivo.patrimonioLiquido.capitalSocial)],
        ['  Lucros Acumulados', fmtBRL(b.passivo.patrimonioLiquido.lucrosAcumulados)],
        ['TOTAL PASSIVO + PL', fmtBRL(pc + pl)],
      ],
      columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right', cellWidth: 50 } },
      didParseCell: (data: any) => {
        const txt = data.row.raw?.[0] || '';
        if (txt.startsWith('PASSIVO') || txt.startsWith('PATRIM') || txt.startsWith('TOTAL')) {
          data.cell.styles.textColor = C.white;
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    addFooter(pdf.getNumberOfPages());
    pageCount++;
  }

  // ═══════════════════════════════════════════
  // DRE
  // ═══════════════════════════════════════════
  if (dre?.receitaBruta) {
    if (pageCount > 0) pdf.addPage();
    addHeader(`${empresa} — DRE`);
    const d = dre;

    const kw = (cw - 6) / 3;
    const margem = d.receitaBruta > 0 ? (d.lucroLiquido / d.receitaBruta) * 100 : 0;
    drawKPI(m, kw, 'Receita Bruta', fmtBRL(d.receitaBruta), 'Faturamento total', C.blue);
    drawKPI(m + kw + 3, kw, 'Lucro Líquido', fmtBRL(d.lucroLiquido), d.lucroLiquido >= 0 ? 'Resultado positivo' : 'Resultado negativo', d.lucroLiquido >= 0 ? C.green : C.red);
    drawKPI(m + (kw + 3) * 2, kw, 'Margem Líquida', fmtPct(margem), 'Lucro / Receita', margem >= 0 ? C.green : C.red);
    y += 27;

    sectionTitle('Demonstração do Resultado');
    const maxVal = Math.abs(d.receitaBruta);
    const items: { label: string; value: number; color: RGB }[] = [
      { label: 'Receita Bruta', value: d.receitaBruta, color: C.blue },
      { label: '(-) Deduções', value: d.deducoes?.total || 0, color: C.red },
      { label: 'Receita Líquida', value: d.receitaLiquida, color: C.blue },
      { label: '(-) CMV', value: d.cmv, color: C.red },
      { label: 'Lucro Bruto', value: d.lucroBruto, color: C.green },
      { label: '(-) Despesas Oper.', value: d.despesasOperacionais?.total || 0, color: C.red },
      { label: '(+) Rec. Financeiras', value: d.receitasFinanceiras, color: C.green },
      { label: '(+) Outras Receitas', value: d.outrasReceitas, color: C.green },
      { label: 'Lucro Líquido', value: d.lucroLiquido, color: d.lucroLiquido >= 0 ? C.green : C.red },
    ];
    items.forEach(i => drawBar(i.label, i.value, maxVal, i.color));
    y += 5;

    sectionTitle('Detalhamento');
    checkPage(40);
    autoTable(pdf, {
      ...tableStyles,
      startY: y,
      head: [['Descrição', 'Valor']],
      body: [
        ['RECEITA BRUTA', fmtBRL(d.receitaBruta)],
        ['(-) Deduções', fmtBRL(d.deducoes?.total)],
        ['= RECEITA LÍQUIDA', fmtBRL(d.receitaLiquida)],
        ['(-) CMV', fmtBRL(d.cmv)],
        ['= LUCRO BRUTO', fmtBRL(d.lucroBruto)],
        ['(-) Despesas Operacionais', fmtBRL(d.despesasOperacionais?.total)],
        ['(+) Receitas Financeiras', fmtBRL(d.receitasFinanceiras)],
        ['(+) Outras Receitas', fmtBRL(d.outrasReceitas)],
        ['= LUCRO LÍQUIDO', fmtBRL(d.lucroLiquido)],
      ],
      columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right', cellWidth: 50 } },
      didParseCell: (data: any) => {
        const txt = data.row.raw?.[0] || '';
        if (txt.startsWith('=') || txt.startsWith('RECEITA BRUTA')) {
          data.cell.styles.textColor = C.white;
          data.cell.styles.fontStyle = 'bold';
        }
        if (txt.startsWith('(-)')) {
          data.cell.styles.textColor = C.red;
        }
      },
    });
    addFooter(pdf.getNumberOfPages());
    pageCount++;
  }

  // ═══════════════════════════════════════════
  // BALANCETE
  // ═══════════════════════════════════════════
  if (balancete?.contas?.length) {
    if (pageCount > 0) pdf.addPage();
    addHeader(`${empresa} — Balancete`);

    const rows = balancete.contas.map(c => [
      c.classificacao,
      c.descricao,
      fmtBRL(c.saldoAnterior),
      fmtBRL(c.debito),
      fmtBRL(c.credito),
      fmtBRL(c.saldoAtual),
      c.natureza,
    ]);

    autoTable(pdf, {
      ...tableStyles,
      startY: y,
      head: [['Class.', 'Descrição', 'Saldo Ant.', 'Débito', 'Crédito', 'Saldo Atual', 'Nat.']],
      body: rows,
      styles: { ...tableStyles.styles, fontSize: 6, cellPadding: 1.5 },
      headStyles: { ...tableStyles.headStyles, fontSize: 6 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 55 },
        2: { halign: 'right', cellWidth: 25 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 25 },
        6: { halign: 'center', cellWidth: 10 },
      },
    });
    addFooter(pdf.getNumberOfPages());
    pageCount++;
  }

  if (pageCount === 0) {
    addHeader(`${empresa} — Relatório`);
    pdf.setTextColor(...C.gray);
    pdf.setFontSize(12);
    pdf.text('Nenhum dado disponível para exportação.', m, y + 10);
    addFooter(1);
  }

  pdf.save(`relatorio-${empresa.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
