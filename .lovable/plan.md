Plano de implementação

1. Nova aba “Histórico” no dashboard
- Adicionar uma nova opção no menu lateral do dashboard: Histórico.
- A aba vai carregar os documentos salvos da empresa atual e montar uma visão temporal por período.
- Usar principalmente os documentos DRE para evolução de:
  - Faturamento / Receita Bruta
  - Receita Líquida
  - Despesas Operacionais
  - Lucro Bruto
  - Resultado Operacional
  - Lucro Líquido
- Quando houver Balanço ou Balancete no mesmo período, incluir indicadores adicionais disponíveis, como Ativo Total e Resultado do Exercício.

2. Gráficos comparativos por período
- Criar gráficos de linha para acompanhar evolução mês a mês / período a período.
- Criar comparação ano contra ano, agrupando os períodos por ano quando houver dados suficientes.
- Adicionar cards de resumo mostrando variação entre o período mais recente e o anterior, por exemplo:
  - Faturamento subiu/caiu X%
  - Despesas subiram/caíram X%
  - Lucro subiu/caiu X%
- Destacar “o que impactou” com uma lista simples dos maiores movimentos entre períodos, por exemplo:
  - Aumento de despesas operacionais
  - Queda/aumento de receita
  - Variação de lucro bruto ou margem

3. Filtros da aba Histórico
- Adicionar filtros rápidos para escolher quais métricas aparecem no gráfico:
  - Faturamento
  - Receita líquida
  - Despesas
  - Lucro bruto
  - Resultado operacional
  - Lucro líquido
- Adicionar filtro de ano quando existirem múltiplos anos.
- Ordenar os períodos corretamente por mês/ano, usando o campo `periodo` já salvo nos documentos.

4. Botões de filtro de grau no Balancete
- Manter os filtros atuais: Todos, Ativo, Passivo, Receitas, Custos/Despesas.
- Adicionar botões de grau baseados na classificação contábil:
  - 1º grau: contas sintéticas principais, ex.: `1`, `2`, `3`, `4`
  - 2º grau: ex.: `1.1`, `2.1`, `4.1`
  - 3º grau: ex.: `1.1.1`, `4.1.2`
  - 4º grau ou mais: contas mais detalhadas
- O filtro de grau funcionará junto com busca e grupo. Exemplo: “Ativo + 3º grau”.

5. Ajustes de interface
- Seguir o padrão visual atual da Diretriz: fundo azul escuro, vermelho primário, fonte Kanit e textos em português.
- Usar os componentes e padrões atuais de cards, botões e gráficos Recharts já usados no dashboard.
- Exibir estados vazios quando não houver histórico suficiente, por exemplo: “Importe DREs de períodos diferentes para comparar a evolução”.

Detalhes técnicos
- Criar um componente novo para a aba de histórico, provavelmente em `src/components/dashboard/HistoricoTab.tsx`.
- Atualizar `src/pages/Dashboard.tsx` para incluir a nova aba.
- Buscar os documentos da tabela `documentos` filtrando pela empresa atual e ordenando por data/período.
- Usar os dados parseados já salvos em `dados_parseados`, sem alterar o banco de dados neste momento.
- Se necessário, adicionar ao store apenas o identificador da empresa selecionada/atual para facilitar o carregamento do histórico no dashboard.
- Atualizar `src/components/dashboard/BalanceteTab.tsx` com o estado de filtro de grau e a lógica para calcular o grau pela quantidade de segmentos da `classificacao`.