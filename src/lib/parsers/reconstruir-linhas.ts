export interface TextItem {
  text: string;
  x: number;
  y: number;
  page: number;
}

export interface LinhaReconstruida {
  y: number;
  textos: string[];
  textoCompleto: string;
}

const Y_TOLERANCE = 3;

export function reconstruirLinhas(allItems: TextItem[]): LinhaReconstruida[] {
  const linhasMap: Record<string, TextItem[]> = {};

  allItems.forEach(item => {
    if (!item.text.trim()) return;

    let yKey: string | null = null;
    for (const existingY of Object.keys(linhasMap)) {
      if (Math.abs(parseFloat(existingY) - item.y) < Y_TOLERANCE) {
        yKey = existingY;
        break;
      }
    }

    if (!yKey) {
      yKey = String(Math.round(item.y / Y_TOLERANCE) * Y_TOLERANCE);
    }

    if (!linhasMap[yKey]) linhasMap[yKey] = [];
    linhasMap[yKey].push(item);
  });

  const linhasOrdenadas = Object.entries(linhasMap)
    .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
    .map(([y, items]) => {
      items.sort((a, b) => a.x - b.x);
      return {
        y: parseFloat(y),
        textos: items.map(i => i.text.trim()).filter(Boolean),
        textoCompleto: items.map(i => i.text.trim()).filter(Boolean).join(' ')
      };
    });

  console.log("Linhas reconstruídas (primeiras 30):");
  linhasOrdenadas.slice(0, 30).forEach((l, i) => {
    console.log(`  Linha ${i} (y=${l.y}): "${l.textoCompleto}"`);
  });

  return linhasOrdenadas;
}

export function extractHeader(linhas: LinhaReconstruida[]) {
  const fullText = linhas.map(l => l.textoCompleto).join('\n');
  const cnpjMatch = fullText.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
  const periodoMatch = fullText.match(/(\d{2}\/\d{2}\/\d{4})\s*(a|até|ate|-)\s*(\d{2}\/\d{2}\/\d{4})/i);

  let empresa = '';
  for (let i = 0; i < Math.min(linhas.length, 8); i++) {
    const l = linhas[i].textoCompleto;
    if (/^(CNPJ|BALANÇO|BALANCETE|DEMONSTRAÇÃO|DRE|RELATÓRIO|Saldo)/i.test(l)) continue;
    if (/^\d/.test(l) && l.length < 20) continue;
    if (l.length > 5 && l.length < 100) { empresa = l; break; }
  }

  return {
    empresa,
    cnpj: cnpjMatch?.[0] ?? '',
    periodo: periodoMatch ? `${periodoMatch[1]} a ${periodoMatch[3]}` : '',
  };
}
