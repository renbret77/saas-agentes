-- migration_v76_onboarding_flag.sql

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT false;
