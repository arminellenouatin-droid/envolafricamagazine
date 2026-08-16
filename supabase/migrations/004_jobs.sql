-- Envol Africa Jobs — tables isolées du Magazine, Kiosque, Awards, Marketplace et Crowdfunding.
-- À appliquer dans le projet Supabase rtfjwpytiuvoekomevpu après les migrations existantes.
-- Toutes les écritures applicatives passent par les API serveur Next.js avec la service role key.

create extension if not exists "uuid-ossp";

create table if not exists public.jobs_offers (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references public.users(id) on delete set null,
  title text not null check (char_length(title) between 3 and 180),
  description text not null check (char_length(description) between 30 and 12000),
  company_name text not null,
  company_logo_url text,
  contact_email text not null,
  contact_phone text,
  address text,
  country_code char(2) not null,
  country_name text not null,
  city text not null,
  region text,
  sector text not null,
  contract_type text not null check (contract_type in ('CDI','CDD','Stage','Freelance','Remote')),
  salary_text text,
  skills text[] not null default '{}',
  status text not null default 'published' check (status in ('draft','pending_review','published','closed','rejected','archived')),
  published_at timestamptz default now(),
  expires_at timestamptz not null,
  views_count integer not null default 0 check (views_count >= 0),
  applications_count integer not null default 0 check (applications_count >= 0),
  is_boosted boolean not null default false,
  boost_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs_candidates (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid unique references public.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  photo_url text,
  cv_path text,
  contact_email text not null,
  contact_phone text,
  description text not null check (char_length(description) between 30 and 8000),
  skills text[] not null default '{}',
  desired_role text not null,
  country_code char(2) not null,
  country_name text not null,
  city text not null,
  availability text not null,
  status text not null default 'published' check (status in ('draft','pending_review','published','hidden','archived')),
  is_boosted boolean not null default false,
  boost_ends_at timestamptz,
  views_count integer not null default 0 check (views_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  audience text not null check (audience in ('candidate','employer')),
  plan_code text not null check (plan_code in ('candidate_24h','candidate_week','candidate_month','employer_post','employer_week','employer_month')),
  amount_xof integer not null check (amount_xof > 0),
  provider text not null default 'moneroo',
  provider_payment_id text unique,
  status text not null default 'pending' check (status in ('pending','active','cancelled','expired','failed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs_unlocks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  offer_id uuid not null references public.jobs_offers(id) on delete cascade,
  amount_xof integer not null default 200 check (amount_xof = 200),
  provider text not null default 'moneroo',
  provider_payment_id text unique,
  status text not null default 'pending' check (status in ('pending','paid','cancelled','failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique(user_id, offer_id)
);

create table if not exists public.jobs_applications (
  id uuid primary key default uuid_generate_v4(),
  offer_id uuid not null references public.jobs_offers(id) on delete cascade,
  candidate_id uuid not null references public.jobs_candidates(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  message text check (char_length(message) <= 2000),
  status text not null default 'sent' check (status in ('sent','seen','shortlisted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(offer_id, user_id)
);

create table if not exists public.jobs_boosts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_type text not null check (target_type in ('offer','candidate')),
  target_id uuid not null,
  duration_days integer not null check (duration_days between 1 and 90),
  amount_xof integer not null check (amount_xof > 0),
  provider text not null default 'moneroo',
  provider_payment_id text unique,
  status text not null default 'pending' check (status in ('pending','active','cancelled','expired','failed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs_notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  event_type text not null check (event_type in ('offer_view','candidate_view','search','offer_unlock','application','boost','subscription')),
  target_type text,
  target_id uuid,
  query text,
  country_code char(2),
  city text,
  created_at timestamptz not null default now()
);

create index if not exists idx_jobs_offers_listing on public.jobs_offers (status, is_boosted desc, published_at desc);
create index if not exists idx_jobs_offers_location on public.jobs_offers (country_code, city, status);
create index if not exists idx_jobs_candidates_listing on public.jobs_candidates (status, is_boosted desc, created_at desc);
create index if not exists idx_jobs_candidates_location on public.jobs_candidates (country_code, city, status);
create index if not exists idx_jobs_applications_offer on public.jobs_applications (offer_id, created_at desc);
create index if not exists idx_jobs_notifications_user on public.jobs_notifications (user_id, read_at, created_at desc);
create index if not exists idx_jobs_events_target on public.jobs_events (target_type, target_id, created_at desc);

create or replace function public.jobs_set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists jobs_offers_updated_at on public.jobs_offers;
create trigger jobs_offers_updated_at before update on public.jobs_offers for each row execute function public.jobs_set_updated_at();
drop trigger if exists jobs_candidates_updated_at on public.jobs_candidates;
create trigger jobs_candidates_updated_at before update on public.jobs_candidates for each row execute function public.jobs_set_updated_at();
drop trigger if exists jobs_subscriptions_updated_at on public.jobs_subscriptions;
create trigger jobs_subscriptions_updated_at before update on public.jobs_subscriptions for each row execute function public.jobs_set_updated_at();
drop trigger if exists jobs_applications_updated_at on public.jobs_applications;
create trigger jobs_applications_updated_at before update on public.jobs_applications for each row execute function public.jobs_set_updated_at();
drop trigger if exists jobs_boosts_updated_at on public.jobs_boosts;
create trigger jobs_boosts_updated_at before update on public.jobs_boosts for each row execute function public.jobs_set_updated_at();

-- RLS: public data is deliberately exposed only through filtered Next.js API routes.
-- service_role bypasses RLS; anonymous/public direct access is denied.
alter table public.jobs_offers enable row level security;
alter table public.jobs_candidates enable row level security;
alter table public.jobs_subscriptions enable row level security;
alter table public.jobs_unlocks enable row level security;
alter table public.jobs_applications enable row level security;
alter table public.jobs_boosts enable row level security;
alter table public.jobs_notifications enable row level security;
alter table public.jobs_events enable row level security;

-- Private CV bucket. Do not make this bucket public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jobs-cvs', 'jobs-cvs', false, 10485760, array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

-- Only the server service role writes/reads private CVs. No anon/authenticated Storage policies are added.
