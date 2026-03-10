-- Función para importación masiva de clientes
-- Esto permite insertar cientos de registros en una sola transacción
-- y manejar posibles conflictos o limpieza de datos.

CREATE OR REPLACE FUNCTION bulk_import_clients(client_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count int := 0;
    error_count int := 0;
    item jsonb;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(client_data)
    LOOP
        BEGIN
            INSERT INTO clients (
                user_id,
                first_name,
                last_name,
                email,
                mobile_phone,
                rfc,
                notes,
                created_at
            ) VALUES (
                auth.uid(),
                (item->>'first_name'),
                (item->>'last_name'),
                (item->>'email'),
                (item->>'phone'),
                (item->>'rfc'),
                (item->>'notes'),
                NOW()
            );
            inserted_count := inserted_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Error insertando cliente: %', SQLERRM;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'success', inserted_count,
        'errors', error_count
    );
END;
$$;

-- Función para importación masiva de pólizas
-- Busca el cliente por nombre exacto para vincular la póliza
CREATE OR REPLACE FUNCTION bulk_import_policies(policy_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count int := 0;
    error_count int := 0;
    item jsonb;
    v_client_id uuid;
    v_insurer_id uuid;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(policy_data)
    LOOP
        BEGIN
            -- Intentar encontrar cliente por nombre completo y que pertenezca al usuario
            SELECT id INTO v_client_id 
            FROM clients 
            WHERE (first_name || ' ' || last_name) ILIKE (item->>'client_name')
            AND user_id = auth.uid()
            LIMIT 1;

            -- Intentar encontrar aseguradora por alias o nombre
            SELECT id INTO v_insurer_id
            FROM insurers
            WHERE (alias ILIKE (item->>'insurer_name') OR name ILIKE (item->>'insurer_name'))
            LIMIT 1;

            IF v_client_id IS NOT NULL AND v_insurer_id IS NOT NULL THEN
                INSERT INTO policies (
                    policy_number,
                    client_id,
                    insurer_id,
                    start_date,
                    end_date,
                    premium_total,
                    payment_method,
                    status,
                    created_at
                ) VALUES (
                    (item->>'policy_number'),
                    v_client_id,
                    v_insurer_id,
                    (item->>'start_date')::date,
                    (item->>'end_date')::date,
                    (item->>'premium_total')::numeric,
                    (item->>'payment_method'),
                    'vigente',
                    NOW()
                );
                inserted_count := inserted_count + 1;
            ELSE
                error_count := error_count + 1;
            END IF;
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
