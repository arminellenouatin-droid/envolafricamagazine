-- Prix par compétition Awards. Migration additive : aucune donnée existante n’est supprimée.
create table if not exists public.awards_prizes (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid not null references public.awards_competitions(id) on delete cascade,
  rank integer not null check (rank between 1 and 3),
  title text not null,
  amount_xof integer not null default 0 check (amount_xof >= 0),
  benefits text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (competition_id, rank)
);

create index if not exists awards_prizes_competition_active_idx
  on public.awards_prizes (competition_id, is_active, rank);

alter table public.awards_prizes enable row level security;

drop policy if exists "Public can read active awards prizes" on public.awards_prizes;
create policy "Public can read active awards prizes"
  on public.awards_prizes for select
  using (is_active = true);
