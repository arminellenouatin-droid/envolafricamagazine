-- Les nouveaux numéros du Kiosque deviennent des publications WAB liées à leur fiche produit.
alter table public.wab_posts
  drop constraint if exists wab_posts_source_type_check;

alter table public.wab_posts
  add constraint wab_posts_source_type_check
  check (source_type is null or source_type in ('jobs_offer','jobs_candidate','crowdfunding_project','marketplace_product','magazine_issue'));

create unique index if not exists uq_wab_posts_magazine_source
  on public.wab_posts (source_type, source_id)
  where source_type = 'magazine_issue' and source_id is not null;
