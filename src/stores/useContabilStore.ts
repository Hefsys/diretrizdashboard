import { create } from 'zustand';
import { ParsedPDF } from '@/lib/pdf-parser';
import { BalancoData, parseBalanco } from '@/lib/parsers/balanco-parser';
import { DREData, parseDRE } from '@/lib/parsers/dre-parser';
import { BalanceteData, parseBalancete } from '@/lib/parsers/balancete-parser';
import { sampleDRE } from '@/lib/sample-data';

interface ContabilState {
  // Raw parsed files
  files: ParsedPDF[];

  // Structured data
  balanco: BalancoData | null;
  dre: DREData | null;
  balancete: BalanceteData | null;

  // Empresa info (from first file parsed)
  empresaId: string;
  empresa: string;
  cnpj: string;
  periodo: string;

  // Actions
  setFiles: (files: ParsedPDF[]) => void;
  processStructuredData: () => void;
  loadSampleData: () => void;
  reset: () => void;
}

export const useContabilStore = create<ContabilState>((set, get) => ({
  files: [],
  balanco: null,
  dre: null,
  balancete: null,
  empresaId: '',
  empresa: '',
  cnpj: '',
  periodo: '',

  setFiles: (files) => {
    set({ files });
    // Auto-process when files change
    setTimeout(() => get().processStructuredData(), 0);
  },

  processStructuredData: () => {
    const { files } = get();
    let balanco: BalancoData | null = null;
    let dre: DREData | null = null;
    let balancete: BalanceteData | null = null;
    let empresa = '';
    let cnpj = '';
    let periodo = '';

    for (const file of files) {
      if (file.status !== 'done') continue;
      const items = file.textItems || [];

      try {
        switch (file.reportType) {
          case 'balanco':
            balanco = parseBalanco(items);
            if (!empresa && balanco.empresa) empresa = balanco.empresa;
            if (!cnpj && balanco.cnpj) cnpj = balanco.cnpj;
            if (!periodo && balanco.periodo) periodo = balanco.periodo;
            break;
          case 'dre-detalhada':
          case 'dre-sintetica':
            dre = parseDRE(items);
            if (!empresa && dre.empresa) empresa = dre.empresa;
            if (!cnpj && dre.cnpj) cnpj = dre.cnpj;
            if (!periodo && dre.periodo) periodo = dre.periodo;
            break;
          case 'balancete':
            balancete = parseBalancete(items);
            if (!empresa && balancete.empresa) empresa = balancete.empresa;
            if (!cnpj && balancete.cnpj) cnpj = balancete.cnpj;
            if (!periodo && balancete.periodo) periodo = balancete.periodo;
            break;
        }
      } catch (e) {
        console.error(`Erro ao processar ${file.fileName}:`, e);
      }
    }

    set({ balanco, dre, balancete, empresa, cnpj, periodo });
  },

  loadSampleData: () => set({
    dre: sampleDRE,
    empresa: sampleDRE.empresa,
    cnpj: sampleDRE.cnpj,
    periodo: sampleDRE.periodo,
  }),

  reset: () => set({
    files: [],
    balanco: null,
    dre: null,
    balancete: null,
    empresaId: '',
    empresa: '',
    cnpj: '',
    periodo: '',
  }),
}));
