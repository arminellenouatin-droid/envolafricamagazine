-- Fix Supabase security advisor: pin the trigger function search_path.
-- This does not change business behavior; it prevents search_path hijacking.
ALTER FUNCTION public.jobs_set_updated_at() SET search_path = public;

