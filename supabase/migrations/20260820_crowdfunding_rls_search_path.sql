-- Harden the RLS deny helper against search_path manipulation.
alter function public.crowdfunding_deny_all() set search_path = public, pg_temp;
