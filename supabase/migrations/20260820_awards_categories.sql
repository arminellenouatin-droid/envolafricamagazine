-- Catégories Africa Awards et lien normalisé vers les compétitions.
-- Les compétitions existantes sont conservées ; leur statut peut être archivé séparément.
create table if not exists public.awards_categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references public.awards_profiles(id),
  created_at timestamptz not null default now()
);

alter table public.awards_competitions
  add column if not exists category_id uuid references public.awards_categories(id);

create index if not exists awards_competitions_category_id_idx
  on public.awards_competitions(category_id);

alter table public.awards_categories enable row level security;

drop policy if exists awards_categories_public_read on public.awards_categories;
create policy awards_categories_public_read
  on public.awards_categories for select
  using (is_active = true);
