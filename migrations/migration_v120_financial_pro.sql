-- MIGRATION V120: EL LIQUIDADOR PRO - ROI REAL & GASTOS OPERATIVOS
-- 🚀 Inteligencia Financiera Avanzada

-- 1. Tabla de Gastos Operativos
CREATE TABLE IF NOT EXISTS agent_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Marketing', 'Oficina', 'Tecnología', 'Personal', 'Impuestos', 'Otros')),
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS para agent_expenses
ALTER TABLE agent_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own expenses"
    ON agent_expenses FOR ALL
    USING (auth.uid() = agent_id);

-- 3. Vista de Rentabilidad Neta (Real ROI)
-- Une los ingresos proyectados (comisiones) con los gastos registrados
CREATE OR REPLACE VIEW view_net_profitability AS
WITH monthly_commissions AS (
    SELECT 
        agent_id,
        date_trunc('month', due_date) as month,
        SUM(agent_commission_amount) as total_revenue
    FROM policy_installments
    GROUP BY agent_id, month
),
monthly_expenses AS (
    SELECT 
        agent_id,
        date_trunc('month', expense_date) as month,
        SUM(amount) as total_expenses
    FROM agent_expenses
    GROUP BY agent_id, month
)
SELECT 
    COALESCE(r.agent_id, e.agent_id) as agent_id,
    COALESCE(r.month, e.month) as month,
    COALESCE(r.total_revenue, 0) as gross_revenue,
    COALESCE(e.total_expenses, 0) as operating_expenses,
    (COALESCE(r.total_revenue, 0) - COALESCE(e.total_expenses, 0)) as net_profit,
    CASE 
        WHEN COALESCE(e.total_expenses, 0) > 0 
        THEN (COALESCE(r.total_revenue, 0) / COALESCE(e.total_expenses, 0)) * 100 
        ELSE 0 
    END as roi_percentage
FROM monthly_commissions r
FULL OUTER JOIN monthly_expenses e ON r.agent_id = e.agent_id AND r.month = e.month;

-- 4. Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_expenses_updated_at
    BEFORE UPDATE ON agent_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
