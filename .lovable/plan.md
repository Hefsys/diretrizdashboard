

## Plano: Corrigir Salvamento de Empresas + Seletor de Período

### Problema 1: Empresas não salvam

Duas causas identificadas:

1. **`user_id` nullable nas tabelas `empresas` e `documentos`** — a RLS exige `auth.uid() = user_id`, mas se `user_id` for null a linha fica invisível. Precisa tornar `user_id NOT NULL` com default `auth.uid()`.

2. **Busca de empresa por CNPJ sem filtro de user_id** — a RLS já filtra, mas se o CNPJ vier vazio do PDF, a lógica pula a busca e tenta criar sem validação adequada.

### Problema 2: Adicionar meses passados/futuros

Atualmente o campo `periodo` vem do PDF (se existir). Precisa de um seletor manual de período para que o usuário escolha mês/ano ao fazer upload, permitindo análises históricas e projeções.

---

### Migração SQL

```sql
-- Tornar user_id NOT NULL com default
ALTER TABLE empresas ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE empresas ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE documentos ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE documentos ALTER COLUMN user_id SET NOT NULL;
```

### Alterações no Código

| Arquivo | Mudança |
|---------|---------|
| `Index.tsx` | Adicionar seletor de período (mês/ano) acima dos drop zones. Passar período selecionado ao `saveDocumento`. Melhorar tratamento de erros no `findOrCreateEmpresa` e `saveDocumento` (exibir toast em caso de falha). |
| `EmpresaSelector.tsx` | Recarregar lista após criar empresa (já funciona). Garantir que o dropdown feche corretamente. |
| `DocumentHistory.tsx` | Já agrupa por período — sem mudança estrutural. |
| `Dashboard.tsx` | Adicionar dropdown de período no header para trocar entre meses salvos da empresa. |

### Novo Componente: `PeriodoSelector.tsx`

- Dropdown com mês (Janeiro–Dezembro) e ano (2020–2027)
- Valor padrão: mês/ano atual
- Formato salvo: "01/2026", "02/2026", etc.
- Posicionado entre o seletor de empresa e os drop zones

### Fluxo Atualizado

1. Usuário seleciona empresa
2. Usuário escolhe o período (mês/ano) — pode ser passado ou futuro
3. Faz upload dos PDFs
4. Documentos salvos com o período selecionado (não o extraído do PDF)
5. No dashboard, pode trocar entre períodos para comparar

