-- MIGRACIÓN V82: Extender Documentos de Póliza
-- Fecha: 2026-03-12
-- Objetivo: Añadir campos 'name' y 'notes' a policy_documents para evitar errores de inserción y mejorar trazabilidad.

ALTER TABLE public.policy_documents ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.policy_documents ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN public.policy_documents.name IS 'Nombre original del archivo o título descriptivo';
COMMENT ON COLUMN public.policy_documents.notes IS 'Notas adicionales o trazabilidad (ej. Cargado por IA)';
