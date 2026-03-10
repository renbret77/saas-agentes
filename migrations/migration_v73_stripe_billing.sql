-- MIGRATION: 073_stripe_billing_and_addons.sql
-- DESCRIPTION: Sets up the core database structure for Stripe subscriptions, one-time payments (credits), and modular add-ons.

-- 1. Create a table to map Stripe Customers to Agencies
CREATE TABLE IF NOT EXISTS public.billing_customers (
    agency_id UUID PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    default_currency TEXT DEFAULT 'usd' CHECK (default_currency IN ('mxn', 'usd')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmins and agency owners can view customer data" ON public.billing_customers
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin' OR (role = 'admin' AND agency_id = public.billing_customers.agency_id))
    );

-- 2. Create the Subscriptions Table
-- This tracks the active tier (Pro, Elite) and Stripe details
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_price_id TEXT NOT NULL,
    status TEXT NOT NULL, -- e.g., 'active', 'past_due', 'canceled', 'trialing'
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmins and agency owners can view subscriptions" ON public.subscriptions
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin' OR (role = 'admin' AND agency_id = public.subscriptions.agency_id))
    );

-- 3. Create Transactions Table (For Auditing & Credit Purchases)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    amount_subtotal INTEGER NOT NULL, -- in cents
    amount_total INTEGER NOT NULL, -- in cents
    currency TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL, -- 'succeeded', 'processing', 'failed'
    metadata JSONB, -- useful to store what exact product was bought (e.g., '50_credits')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmins and agency owners can view transactions" ON public.transactions
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin' OR (role = 'admin' AND agency_id = public.transactions.agency_id))
    );

-- 4. Create "Add-ons" Table (The "Módulos Extras")
-- Examples: 'whatsapp_bot', 'auto_reminders'
CREATE TABLE IF NOT EXISTS public.agency_addons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    addon_type TEXT NOT NULL, -- Code identifier: 'whatsapp_bot', 'claims_portal'
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'past_due')),
    stripe_subscription_id TEXT, -- If the add-on is billed recursively via Stripe
    expires_at TIMESTAMP WITH TIME ZONE, -- Useful for trials or fixed-length unclocking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(agency_id, addon_type)
);
ALTER TABLE public.agency_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for agents belonging to the agency" ON public.agency_addons
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE agency_id = public.agency_addons.agency_id)
    );

-- Make sure to allow Service Role inserts for webhooks (bypasses RLS automatically, but good to be explicit for logic if needed)
