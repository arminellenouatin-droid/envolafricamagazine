create table if not exists public.crowdfunding_boosts (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  amount_xof integer not null check (amount_xof > 0),
  duration_days integer not null check (duration_days between 1 and 90),
  provider text not null default 'moneroo',
  provider_payment_id text unique,
  status text not null default 'pending' check (status in ('pending','active','ended','cancelled','failed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_crowdfunding_boosts_payment on public.crowdfunding_boosts(provider_payment_id);
create index if not exists idx_crowdfunding_boosts_status on public.crowdfunding_boosts(status, ends_at desc);
