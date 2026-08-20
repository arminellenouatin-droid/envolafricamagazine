alter table public.awards_candidates
  add column if not exists application_id uuid references public.awards_applications(id) on delete set null;

create unique index if not exists awards_candidates_application_unique
  on public.awards_candidates(application_id)
  where application_id is not null;
