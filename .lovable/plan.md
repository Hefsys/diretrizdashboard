Plano de ajuste:

1. Fazer a DRE respeitar o regime/categorias de cada documento
- A tela não vai assumir que toda empresa é Simples Nacional.
- “Simples Nacional” só aparecerá quando o PDF/documento trouxer essa categoria ou quando o dado salvo já tiver esse campo preenchido.
- Empresas que tiverem ICMS, PIS, COFINS, IRPJ, CSLL, substituição tributária ou outras deduções continuarão vendo essas categorias quando elas existirem no documento.
- Remover o fallback atual que transforma automaticamente o saldo total de deduções em “Simples Nacional”, pois isso pode classificar errado empresas que não são do Simples.

2. Mostrar as deduções com os mesmos nomes das categorias encontradas
- A seção de deduções será montada dinamicamente a partir dos valores reais parseados:
  - Devoluções;
  - Simples Nacional;
  - ICMS;
  - PIS;
  - COFINS;
  - IRPJ;
  - Contribuição Social/CSLL;
  - Substituição Tributária;
  - Outras deduções.
- Linhas zeradas não serão exibidas.
- O total de deduções permanecerá como resumo.

3. Preservar detalhamento expansível das despesas sem forçar categorias inexistentes
- Manter as despesas expansíveis, mas só exibir subcategorias realmente identificadas no documento.
- Se o documento trouxer despesas específicas, elas aparecem dentro do grupo correspondente.
- Se houver valor não classificado, ele fica em “Outros”, sem inventar uma categoria como “Impostos/Taxas” quando não existir no documento.

4. Ajustar exportação em PDF e gráficos
- O PDF exportado seguirá a mesma lógica da tela: categorias de deduções conforme o documento, não somente “Simples Nacional”.
- Gráficos continuarão escondendo categorias zeradas.
- “Impostos/Taxas” em despesas só aparecerá se houver valor real nessa categoria.

5. Atualizar dados de exemplo e testes
- Ajustar o `sample-data` para não induzir a tela a mostrar Simples Nacional em todos os casos.
- Incluir/ajustar testes cobrindo dois cenários:
  - empresa do Simples Nacional com linha “Simples Nacional” no documento;
  - empresa fora do Simples com impostos separados, mantendo as categorias originais.

Detalhes técnicos:
- Alterar `src/components/dashboard/DRETab.tsx` para criar uma lista dinâmica de deduções a partir de `dre.deducoes`, sem fallback automático para Simples Nacional.
- Alterar `src/lib/export-pdf.ts` para exportar a mesma lista dinâmica de deduções.
- Revisar `src/lib/parsers/dre-parser.ts` apenas se necessário para garantir que impostos separados e Simples Nacional sejam guardados em campos próprios, sem sobrescrever categorias.
- Atualizar `src/lib/sample-data.ts` e `src/test/dre-parser.test.ts` para refletir os dois tipos de documento.