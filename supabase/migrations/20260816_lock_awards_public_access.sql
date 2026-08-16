-- Verrou de sécurité : les tables Awards non encore exposées par des policies métier
-- restent accessibles uniquement aux routes serveur utilisant la service role.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'awards_advertisements', 'awards_affiliate_conversions', 'awards_affiliate_links',
    'awards_badges', 'awards_comments', 'awards_favorites', 'awards_gifts_catalog',
    'awards_hosts', 'awards_jury_members', 'awards_live_events', 'awards_live_sessions',
    'awards_notifications', 'awards_results', 'awards_sponsors', 'awards_user_badges',
    'awards_user_levels'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
  end loop;
end $$;
