import { parseValorBR } from '../parse-valor-br';
import { TextItem, reconstruirLinhas, extractHeader } from './reconstruir-linhas';

export interface BalancoData {
  empresa: string;
  cnpj: string;
  periodo: string;
  ativo: {
    circulante: {
      disponivel: { caixa: number; bancos: number; aplicacoes: number; total: number };
      clientes: number;
      outrosCreditos: number;
      estoques: number;
      total: number;
    };
    naoCirculante: { imobilizado: number; total: number };
    total: number;
  };
  passivo: {
    circulante: {
      fornecedores: number;
      obrigacoesTributarias: number;
      obrigacoesTrabalhistas: number;
      outrasObrigacoes: number;
      total: number;
    };
    patrimonioLiquido: {
      capitalSocial: number;
      lucrosAcumulados: number;
      ajustesExercicios: number;
      total: number;
    };
    total: number;
  };
}

const MONEY_PATTERN = /\(?\d+(?:\.\d{3})*,\d{2}\)?\s*[DC]?/gi;

function normalizarLabel(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, ' ')
    .replace(/[\s\-/]+/g, ' ')
    .trim()
    .toUpperCase();
}

function extrairValorELabel(txt: string): { label: string; valor: number } | null {
  const valores = txt.match(MONEY_PATTERN) || [];
  if (!valores.length) return null;

  const valorRaw = valores[valores.length - 1].trim();
  const labelSemValores = txt.replace(MONEY_PATTERN, ' ').replace(/\s+/g, ' ').trim();
  const label = normalizarLabel(labelSemValores);
  if (!label || /^(SALDO|DATA|PAGINA|CNPJ|BALANCO|DEMONSTRACAO)\b/.test(label)) return null;

  return { label, valor: Math.abs(parseValorBR(valorRaw)) };
}

