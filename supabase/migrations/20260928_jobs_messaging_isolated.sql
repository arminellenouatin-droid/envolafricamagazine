-- ============================================================================
-- MESSAGERIE JOBS ISOLÉE (DEMANDEURS <-> OFFREURS / B2B / PEER) — ENVOL AFRICA
-- Table dédiée et isolée à la messagerie du volet Emploi / Recrutement
-- ============================================================================

create extension if not exists "uuid-ossp";

-- 1. Conversations Jobs
create table if not exists public.jobs_conversations (
  id uuid primary key default uuid_generate_v4(),
  title text,
  type text not null default 'direct' check (type in ('direct', 'group')),
  job_offer_id text,
  job_offer_title text,
  creator_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'archived', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_jobs_conversations_creator_id on public.jobs_conversations(creator_id);
create index if not exists idx_jobs_conversations_job_offer_id on public.jobs_conversations(job_offer_id);
create index if not exists idx_jobs_conversations_updated_at on public.jobs_conversations(updated_at);

-- 2. Participants aux conversations Jobs
create table if not exists public.jobs_conversation_participants (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.jobs_conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'candidate' check (role in ('candidate', 'employer', 'recruiter', 'admin')),
  status text not null default 'active' check (status in ('active', 'left', 'removed')),
  last_read_at timestamptz default now(),
  joined_at timestamptz not null default now(),
  constraint unique_jobs_conversation_user unique (conversation_id, user_id)
);

create index if not exists idx_jobs_conv_participants_conv_id on public.jobs_conversation_participants(conversation_id);
create index if not exists idx_jobs_conv_participants_user_id on public.jobs_conversation_participants(user_id);

-- 3. Messages Jobs
create table if not exists public.jobs_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.jobs_conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  sender_role text not null default 'candidate' check (sender_role in ('candidate', 'employer', 'recruiter', 'admin', 'system')),
  sender_name text not null,
  sender_avatar text,
  content text,
  type text not null default 'text' check (type in ('text', 'voice', 'image', 'video', 'document', 'system')),
  is_edited boolean not null default false,
  edited_at timestamptz,
  is_deleted boolean not null default false,
  deleted_for jsonb not null default '[]'::jsonb,
  reply_to_id uuid references public.jobs_messages(id) on delete set null,
  reactions jsonb not null default '{}'::jsonb,
  read_by jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_jobs_messages_conversation_id on public.jobs_messages(conversation_id);
create index if not exists idx_jobs_messages_sender_id on public.jobs_messages(sender_id);
create index if not exists idx_jobs_messages_created_at on public.jobs_messages(created_at);

-- 4. Pièces jointes Jobs (CV, contrats, fiches de poste, images, vocaux)
create table if not exists public.jobs_attachments (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.jobs_messages(id) on delete cascade,
  type text not null check (type in ('document', 'image', 'video', 'voice')),
  url text not null,
  name text not null,
  size numeric not null default 0,
  duration numeric,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_jobs_attachments_message_id on public.jobs_attachments(message_id);

-- 5. Sessions d'appels WebRTC (1:1 et réunions / panels d'entretien)
create table if not exists public.jobs_calls (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.jobs_conversations(id) on delete cascade,
  initiator_id uuid not null references public.users(id) on delete cascade,
  initiator_name text not null,
  call_type text not null default 'audio' check (call_type in ('audio', 'video')),
  is_group boolean not null default false,
  status text not null default 'initiated' check (status in ('initiated', 'ringing', 'connected', 'ended', 'declined', 'missed')),
  participants jsonb not null default '[]'::jsonb,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists idx_jobs_calls_conversation_id on public.jobs_calls(conversation_id);

-- 6. Blocages d'utilisateurs Jobs
create table if not exists public.jobs_blocks (
  id uuid primary key default uuid_generate_v4(),
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  constraint unique_jobs_block unique (blocker_id, blocked_id)
);

create index if not exists idx_jobs_blocks_blocker_id on public.jobs_blocks(blocker_id);
create index if not exists idx_jobs_blocks_blocked_id on public.jobs_blocks(blocked_id);

-- 7. Signalements Jobs (arnaque, fausse offre, harcèlement)
create table if not exists public.jobs_reports (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.jobs_conversations(id) on delete cascade,
  reporter_id uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid references public.users(id) on delete cascade,
  reported_message_id uuid references public.jobs_messages(id) on delete set null,
  category text not null check (category in ('spam', 'scam', 'harassment', 'fake_job', 'inappropriate', 'other')),
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  admin_notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_jobs_reports_conversation_id on public.jobs_reports(conversation_id);
create index if not exists idx_jobs_reports_reporter_id on public.jobs_reports(reporter_id);

-- ============================================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.jobs_conversations enable row level security;
alter table public.jobs_conversation_participants enable row level security;
alter table public.jobs_messages enable row level security;
alter table public.jobs_attachments enable row level security;
alter table public.jobs_calls enable row level security;
alter table public.jobs_blocks enable row level security;
alter table public.jobs_reports enable row level security;

-- Révoquer les accès anon
revoke all on public.jobs_conversations from anon;
revoke all on public.jobs_conversation_participants from anon;
revoke all on public.jobs_messages from anon;
revoke all on public.jobs_attachments from anon;
revoke all on public.jobs_calls from anon;
revoke all on public.jobs_blocks from anon;
revoke all on public.jobs_reports from anon;

-- Politiques RLS pour utilisateurs authentifiés
drop policy if exists "jobs_conversations_read" on public.jobs_conversations;
create policy "jobs_conversations_read" on public.jobs_conversations
  for select using (
    exists (
      select 1 from public.jobs_conversation_participants p
      where p.conversation_id = jobs_conversations.id
        and p.user_id = (select auth.uid())
        and p.status = 'active'
    )
  );

drop policy if exists "jobs_messages_read" on public.jobs_messages;
create policy "jobs_messages_read" on public.jobs_messages
  for select using (
    exists (
      select 1 from public.jobs_conversation_participants p
      where p.conversation_id = jobs_messages.conversation_id
        and p.user_id = (select auth.uid())
        and p.status = 'active'
    )
  );

drop policy if exists "jobs_messages_insert" on public.jobs_messages;
create policy "jobs_messages_insert" on public.jobs_messages
  for insert with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.jobs_conversation_participants p
      where p.conversation_id = jobs_messages.conversation_id
        and p.user_id = (select auth.uid())
        and p.status = 'active'
    )
  );
