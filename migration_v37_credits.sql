-- Migration Phase v37: AI Analyzer & Credits
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS source_files JSONB DEFAULT '[]';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS credit_cost INTEGER DEFAULT 1;

-- Add AI Credits to agent_settings
ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS ai_credits_total INTEGER DEFAULT 10;
ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0;

-- Function to handle quote creation with credit check
CREATE OR REPLACE FUNCTION process_ai_quote(
    p_agent_id UUID,
    p_quote_data JSONB
) RETURNS UUID AS $$
DECLARE
    v_credits_remaining INTEGER;
    v_quote_id UUID;
BEGIN
    -- Check credits
    SELECT (ai_credits_total - ai_credits_used) INTO v_credits_remaining
    FROM agent_settings
    WHERE user_id = p_agent_id;

    IF v_credits_remaining <= 0 THEN
        RAISE EXCEPTION 'Créditos de IA insuficientes';
    END IF;

    -- Insert quote
    INSERT INTO quotes (
        agent_id, 
        client_name, 
        client_email, 
        client_phone, 
        branch, 
        options, 
        ai_summary, 
        source_files
    )
    VALUES (
        p_agent_id,
        (p_quote_data->>'client_name'),
        (p_quote_data->>'client_email'),
        (p_quote_data->>'client_phone'),
        (p_quote_data->>'branch'),
        (p_quote_data->'options'),
        (p_quote_data->>'ai_summary'),
        (p_quote_data->'source_files')
    )
    RETURNING id INTO v_quote_id;

    -- Update credits
    UPDATE agent_settings
    SET ai_credits_used = ai_credits_used + 1
    WHERE user_id = p_agent_id;

    RETURN v_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
