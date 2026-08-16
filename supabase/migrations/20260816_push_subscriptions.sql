-- Abonnements Web Push pour les notifications consenties de l'écosystème EAM.
-- La table push_subscriptions existait déjà dans la migration WAB avec profile_id -> users.id.
-- Cette migration la complète sans supprimer ni réinitialiser les abonnements existants.

alter table public.push_subscriptions add column if not exists user_agent text;
alter table public.push_subscriptions add column if not exists updated_at timestamptz not null default now();

create unique index if not exists uq_push_subscriptions_endpoint on public.push_subscriptions (endpoint) where endpoint is not null;
create index if not exists idx_push_subscriptions_user on public.push_subscriptions (profile_id, updated_at desc);

alter table public.push_subscriptions enable row level security;
revoke all on table public.push_subscriptions from anon, authenticated;
