import { parseValorBR } from '../parse-valor-br';
import { TextItem, reconstruirLinhas, extractHeader } from './reconstruir-linhas';

export interface DREData {
  empresa: string;
  cnpj: string;
  periodo: string;
  receitaBruta: number;
  deducoes: {
    devolucoes: number;
    simplesNacional: number;
    icms: number;
    cofins: number;
    pis: number;
    contribuicaoSocial: number;
    impostoRenda: number;
    substituicaoTributaria: number;
    outras: number;
    total: number;
  };
  receitaLiquida: number;
  cmv: number;
  lucroBruto: number;
  despesasOperacionais: {
    pessoal: { salarios: number; ferias: number; inss: number; fgts: number; outros: number; total: number };
    impostosTaxas: { icms: number; outros: number; total: number };
    despesasGerais: { energia: number; agua: number; seguros: number; servicos: number; fretes: number; materiais: number; outros: number; total: number };
    despesasFinanceiras: { juros: number; tarifas: number; iof: number; total: number };
    total: number;
  };
  receitasFinanceiras: number;
  outrasReceitas: number;
  resultadoOperacional: number;
  lucroLiquido: number;
}

export function validateDREData(data: DREData): string[] {
  const warnings: string[] = [];
  const principais = [data.receitaBruta, data.receitaLiquida, data.cmv, data.lucroBruto, data.despesasOperacionais.total, data.lucroLiquido];
  if (principais.every(v => v === 0)) warnings.push('Nenhum dado parseável foi encontrado na DRE.');
  if (data.receitaBruta < data.receitaLiquida) warnings.push('Receita Bruta menor que Receita Líquida; revise o PDF importado.');
  if (data.receitaBruta === 0 && Math.abs(data.lucroLiquido) > 0) warnings.push('Receita Bruta zerada com Lucro Líquido preenchido.');
  if (data.receitaBruta > 0 && data.lucroLiquido === 0) warnings.push('Lucro Líquido zerado após o parsing.');
  return warnings;
}

