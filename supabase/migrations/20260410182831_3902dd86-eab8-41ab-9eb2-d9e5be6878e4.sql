
-- Adicionar user_id nas tabelas existentes
ALTER TABLE public.empresas ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.documentos ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar RLS empresas
DROP POLICY IF EXISTS "Allow all access to empresas" ON public.empresas;
CREATE POLICY "Users manage own empresas" ON public.empresas
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Atualizar RLS documentos
DROP POLICY IF EXISTS "Allow all access to documentos" ON public.documentos;
CREATE POLICY "Users manage own documentos" ON public.documentos
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
