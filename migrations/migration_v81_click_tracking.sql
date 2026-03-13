-- MIGRACIÓN V81: Rastreo de Lectura de Pólizas
-- Fecha: 2026-03-12
-- Autor: Antigravity

-- 1. Agregar columnas de rastreo a policy_documents
ALTER TABLE public.policy_documents 
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 2. Función para registrar vistas atómicamente
CREATE OR REPLACE FUNCTION public.record_document_view(p_doc_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.policy_documents
    SET 
        view_count = view_count + 1,
        last_viewed_at = NOW()
    WHERE id = p_doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Asegurar que las políticas de RLS permitan la ejecución del RPC
ALTER FUNCTION public.record_document_view(UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.record_document_view(UUID) TO anon, authenticated, service_role;

-- Nota: En un entorno real, restringiríamos esto más, pero para el prototipo 
-- y manejo de links cortos sin auth obligatorio del cliente, permitimos el update.
