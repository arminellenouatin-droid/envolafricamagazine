-- Fondations internes Envol Africa : sécurité, consentement, newsletter et KPI.
-- Les routes serveur utiliseront le rôle service pour ces tables sensibles.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'active', 'unsubscribed', 'bounced')),
  source text not null default 'kiosque',
  consent_at timestamptz,
  verified_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_newsletter_status on public.newsletter_subscribers(status, created_at desc);

create table if not exists public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  subscriber_id uuid references public.newsletter_subscribers(id) on delete cascade,
  token_hash text not null unique,
  purpose text not null default 'account_verification',
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_email_verification_tokens_user on public.email_verification_tokens(user_id, purpose, created_at desc);
create index if not exists idx_email_verification_tokens_subscriber on public.email_verification_tokens(subscriber_id, purpose, created_at desc);

create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  ip_hash text,
  succeeded boolean not null default false,
  attempted_at timestamptz not null default now()
);
create index if not exists idx_login_attempts_email_time on public.login_attempts(email_hash, attempted_at desc);
create index if not exists idx_login_attempts_ip_time on public.login_attempts(ip_hash, attempted_at desc);

create table if not exists public.session_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_type text not null check (event_type in ('login', 'logout', 'heartbeat', 'session_expired')),
  platform text not null default 'web',
  ip_hash text,
  user_agent_hash text,
  country text,
  occurred_at timestamptz not null default now()
);
create index if not exists idx_session_events_time on public.session_events(occurred_at desc);
create index if not exists idx_session_events_user_time on public.session_events(user_id, occurred_at desc);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.users(id) on delete set null,
  visitor_id_hash text,
  analytics_storage text not null default 'denied',
  ad_storage text not null default 'denied',
  ad_user_data text not null default 'denied',
  ad_personalization text not null default 'denied',
  policy_version text not null default '2026-08-20',
  created_at timestamptz not null default now()
);
create index if not exists idx_consent_records_profile_time on public.consent_records(profile_id, created_at desc);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.users(id) on delete set null,
  visitor_id_hash text,
  event_name text not null,
  platform text not null default 'web',
  entity_type text,
  entity_id text,
  value numeric,
  currency text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists idx_analytics_events_name_time on public.analytics_events(event_name, occurred_at desc);
create index if not exists idx_analytics_events_platform_time on public.analytics_events(platform, occurred_at desc);

alter table public.email_verification_tokens enable row level security;
alter table public.login_attempts enable row level security;
alter table public.session_events enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.consent_records enable row level security;
alter table public.analytics_events enable row level security;

revoke all on table public.email_verification_tokens from anon, authenticated;
revoke all on table public.login_attempts from anon, authenticated;
revoke all on table public.session_events from anon, authenticated;
revoke all on table public.newsletter_subscribers from anon, authenticated;
revoke all on table public.consent_records from anon, authenticated;
revoke all on table public.analytics_events from anon, authenticated;
