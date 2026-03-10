-- migration_v74_fix_prueba_agency_v2.sql

-- 1. Asegurar roles correctos para la prueba
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email LIKE 'prueba%@admin.com'
);

-- 2. Limpiar políticas de seguridad defectuosas de Clientes
DROP POLICY IF EXISTS "Agents can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Agents can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Agents can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can manage own or assigned clients" ON public.clients;
DROP POLICY IF EXISTS "Agency isolation for clients" ON public.clients;

-- Crear Política Robusta para Clientes (Basada en user_id relacional)
CREATE POLICY "Strict Agency Data Isolation for Clients" ON public.clients
    FOR ALL USING (
        -- Regla 1: Soy Súper Admin (veo todo)
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
        OR
        -- Regla 2: Soy dueño directo
        user_id = auth.uid()
        OR 
        -- Regla 3: El cliente pertenece a mi agencia
        EXISTS (
            SELECT 1 FROM public.profiles client_owner
            JOIN public.profiles me ON me.id = auth.uid()
            WHERE client_owner.id = public.clients.user_id 
              AND client_owner.agency_id = me.agency_id 
              AND me.agency_id IS NOT NULL
        )
    );

-- 3. Limpiar políticas de seguridad defectuosas de Pólizas
DROP POLICY IF EXISTS "Agents can view policies of their clients" ON public.policies;
DROP POLICY IF EXISTS "Agency isolation for policies" ON public.policies;

-- Crear Política Robusta para Pólizas (Vinculada a Clientes)
CREATE POLICY "Strict Agency Data Isolation for Policies" ON public.policies
    FOR ALL USING (
        -- Regla 1: Soy Súper Admin
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
        OR
        -- Regla 2: La póliza le pertenece a un cliente de mi agencia
        EXISTS (
            SELECT 1 FROM public.clients c
            JOIN public.profiles client_owner ON client_owner.id = c.user_id
            JOIN public.profiles me ON me.id = auth.uid()
            WHERE c.id = public.policies.client_id
              AND client_owner.agency_id = me.agency_id
              AND me.agency_id IS NOT NULL
        )
    );
