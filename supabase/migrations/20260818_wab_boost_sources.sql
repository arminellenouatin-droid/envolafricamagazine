-- Relie chaque republication WAB à son annonce ou projet d’origine.
alter table public.wab_posts
  add column if not exists source_type text,
  add column if not exists source_id uuid,
  add column if not exists source_url text,
  add column if not exists source_title text;

alter table public.wab_posts
  drop constraint if exists wab_posts_source_type_check;

alter table public.wab_posts
  add constraint wab_posts_source_type_check
  check (source_type is null or source_type in ('jobs_offer','jobs_candidate','crowdfunding_project','marketplace_product'));

create unique index if not exists uq_wab_posts_boost_source
  on public.wab_posts (source_type, source_id)
  where source_type is not null and source_id is not null;

create index if not exists idx_wab_posts_source
  on public.wab_posts (source_type, source_id);
