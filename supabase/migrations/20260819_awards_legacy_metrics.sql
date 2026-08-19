-- Lot 4 Awards: preserve display-only legacy counters during the JSON -> Supabase transition.
-- Additive and reversible: no existing rows are changed or deleted.
alter table public.awards_competitions
  add column if not exists legacy_candidates_count integer,
  add column if not exists legacy_votes_count integer,
  add column if not exists legacy_pot_amount_cents integer,
  add column if not exists legacy_cover_image text;

alter table public.awards_candidates
  add column if not exists legacy_votes_count integer,
  add column if not exists legacy_gifts_count integer,
  add column if not exists legacy_donations_cents integer;
