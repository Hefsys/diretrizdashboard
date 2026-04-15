import { parseValorBR } from '../parse-valor-br';
import { TextItem, LinhaReconstruida, reconstruirLinhas, extractHeader } from './reconstruir-linhas';

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

export function parseBalanco(items: TextItem[]): BalancoData {
  const linhas = reconstruirLinhas(items);
  const header = extractHeader(linhas);

  const r: Record<string, number> = {};

  for (const linha of linhas) {
    const txt = linha.textoCompleto;

    // Match value with D/C suffix at end of line
    const matchValor = txt.match(/([\d]+(?:\.[\d]{3})*(?:,[\d]{2}))\s*([DC])\s*$/i);
    if (!matchValor) continue;

    const valor = Math.abs(parseValorBR(matchValor[1]));
    const label = txt.replace(matchValor[0], '').trim().toUpperCase();

    console.log(`Balanço: "${label}" → ${valor} (${matchValor[2]})`);

    if (/^ATIVO$/.test(label)) r.ativoTotal = valor;
    else if (/^ATIVO CIRCULANTE$/.test(label)) r.ativoCirculante = valor;
    else if (/^ATIVO N[ÃA]O CIRCULANTE$/.test(label)) r.ativoNaoCirculante = valor;
    else if (/^DISPON[ÍI]VEL$/.test(label)) r.disponivel = valor;
    else if (/^CAIXA$/.test(label) || /^CAIXA GERAL$/.test(label)) r.caixa = (r.caixa || 0) + valor;
    else if (/^BANCOS CONTA MOVIMENTO$/.test(label)) r.bancos = valor;
    else if (/^APLICA[ÇC][ÕO]ES FINANCEIRAS/.test(label)) r.aplicacoes = valor;
    else if (/^CLIENTES$/.test(label)) r.clientes = valor;
    else if (/^DUPLICATAS A RECEBER$/.test(label)) r.clientes = r.clientes || valor;
    else if (/^OUTROS CR[ÉE]DITOS$/.test(label)) r.outrosCreditos = valor;
    else if (/^ESTOQUES$/.test(label)) r.estoques = valor;
    else if (/^IMOBILIZADO$/.test(label)) r.imobilizado = valor;
    else if (/^PASSIVO CIRCULANTE$/.test(label)) r.passivoCirculante = valor;
    else if (/^FORNECEDORES$/.test(label) && !r.fornecedores) r.fornecedores = valor;
    else if (/^OBRIGA[ÇC][ÕO]ES TRIBUT[ÁA]RIAS$/.test(label)) r.obrigTributarias = valor;
    else if (/^OBRIGA[ÇC][ÕO]ES TRABALHIST/.test(label)) r.obrigTrabalhistas = valor;
    else if (/^OUTRAS OBRIGA[ÇC][ÕO]ES$/.test(label)) r.outrasObrigacoes = valor;
    else if (/^PATRIM[ÔO]NIO L[ÍI]QUIDO$/.test(label)) r.patrimonioLiquido = valor;
    else if (/^CAPITAL SOCIAL$/.test(label) && !r.capitalSocial) r.capitalSocial = valor;
    else if (/^LUCROS OU PREJU[ÍI]ZOS ACUMULADOS$/.test(label)) r.lucrosAcumulados = valor;
    else if (/^LUCROS ACUMULADOS$/.test(label) && !r.lucrosAcumulados) r.lucrosAcumulados = valor;
    else if (/^AJUSTES DE EXERC[ÍI]CIOS/.test(label)) r.ajustes = valor;
  }

  console.log("=== VALIDAÇÃO BALANÇO ===");
  console.log("Ativo Total:", r.ativoTotal, "(esperado: 6698934.72)");
  console.log("Ativo Circulante:", r.ativoCirculante, "(esperado: 6698934.72)");
  console.log("Disponível:", r.disponivel, "(esperado: 307233.10)");
  console.log("Passivo Circulante:", r.passivoCirculante, "(esperado: 55704.53)");
  console.log("Patrimônio Líquido:", r.patrimonioLiquido, "(esperado: 6643230.19)");

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
