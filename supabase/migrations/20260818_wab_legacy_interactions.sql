create table if not exists public.wab_legacy_post_metrics (
  post_id text primary key,
  likes_count integer not null default 0 check (likes_count >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  shares_count integer not null default 0 check (shares_count >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.wab_legacy_reactions (
  post_id text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.wab_legacy_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id text not null,
  user_id uuid references public.users(id) on delete set null,
  author text not null,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_wab_legacy_comments_post on public.wab_legacy_comments(post_id, created_at);
