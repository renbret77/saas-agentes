-- MIGRATION: 078_fiscal_data_mexico.sql
-- DESCRIPTION: Agrega campos obligatorios para facturación CFDI 4.0 (México) a la tabla de Agencias.

ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS rfc TEXT,
ADD COLUMN IF NOT EXISTS fiscal_name TEXT,
ADD COLUMN IF NOT EXISTS tax_regime TEXT, -- Ej: '601', '626'
ADD COLUMN IF NOT EXISTS fiscal_address_zip TEXT;

-- Comentarios para claridad
COMMENT ON COLUMN public.agencies.tax_regime IS 'Código del Régimen Fiscal del SAT (601: General Personas Morales, 626: RESICO, etc)';
COMMENT ON COLUMN public.agencies.fiscal_address_zip IS 'Código Postal del domicilio fiscal del emisor/receptor';
