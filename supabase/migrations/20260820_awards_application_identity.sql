alter table public.awards_applications
  add column if not exists display_name text;

create index if not exists awards_applications_competition_status_idx
  on public.awards_applications(competition_id, status);
