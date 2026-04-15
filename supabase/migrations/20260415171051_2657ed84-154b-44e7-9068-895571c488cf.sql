ALTER TABLE empresas ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE empresas ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE documentos ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE documentos ALTER COLUMN user_id SET NOT NULL;