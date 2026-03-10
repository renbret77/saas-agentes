-- Fase v27: CRM Pipeline Status Update

-- 1. Actualizar el constraint de estados en la tabla de clientes
-- Primero eliminamos el constraint antiguo si existe (el nombre suele ser check_status o similar)
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_status_check;

-- 2. Agregar el nuevo constraint con las etapas del funnel
ALTER TABLE public.clients 
ADD CONSTRAINT clients_status_check 
CHECK (status IN ('lead', 'contacted', 'quoting', 'won', 'lost', 'active', 'inactive'));

-- 3. Comentario para documentación
COMMENT ON COLUMN public.clients.status IS 'Estado en el funnel: lead, contacted, quoting, won, lost o estados finales active, inactive';

-- Nota: 'won' suele convertirse automáticamente en 'active' al emitir la primera póliza, 
-- pero permitimos 'won' para el tracking visual del tablero.