function parseValorDRE(str: string): number {
  if (!str) return 0;
  const negativo = str.includes('(') && str.includes(')');
  const limpo = str.replace(/[()R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(limpo) || 0;
  return negativo ? -num : num;
}

function pos(v: number): number { return v === 0 ? 0 : Math.abs(v); }
function neg(v: number): number { return v === 0 ? 0 : -Math.abs(v); }

const MONEY_PATTERN = /\(?\d+(?:\.\d{3})*,\d{2}\)?/g;

function normalizarLabel(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, ' ')
    .replace(/[\s-]+/g, ' ')
    .trim()
    .toUpperCase();
}

function removerValoresFinais(str: string): string {
  return str.replace(/(?:\s+\(?\d+(?:\.\d{3})*,\d{2}\)?)+\s*$/, '').trim();
}

type DRESection = 'receitaBruta' | 'deducoes' | 'despesasOperacionais' | null;

function atualizarSecao(label: string): DRESection | undefined {
  if (/^RECEITA\s+BRUTA/.test(label)) return 'receitaBruta';
  if (/^DEDUCOES/.test(label)) return 'deducoes';
  if (/^DESPESAS\s+(OPERACIONAIS|ADMINISTRATIVAS|GERAIS|COM PESSOAL|FINANCEIRAS)/.test(label)) return 'despesasOperacionais';
  if (/RECEITA\s+LIQUIDA|LUCRO\s+BRUTO|RESULTADO\s+OPERACIONAL|LUCRO\s+LIQUIDO|RESULTADO\s+DO\s+EXERC/.test(label)) return null;
  return undefined;
}

function escolherValorDRE(label: string, valores: string[]): string {
  if (valores.length === 1) return valores[0];
  const isLinhaResumo = /RECEITA\s+LIQUIDA|LUCRO|RESULTADO|DESPESAS\s+OPERACIONAIS|DEDUCOES|TOTAL/.test(label);
  if (isLinhaResumo) return valores[valores.length - 1];
  return valores[0];
}

export function parseDRE(items: TextItem[], options: { debug?: boolean } = {}): DREData {
  const { debug = true } = options;
  const linhas = reconstruirLinhas(items);
  const header = extractHeader(linhas);

  const r: Record<string, number> = {};
  let currentSection: DRESection = null;

  for (const linha of linhas) {
    const txt = linha.textoCompleto;

    const valores = txt.match(MONEY_PATTERN) || [];
    const labelSemValores = removerValoresFinais(txt);
    const label = normalizarLabel(labelSemValores);

    const nextSection = atualizarSecao(label);
    if (nextSection !== undefined) currentSection = nextSection;

    if (!valores.length) {
      continue;
    }

    const valorRaw = escolherValorDRE(label, valores).trim();
    const valor = parseValorDRE(valorRaw);

    if (debug) console.log(`DRE: "${label}" → ${valor}`);

    if (/RECEITA\s+LIQUIDA/.test(label)) r.receitaLiquida = pos(valor);
    else if (/LUCRO\s+BRUTO/.test(label) || /RESULTADO\s+BRUTO/.test(label)) r.lucroBruto = pos(valor);
    else if (/RESULTADO\s+OPERACIONAL/.test(label)) r.resultadoOperacional = valor;
    else if (/LUCRO\s+LIQUIDO/.test(label) || /RESULTADO\s+DO\s+EXERC/.test(label) || /RESULTADO\s+LIQUIDO/.test(label)) r.lucroLiquido = valor;

    // Receita Bruta
    else if (/RECEITA\s*BRUTA$/.test(label) || /RECEITA\s+OPERACIONAL\s+BRUTA$/.test(label)) {
      r.receitaBruta = r.receitaBruta || pos(valor);
    }
    else if (
      currentSection === 'receitaBruta' ||
      /VENDA\s+DE\s+MERCADORIAS/.test(label) ||
      /SERVICOS?\s+PRESTAD/.test(label) ||
      /PRESTACAO\s+DE\s+SERVICOS/.test(label) ||
      (/RECEITA/.test(label) && !/FINANCEIR|LIQUIDA|DEDUC|DESPESA/.test(label))
    ) {
      r.receitaBrutaItens = (r.receitaBrutaItens || 0) + pos(valor);
    }

    // Deduções
    else if (/DEVOLUCAO/.test(label)) r.devolucoes = neg(valor);
    else if (/ICMS\s+S/.test(label) || (/\bICMS\b/.test(label) && /\(-?\)/.test(label))) r.icms = neg(valor);
    else if (/COFINS/.test(label) && !label.includes('DESPESA')) r.cofins = neg(valor);
    else if (/\bPIS\b/.test(label) && !label.includes('DESPESA')) r.pis = neg(valor);
    else if (/SIMPLES\s+NACIONAL/.test(label)) r.simplesNacional = (r.simplesNacional || 0) + neg(valor);
    else if (/CONTRIBUICAO\s+SOCIAL/.test(label)) r.csll = neg(valor);
    else if (/IMPOSTO\s+DE\s+RENDA/.test(label)) r.irpj = neg(valor);
    else if (/SUBSTITUICAO/.test(label)) r.st = neg(valor);
    else if (/DEDUCOES/.test(label) && /TOTAL/.test(label)) r.totalDeducoes = neg(valor);
    else if (/^[\(-]*\s*DEDUCOES/.test(label)) r.totalDeducoes = r.totalDeducoes || neg(valor);
    else if (currentSection === 'deducoes') r.outrasDeducoes = (r.outrasDeducoes || 0) + neg(valor);

    // CMV
    else if (/CUSTOS?\s+D[AO]S?\s+MERCADORIAS/.test(label) || /^CMV/.test(label)) r.cmv = neg(valor);

    // Despesas pessoal
    else if (/SALARIOS/.test(label)) r.salarios = neg(valor);
    else if (/PRO\s*LABORE/.test(label)) r.proLabore = (r.proLabore || 0) + neg(valor);
    else if (/FERIAS/.test(label)) r.ferias = neg(valor);
    else if (/\bINSS\b/.test(label)) r.inss = neg(valor);
    else if (/\bFGTS\b/.test(label)) r.fgts = neg(valor);

    // Despesas gerais
    else if (/ENERGIA/.test(label)) r.energia = neg(valor);
    else if (/AGUA/.test(label)) r.agua = neg(valor);
    else if (/SEGUROS?/.test(label)) r.seguros = neg(valor);
    else if (/SERVICOS|ASSISTENCIA\s+CONTABIL|CONTABIL/.test(label)) r.servicos = (r.servicos || 0) + neg(valor);
    else if (/FRETES?/.test(label)) r.fretes = neg(valor);
    else if (/MATERI/.test(label)) r.materiais = neg(valor);

    // Despesas financeiras
    else if (/JUROS/.test(label)) r.juros = neg(valor);
    else if (/TARIFAS/.test(label)) r.tarifas = neg(valor);
    else if (/\bIOF\b/.test(label)) r.iof = neg(valor);

    // Total despesas operacionais
    else if (/DESPESAS\s+OPERACIONAIS/.test(label)) r.despesasTotal = neg(valor);
    else if (currentSection === 'despesasOperacionais') r.despesasGeraisOutros = (r.despesasGeraisOutros || 0) + neg(valor);

    // Receitas
    else if (/RENDIMENTOS\s+DE\s+APLICA/.test(label) || /RECEITAS\s+FINANCEIRAS/.test(label)) r.receitasFinanceiras = pos(valor);
    else if (/BONIFICA[ÇC][ÕO]ES/.test(label) || /OUTRAS\s+RECEITAS/.test(label)) r.outrasReceitas = pos(valor);

  }

  // Calculate derived values
  const rb = r.receitaBruta || r.receitaBrutaItens || 0;
  const deducItems = [r.devolucoes || 0, r.simplesNacional || 0, r.icms || 0, r.cofins || 0, r.pis || 0, r.csll || 0, r.irpj || 0, r.st || 0, r.outrasDeducoes || 0];
  const deducoesCalc = deducItems.reduce((a, b) => a + b, 0);
  const totalDeducoes = r.totalDeducoes || deducoesCalc;
  const receitaLiquida = r.receitaLiquida || pos(rb + totalDeducoes);
  const lucroBruto = r.lucroBruto || pos(receitaLiquida + (r.cmv || 0));

  const totalPessoal = -[r.salarios, r.proLabore, r.ferias, r.inss, r.fgts].reduce((a, b) => a + Math.abs(b || 0), 0);
  const totalDespGerais = -[r.energia, r.agua, r.seguros, r.servicos, r.fretes, r.materiais, r.despesasGeraisOutros].reduce((a, b) => a + Math.abs(b || 0), 0);
  const totalDespFin = -[r.juros, r.tarifas, r.iof].reduce((a, b) => a + Math.abs(b || 0), 0);
  const totalDespOp = r.despesasTotal || (totalPessoal + totalDespGerais + totalDespFin);

  const recFin = r.receitasFinanceiras || 0;
  const outrasRec = r.outrasReceitas || 0;
  const resultadoOp = r.resultadoOperacional || (lucroBruto + totalDespOp + recFin + outrasRec);
  const lucroLiq = r.lucroLiquido || resultadoOp;

  console.log("=== VALIDAÇÃO DRE ===");
  console.log("Receita Bruta:", rb, "(esperado: 3499999.50)");
  console.log("Lucro Bruto:", lucroBruto, "(esperado: 1525620.39)");
  console.log("Lucro Líquido:", lucroLiq, "(esperado: 1221468.22)");

  const result: DREData = {
    ...header,
    receitaBruta: rb,
    deducoes: {
      devolucoes: r.devolucoes || 0,
      simplesNacional: r.simplesNacional || 0,
      icms: r.icms || 0,
      cofins: r.cofins || 0,
      pis: r.pis || 0,
      contribuicaoSocial: r.csll || 0,
      impostoRenda: r.irpj || 0,
      substituicaoTributaria: r.st || 0,
      outras: r.outrasDeducoes || 0,
      total: totalDeducoes,
    },
    receitaLiquida,
    cmv: r.cmv || 0,
    lucroBruto,
    despesasOperacionais: {
      pessoal: { salarios: r.salarios || 0, proLabore: r.proLabore || 0, ferias: r.ferias || 0, inss: r.inss || 0, fgts: r.fgts || 0, outros: 0, total: totalPessoal },
      impostosTaxas: { icms: 0, outros: 0, total: 0 },
      despesasGerais: { energia: r.energia || 0, agua: r.agua || 0, seguros: r.seguros || 0, servicos: r.servicos || 0, fretes: r.fretes || 0, materiais: r.materiais || 0, outros: r.despesasGeraisOutros || 0, total: totalDespGerais },
      despesasFinanceiras: { juros: r.juros || 0, tarifas: r.tarifas || 0, iof: r.iof || 0, total: totalDespFin },
      total: totalDespOp,
    },
    receitasFinanceiras: recFin,
    outrasReceitas: outrasRec,
    resultadoOperacional: resultadoOp,
    lucroLiquido: lucroLiq,
  };

  if (debug) {
    console.log('DRE parseada:', JSON.stringify(result, null, 2));
    validateDREData(result).forEach(w => console.warn('Aviso DRE:', w));
  }

  return result;
}
