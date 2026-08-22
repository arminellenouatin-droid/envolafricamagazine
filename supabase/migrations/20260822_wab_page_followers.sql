-- Abonnements aux pages WAB : migration additive, sans suppression ni modification des données existantes.
create table if not exists public.wab_page_followers (
  page_id uuid not null references public.wab_pages(id) on delete cascade,
  follower_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (page_id, follower_user_id)
);

create index if not exists wab_page_followers_user_idx
  on public.wab_page_followers (follower_user_id, created_at desc);

create index if not exists wab_page_followers_page_idx
  on public.wab_page_followers (page_id, created_at desc);

alter table public.wab_page_followers enable row level security;
