-- Migration Phase v39: Referral System & Rewards
ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);
ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Function to generate unique referral codes on profile creation
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := 'RB-' || UPPER(SUBSTRING(REPLACE(uuid_generate_v4()::TEXT, '-', ''), 1, 6));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate code
DROP TRIGGER IF EXISTS tr_generate_referral_code ON agent_settings;
CREATE TRIGGER tr_generate_referral_code
BEFORE INSERT ON agent_settings
FOR EACH ROW
EXECUTE FUNCTION generate_referral_code();

-- Function to process a new referral bonus
CREATE OR REPLACE FUNCTION process_referral_bonus(
    p_new_agent_id UUID,
    p_referral_code TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_referrer_id UUID;
BEGIN
    -- Find the referrer
    SELECT user_id INTO v_referrer_id
    FROM agent_settings
    WHERE referral_code = p_referral_code;

    IF v_referrer_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Update the new agent (mark as referred)
    UPDATE agent_settings
    SET referred_by = v_referrer_id,
        ai_credits_total = ai_credits_total + 20 -- Bonus for the new agent
    WHERE user_id = p_new_agent_id;

    -- Update the referrer (bonus credits + count)
    UPDATE agent_settings
    SET referral_count = referral_count + 1,
        ai_credits_total = ai_credits_total + 50 -- Bonus for the referrer
    WHERE user_id = v_referrer_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
