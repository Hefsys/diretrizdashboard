Plano de implementação:

1. Ajustar a categoria de deduções da DRE
- Remover da visualização principal da DRE as linhas separadas de ICMS, PIS, COFINS, IRPJ e Contribuição Social.
- Exibir em deduções apenas:
  - Devoluções, quando houver valor;
  - Simples Nacional, usando o valor identificado no PDF;
  - Outras deduções, se existir algum saldo restante não classificado;
  - Total de deduções.
- Atualizar o parser para guardar explicitamente o valor de Simples Nacional em `deducoes.simplesNacional`, sem depender da categoria genérica de impostos.

2. Criar detalhamento expansível das despesas na DRE
- Transformar as linhas de despesas operacionais em seções clicáveis/expansíveis.
- Ao clicar em “Despesas com Pessoal”, mostrar salários, pró-labore, férias, INSS, FGTS e outros quando houver valores.
- Ao clicar em “Despesas Gerais”, mostrar energia, água, seguros, serviços/assistência contábil, fretes, materiais e outros.
- Ao clicar em “Despesas Financeiras”, mostrar juros, tarifas e IOF.
- Manter a linha “Total Despesas Operacionais” como resumo.

3. Atualizar gráficos e rótulos
- Remover “Impostos/Taxas” dos gráficos de despesas quando não houver valores reais nessa categoria.
- Padronizar os rótulos para refletirem melhor o PDF, com Simples Nacional nas deduções e despesas detalhadas por subcategoria.

4. Preservar dados já existentes
- Para documentos antigos que ainda não tenham `simplesNacional`, a interface calculará o valor de Simples Nacional a partir de `outrasDeducoes`/saldo de deduções quando aplicável, evitando tela zerada.
- Documentos novos passarão a salvar o campo correto ao serem reprocessados.

Detalhes técnicos:
- Alterar `src/lib/parsers/dre-parser.ts` para adicionar `simplesNacional` ao modelo de deduções e mapear a linha “SIMPLES NACIONAL”.
- Alterar `src/components/dashboard/DRETab.tsx` para trocar as linhas fixas de impostos por uma estrutura dinâmica e expansível.
- Ajustar `DistribuicaoDespesas`, `DespesasChart` e `ComparacaoGastos` para esconder categorias zeradas e evitar a categoria “Impostos/Taxas” quando ela não representa o PDF.
- Atualizar `sample-data` e testes do parser para cobrir o caso da DRE com Simples Nacional.