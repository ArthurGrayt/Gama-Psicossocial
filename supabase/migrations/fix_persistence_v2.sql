-- 1. Garantir que a tabela existe com a estrutura correta
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section TEXT NOT NULL,
    key TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'text',
    last_updated TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Limpar duplicatas antes de criar a restrição única
-- Mantém apenas a linha mais recente para cada combinação de seção/chave
DELETE FROM public.site_content a
USING public.site_content b
WHERE a.id < b.id
  AND a.section = b.section
  AND a.key = b.key;

-- 3. Adicionar restrição de unicidade (Caso não exista)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'site_content_section_key_key'
    ) THEN
        ALTER TABLE public.site_content ADD CONSTRAINT site_content_section_key_key UNIQUE (section, key);
    END IF;
END $$;

-- 4. Habilitar RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de acesso público (Ajustar se preferir anon ou auth)
DROP POLICY IF EXISTS "Permitir leitura pública" ON public.site_content;
CREATE POLICY "Permitir leitura pública" ON public.site_content
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir upsert público" ON public.site_content;
CREATE POLICY "Permitir upsert público" ON public.site_content
    FOR ALL USING (true) WITH CHECK (true);

-- 6. Configurações de Storage (Bucket 'data')
-- Garante que o bucket existe e é público
INSERT INTO storage.buckets (id, name, public)
VALUES ('data', 'data', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas para o Storage
DROP POLICY IF EXISTS "Acesso Público Leitura" ON storage.objects;
CREATE POLICY "Acesso Público Leitura" ON storage.objects
    FOR SELECT USING (bucket_id = 'data');

DROP POLICY IF EXISTS "Upload Público" ON storage.objects;
CREATE POLICY "Upload Público" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'data');

DROP POLICY IF EXISTS "Update Público" ON storage.objects;
CREATE POLICY "Update Público" ON storage.objects
    FOR UPDATE USING (bucket_id = 'data');
