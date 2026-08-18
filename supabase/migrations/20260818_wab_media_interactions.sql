create table if not exists public.wab_media_reactions (
  id uuid primary key default uuid_generate_v4(),
  media_type text not null check (media_type in ('story','reel')),
  media_id text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  reaction text not null check (reaction in ('love','like','laugh','sad','cry','wow')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(media_type, media_id, user_id)
);

create table if not exists public.wab_media_comments (
  id uuid primary key default uuid_generate_v4(),
  media_type text not null check (media_type in ('story','reel')),
  media_id text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  author text not null,
  content text not null check (char_length(content) between 2 and 2000),
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now()
);

create index if not exists idx_wab_media_reactions_media on public.wab_media_reactions(media_type, media_id, created_at desc);
create index if not exists idx_wab_media_comments_media on public.wab_media_comments(media_type, media_id, created_at asc);

alter table public.wab_media_reactions enable row level security;
alter table public.wab_media_comments enable row level security;

do $$ begin
  create policy "Public can read WAB media reactions" on public.wab_media_reactions for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Public can read published WAB media comments" on public.wab_media_comments for select using (status = 'published');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role manages WAB media reactions" on public.wab_media_reactions for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role manages WAB media comments" on public.wab_media_comments for all using (true) with check (true);
exception when duplicate_object then null;
end $$;
