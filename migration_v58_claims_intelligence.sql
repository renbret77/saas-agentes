-- MIGRACIÓN V58: CLAIMS INTELLIGENCE 360
-- Añade campos de nivel profesional para seguimiento de ajustadores y finanzas de siniestros.

-- 1. Añadir campos avanzados a la tabla de claims
ALTER TABLE public.claims 
ADD COLUMN IF NOT EXISTS adjuster_name TEXT,
ADD COLUMN IF NOT EXISTS adjuster_phone TEXT,
ADD COLUMN IF NOT EXISTS accident_location TEXT,
ADD COLUMN IF NOT EXISTS deductible_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS co_insurance_percentage DECIMAL(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb, -- Historial de eventos [ { "date": "...", "event": "Llamada a AXA", "user": "..." } ]
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 2. Asegurar que los permisos estén actualizados para los nuevos campos
GRANT ALL ON public.claims TO authenticated;
GRANT ALL ON public.claims TO service_role;
GRANT ALL ON public.claims TO anon;

-- 3. Comentario sobre la estructura de checklist avanzada
COMMENT ON COLUMN public.claims.checklist IS 'Estructura sugerida: [ { "id": "med_report", "name": "Informe Médico", "status": "pending", "required": true, "due_date": "..." } ]';
