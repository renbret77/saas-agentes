-- MIGRATION: Device Fingerprinting and Anti-Abuse Limits

-- 1. Create the Device Tracking Table
CREATE TABLE IF NOT EXISTS public.device_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, device_id)
);

ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;

-- 2. Create the RPC Function to assert device Fingerprinting Limits
-- This function gets called exactly after successful auth but before proceeding.
CREATE OR REPLACE FUNCTION assert_device_limit(p_user_id UUID, p_device_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_agency_id UUID;
    v_license_type TEXT;
    v_device_count INTEGER;
BEGIN
    -- 2.1 Get the user's agency and license type
    SELECT agency_id INTO v_agency_id FROM public.profiles WHERE id = p_user_id;
    
    -- If no agency, fail safe (shouldn't happen with our new flow)
    IF v_agency_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT license_type INTO v_license_type FROM public.agencies WHERE id = v_agency_id;

    -- 2.2 Upsert the device log for this user
    INSERT INTO public.device_logs (user_id, agency_id, device_id, last_login)
    VALUES (p_user_id, v_agency_id, p_device_id, NOW())
    ON CONFLICT (user_id, device_id) 
    DO UPDATE SET last_login = NOW();

    -- 2.3 The Core Anti-Abuse Check: Only applies to FREE tier
    IF v_license_type = 'free' THEN
        -- Contar cuántas cuentas "Free" DISTINTAS de cualquier agencia se han logueado en este MISMO dispositivo
        -- en los últimos 30 días.
        SELECT COUNT(DISTINCT d.user_id) INTO v_device_count
        FROM public.device_logs d
        JOIN public.agencies a ON a.id = d.agency_id
        WHERE d.device_id = p_device_id
          AND a.license_type = 'free'
          AND d.last_login > NOW() - INTERVAL '30 days';

        -- SI el dispositivo físico se usa para acceder a 3 o más cuentas "Free" diferentes, LO BLOQUEAMOS.
        IF v_device_count >= 3 THEN
            RETURN FALSE; -- Bloquear acceso
        END IF;
    END IF;

    -- If the license is PRO/ELITE, or they passed the free tier check, allow them in.
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
