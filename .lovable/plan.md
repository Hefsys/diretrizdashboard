Plano para ajustar o histórico de envios

Objetivo
- Sempre considerar automaticamente o envio mais recente para cada tipo de documento:
  - Balanço Patrimonial
  - DRE, tratando `dre-detalhada` e `dre-sintetica` como o mesmo grupo `dre`
  - Balancete

O que será alterado
1. Consolidar a regra de “tipo canônico”
- Criar uma pequena função/utilitário para transformar tipos em grupos:
  - `balanco` → `balanco`
  - `dre-detalhada` / `dre-sintetica` → `dre`
  - `balancete` → `balancete`
- Usar essa regra tanto no carregamento automático quanto no histórico.

2. Carregamento automático da empresa
- Ao selecionar uma empresa, buscar os documentos ordenados por data de envio mais recente.
- Preencher o dashboard somente com o primeiro documento encontrado de cada grupo canônico.
- Resultado esperado: se houver 5 DREs antigas e 1 DRE nova, a nova será sempre a usada.

3. Histórico de envios
- Manter a listagem histórica, mas evidenciar quais documentos são os “atuais” de cada tipo.
- Opcionalmente agrupar/ordenar para que os últimos de cada tipo apareçam primeiro dentro do período.
- O botão “Ver Dashboard” continuará usando os dados atuais mais recentes.

4. Depois de salvar novo documento
- Assim que um novo Balanço, DRE ou Balancete for enviado e salvo, ele passará a ser o documento atual daquele tipo.
- O estado local será atualizado para evitar depender de recarregar a página.

Detalhes técnicos
- Arquivo principal: `src/pages/Index.tsx`
- Arquivo de histórico: `src/components/DocumentHistory.tsx`
- Não será necessário mudar o banco de dados.
- A regra atual já ordena por `created_at` decrescente; o ajuste será deixar a regra explícita, reutilizável e consistente para DRE detalhada/sintética e para novos uploads.

Validação
- Confirmar que, ao carregar uma empresa, o dashboard recebe somente o último documento de cada tipo.
- Confirmar que um novo envio substitui visualmente o documento anterior daquele tipo.
- Rodar verificação TypeScript para garantir que não houve erro de compilação.