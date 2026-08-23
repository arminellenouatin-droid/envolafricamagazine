-- Participation persistante aux lives Awards. Migration additive.
create table if not exists public.awards_live_participants (
  id uuid primary key default uuid_generate_v4(),
  live_session_id uuid not null references public.awards_live_sessions(id) on delete cascade,
  competition_id uuid not null references public.awards_competitions(id) on delete cascade,
  candidate_id uuid references public.awards_candidates(id) on delete set null,
  user_id uuid not null references public.awards_profiles(id) on delete cascade,
  role text not null default 'candidate' check (role in ('candidate','host','viewer')),
  state text not null default 'waiting' check (state in ('waiting','on_stage','left','removed')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (live_session_id, user_id)
);

create index if not exists awards_live_participants_session_idx
  on public.awards_live_participants (live_session_id, state, updated_at desc);

alter table public.awards_live_participants enable row level security;

drop policy if exists "Public can read live participants" on public.awards_live_participants;
create policy "Public can read live participants"
  on public.awards_live_participants for select
  using (true);
