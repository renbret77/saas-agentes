-- Migration Fix: Missing Column for Telegram
-- Run this in the Supabase SQL Editor

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS telegram TEXT;

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
