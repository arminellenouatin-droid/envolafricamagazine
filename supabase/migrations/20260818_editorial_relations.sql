create table if not exists public.editorial_authors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  photo_url text,
  bio text,
  role_label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.articles add column if not exists author_profile_id uuid references public.editorial_authors(id) on delete set null;
alter table public.articles add column if not exists category_id uuid references public.categories(id) on delete set null;

create index if not exists idx_editorial_authors_active on public.editorial_authors(is_active, name);
create index if not exists idx_articles_author_profile on public.articles(author_profile_id);
create index if not exists idx_articles_category_id on public.articles(category_id);

alter table public.editorial_authors enable row level security;
do $$ begin
  create policy "Public can read active editorial authors" on public.editorial_authors for select using (is_active = true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Service role manages editorial authors" on public.editorial_authors for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

-- Keep the new relation usable for existing content where only plain text existed.
insert into public.editorial_authors (name, slug, bio, role_label)
select distinct trim(author), lower(regexp_replace(trim(author), '[^a-zA-Z0-9]+', '-', 'g')), null, 'Rédacteur'
from public.articles
where coalesce(trim(author), '') <> ''
on conflict (slug) do nothing;

update public.articles a
set author_profile_id = ea.id
from public.editorial_authors ea
where a.author_profile_id is null and lower(trim(a.author)) = lower(trim(ea.name));

update public.articles a
set category_id = c.id
from public.categories c
where a.category_id is null and lower(trim(a.category)) = lower(trim(c.label));
