import { ReportType } from './pdf-parser';

export type DocumentGroup = 'balanco' | 'dre' | 'balancete' | 'desconhecido';

export function getDocumentGroup(tipo: string | ReportType): DocumentGroup {
  if (tipo === 'balanco') return 'balanco';
  if (tipo === 'balancete') return 'balancete';
  if (tipo.startsWith('dre')) return 'dre';
  return 'desconhecido';
}

export function getDocumentGroupLabel(group: DocumentGroup): string {
  if (group === 'balanco') return 'Balanço atual';
  if (group === 'dre') return 'DRE atual';
  if (group === 'balancete') return 'Balancete atual';
  return 'Atual';
}