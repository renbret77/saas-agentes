-- migration_v80_fix_strict_rls_cascades.sql
-- Objetivo: Restaurar las políticas de seguridad (RLS) para tablas dependientes de Pólizas
-- que fueron eliminadas en la limpieza de "Ghost Policies" v74.

-- 1. Documentos de Pólizas (Policy Documents)
-- Permitir que un usuario gestione documentos si tiene acceso a la póliza padre
DROP POLICY IF EXISTS "Strict Agency Data Isolation for Policy Docs" ON public.policy_documents;
CREATE POLICY "Strict Agency Data Isolation for Policy Docs" ON public.policy_documents
    FOR ALL 
    TO authenticated
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
        OR
        EXISTS (
            SELECT 1 FROM public.policies p
            WHERE p.id = public.policy_documents.policy_id
        )
    );

-- 2. Recibos de Pólizas (Policy Installments)
-- Permitir que un usuario vea/edite recibos si tiene acceso a la póliza padre
DROP POLICY IF EXISTS "Agentes pueden ver sus recibos" ON public.policy_installments;
DROP POLICY IF EXISTS "Strict Agency Data Isolation for Policy Installments" ON public.policy_installments;
CREATE POLICY "Strict Agency Data Isolation for Policy Installments" ON public.policy_installments
    FOR ALL 
    TO authenticated
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
        OR
        EXISTS (
            SELECT 1 FROM public.policies p
            WHERE p.id = public.policy_installments.policy_id
        )
    );

-- Comentario de verificación
COMMENT ON TABLE public.policy_documents IS 'Documentos adjuntos a pólizas con RLS vinculado a la póliza padre.';
COMMENT ON TABLE public.policy_installments IS 'Desglose de pagos de pólizas con RLS vinculado a la póliza padre.';
