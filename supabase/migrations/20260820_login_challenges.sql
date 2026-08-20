-- Challenge temporaire avant émission du cookie de session lorsque la 2FA est active.
create table if not exists public.login_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  challenge_hash text not null unique,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_login_challenges_user_time on public.login_challenges(user_id, created_at desc);
alter table public.login_challenges enable row level security;
revoke all on table public.login_challenges from anon, authenticated;
