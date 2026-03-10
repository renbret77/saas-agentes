-- Fase v25: Billetera de Créditos e Inteligencia de Venta Cruzada

-- 1. Tabla de Créditos por Usuario (SaaS Wallet)
CREATE TABLE IF NOT EXISTS public.user_credits (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    balance INT DEFAULT 50 NOT NULL, -- Bonus inicial de 50 créditos
    total_consumed INT DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.user_credits 
FOR SELECT USING (auth.uid() = user_id);

-- 2. Historial de Consumo (Auditoría)
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    action_type TEXT NOT NULL, -- 'ocr_policy', 'generate_campaign', 'image_gen'
    credits_spent INT NOT NULL,
    metadata JSONB, -- Detalles (id_póliza, id_cliente, etc)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs" ON public.ai_usage_logs 
FOR SELECT USING (auth.uid() = user_id);

-- 3. Vista de Inteligencia: Brecha de Cobertura (Cross-sell Gap Analysis)
-- Esta vista identifica qué clientes NO tienen ciertos ramos contratados
CREATE OR REPLACE VIEW v_cross_sell_opportunities AS
WITH client_branches AS (
    -- Obtenemos qué ramos tiene cada cliente actualmente
    SELECT 
        c.id as client_id,
        c.user_id,
        c.first_name || ' ' || c.last_name as client_name,
        ARRAY_AGG(DISTINCT il.name) as active_branches
    FROM clients c
    LEFT JOIN policies p ON c.id = p.client_id
    LEFT JOIN insurance_lines il ON p.line_id = il.id
    GROUP BY c.id, c.user_id, c.first_name, c.last_name
)
SELECT 
    cb.client_id,
    cb.user_id,
    cb.client_name,
    cb.active_branches,
    -- Definimos oportunidades basadas en ramos críticos que faltan
    CASE 
        WHEN NOT ('Vida' = ANY(cb.active_branches)) THEN true 
        ELSE false 
    END as gap_life,
    CASE 
        WHEN NOT ('GMM' = ANY(cb.active_branches)) THEN true 
        ELSE false 
    END as gap_health,
    CASE 
        WHEN NOT ('Hogar' = ANY(cb.active_branches)) THEN true 
        ELSE false 
    END as gap_home,
    CASE 
        WHEN NOT ('Auto' = ANY(cb.active_branches)) THEN true 
        ELSE false 
    END as gap_auto
FROM client_branches cb;

-- 4. Función para descontar créditos (Seguridad Backend)
CREATE OR REPLACE FUNCTION spend_ai_credits(p_action_type TEXT, p_cost INT, p_metadata JSONB DEFAULT '{}')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance INT;
BEGIN
    -- Obtener balance actual
    SELECT balance INTO v_current_balance FROM user_credits WHERE user_id = auth.uid();
    
    -- Si no existe el registro, crearlo con el balance inicial
    IF v_current_balance IS NULL THEN
        INSERT INTO user_credits (user_id, balance) VALUES (auth.uid(), 50) RETURNING balance INTO v_current_balance;
    END IF;

    -- Validar si tiene suficientes créditos
    IF v_current_balance >= p_cost THEN
        -- Descontar
        UPDATE user_credits 
        SET balance = balance - p_cost,
            total_consumed = total_consumed + p_cost,
            updated_at = NOW()
        WHERE user_id = auth.uid();

        -- Registrar en log
        INSERT INTO ai_usage_logs (user_id, action_type, credits_spent, metadata)
        VALUES (auth.uid(), p_action_type, p_cost, p_metadata);

        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;
