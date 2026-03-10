-- migration_v74_fix_prueba_agency.sql

-- 1. Asegurarnos que todos los pruebaX@admin.com tengan role = 'admin' e ignoremos lo que sea que diga el registro base
UPDATE public.profiles
SET role = 'admin'
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'prueba%@admin.com'
);

-- 2. Reforzar el RLS de Clients:
-- El RLS actual asume que un user tiene role 'admin'. Si en algun momento fue null o 'user', el RLS falló
-- Re-escribamos la politica más dura de clients (borramos la anterior primero)

DROP POLICY IF EXISTS "Agencias ven sus propios clientes" ON public.clients;
CREATE POLICY "Agencias ven sus propios clientes" ON public.clients
    FOR ALL
    USING (
        agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid()) 
        OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
    );

DROP POLICY IF EXISTS "Agencias ven sus propias polizas" ON public.policies;
CREATE POLICY "Agencias ven sus propias polizas" ON public.policies
    FOR ALL
    USING (
        agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid()) 
        OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
    );
    
-- Limpieza de seguridad: Forzar un update en la agency_id de prueba1 si somehow se cruzó con tu admin real
-- (Solo en caso de que en el frontend el user as user se haya corrompido)
