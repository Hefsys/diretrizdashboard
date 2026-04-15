import { parseValorBR } from '../parse-valor-br';
import { TextItem, reconstruirLinhas, extractHeader } from './reconstruir-linhas';

export interface ContaBalancete {
  codigo: number;
  classificacao: string;
  descricao: string;
  saldoAnterior: number;
  debito: number;
  credito: number;
  saldoAtual: number;
  natureza: 'D' | 'C';
}

export interface BalanceteData {
  empresa: string;
  cnpj: string;
  periodo: string;
  contas: ContaBalancete[];
  resumo: {
    totalDevedoras: number;
    totalCredoras: number;
    resultadoExercicio: number;
  };
}

function parseValorComSufixo(str: string): { valor: number; natureza: 'D' | 'C' | null } {
  if (!str) return { valor: 0, natureza: null };
  const t = str.trim();
  const suffixMatch = t.match(/([DC])\s*$/i);
  const natureza = suffixMatch ? (suffixMatch[1].toUpperCase() as 'D' | 'C') : null;
  const cleanStr = natureza ? t.slice(0, -1).trim() : t;
  return { valor: Math.abs(parseValorBR(cleanStr)), natureza };
}

export function parseBalancete(items: TextItem[]): BalanceteData {
  const linhas = reconstruirLinhas(items);
  const header = extractHeader(linhas);
  const contas: ContaBalancete[] = [];

  // Each reconstructed line should now have: CODE CLASSIF DESC SALDO_ANT DEBITO CREDITO SALDO_ATUAL
  const lineRegex = /^(\d+)\s+([\d.]+)\s+(.+?)\s+([\d.,]+[DC])\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+[DC])\s*$/i;

  for (const linha of linhas) {
    const match = linha.textoCompleto.match(lineRegex);
    if (!match) continue;

    const codigo = parseInt(match[1], 10);
    const classificacao = match[2];
    const descricao = match[3].trim();
    const saldoAnt = parseValorComSufixo(match[4]);
    const debito = Math.abs(parseValorBR(match[5]));
    const credito = Math.abs(parseValorBR(match[6]));
    const saldoAtual = parseValorComSufixo(match[7]);

    contas.push({
      codigo,
      classificacao,
      descricao,
      saldoAnterior: saldoAnt.valor,
      debito,
      credito,
      saldoAtual: saldoAtual.valor,
      natureza: saldoAtual.natureza || saldoAnt.natureza || 'D',
    });
  }

  console.log("Total de contas parseadas:", contas.length);

  const totalDevedoras = contas.filter(c => c.natureza === 'D').reduce((s, c) => s + c.saldoAtual, 0);
  const totalCredoras = contas.filter(c => c.natureza === 'C').reduce((s, c) => s + c.saldoAtual, 0);

  return {
    ...header,
    contas,
    resumo: {
      totalDevedoras,
      totalCredoras,
      resultadoExercicio: totalDevedoras - totalCredoras,
    },
  };
}
