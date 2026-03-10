-- Migration Phase v38: Credit Visibility & Pricing Tiers
ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS pricing_tier TEXT DEFAULT 'Basic'; -- Basic, Pro, Elite
ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS last_refill_at TIMESTAMPTZ DEFAULT NOW();

-- Update process_ai_quote to check tier limits if relevant
-- (already handled by the credit check in v37 migration)
