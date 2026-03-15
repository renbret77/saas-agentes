-- Migration Phase v41: Credit Transactions & Resale System
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID REFERENCES profiles(id),
    to_user_id UUID REFERENCES profiles(id),
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- 'assignment', 'purchase', 'usage', 'refund'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for credit_transactions
CREATE POLICY "Admins can see their agency transactions" ON credit_transactions
    FOR SELECT USING (
        auth.uid() = from_user_id OR auth.uid() = to_user_id
    );

-- Function to safely assign credits from admin to agent
CREATE OR REPLACE FUNCTION assign_credits(
    p_admin_id UUID,
    p_agent_id UUID,
    p_amount INTEGER,
    p_notes TEXT
) RETURNS VOID AS $$
BEGIN
    -- 1. Register the transaction
    INSERT INTO credit_transactions (from_user_id, to_user_id, amount, transaction_type, notes)
    VALUES (p_admin_id, p_agent_id, p_amount, 'assignment', p_notes);

    -- 2. Update agent credits
    UPDATE agent_settings
    SET ai_credits_total = ai_credits_total + p_amount
    WHERE user_id = p_agent_id;

    -- If no agent_settings exist, create them
    IF NOT FOUND THEN
        INSERT INTO agent_settings (user_id, ai_credits_total, ai_credits_used)
        VALUES (p_agent_id, 10 + p_amount, 0);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
