alter table public.wab_posts
  add column if not exists shares_count integer not null default 0;

alter table public.wab_posts
  drop constraint if exists wab_posts_shares_count_check;

alter table public.wab_posts
  add constraint wab_posts_shares_count_check check (shares_count >= 0);
