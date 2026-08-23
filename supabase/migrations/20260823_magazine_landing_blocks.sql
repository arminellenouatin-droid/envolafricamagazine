-- Configuration éditoriale du Landing Magazine.
-- Les articles, formations, offres Jobs et publications WAB restent les sources métier;
-- cette table ne stocke que le placement, la visibilité et les règles de sourcing.

alter table if exists public.landing_blocks
  add column if not exists block_type text not null default 'article_list',
  add column if not exists source_type text not null default 'manual',
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists item_limit integer not null default 6,
  add column if not exists config jsonb not null default '{}'::jsonb,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.landing_blocks
  drop constraint if exists landing_blocks_block_type_check;
alter table public.landing_blocks
  add constraint landing_blocks_block_type_check check (block_type in (
    'hero', 'secondary_feature', 'article_list', 'manager', 'most_read',
    'formations', 'opportunities', 'videos', 'next_issue', 'ecosystem',
    'startups', 'recruitment', 'sponsored'
  ));

alter table public.landing_blocks
  drop constraint if exists landing_blocks_source_type_check;
alter table public.landing_blocks
  add constraint landing_blocks_source_type_check check (source_type in (
    'manual', 'articles', 'article_tag', 'article_category', 'formations',
    'jobs_boosted', 'wab_boosted', 'video_library', 'ecosystem_links', 'sponsored_library'
  ));

alter table public.landing_blocks
  drop constraint if exists landing_blocks_item_limit_check;
alter table public.landing_blocks
  add constraint landing_blocks_item_limit_check check (item_limit between 1 and 24);

create index if not exists idx_landing_blocks_active_order
  on public.landing_blocks(is_active, "order");

insert into public.landing_blocks (block_key, block_type, source_type, title, item_limit, config, "order") values
  ('magazine_fil', 'article_list', 'articles', 'Fil d’infos', 6, '{"selection":"featured"}'::jsonb, 1),
  ('manager_du_mois', 'manager', 'manual', 'Manager du mois', 1, '{"article_id":null,"image_url":null}'::jsonb, 2),
  ('formations_certifiees', 'formations', 'formations', 'Formations certifiées Envol Africa', 6, '{"only_certified":true}'::jsonb, 3),
  ('opportunites', 'opportunities', 'manual', 'Opportunités, emplois et concours', 6, '{"tabs":["financement","emploi","opportunites"]}'::jsonb, 4),
  ('videos', 'videos', 'video_library', 'Vidéos', 6, '{}'::jsonb, 5),
  ('prochain_numero', 'next_issue', 'article_tag', 'Dans notre prochain numéro', 6, '{"tag":"dans le prochain numéro"}'::jsonb, 6),
  ('ecosysteme', 'ecosystem', 'ecosystem_links', 'Tout l’écosystème Envol Africa', 6, '{}'::jsonb, 7),
  ('startups', 'startups', 'article_category', 'Start’ups', 6, '{"category":"Start-up"}'::jsonb, 8),
  ('recrutement', 'recruitment', 'jobs_boosted', 'Recrutements', 6, '{"only_active":true}'::jsonb, 9),
  ('contenus_sponsorises', 'sponsored', 'sponsored_library', 'Contenus sponsorisés', 6, '{}'::jsonb, 10)
on conflict (block_key) do update set
  block_type = excluded.block_type,
  source_type = excluded.source_type,
  title = coalesce(public.landing_blocks.title, excluded.title),
  item_limit = greatest(1, least(public.landing_blocks.item_limit, 24)),
  updated_at = now();

alter table public.landing_blocks enable row level security;
revoke all on table public.landing_blocks from anon, authenticated;
grant select on table public.landing_blocks to anon, authenticated;
drop policy if exists landing_blocks_public_read on public.landing_blocks;
create policy landing_blocks_public_read on public.landing_blocks
  for select to anon, authenticated using (is_active = true);
