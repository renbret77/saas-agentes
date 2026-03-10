-- Migration v67: Tracking de Notificaciones (SICAS Killer)
-- Permite saber cuándo y por qué medio se avisó al cliente.

CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id), -- Agente que envió
    client_id UUID REFERENCES public.clients(id),
    policy_id UUID REFERENCES public.policies(id),
    installment_id UUID REFERENCES public.policy_installments(id),
    channel TEXT NOT NULL, -- 'whatsapp', 'email', 'telegram'
    notification_type TEXT NOT NULL, -- 'payment', 'renewal', 'marketing'
    status TEXT DEFAULT 'sent',
    metadata JSONB, -- Para guardar link generado o contenido
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agentes pueden ver sus logs de notificaciones" ON public.notification_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Agentes pueden registrar notificaciones" ON public.notification_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Índices para búsqueda rápida en el Dashboard
CREATE INDEX IF NOT EXISTS idx_notify_logs_policy ON public.notification_logs(policy_id);
CREATE INDEX IF NOT EXISTS idx_notify_logs_inst ON public.notification_logs(installment_id);
CREATE INDEX IF NOT EXISTS idx_notify_logs_client ON public.notification_logs(client_id);
