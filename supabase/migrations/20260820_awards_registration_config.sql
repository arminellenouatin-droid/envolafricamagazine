-- Configuration d'inscription par compétition, sans données nominées fictives.
create table if not exists public.awards_registration_configs (
  competition_id uuid primary key references public.awards_competitions(id) on delete cascade,
  form_mode text not null default 'simple' check (form_mode in ('simple','entrepreneurship')),
  registration_fee_xof integer not null default 0 check (registration_fee_xof >= 0),
  currency text not null default 'XOF',
  registrations_start_at timestamptz,
  registrations_end_at timestamptz,
  voting_start_at timestamptz,
  voting_end_at timestamptz,
  initial_prize_pool_xof integer not null default 0 check (initial_prize_pool_xof >= 0),
  min_pool_contribution_xof integer not null default 100 check (min_pool_contribution_xof >= 100),
  min_donation_xof integer not null default 100 check (min_donation_xof >= 100),
  updated_by uuid references public.awards_profiles(id),
  updated_at timestamptz not null default now(),
  constraint registration_window_valid check (registrations_end_at is null or registrations_start_at is null or registrations_end_at > registrations_start_at),
  constraint voting_window_valid check (voting_end_at is null or voting_start_at is null or voting_end_at > voting_start_at)
);

create table if not exists public.awards_registration_fields (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid not null references public.awards_competitions(id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null check (field_type in ('text','textarea','phone','number','url','date','select','file')),
  is_required boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (competition_id, field_key)
);

alter table public.awards_applications
  add column if not exists applicant_user_id uuid references public.awards_profiles(id),
  add column if not exists phone text,
  add column if not exists identity_data jsonb not null default '{}'::jsonb,
  add column if not exists business_data jsonb not null default '{}'::jsonb,
  add column if not exists custom_fields jsonb not null default '{}'::jsonb,
  add column if not exists payment_transaction_id uuid references public.awards_payment_transactions(id),
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_by uuid references public.awards_profiles(id),
  add column if not exists reviewed_at timestamptz;

alter table public.awards_registration_configs enable row level security;
alter table public.awards_registration_fields enable row level security;

create index if not exists awards_registration_fields_competition_idx on public.awards_registration_fields(competition_id, sort_order);

 drop policy if exists awards_registration_configs_public_read on public.awards_registration_configs;
create policy awards_registration_configs_public_read on public.awards_registration_configs for select using (true);

 drop policy if exists awards_registration_fields_public_read on public.awards_registration_fields;
create policy awards_registration_fields_public_read on public.awards_registration_fields for select using (true);
