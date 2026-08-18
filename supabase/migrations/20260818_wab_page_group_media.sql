alter table public.wab_pages add column if not exists avatar_url text;
alter table public.wab_pages add column if not exists cover_url text;
alter table public.wab_groups add column if not exists avatar_url text;
alter table public.wab_groups add column if not exists cover_url text;
