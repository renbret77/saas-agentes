-- SQL Migration: Loyalty & Rewards System (v2.9.15)
-- Objetivo: Soporte técnico para cupones dinámicos y automatización de fidelización.

-- 1. Tabla de Cupones/Recompensas
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) DEFAULT 'coupon', -- 'coupon', 'gift_card', 'discount'
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    value_amount NUMERIC(10, 2),
    expiry_date TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'redeemed', 'expired'
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: loyalty_rewards
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents manage own rewards" ON public.loyalty_rewards FOR ALL USING (auth.uid() = agent_id);

-- 2. Integración de V-Prop en Pólizas (Opcional si se requiere tracking específico)
ALTER TABLE public.policies
ADD COLUMN IF NOT EXISTS attached_vprop_id UUID REFERENCES public.quote_sessions(id) ON DELETE SET NULL;

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_loyalty_client ON public.loyalty_rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_status ON public.loyalty_rewards(status);
