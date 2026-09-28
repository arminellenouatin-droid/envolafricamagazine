-- Migration: Add background_color column to wab_posts for text-only posts
alter table public.wab_posts
  add column if not exists background_color text;

comment on column public.wab_posts.background_color is 'Identifiant du préréglage de couleur d''arrière-plan (ex: noir, bleu-nuit, bordeaux) pour les publications de texte pur';
