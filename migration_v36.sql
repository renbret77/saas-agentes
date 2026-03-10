-- Migration Phase v36: Smart Quotes
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES auth.users(id),
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    branch TEXT NOT NULL, -- Autos, GMM, Vida, etc.
    status TEXT DEFAULT 'pendiente', -- pendiente, enviado, aceptado, rechazado
    ai_summary TEXT, -- Resumen generado por IA
    options JSONB DEFAULT '[]', -- Array de opciones [ { company, price, coverage_summary, is_recommended } ]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Agents can manage their own quotes" 
ON quotes FOR ALL 
USING (auth.uid() = agent_id);

CREATE POLICY "Public can view quotes by ID" 
ON quotes FOR SELECT 
USING (true);
