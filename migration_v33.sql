-- Migration v33: Stripe Integration & Advanced Reporting Support

-- 1. Tabla para Clientes de Stripe
CREATE TABLE IF NOT EXISTS stripe_customers (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stripe customer data"
    ON stripe_customers FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Tabla para Suscripciones / Créditos
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    quantity INTEGER DEFAULT 1,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Asegurar que los ramos estén bien tipados para los reportes avanzados
-- (Asumimos que la tabla policies ya tiene los campos necesarios)

-- 4. Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stripe_customers_updated_at
    BEFORE UPDATE ON stripe_customers
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
