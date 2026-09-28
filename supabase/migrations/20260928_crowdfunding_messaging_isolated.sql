-- ============================================================================
-- MESSAGERIE CROWDFUNDING ISOLÉE (PORTEUR <-> INVESTISSEURS) — ENVOL AFRICA
-- Table dédiée et isolée aux espaces de projets de financement participatif
-- ============================================================================

create extension if not exists "uuid-ossp";

-- 1. Espaces de projet (un espace par projet de financement)
create table if not exists public.crowdfunding_spaces (
  id uuid primary key default uuid_generate_v4(),
  projet_id text not null,
  porteur_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  campaign_mode text not null default 'don' check (campaign_mode in ('don', 'prise_part', 'pret', 'mixte')),
  status text not null default 'actif' check (status in ('actif', 'archive', 'en_litige')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crowdfunding_spaces_projet_id on public.crowdfunding_spaces(projet_id);
create index if not exists idx_crowdfunding_spaces_porteur_id on public.crowdfunding_spaces(porteur_id);

-- 2. Participants à l'espace (porteur et investisseurs confirmés)
create table if not exists public.crowdfunding_participants (
  id uuid primary key default uuid_generate_v4(),
  space_id uuid not null references public.crowdfunding_spaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'investisseur' check (role in ('porteur', 'investisseur', 'admin')),
  investment_id text,
  investment_mode text not null default 'don' check (investment_mode in ('don', 'prise_part', 'pret')),
  invested_amount numeric default 0,
  percentage numeric,
  interest_rate numeric,
  status text not null default 'actif' check (status in ('actif', 'revoque', 'mute')),
  joined_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint unique_space_user unique (space_id, user_id)
);

create index if not exists idx_crowdfunding_participants_space_id on public.crowdfunding_participants(space_id);
create index if not exists idx_crowdfunding_participants_user_id on public.crowdfunding_participants(user_id);

-- 3. Messages Crowdfunding
create table if not exists public.crowdfunding_messages (
  id uuid primary key default uuid_generate_v4(),
  space_id uuid not null references public.crowdfunding_spaces(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  sender_role text not null default 'investisseur' check (sender_role in ('porteur', 'investisseur', 'admin', 'system')),
  sender_name text not null,
  sender_avatar text,
  content text,
  is_update boolean not null default false,
  update_title text,
  is_pinned boolean not null default false,
  mentions jsonb not null default '[]'::jsonb,
  read_by jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_crowdfunding_messages_space_id on public.crowdfunding_messages(space_id);
create index if not exists idx_crowdfunding_messages_created_at on public.crowdfunding_messages(created_at);

-- 4. Pièces jointes multi-contenu (combinées aux messages)
create table if not exists public.crowdfunding_attachments (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.crowdfunding_messages(id) on delete cascade,
  type text not null check (type in ('document', 'image', 'video', 'voice')),
  url text not null,
  name text not null,
  size numeric not null default 0,
  duration numeric,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_crowdfunding_attachments_message_id on public.crowdfunding_attachments(message_id);

-- 5. Sessions d'appels WebRTC (1:1 et de groupe)
create table if not exists public.crowdfunding_calls (
  id uuid primary key default uuid_generate_v4(),
  space_id uuid not null references public.crowdfunding_spaces(id) on delete cascade,
  initiator_id uuid not null references public.users(id) on delete cascade,
  initiator_name text not null,
  call_type text not null default 'video' check (call_type in ('audio', 'video')),
  is_group boolean not null default false,
  status text not null default 'initiated' check (status in ('initiated', 'active', 'ended', 'missed')),
  participants jsonb not null default '[]'::jsonb,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists idx_crowdfunding_calls_space_id on public.crowdfunding_calls(space_id);

-- 6. Paramètres de confidentialité par projet
create table if not exists public.crowdfunding_settings (
  id uuid primary key default uuid_generate_v4(),
  projet_id text not null unique,
  show_amounts_to_investors boolean not null default false,
  allow_investor_calls boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 7. Signalements et modération
create table if not exists public.crowdfunding_reports (
  id uuid primary key default uuid_generate_v4(),
  space_id uuid not null references public.crowdfunding_spaces(id) on delete cascade,
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_type text not null check (target_type in ('message', 'participant', 'space')),
  target_id text not null,
  reason text not null,
  status text not null default 'en_attente' check (status in ('en_attente', 'traite', 'rejete')),
  admin_notes text,
  created_at timestamptz not null default now()
);

-- 8. Journal d'audit des accès admin aux espaces de discussion
create table if not exists public.crowdfunding_admin_access_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references public.users(id) on delete cascade,
  space_id uuid not null references public.crowdfunding_spaces(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.crowdfunding_spaces enable row level security;
alter table public.crowdfunding_participants enable row level security;
alter table public.crowdfunding_messages enable row level security;
alter table public.crowdfunding_attachments enable row level security;
alter table public.crowdfunding_calls enable row level security;
alter table public.crowdfunding_settings enable row level security;
alter table public.crowdfunding_reports enable row level security;
alter table public.crowdfunding_admin_access_logs enable row level security;

-- Accès sécurisé : Seul le serveur avec service_role a accès complet.
-- Pour les utilisateurs authentifiés, accès filtré par participant actif :
drop policy if exists "crowdfunding_spaces_read" on public.crowdfunding_spaces;
create policy "crowdfunding_spaces_read" on public.crowdfunding_spaces
  for select using (
    exists (
      select 1 from public.crowdfunding_participants p
      where p.space_id = crowdfunding_spaces.id
        and p.user_id = (select auth.uid())
        and p.status = 'actif'
    )
  );

drop policy if exists "crowdfunding_messages_read" on public.crowdfunding_messages;
create policy "crowdfunding_messages_read" on public.crowdfunding_messages
  for select using (
    exists (
      select 1 from public.crowdfunding_participants p
      where p.space_id = crowdfunding_messages.space_id
        and p.user_id = (select auth.uid())
        and p.status = 'actif'
    )
  );

drop policy if exists "crowdfunding_messages_insert" on public.crowdfunding_messages;
create policy "crowdfunding_messages_insert" on public.crowdfunding_messages
  for insert with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.crowdfunding_participants p
      where p.space_id = crowdfunding_messages.space_id
        and p.user_id = (select auth.uid())
        and p.status = 'actif'
    )
  );
