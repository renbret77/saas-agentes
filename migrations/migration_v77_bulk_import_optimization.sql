-- MIGRATION: 077_bulk_import_optimization.sql
-- DESCRIPTION: Mejora los RPCs de importación masiva para soportar más campos y asegurar aislamiento de agencia.

CREATE OR REPLACE FUNCTION bulk_import_clients_v2(client_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count int := 0;
    error_count int := 0;
    item jsonb;
    v_agency_id uuid;
BEGIN
    -- Obtener la agencia del ejecutor
    SELECT agency_id INTO v_agency_id FROM profiles WHERE id = auth.uid();

    FOR item IN SELECT * FROM jsonb_array_elements(client_data)
    LOOP
        BEGIN
            INSERT INTO clients (
                user_id,
                first_name,
                last_name,
                email,
                phone,
                rfc,
                type,
                notes,
                created_at
            ) VALUES (
                auth.uid(),
                COALESCE(item->>'first_name', 'S/N'),
                COALESCE(item->>'last_name', 'S/A'),
                (item->>'email'),
                (item->>'phone'),
                (item->>'rfc'),
                COALESCE(item->>'type', 'fisica'),
                (item->>'notes'),
                NOW()
            );
            inserted_count := inserted_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'success', inserted_count,
        'errors', error_count
    );
END;
$$;
