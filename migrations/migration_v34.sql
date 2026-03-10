-- Migration v34: Loyalty & One-Click Sharing Support

-- 1. Añadir fecha de último contacto a clientes
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- 2. Añadir configuraciones de fidelización a los ajustes del agente
ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS loyalty_templates JSONB DEFAULT '{
    "birthday": "¡Hola [NAME]! 🎂 De parte de Seguros RB, te deseamos un muy feliz cumpleaños. Que pases un día increíble.",
    "checkup": "Hola [NAME], ¿cómo va todo? 👋 Paso a saludarte y recordarte que estoy aquí para cualquier duda con tus seguros. ¡Saludos!",
    "referral": "Hola [NAME]. 👋 Si estás contento con mi servicio, ¿me podrías recomendar con algún amigo o familiar? ¡Te lo agradecería mucho!"
}'::jsonb;

-- 3. Crear índices para optimizar búsqueda de cumpleaños
CREATE INDEX IF NOT EXISTS idx_clients_birth_date ON clients (birth_date);
