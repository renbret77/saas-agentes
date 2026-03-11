-- Migration Fix: Missing Columns for Phase 19.5
-- Run this in the Supabase SQL Editor

-- Update Clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS rfc TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tax_regime TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Update Policies table
ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS asset_description TEXT;
ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS agent_code TEXT;
ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS sub_ramo TEXT;

-- Create Index for RFC
CREATE INDEX IF NOT EXISTS idx_clients_rfc ON public.clients(rfc);

-- Refresh PostgREST cache (optional but helpful)
NOTIFY pgrst, 'reload schema';
