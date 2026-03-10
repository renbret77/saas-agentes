-- MASTER RECOVERY SCRIPT v51
-- Generado para resolver: ERROR: 42P01: relation "public.agent_settings" does not exist

-- 1. Crear la tabla desde cero con la estructura completa
CREATE TABLE IF NOT EXISTS public.agent_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    evolution_api_url TEXT,
    evolution_api_key TEXT,
    whatsapp_instance_name TEXT,
    chatbot_enabled BOOLEAN DEFAULT false,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES auth.users(id),
    referral_count INTEGER DEFAULT 0,
    notification_settings JSONB DEFAULT '{
        "pre_due": { "enabled": true, "days_before": 5, "variants": ["", "", ""], "ai_tone": "profesional" },
        "grace_period": { "enabled": true, "days_after": 2, "variants": ["", "", ""], "ai_tone": "profesional" },
        "expired": { "enabled": false, "days_after": 5, "variants": ["", "", ""], "ai_tone": "urgente" }
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (Seguridad a nivel de fila)
ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de acceso (solo el dueño puede ver/editar)
DROP POLICY IF EXISTS "Users can view their own settings" ON public.agent_settings;
CREATE POLICY "Users can view their own settings" ON public.agent_settings
    FOR ALL USING (auth.uid() = user_id);

-- 4. Otorgar permisos a los roles de la API
GRANT ALL ON TABLE public.agent_settings TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.agent_settings TO authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 5. Forzar recarga del caché del esquema para PostgREST
NOTIFY pgrst, 'reload schema';

-- Comentario de documentación
COMMENT ON TABLE public.agent_settings IS 'Master table for agent preferences, AI notification variants, and referrals.';
