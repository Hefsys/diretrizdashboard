ALTER TABLE public.documentos
ADD COLUMN IF NOT EXISTS arquivo_path TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-pdf', 'documentos-pdf', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can view documentos pdf"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documentos-pdf');

CREATE POLICY "Authenticated users can upload documentos pdf"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documentos-pdf');

CREATE POLICY "Authenticated users can update documentos pdf"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documentos-pdf')
WITH CHECK (bucket_id = 'documentos-pdf');

CREATE POLICY "Authenticated users can delete documentos pdf"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documentos-pdf');