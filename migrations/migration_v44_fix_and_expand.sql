-- Migration Phase v44: Fix Schema & Add Tones/Expired Tier
-- Ensures table exists and adds new notification logic

CREATE TABLE IF NOT EXISTS agent_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES auth.users(id),
    referral_count INTEGER DEFAULT 0,
    notification_settings JSONB DEFAULT '{
        "pre_due": { "enabled": true, "days_before": 5, "template": "", "ai_tone": "profesional" },
        "grace_period": { "enabled": true, "days_after": 2, "template": "", "ai_tone": "profesional" },
        "expired": { "enabled": false, "days_after": 5, "template": "", "ai_tone": "urgente" }
    }'::jsonb,
    chatbot_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already existed partially
ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS notification_settings JSONB;

-- Force reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

-- Update comment
COMMENT ON TABLE agent_settings IS 'Stored agent profile settings, referrals, and AI notification templates';
