-- migration_v75_ai_quoting_engine.sql

-- 1. Crear tabla para agrupar mútiples cotizaciones en una "Presentación Comercial"
CREATE TABLE IF NOT EXISTS public.quote_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, -- Opcional, puede ser un prospecto nuevo
    
    project_title TEXT NOT NULL, -- ej. "Cotización Flotilla Uber" o "Seguro GM Familiar"
    insurance_line TEXT, -- ej. "Autos", "Gastos Médicos"
    client_name_temp TEXT, -- Para prospectos sin registro formal
    
    -- Manejo del Link Web Compartible
    public_share_id TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'), -- URL friendly ID
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: quote_sessions
ALTER TABLE public.quote_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Strict Agency Data Isolation for Quote Sessions" ON public.quote_sessions
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin' 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles me 
            WHERE me.id = auth.uid() 
              AND me.agency_id = public.quote_sessions.agency_id
        )
    );

-- 2. Crear tabla para las opciones individuales analizadas por la IA (Los PDFs)
CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.quote_sessions(id) ON DELETE CASCADE,
    
    insurer_name TEXT NOT NULL, -- GNP, AXA, etc. Detectado por la IA
    original_pdf_url TEXT, -- Link al Storage (opcional/efímero)
    
    -- El Cerebro: El JSON estructurado devuelto por GPT-4o
    parsed_data JSONB NOT NULL DEFAULT '{}', 
    
    -- Atributos clave extraídos para indexación rápida
    premium_total NUMERIC(15,2),
    currency TEXT DEFAULT 'MXN',
    
    is_recommended BOOLEAN DEFAULT false, -- Si el agente marcó esta como "La Mejor Opción"
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: quote_items
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Strict Agency Data Isolation for Quote Items" ON public.quote_items
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin' 
        OR 
        EXISTS (
            SELECT 1 FROM public.quote_sessions qs
            JOIN public.profiles me ON me.id = auth.uid()
            WHERE qs.id = public.quote_items.session_id
              AND qs.agency_id = me.agency_id
        )
    );

-- 3. Crear Storage Bucket para Cotizaciones Temporales
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('quotes_temp', 'quotes_temp', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET allowed_mime_types = ARRAY['application/pdf'];

-- RLS para Storage: Solo Autenticados suben, y el agente solo ve sus cosas
CREATE POLICY "Agents can upload quote pdfs" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'quotes_temp' AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Agents can view own quote pdfs" ON storage.objects
FOR SELECT TO authenticated USING (
    bucket_id = 'quotes_temp' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Trigger de Updated_at
CREATE TRIGGER trigger_update_quote_sessions_timestamp
BEFORE UPDATE ON public.quote_sessions
FOR EACH ROW
EXECUTE FUNCTION update_agency_timestamp();
