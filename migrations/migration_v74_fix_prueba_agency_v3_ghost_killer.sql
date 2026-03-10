-- migration_v74_fix_prueba_agency_v3_ghost_killer.sql

-- ELMINAR POLÍTICAS FANTASMAS (GHOST POLICIES)
-- Estas políticas antiguas permitían a cualquier usuario autenticado ver todo el SaaS, saltándose las nuevas reglas Strict

-- 1. Tabla Pólizas (Policies)
DROP POLICY IF EXISTS "Manage Own Policies" ON public.policies;

-- 2. Tabla Documentos de Pólizas (Policy Documents)
DROP POLICY IF EXISTS "Manage Policy Docs" ON public.policy_documents;

-- 3. Tabla Clientes (Clients) (Por si acaso existe una genérica oculta)
DROP POLICY IF EXISTS "Manage Own Clients" ON public.clients;

-- 4. Repetir la actualización de perfiles (Solo por precaución de que la anterior no enganchara a todos)
UPDATE public.profiles 
SET role = 'admin' 
WHERE id IN (
    SELECT id FROM auth.users WHERE email LIKE 'prueba%@admin.com'
);

-- NOTA: Las políticas Strict que corriste en el código pasado (Strict Agency Data Isolation)
-- ya están activas y blindadas. El único problema era que estas políticas "fantasma" 
-- súper permisivas estaban cancelando el candado de seguridad. Al borrarlas, el candado cierra por fin.
