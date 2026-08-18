-- Inbox unifiée de l'écosystème Envol Africa.
-- Les APIs serveur utilisent service_role ; RLS empêche tout accès direct public.

alter table public.notifications add column if not exists platform text not null default 'system';
alter table public.notifications add column if not exists entity_type text;
alter table public.notifications add column if not exists entity_id text;
alter table public.notifications add column if not exists dedupe_key text;
alter table public.notifications add column if not exists push_sent_at timestamptz;

create index if not exists idx_notifications_profile_unread
  on public.notifications (profile_id, read_at, created_at desc);
create index if not exists idx_notifications_platform_created
  on public.notifications (platform, created_at desc);
create unique index if not exists uq_notifications_dedupe_key
  on public.notifications (dedupe_key)
  where dedupe_key is not null;

create table if not exists public.ecosystem_messages (
  id uuid primary key default uuid_generate_v4(),
  platform text not null,
  thread_id text,
  sender_id uuid references public.users(id) on delete set null,
  recipient_id uuid not null references public.users(id) on delete cascade,
  subject text,
  body text not null,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_ecosystem_messages_recipient_unread
  on public.ecosystem_messages (recipient_id, read_at, created_at desc);
create index if not exists idx_ecosystem_messages_platform_thread
  on public.ecosystem_messages (platform, thread_id, created_at desc);

alter table public.notifications enable row level security;
alter table public.ecosystem_messages enable row level security;
revoke all on table public.notifications from anon, authenticated;
revoke all on table public.ecosystem_messages from anon, authenticated;
