create table if not exists public.wab_pages (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_url text,
  description text,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wab_posts add column if not exists page_id uuid references public.wab_pages(id) on delete set null;
create index if not exists idx_wab_pages_owner on public.wab_pages(owner_user_id, status, created_at desc);
create index if not exists idx_wab_posts_page on public.wab_posts(page_id, created_at desc);
create unique index if not exists uq_wab_pages_owner_name on public.wab_pages(owner_user_id, lower(name));

alter table public.wab_pages enable row level security;
alter table public.wab_posts enable row level security;

do $$ begin
  create policy "Public can read active WAB pages" on public.wab_pages for select using (status = 'active');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role manages WAB pages" on public.wab_pages for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role manages WAB posts" on public.wab_posts for all using (true) with check (true);
exception when duplicate_object then null;
end $$;
