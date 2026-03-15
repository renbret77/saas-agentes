-- MIGRATION: 084_anti_agandalle_limits.sql
-- DESCRIPTION: Implements strict usage limits (Anti-agandalle) for policies and clients.

-- 1. Add storage limits to agencies
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS max_storage_mb INTEGER DEFAULT 1024;

-- 2. Function to check quota before insertion
CREATE OR REPLACE FUNCTION public.fn_check_usage_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_limit INTEGER;
    v_current INTEGER;
    v_agency_id UUID;
BEGIN
    -- Get agency_id from profile
    SELECT agency_id INTO v_agency_id FROM public.profiles WHERE id = NEW.user_id;

    IF v_agency_id IS NULL THEN
        RETURN NEW; -- No agency, no limits (possibly superadmin test)
    END IF;

    -- CASE: Monitoring Clients
    IF TG_TABLE_NAME = 'clients' THEN
        SELECT max_clients INTO v_limit FROM public.agencies WHERE id = v_agency_id;
        SELECT COUNT(*) INTO v_current FROM public.clients 
        WHERE user_id IN (SELECT id FROM public.profiles WHERE agency_id = v_agency_id);
    
    -- CASE: Monitoring Policies
    ELSIF TG_TABLE_NAME = 'policies' THEN
        SELECT max_policies INTO v_limit FROM public.agencies WHERE id = v_agency_id;
        SELECT COUNT(*) INTO v_current FROM public.policies 
        WHERE client_id IN (
            SELECT id FROM public.clients 
            WHERE user_id IN (SELECT id FROM public.profiles WHERE agency_id = v_agency_id)
        );
    END IF;

    -- Enforcement
    IF v_current >= v_limit THEN
        RAISE EXCEPTION 'Límite de suscripción alcanzado (% sobre %). Por favor, adquiere un módulo de crecimiento.', v_current, v_limit;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Triggers
DROP TRIGGER IF EXISTS trigger_check_client_quota ON public.clients;
CREATE TRIGGER trigger_check_client_quota
BEFORE INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.fn_check_usage_quota();

DROP TRIGGER IF EXISTS trigger_check_policy_quota ON public.policies;
CREATE TRIGGER trigger_check_policy_quota
BEFORE INSERT ON public.policies
FOR EACH ROW
EXECUTE FUNCTION public.fn_check_usage_quota();

-- 4. Initial update for existing agencies if needed
UPDATE public.agencies SET max_policies = 500, max_clients = 300, max_storage_mb = 1024 WHERE license_type = 'free';
UPDATE public.agencies SET max_policies = 2000, max_clients = 1500, max_storage_mb = 10240 WHERE license_type = 'pro';
