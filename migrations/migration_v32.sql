-- SQL Migration: SaaS Pro Expansion (Fase v32)

-- 1. Campos Pro para Aseguradoras
ALTER TABLE insurers 
ADD COLUMN IF NOT EXISTS claim_phone TEXT,
ADD COLUMN IF NOT EXISTS billing_portal_url TEXT;

-- 2. Campos Pro para Clientes
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS contact_preference TEXT DEFAULT 'whatsapp';

-- 3. Tabla de Configuración de Agente (Multi-tenant SaaS)
CREATE TABLE IF NOT EXISTS agent_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    evolution_api_url TEXT,
    evolution_api_key TEXT,
    whatsapp_instance_name TEXT,
    chatbot_enabled BOOLEAN DEFAULT FALSE,
    chatbot_context TEXT, -- Instrucciones específicas para el bot de este agente
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para agent_settings
ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los agentes pueden ver sus propias configuraciones" 
ON agent_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Los agentes pueden actualizar sus propias configuraciones" 
ON agent_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Los agentes pueden insertar sus propias configuraciones" 
ON agent_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);
