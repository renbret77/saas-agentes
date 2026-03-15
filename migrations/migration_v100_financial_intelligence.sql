-- SQL Migration: Financial Intelligence (Fase v100)
-- Objetivo: Soporte técnico para el "Liquidador Financiero" y Rentabilidad Real.

-- 1. Tabla de Tasas de Comisión por Aseguradora y Ramo
CREATE TABLE IF NOT EXISTS public.insurer_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    insurer_id UUID NOT NULL REFERENCES public.insurers(id) ON DELETE CASCADE,
    line_id UUID NOT NULL REFERENCES public.insurance_lines(id) ON DELETE CASCADE,
    commission_percentage NUMERIC(5,2) DEFAULT 0 NOT NULL, -- Porcentaje que recibe la agencia
    bonus_percentage NUMERIC(5,2) DEFAULT 0, -- Bonos adicionales o sobrecomisiones
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(insurer_id, line_id)
);

-- RLS: insurer_commissions
ALTER TABLE public.insurer_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage Commissions Auth" ON public.insurer_commissions FOR ALL USING (auth.role() = 'authenticated');

-- 2. Expandir Pólizas para trackear comisiones estimadas
ALTER TABLE public.policies 
ADD COLUMN IF NOT EXISTS estimated_commission_amount NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS commission_rate_snapshot NUMERIC(5,2);

-- 3. Expandir Recibos para trackear comisiones reales cobradas
ALTER TABLE public.policy_installments
ADD COLUMN IF NOT EXISTS commission_earned NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS is_commission_paid BOOLEAN DEFAULT FALSE;

-- 4. Vista Proyectiva: Flujo de Caja (Próximos 90 días)
CREATE OR REPLACE VIEW v_financial_cashflow_projection AS
SELECT 
    pi.due_date,
    pi.total_amount as premium_to_collect,
    p.premium_net,
    COALESCE(ic.commission_percentage, 0) as commission_rate,
    (pi.total_amount * (COALESCE(ic.commission_percentage, 0) / 100)) as estimated_commission,
    i.alias as insurer_alias,
    il.name as line_name,
    c.first_name || ' ' || c.last_name as client_name,
    p.user_id as agent_id
FROM policy_installments pi
JOIN policies p ON pi.policy_id = p.id
JOIN insurers i ON p.insurer_id = i.id
JOIN insurance_lines il ON p.line_id = il.id
JOIN clients c ON p.client_id = c.id
LEFT JOIN insurer_commissions ic ON p.insurer_id = ic.insurer_id AND p.line_id = ic.line_id
WHERE pi.status != 'Pagado'
  AND pi.due_date >= CURRENT_DATE
  AND pi.due_date <= CURRENT_DATE + INTERVAL '90 days';

-- 5. Función para calcular rentabilidad neta (Marketing vs Comisiones)
-- Se asume que los costos de marketing están en una tabla de 'marketing_campaigns' o similar
-- Por ahora creamos la vista base de rentabilidad
CREATE OR REPLACE VIEW v_agent_profitability AS
SELECT 
    p.id as agent_id,
    p.first_name || ' ' || p.last_name as agent_name,
    SUM(pi.commission_earned) filter (where pi.status = 'Pagado') as total_commissions_paid,
    COUNT(pol.id) as total_policies_active
FROM profiles p
LEFT JOIN policies pol ON p.id = pol.user_id
LEFT JOIN policy_installments pi ON pol.id = pi.policy_id
GROUP BY p.id, p.first_name, p.last_name;
