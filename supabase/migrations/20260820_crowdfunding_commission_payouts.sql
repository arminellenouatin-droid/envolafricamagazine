-- Commission configurable by funding type and deducted only at payout.
create table if not exists public.crowdfunding_commission_rates (
  id uuid primary key default uuid_generate_v4(),
  funding_type text unique not null,
  rate_percent numeric not null default 4 check (rate_percent >= 0 and rate_percent <= 100),
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.crowdfunding_commission_rates (funding_type, rate_percent)
values ('angel',4),('reward',4),('equity',4),('lending',4),('don',4),('prise_part',4),('pret',4)
on conflict (funding_type) do nothing;

create table if not exists public.crowdfunding_payout_requests (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.crowdfunding_projects(id) on delete cascade,
  porteur_id text not null,
  gross_amount numeric not null check (gross_amount >= 0),
  commission_rate numeric not null check (commission_rate >= 0 and commission_rate <= 100),
  commission_amount numeric not null check (commission_amount >= 0),
  net_amount numeric not null check (net_amount >= 0),
  currency text not null default 'XOF',
  status text not null default 'requested' check (status in ('requested','approved','paid','rejected','cancelled')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  paid_at timestamptz,
  note text not null default ''
);

create unique index if not exists crowdfunding_one_open_payout_per_project
on public.crowdfunding_payout_requests(project_id)
where status in ('requested','approved');

alter table public.crowdfunding_commission_rates enable row level security;
alter table public.crowdfunding_payout_requests enable row level security;
create policy crowdfunding_commission_rates_deny_direct_client on public.crowdfunding_commission_rates for all to anon, authenticated using (public.crowdfunding_deny_all()) with check (public.crowdfunding_deny_all());
create policy crowdfunding_payout_requests_deny_direct_client on public.crowdfunding_payout_requests for all to anon, authenticated using (public.crowdfunding_deny_all()) with check (public.crowdfunding_deny_all());
