-- World Africa Business (WAB) — réseau professionnel africain isolé.
-- À appliquer après 004_jobs.sql. Aucune table Magazine, Kiosque, Awards, Marketplace ou Crowdfunding n'est modifiée.

create extension if not exists "uuid-ossp";

create table if not exists public.wab_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references public.users(id) on delete cascade,
  headline text,
  about text,
  company_name text,
  industry text,
  country_code char(2),
  city text,
  avatar_url text,
  status text not null default 'active' check (status in ('active','silent','banned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wab_posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.wab_profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 10000),
  media jsonb not null default '[]'::jsonb,
  content_type text not null default 'text' check (content_type in ('text','image','video','document','opportunity','marketplace_product')),
  visibility text not null default 'public' check (visibility in ('public','connections')),
  moderation_status text not null default 'published' check (moderation_status in ('pending_review','published','hidden','rejected')),
  moderation_reason text,
  is_boosted boolean not null default false,
  boost_ends_at timestamptz,
  views_count integer not null default 0 check (views_count >= 0),
  eligible_views_count integer not null default 0 check (eligible_views_count >= 0),
  watch_seconds integer not null default 0 check (watch_seconds >= 0),
  likes_count integer not null default 0 check (likes_count >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wab_post_views (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.wab_posts(id) on delete cascade,
  viewer_user_id uuid references public.users(id) on delete set null,
  visitor_id text,
  watch_seconds integer not null default 0 check (watch_seconds >= 0),
  is_eligible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.wab_post_reactions (
  post_id uuid references public.wab_posts(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.wab_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.wab_posts(id) on delete cascade,
  author_id uuid references public.wab_profiles(id) on delete set null,
  content text not null check (char_length(content) between 1 and 2000),
  moderation_status text not null default 'published' check (moderation_status in ('published','hidden','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.wab_reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_user_id uuid references public.users(id) on delete set null,
  target_type text not null check (target_type in ('post','comment','profile')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.wab_rewards (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.wab_profiles(id) on delete cascade,
  post_id uuid references public.wab_posts(id) on delete set null,
  reward_type text not null check (reward_type in ('views_1000','watch_minutes_3000')),
  eligible_views integer not null default 0,
  eligible_watch_seconds integer not null default 0,
  amount_xof integer not null check (amount_xof > 0),
  status text not null default 'pending_review' check (status in ('pending_review','validated','rejected','paid')),
  validated_by uuid references public.users(id) on delete set null,
  validated_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wab_boosts (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.wab_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  budget_xof integer not null check (budget_xof > 0),
  duration_days integer not null check (duration_days between 1 and 90),
  target_countries text[] not null default '{}',
  target_industries text[] not null default '{}',
  provider text not null default 'moneroo',
  provider_payment_id text unique,
  status text not null default 'pending' check (status in ('pending','active','ended','cancelled','failed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wab_connections (
  follower_user_id uuid not null references public.users(id) on delete cascade,
  profile_id uuid not null references public.wab_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_user_id, profile_id)
);

create table if not exists public.wab_notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wab_salons (
  id uuid primary key default uuid_generate_v4(),
  host_profile_id uuid not null references public.wab_profiles(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','live','ended','cancelled')),
  stream_url text,
  replay_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.wab_salon_participants (
  salon_id uuid references public.wab_salons(id) on delete cascade,
  profile_id uuid references public.wab_profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (salon_id, profile_id, joined_at)
);

create index if not exists idx_wab_posts_feed on public.wab_posts (moderation_status, is_boosted desc, created_at desc);
create index if not exists idx_wab_posts_author on public.wab_posts (author_id, created_at desc);
create index if not exists idx_wab_views_post on public.wab_post_views (post_id, created_at desc);
create index if not exists idx_wab_reports_status on public.wab_reports (status, created_at desc);
create index if not exists idx_wab_rewards_status on public.wab_rewards (status, created_at desc);
create index if not exists idx_wab_boosts_status on public.wab_boosts (status, ends_at desc);
create index if not exists idx_wab_notifications_user on public.wab_notifications (user_id, read_at, created_at desc);

alter table public.wab_profiles enable row level security;
alter table public.wab_posts enable row level security;
alter table public.wab_post_views enable row level security;
alter table public.wab_post_reactions enable row level security;
alter table public.wab_comments enable row level security;
alter table public.wab_reports enable row level security;
alter table public.wab_rewards enable row level security;
alter table public.wab_boosts enable row level security;
alter table public.wab_connections enable row level security;
alter table public.wab_notifications enable row level security;
alter table public.wab_salons enable row level security;
alter table public.wab_salon_participants enable row level security;

-- Média WAB conservé privé jusqu'à validation/modération par les API serveur.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wab-media', 'wab-media', false, 52428800, array['image/jpeg','image/png','image/webp','video/mp4','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do nothing;

-- Les accès sont servis par les API Next.js sécurisées avec la service role ; aucune exposition directe aux tables WAB.
