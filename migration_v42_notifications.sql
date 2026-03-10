-- Migration Phase v42: Automated Notification Settings
-- Support for storing AI-crafted templates for payment reminders and grace periods

ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
    "pre_due": {
        "enabled": true,
        "days_before": 5,
        "template": "Hola {{nombre_cliente}}, te recordamos que tu póliza {{póliza}} está por vencer. El monto a pagar es {{monto}}. ¡Que tengas excelente día!"
    },
    "grace_period": {
        "enabled": true,
        "days_after": 2,
        "template": "Estimado {{nombre_cliente}}, notamos que el pago de tu póliza {{póliza}} por {{monto}} aún no se ha reflejado. Te recordamos que cuentas con un periodo de gracia para evitar la cancelación."
    }
}'::jsonb;

-- Comment to document schema
COMMENT ON COLUMN agent_settings.notification_settings IS 'Stored templates and rules for automated WhatsApp/Email notifications';