export function parseBalanco(items: TextItem[]): BalancoData {
  const linhas = reconstruirLinhas(items);
  const header = extractHeader(linhas);

  const r: Record<string, number> = {};

  for (const linha of linhas) {
    const parsed = extrairValorELabel(linha.textoCompleto);
    if (!parsed) continue;

    const { label, valor } = parsed;

    console.log(`Balanço: "${label}" → ${valor}`);

    if (/^ATIVO$/.test(label)) r.ativoTotal = valor;
    else if (/^ATIVO CIRCULANTE$/.test(label)) r.ativoCirculante = valor;
    else if (/^ATIVO NAO CIRCULANTE$/.test(label)) r.ativoNaoCirculante = valor;
    else if (/^DISPONIVEL$|CAIXA E EQUIVALENTES|DISPONIBILIDADES/.test(label)) r.disponivel = valor;
    else if (/^CAIXA$|^CAIXA GERAL$|NUMERARIO/.test(label)) r.caixa = (r.caixa || 0) + valor;
    else if (/BANCOS? CONTA MOVIMENTO|CONTA CORRENTE|BANCO/.test(label)) r.bancos = (r.bancos || 0) + valor;
    else if (/APLICACOES FINANCEIRAS|APLICACAO/.test(label)) r.aplicacoes = (r.aplicacoes || 0) + valor;
    else if (/^CLIENTES$/.test(label)) r.clientes = valor;
    else if (/DUPLICATAS A RECEBER|CONTAS A RECEBER|CLIENTES/.test(label)) r.clientes = r.clientes || valor;
    else if (/^OUTROS CREDITOS$|TRIBUTOS A RECUPERAR|IMPOSTOS A RECUPERAR|ADIANTAMENTOS/.test(label)) r.outrosCreditos = valor;
    else if (/^ESTOQUES$/.test(label)) r.estoques = valor;
    else if (/^IMOBILIZADO$|BENS EM OPERACAO|INTANGIVEL/.test(label)) r.imobilizado = valor;
    else if (/^PASSIVO CIRCULANTE$/.test(label)) r.passivoCirculante = valor;
    else if (/^FORNECEDORES$/.test(label) && !r.fornecedores) r.fornecedores = valor;
    else if (/FORNECEDORES|DUPLICATAS A PAGAR/.test(label) && !r.fornecedores) r.fornecedores = valor;
    else if (/OBRIGACOES TRIBUTARIAS|OBRIGACOES FISCAIS|IMPOSTOS.*RECOLHER|TRIBUTOS.*RECOLHER|CONTRIBUICOES.*RECOLHER/.test(label)) r.obrigTributarias = valor;
    else if (/OBRIGACOES TRABALHIST|OBRIGACOES SOCIAIS|SALARIOS.*PAGAR|PRO LABORE.*PAGAR|ENCARGOS.*RECOLHER|INSS.*RECOLHER|FGTS.*RECOLHER/.test(label)) r.obrigTrabalhistas = valor;
    else if (/OUTRAS OBRIGACOES|EMPRESTIMOS|FINANCIAMENTOS|ADIANTAMENTO DE CLIENTES/.test(label)) r.outrasObrigacoes = valor;
    else if (/^PATRIMONIO LIQUIDO$/.test(label)) r.patrimonioLiquido = valor;
    else if (/^CAPITAL SOCIAL$/.test(label) && !r.capitalSocial) r.capitalSocial = valor;
    else if (/^LUCROS OU PREJUIZOS ACUMULADOS$/.test(label)) r.lucrosAcumulados = valor;
    else if (/^LUCROS ACUMULADOS$/.test(label) && !r.lucrosAcumulados) r.lucrosAcumulados = valor;
    else if (/^AJUSTES DE EXERCICIOS|RESULTADO DO EXERCICIO/.test(label)) r.ajustes = valor;
  }

  if (!r.disponivel) r.disponivel = (r.caixa || 0) + (r.bancos || 0) + (r.aplicacoes || 0);
  if (!r.ativoCirculante) r.ativoCirculante = (r.disponivel || 0) + (r.clientes || 0) + (r.outrosCreditos || 0) + (r.estoques || 0);
  if (!r.ativoTotal) r.ativoTotal = (r.ativoCirculante || 0) + (r.ativoNaoCirculante || r.imobilizado || 0);
  if (!r.passivoCirculante) r.passivoCirculante = (r.fornecedores || 0) + (r.obrigTributarias || 0) + (r.obrigTrabalhistas || 0) + (r.outrasObrigacoes || 0);
  if (!r.patrimonioLiquido && r.ativoTotal) r.patrimonioLiquido = r.ativoTotal - (r.passivoCirculante || 0);

  return {
    ...header,
    ativo: {
      circulante: {
        disponivel: {
          caixa: r.caixa || 0,
          bancos: r.bancos || 0,
          aplicacoes: r.aplicacoes || 0,
          total: r.disponivel || 0,
        },
        clientes: r.clientes || 0,
        outrosCreditos: r.outrosCreditos || 0,
        estoques: r.estoques || 0,
        total: r.ativoCirculante || 0,
      },
      naoCirculante: {
        imobilizado: r.imobilizado || 0,
        total: r.ativoNaoCirculante || r.imobilizado || 0,
      },
      total: r.ativoTotal || r.ativoCirculante || 0,
    },
    passivo: {
      circulante: {
        fornecedores: r.fornecedores || 0,
        obrigacoesTributarias: r.obrigTributarias || 0,
        obrigacoesTrabalhistas: r.obrigTrabalhistas || 0,
        outrasObrigacoes: r.outrasObrigacoes || 0,
        total: r.passivoCirculante || 0,
      },
      patrimonioLiquido: {
        capitalSocial: r.capitalSocial || 0,
        lucrosAcumulados: r.lucrosAcumulados || 0,
        ajustesExercicios: -(r.ajustes || 0),
        total: r.patrimonioLiquido || 0,
      },
      total: (r.passivoCirculante || 0) + (r.patrimonioLiquido || 0),
    },
  };
}
