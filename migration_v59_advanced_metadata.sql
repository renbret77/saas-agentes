-- Migration Phase v59: Advanced Metadata for SICAS Killer V3
-- Adds fields for RFC, Tax Regime, WhatsApp and detailed Policy info

-- Update Clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS rfc TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tax_regime TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Update Policies table
ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS asset_description TEXT; -- "Inciso" (e.g., Altima 2010)
ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS agent_code TEXT;
ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS sub_ramo TEXT; -- "Plan" (e.g., Cobertura Amplia)

-- Index for RFC searching
CREATE INDEX IF NOT EXISTS idx_clients_rfc ON public.clients(rfc);
