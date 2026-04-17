
-- Empresas: acesso compartilhado
DROP POLICY IF EXISTS "Users manage own empresas" ON public.empresas;

CREATE POLICY "Authenticated users can view all empresas"
ON public.empresas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert empresas"
ON public.empresas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update all empresas"
ON public.empresas FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete all empresas"
ON public.empresas FOR DELETE
TO authenticated
USING (true);

-- Documentos: acesso compartilhado
DROP POLICY IF EXISTS "Users manage own documentos" ON public.documentos;

CREATE POLICY "Authenticated users can view all documentos"
ON public.documentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert documentos"
ON public.documentos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update all documentos"
ON public.documentos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete all documentos"
ON public.documentos FOR DELETE
TO authenticated
USING (true);
