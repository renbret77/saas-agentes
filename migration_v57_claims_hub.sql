-- MIGRACIÓN V57: CLAIMS HUB (CENTRO DE GESTIÓN DE SINIESTROS)
-- Esta migración asegura que la tabla de siniestros tenga todo lo necesario para el seguimiento detallado.

-- 1. Crear o Actualizar la tabla de claims
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    folio_number TEXT, -- Folio oficial de la aseguradora
    claim_type TEXT NOT NULL, -- Accidente, Robo, Cristales, etc.
    status TEXT DEFAULT 'Abierto' CHECK (status IN ('Abierto', 'En Proceso', 'Pendiente Documentación', 'Enviado Aseguradora', 'Cerrado', 'Rechazado')),
    description TEXT,
    report_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()), -- Fecha de reporte a la aseguradora
    insurer_response_date TIMESTAMP WITH TIME ZONE, -- Fecha tentativa de respuesta
    estimated_amount DECIMAL(15, 2) DEFAULT 0.00,
    checklist JSONB DEFAULT '[]'::jsonb, -- Lista de documentos [ { "name": "Informe Médico", "status": "pending/received", "required": true } ]
    documents JSONB DEFAULT '[]'::jsonb, -- Metadatos de documentos cargados [ { "name": "Foto.jpg", "url": "...", "date": "..." } ]
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Seguridad (Asegurar que el agente solo vea siniestros de sus clientes)
DROP POLICY IF EXISTS "Agents can view own claims" ON public.claims;
CREATE POLICY "Agents can view own claims" ON public.claims
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE public.clients.id = public.claims.client_id 
            AND public.clients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can insert own claims" ON public.claims;
CREATE POLICY "Agents can insert own claims" ON public.claims
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE public.clients.id = public.claims.client_id 
            AND public.clients.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can update own claims" ON public.claims;
CREATE POLICY "Agents can update own claims" ON public.claims
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE public.clients.id = public.claims.client_id 
            AND public.clients.user_id = auth.uid()
        )
    );

-- 4. Permisos Públicos/Anon (Si se requiere para el portal)
GRANT ALL ON public.claims TO authenticated;
GRANT ALL ON public.claims TO service_role;
GRANT ALL ON public.claims TO anon;

-- 5. Trigger para updated_at
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
