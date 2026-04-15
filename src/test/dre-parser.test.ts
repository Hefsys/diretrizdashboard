import { describe, expect, it } from 'vitest';
import { parseDRE, validateDREData } from '../lib/parsers/dre-parser';
import { TextItem } from '../lib/parsers/reconstruir-linhas';

/**
 * Helper: simulates text items as they'd come from pdfjs-dist.
 * Each line becomes items at the same Y, with label at x=50 and value at x=300.
 */
function makeItems(lines: [string, string?][]): TextItem[] {
  const items: TextItem[] = [];
  let y = 800; // Start from top (high Y = top of page in PDF coords)
  for (const [label, value] of lines) {
    items.push({ text: label, x: 50, y, page: 1 });
    if (value) {
      items.push({ text: value, x: 300, y, page: 1 });
    }
    y -= 15;
  }
  return items;
}

describe('parseDRE', () => {
  it('extrai os principais valores sem deslocar as linhas', () => {
    const items = makeItems([
      ['EMPRESA EXEMPLO LTDA'],
      ['CNPJ 12.345.678/0001-90'],
      ['01/01/2024 a 31/12/2024'],
      ['RECEITA BRUTA', '3.499.999,50'],
      ['DEDUÇÕES', '(255.178,23)'],
      ['RECEITA LÍQUIDA', '3.244.821,27'],
      ['CMV', '(1.719.200,88)'],
      ['LUCRO BRUTO', '1.525.620,39'],
      ['DESPESAS OPERACIONAIS', '(308.290,66)'],
      ['RECEITAS FINANCEIRAS', '3.185,82'],
      ['OUTRAS RECEITAS OPERACIONAIS', '952,67'],
      ['LUCRO LÍQUIDO DO EXERCÍCIO', '1.221.468,22'],
    ]);

    const result = parseDRE(items, { debug: false });

    expect(result.receitaBruta).toBe(3499999.5);
    expect(result.deducoes.total).toBe(-255178.23);
    expect(result.receitaLiquida).toBe(3244821.27);
    expect(result.cmv).toBe(-1719200.88);
    expect(result.lucroBruto).toBe(1525620.39);
    expect(result.despesasOperacionais.total).toBe(-308290.66);
    expect(result.receitasFinanceiras).toBe(3185.82);
    expect(result.outrasReceitas).toBe(952.67);
    expect(result.lucroLiquido).toBe(1221468.22);
    expect(validateDREData(result)).toEqual([]);
  });
});
