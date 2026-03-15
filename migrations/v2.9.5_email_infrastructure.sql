-- Tabla para configuraciones de SMTP por agente
CREATE TABLE IF NOT EXISTS public.communication_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    host TEXT NOT NULL,
    port INTEGER DEFAULT 587,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    from_name TEXT,
    from_email TEXT,
    use_privacy_notice BOOLEAN DEFAULT true,
    custom_privacy_notice TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(agent_id)
);

-- Tabla para logs de comunicación (Email/WA)
CREATE TABLE IF NOT EXISTS public.communication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'email' | 'whatsapp'
    category TEXT,
    recipient TEXT,
    subject TEXT,
    body_html TEXT,
    status TEXT DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Políticas de RLS
ALTER TABLE public.communication_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Agents can manage own config" ON public.communication_configs;
CREATE POLICY "Agents can manage own config" ON public.communication_configs 
    FOR ALL USING (auth.uid() = agent_id);

ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Agents can see own logs" ON public.communication_logs;
CREATE POLICY "Agents can see own logs" ON public.communication_logs 
    FOR SELECT USING (auth.uid() = agent_id);
