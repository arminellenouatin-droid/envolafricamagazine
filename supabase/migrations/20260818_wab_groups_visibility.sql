create table if not exists public.wab_groups (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  privacy text not null default 'community' check (privacy in ('community','private')),
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wab_group_members (
  group_id uuid not null references public.wab_groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','moderator','member')),
  status text not null default 'active' check (status in ('active','pending','blocked')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.wab_posts add column if not exists group_id uuid references public.wab_groups(id) on delete set null;
alter table public.wab_posts add column if not exists visibility text not null default 'community';
alter table public.wab_posts add column if not exists audience jsonb not null default '{}'::jsonb;
alter table public.wab_posts drop constraint if exists wab_posts_visibility_check;
alter table public.wab_posts add constraint wab_posts_visibility_check check (visibility in ('public','community','group'));

alter table public.wab_stories add column if not exists visibility text not null default 'community';

create index if not exists idx_wab_groups_owner on public.wab_groups(owner_user_id, status, created_at desc);
create unique index if not exists uq_wab_groups_owner_name on public.wab_groups(owner_user_id, lower(name));
create index if not exists idx_wab_group_members_user on public.wab_group_members(user_id, status);
create index if not exists idx_wab_posts_group on public.wab_posts(group_id, created_at desc);
create index if not exists idx_wab_posts_visibility on public.wab_posts(visibility, created_at desc);

alter table public.wab_groups enable row level security;
alter table public.wab_group_members enable row level security;
alter table public.wab_posts enable row level security;
alter table public.wab_stories enable row level security;

do $$ begin
  create policy "Public can read active WAB groups" on public.wab_groups for select using (status = 'active');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role manages WAB groups" on public.wab_groups for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role manages WAB group members" on public.wab_group_members for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

update public.wab_posts set visibility = 'public' where visibility is null;
