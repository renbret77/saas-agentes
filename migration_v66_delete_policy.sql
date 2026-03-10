-- MIGRACIÓN V66: DELETE POLICY FOR CLAIMS
-- Fecha: 2026-03-04
-- Autor: Antigravity

-- Añadir política de eliminación para agentes (dueños de los clientes del siniestro)
DROP POLICY IF EXISTS "Agents can delete own claims" ON public.claims;

CREATE POLICY "Agents can delete own claims" ON public.claims
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE public.clients.id = public.claims.client_id 
            AND public.clients.user_id = auth.uid()
        )
    );

-- Verificar que service_role tenga todos los permisos
GRANT ALL ON public.claims TO service_role;
