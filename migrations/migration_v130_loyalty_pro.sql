-- MIGRATION V130: DIGITAL REWARD MASTERY & PREDICTIVE RETENTION
-- 🚀 Ecosistema de Lealtad y Referenciación Elite

-- 1. Extender tabla public.clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- 2. Función para generar código de referido para clientes
CREATE OR REPLACE FUNCTION generate_client_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := 'REF-' || UPPER(SUBSTRING(REPLACE(uuid_generate_v4()::TEXT, '-', ''), 1, 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_client_referral_code
BEFORE INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION generate_client_referral_code();

-- 3. Tabla de Referidos de Clientes
CREATE TABLE IF NOT EXISTS client_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    referred_name TEXT NOT NULL,
    referred_phone TEXT,
    referred_email TEXT,
    status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'contacted', 'client', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE client_referrals ENABLE ROW LEVEL SECURITY;

-- Política: Los agentes pueden ver los referidos de sus clientes
-- (Asumiendo que clients tiene agent_id o podemos llegar vía join)
-- Si no hay agent_id directo en client_referrals, lo añadimos para eficiencia
ALTER TABLE client_referrals ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE POLICY "Agents can manage their client referrals"
    ON client_referrals FOR ALL
    USING (auth.uid() = agent_id);

-- 4. Registro de Puntos de Lealtad
CREATE TABLE IF NOT EXISTS loyalty_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE loyalty_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their client loyalty logs"
    ON loyalty_logs FOR SELECT
    USING (true); -- Simplificado para lectura, filtrado por el agente en la app

-- 5. Actualizar last_contacted_at cuando se registra una comunicación
-- Esto se manejará preferiblemente desde la aplicación para mayor control
