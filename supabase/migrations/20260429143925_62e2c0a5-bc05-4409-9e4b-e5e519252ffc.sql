DROP POLICY IF EXISTS "Authenticated users can view documentos pdf" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documentos pdf" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documentos pdf" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documentos pdf" ON storage.objects;

CREATE POLICY "Users can view own documentos pdf"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documentos-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documentos pdf"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documentos-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documentos pdf"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documentos-pdf' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'documentos-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documentos pdf"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documentos-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);