-- MIGRATION V140: GLOBAL CONNECTIVITY & AI AUTONOMY
-- 🚀 Webhooks, AI Briefing Metadata & Autonomous Triggers

-- 1. Tabla de Configuración de Webhooks
CREATE TABLE IF NOT EXISTS outgoing_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'client.created', 'policy.renewed', 'payment.overdue', 'lead.converted'
    is_active BOOLEAN DEFAULT TRUE,
    secret_key TEXT DEFAULT 'sk_' || UPPER(SUBSTRING(REPLACE(uuid_generate_v4()::TEXT, '-', ''), 1, 16)),
    headers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_triggered_at TIMESTAMPTZ
);

-- Habilitar RLS
ALTER TABLE outgoing_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their webhooks"
    ON outgoing_webhooks FOR ALL
    USING (auth.uid() = agent_id);

-- 2. Tabla de Logs de Webhooks (Auditoría)
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID REFERENCES outgoing_webhooks(id) ON DELETE CASCADE,
    payload JSONB,
    response_code INTEGER,
    response_body TEXT,
    success BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their webhook logs"
    ON webhook_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM outgoing_webhooks 
        WHERE id = webhook_logs.webhook_id AND agent_id = auth.uid()
    ));

-- 3. Extender agent_settings para Configuración de AI Co-Pilot
ALTER TABLE agent_settings
ADD COLUMN IF NOT EXISTS ai_briefing_voice TEXT DEFAULT 'alloy',
ADD COLUMN IF NOT EXISTS autonomous_followup_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sales_tone_voice TEXT DEFAULT 'professional';

-- 4. Vista de Consolidación para AI Briefing
CREATE OR REPLACE VIEW view_daily_executive_summary AS
SELECT 
    p.agent_id,
    COUNT(DISTINCT c.id) as total_active_clients,
    COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'pending' AND i.due_date = CURRENT_DATE), 0) as expected_today,
    COUNT(i.id) FILTER (WHERE i.status = 'pending' AND i.due_date < CURRENT_DATE) as overdue_installments_count,
    COUNT(p.id) FILTER (WHERE p.renewal_date >= CURRENT_DATE AND p.renewal_date <= CURRENT_DATE + INTERVAL '7 days') as upcoming_renewals_week
FROM public.policies p
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.installments i ON p.id = i.policy_id
GROUP BY p.agent_id;
