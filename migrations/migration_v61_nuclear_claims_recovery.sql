-- MIGRACIÓN V61: NUCLEAR CLAIMS RECOVERY
-- Este script realiza un reset total de la tabla de siniestros para forzar la recarga del cache de Supabase (PostgreREST).
-- ATENCIÓN: Este script borrará los datos actuales de la tabla claims para asegurar una estructura limpia.

-- 1. Eliminar tabla si existe (Nuclear)
DROP TABLE IF EXISTS public.claims CASCADE;

-- 2. Crear tabla con TODOS los campos acumulados (v57 + v58 + v59)
CREATE TABLE public.claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    folio_number TEXT,
    claim_type TEXT NOT NULL,
    status TEXT DEFAULT 'Abierto' CHECK (status IN ('Abierto', 'En Proceso', 'Pendiente Documentación', 'Enviado Aseguradora', 'Cerrado', 'Rechazado')),
    description TEXT,
    report_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    insurer_response_date TIMESTAMP WITH TIME ZONE,
    estimated_amount DECIMAL(15, 2) DEFAULT 0.00,
    checklist JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    adjuster_name TEXT,
    adjuster_phone TEXT,
    accident_location TEXT,
    deductible_amount DECIMAL(15, 2) DEFAULT 0.00,
    co_insurance_percentage DECIMAL(5, 2) DEFAULT 0.00,
    history JSONB DEFAULT '[]'::jsonb,
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar RLS
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- 4. Re-aplicar Políticas de Seguridad
CREATE POLICY "Agents can view own claims" ON public.claims
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE public.clients.id = public.claims.client_id 
            AND public.clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Agents can insert own claims" ON public.claims
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE public.clients.id = public.claims.client_id 
            AND public.clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Agents can update own claims" ON public.claims
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE public.clients.id = public.claims.client_id 
            AND public.clients.user_id = auth.uid()
        )
    );

-- 5. Otorgar permisos (Crucial para el Schema Cache)
GRANT ALL ON public.claims TO authenticated;
GRANT ALL ON public.claims TO service_role;
GRANT ALL ON public.claims TO anon;

-- 6. Re-aplicar Trigger de Updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_claims_updated_at ON public.claims;
CREATE TRIGGER update_claims_updated_at
    BEFORE UPDATE ON public.claims
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 7. Comentario para verificar metadata
COMMENT ON TABLE public.claims IS 'Tabla maestra de siniestros - Recuperada en v61';
