-- migration_v82_public_quotes_access.sql

-- Habilitar lectura pública de quote_sessions basada en public_share_id
CREATE POLICY "Public Read Access by Share ID for Sessions" ON public.quote_sessions
    FOR SELECT TO anon, authenticated
    USING (public_share_id IS NOT NULL);

-- Habilitar lectura pública de quote_items basada en el link de la sesión
CREATE POLICY "Public Read Access by Session for Items" ON public.quote_items
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quote_sessions qs
            WHERE qs.id = public.quote_items.session_id
        )
    );

-- Asegurar que agencies también sea legible públicamente para mostrar logo en la landing
-- (O al menos los campos necesarios)
CREATE POLICY "Public Read Partial Agency Info" ON public.agencies
    FOR SELECT TO anon, authenticated
    USING (true);
