import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from './parsers/reconstruir-linhas';
import { parseDRE, validateDREData } from './parsers/dre-parser';
import { parseBalanco } from './parsers/balanco-parser';
import { parseBalancete } from './parsers/balancete-parser';

// Use the worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export type ReportType = 'balanco' | 'balancete' | 'dre-detalhada' | 'dre-sintetica' | 'desconhecido';

export interface ParsedPDF {
  fileName: string;
  reportType: ReportType;
  reportTypeLabel: string;
  empresa?: string;
  cnpj?: string;
  periodo?: string;
  rawText: string;
  textItems: TextItem[];
  status: 'processing' | 'done' | 'error';
  error?: string;
  warnings?: string[];
}

const REPORT_LABELS: Record<ReportType, string> = {
  'balanco': 'Balanço Patrimonial',
  'balancete': 'Balancete',
  'dre-detalhada': 'DRE Detalhada',
  'dre-sintetica': 'DRE Sintética',
  'desconhecido': 'Tipo Desconhecido',
};

function detectReportType(text: string): ReportType {
  const upper = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  if (upper.includes('BALANÇO PATRIMONIAL') || upper.includes('BALANCO PATRIMONIAL')) {
    return 'balanco';
  }
  if (upper.includes('BALANCETE')) {
    return 'balancete';
  }
  if (
    upper.includes('DEMONSTRACAO DO RESULTADO') ||
    upper.includes('DEMONSTRATIVO DO RESULTADO') ||
    upper.includes('DEMONSTRATIVO DE RESULTADO') ||
    /\bD\s*\.?\s*R\s*\.?\s*E\b/.test(upper) ||
    (upper.includes('RECEITA OPERACIONAL') && upper.includes('LUCRO')) ||
    (upper.includes('RESULTADO DO EXERCICIO') && upper.includes('DESPESAS'))
  ) {
    const hasDetailedAccounts = /\d+\.\d+\.\d+/.test(text);
    const lineCount = text.split('\n').filter(l => /\d/.test(l)).length;
    if (hasDetailedAccounts || lineCount > 30) {
      return 'dre-detalhada';
    }
    return 'dre-sintetica';
  }
  return 'desconhecido';
}

function extractCNPJ(text: string): string | undefined {
  const match = text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
  return match?.[0];
}

function extractPeriodo(text: string): string | undefined {
  const match = text.match(/(\d{2}\/\d{2}\/\d{4})\s*(a|até|ate|-)\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (match) return `${match[1]} a ${match[3]}`;
  const monthMatch = text.match(/(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*(de\s*)?\d{4}/i);
  if (monthMatch) return monthMatch[0];
  return undefined;
}

function extractEmpresa(text: string): string | undefined {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (/^(CNPJ|BALANÇO|BALANCETE|DEMONSTRAÇÃO|DRE|RELATÓRIO)/i.test(line)) continue;
    if (/^\d/.test(line) && line.length < 20) continue;
    if (line.length > 5 && line.length < 100) {
      return line;
    }
  }
  return undefined;
}

export async function extractTextItemsFromPDF(file: File): Promise<{ rawText: string; items: TextItem[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allItems: TextItem[] = [];
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';

    content.items.forEach((item: any) => {
      if (item.str.trim()) {
        allItems.push({
          text: item.str.trim(),
          x: Math.round(item.transform[4]),
          y: Math.round(item.transform[5]),
          page: i,
        });
      }
    });
  }

  console.log("Text items extraídos:", allItems.length, "items");
  console.log("Primeiros 20 items:", JSON.stringify(allItems.slice(0, 20), null, 2));

  return { rawText: fullText, items: allItems };
}

export async function parsePDF(file: File): Promise<ParsedPDF> {
  try {
    const { rawText, items } = await extractTextItemsFromPDF(file);
    const reportType = detectReportType(rawText);
    let empresa = extractEmpresa(rawText);
    let cnpj = extractCNPJ(rawText);
    let periodo = extractPeriodo(rawText);
    let warnings: string[] | undefined;

    if (reportType === 'dre-detalhada' || reportType === 'dre-sintetica') {
      const parsedDRE = parseDRE(items, { debug: true });
      warnings = validateDREData(parsedDRE);
      empresa = parsedDRE.empresa || empresa;
      cnpj = parsedDRE.cnpj || cnpj;
      periodo = parsedDRE.periodo || periodo;
    } else if (reportType === 'balanco') {
      const parsedBalanco = parseBalanco(items);
      empresa = parsedBalanco.empresa || empresa;
      cnpj = parsedBalanco.cnpj || cnpj;
      periodo = parsedBalanco.periodo || periodo;
    } else if (reportType === 'balancete') {
      const parsedBalancete = parseBalancete(items);
      empresa = parsedBalancete.empresa || empresa;
      cnpj = parsedBalancete.cnpj || cnpj;
      periodo = parsedBalancete.periodo || periodo;
    }

    return {
      fileName: file.name,
      reportType,
      reportTypeLabel: REPORT_LABELS[reportType],
      empresa,
      cnpj,
      periodo,
      rawText,
      textItems: items,
      status: 'done',
      warnings,
    };
  } catch (e: any) {
    return {
      fileName: file.name,
      reportType: 'desconhecido',
      reportTypeLabel: REPORT_LABELS['desconhecido'],
      rawText: '',
      textItems: [],
      status: 'error',
      error: e.message || 'Erro ao processar PDF',
    };
  }
}
