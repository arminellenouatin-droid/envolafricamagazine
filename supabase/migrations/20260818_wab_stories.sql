create table if not exists public.wab_stories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  author text not null,
  media_url text not null,
  mime_type text not null default 'image/jpeg',
  caption text not null default '',
  views integer not null default 0 check (views >= 0),
  likes integer not null default 0 check (likes >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  moderation_status text not null default 'published' check (moderation_status in ('published','pending_review','hidden'))
);
create index if not exists idx_wab_stories_feed on public.wab_stories(moderation_status, expires_at desc, created_at desc);
