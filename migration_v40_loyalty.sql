-- Migration Phase v40: Referral Loyalty Logic
-- Track active status of referrals to reward referrers periodically

-- Function to calculate and grant loyalty credits
-- This would ideally be called by an edge function or cron job once a month
CREATE OR REPLACE FUNCTION grant_monthly_referral_loyalty()
RETURNS VOID AS $$
DECLARE
    r RECORD;
    v_active_referrals_count INTEGER;
BEGIN
    FOR r IN SELECT user_id, referral_code FROM agent_settings WHERE referral_count > 0 LOOP
        -- Count active referred users (e.g., those who logged in last 30 days or have active subscription)
        -- For now, we count everyone they referred who is in agent_settings
        SELECT COUNT(*) INTO v_active_referrals_count
        FROM agent_settings
        WHERE referred_by = r.user_id;

        IF v_active_referrals_count > 0 THEN
            -- Grant 10 credits per active referral
            UPDATE agent_settings
            SET ai_credits_total = ai_credits_total + (v_active_referrals_count * 10)
            WHERE user_id = r.user_id;

            -- Log transaction (if we had a log table)
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add column to track estimated recurring credits for the UI
ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS recurring_credits_multiplier INTEGER DEFAULT 10;
