-- MIGRATION: Multi-tenancy and Super Admin (Agencies)

-- 1. Create Agencies (Tenants) Table
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    license_type TEXT DEFAULT 'free' CHECK (license_type IN ('free', 'pro', 'elite')),
    max_users INT DEFAULT 1,
    max_clients INT DEFAULT 20,
    max_policies INT DEFAULT 20,
    admin_phone TEXT UNIQUE,
    cnsf_license TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Agencies
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- 2. Modify Profiles Table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requires_daily_mfa BOOLEAN DEFAULT false;

-- Actualizar constraint de role para incluir superadmin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('superadmin', 'admin', 'agent', 'assistant'));

-- 3. SuperAdmin Policies (Only superadmin can manage agencies)
CREATE POLICY "Superadmins can manage agencies" ON public.agencies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin'
        )
    );

-- Agencies can view their own record
CREATE POLICY "Users can view their own agency" ON public.agencies
    FOR SELECT USING (
        id = (SELECT agency_id FROM public.profiles WHERE profiles.id = auth.uid())
    );

-- 4. Multi-tenancy Isolation Fix for Clients (Agents can only see clients in their agency)
-- First drop existing conflicting policies
DROP POLICY IF EXISTS "Users can manage own or assigned clients" ON public.clients;

CREATE POLICY "Agency isolation for clients" ON public.clients
    FOR ALL USING (
        user_id = auth.uid() 
        OR 
        EXISTS (
            -- Verifico que el usuario del cliente pertenezca a mi misma agencia
            SELECT 1 FROM public.profiles client_owner
            JOIN public.profiles me ON me.id = auth.uid()
            WHERE client_owner.id = public.clients.user_id 
              AND client_owner.agency_id = me.agency_id 
              AND me.agency_id IS NOT NULL
        )
    );

-- 5. Trigger para actualizar el updated_at de las agencias
CREATE OR REPLACE FUNCTION update_agency_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_agency_timestamp ON public.agencies;
CREATE TRIGGER trigger_update_agency_timestamp
BEFORE UPDATE ON public.agencies
FOR EACH ROW
EXECUTE FUNCTION update_agency_timestamp();
