-- Migration v46: Multi-Variant Notifications Support
-- This script updates agent_settings to support 3 variants per notification tier

UPDATE agent_settings
SET notification_settings = jsonb_build_object(
    'pre_due', jsonb_build_object(
        'enabled', COALESCE((notification_settings->'pre_due'->>'enabled')::boolean, true),
        'days_before', COALESCE((notification_settings->'pre_due'->>'days_before')::int, 5),
        'ai_tone', COALESCE(notification_settings->'pre_due'->>'ai_tone', 'profesional'),
        'variants', jsonb_build_array(
            COALESCE(notification_settings->'pre_due'->>'template', ''),
            '',
            ''
        )
    ),
    'grace_period', jsonb_build_object(
        'enabled', COALESCE((notification_settings->'grace_period'->>'enabled')::boolean, true),
        'days_after', COALESCE((notification_settings->'grace_period'->>'days_after')::int, 2),
        'ai_tone', COALESCE(notification_settings->'grace_period'->>'ai_tone', 'profesional'),
        'variants', jsonb_build_array(
            COALESCE(notification_settings->'grace_period'->>'template', ''),
            '',
            ''
        )
    ),
    'expired', jsonb_build_object(
        'enabled', COALESCE((notification_settings->'expired'->>'enabled')::boolean, false),
        'days_after', COALESCE((notification_settings->'expired'->>'days_after')::int, 5),
        'ai_tone', COALESCE(notification_settings->'expired'->>'ai_tone', 'urgente'),
        'variants', jsonb_build_array(
            COALESCE(notification_settings->'expired'->>'template', ''),
            '',
            ''
        )
    )
)
WHERE notification_settings IS NOT NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
