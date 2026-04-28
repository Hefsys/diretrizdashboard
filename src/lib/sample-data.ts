import { DREData } from './parsers/dre-parser';

export const sampleDRE: DREData = {
  empresa: 'Empresa Exemplo Ltda',
  cnpj: '12.345.678/0001-90',
  periodo: '01/01/2024 a 31/12/2024',
  receitaBruta: 3499999.50,
  deducoes: {
    devolucoes: -12500.00,
    simplesNacional: 0,
    icms: -95000.00,
    cofins: -52000.00,
    pis: -11300.00,
    contribuicaoSocial: -35000.00,
    impostoRenda: -42000.00,
    substituicaoTributaria: -7378.23,
    outras: 0,
    total: -255178.23,
  },
  receitaLiquida: 3244821.27,
  cmv: -1719200.88,
  lucroBruto: 1525620.39,
  despesasOperacionais: {
    pessoal: { salarios: -120000, proLabore: 0, ferias: -15000, inss: -28000, fgts: -9600, outros: -5000, total: -177600 },
    impostosTaxas: { icms: -8000, outros: -3500, total: -11500 },
    despesasGerais: { energia: -18000, agua: -3500, seguros: -12000, servicos: -35000, fretes: -22000, materiais: -8000, outros: -15690.66, total: -114190.66 },
    despesasFinanceiras: { juros: -3000, tarifas: -1500, iof: -500, total: -5000 },
    total: -308290.66,
  },
  receitasFinanceiras: 3185.82,
  outrasReceitas: 952.67,
  resultadoOperacional: 1221468.22,
  lucroLiquido: 1221468.22,
};
