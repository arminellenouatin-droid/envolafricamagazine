-- Les articles publiés du magazine peuvent être relayés dans WAB avec leur lien canonique.
alter table public.wab_posts
  drop constraint if exists wab_posts_source_type_check;

alter table public.wab_posts
  add constraint wab_posts_source_type_check
  check (source_type is null or source_type in ('jobs_offer','jobs_candidate','crowdfunding_project','marketplace_product','magazine_issue','magazine_article'));

create unique index if not exists uq_wab_posts_article_source
  on public.wab_posts (source_type, source_id)
  where source_type = 'magazine_article' and source_id is not null;
