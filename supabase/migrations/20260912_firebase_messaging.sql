-- Firebase Cloud Messaging registrations for connected Envol Africa users.
-- Keeps legacy Web Push subscriptions compatible during the transition.

alter table public.push_subscriptions add column if not exists provider text not null default 'web_push';
alter table public.push_subscriptions add column if not exists fcm_fid text;

create unique index if not exists uq_push_subscriptions_fcm_fid
  on public.push_subscriptions (fcm_fid);
create index if not exists idx_push_subscriptions_provider_user
  on public.push_subscriptions (provider, profile_id, updated_at desc);

alter table public.push_subscriptions enable row level security;
revoke all on table public.push_subscriptions from anon, authenticated;
