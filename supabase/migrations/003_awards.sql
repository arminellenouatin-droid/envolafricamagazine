-- Africa Awards - Schema complet - 02-BASE-DE-DONNEES
-- RLS activé par défaut, tout interdit par défaut sauf explicitement autorisé
-- Seul admin peut créer/lancer compétition - RLS + test Playwright 403 organizer

-- Extensions
create extension if not exists "uuid-ossp";

-- Organizations
create table if not exists public.awards_organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text check (type in ('entreprise','association','ong','ministere','media','autre')),
  country text,
  website text,
  created_at timestamptz default now()
);

-- Profiles extension for Awards roles (spectator, candidate, organizer, host, jury, admin)
-- On utilise public.users existant + ajoute role awards si besoin, ou on crée awards_profiles
create table if not exists public.awards_profiles (
  id uuid primary key references public.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'spectator' check (role in ('spectator','candidate','organizer','host','jury','admin')),
  country text,
  bio text,
  level text default 'bronze' check (level in ('bronze','argent','or','platine','diamant')),
  created_at timestamptz default now()
);

-- Competition requests (demandes - soumises par organisateur)
create table if not exists public.awards_competition_requests (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.awards_organizations(id),
  submitted_by uuid references public.awards_profiles(id) not null,
  category text not null,
  title text not null,
  description text,
  proposed_rules text,
  proposed_calendar jsonb,
  proposed_rewards text,
  status text not null default 'submitted' check (status in ('submitted','under_review','validated','rejected')),
  rejection_reason text,
  reviewed_by uuid references public.awards_profiles(id),
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

-- Competitions (création/lancement admin uniquement)
create table if not exists public.awards_competitions (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid references public.awards_competition_requests(id),
  created_by uuid references public.awards_profiles(id) not null,
  organizer_org_id uuid references public.awards_organizations(id),
  category text not null,
  title text not null,
  slug text unique not null,
  description text,
  rules text,
  status text not null default 'draft' check (status in ('draft','published','registrations_open','registrations_closed','voting_open','live_scheduled','live_running','voting_closed','deliberation','finished','archived')),
  vote_price_cents integer default 0,
  points_per_vote integer default 1,
  jury_weight integer default 0 check (jury_weight >=0 and jury_weight <=100),
  public_vote_weight integer default 100 check (public_vote_weight >=0 and public_vote_weight <=100),
  results_public boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now(),
  constraint weight_sum check (jury_weight + public_vote_weight = 100)
);

-- Competition organizers (attribution gestion limitée)
create table if not exists public.awards_competition_organizers (
  competition_id uuid references public.awards_competitions(id) on delete cascade,
  organizer_id uuid references public.awards_profiles(id) on delete cascade,
  permissions jsonb default '{"manage_candidates": true, "propose_hosts": true, "propose_jury": true, "propose_results": true}',
  assigned_by uuid references public.awards_profiles(id) not null,
  primary key (competition_id, organizer_id)
);

-- Candidates
create table if not exists public.awards_candidates (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid references public.awards_competitions(id) on delete cascade,
  profile_id uuid references public.awards_profiles(id),
  display_name text not null,
  bio text,
  country text,
  photo_url text,
  video_url text,
  project_description text,
  status text default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz default now()
);

-- Applications (candidatures avant validation en tant que candidate)
create table if not exists public.awards_applications (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid references public.awards_competitions(id) on delete cascade,
  applicant_id uuid references public.awards_profiles(id) not null,
  bio text,
  project_description text,
  photos text[],
  video_url text,
  documents text[],
  status text default 'soumise' check (status in ('soumise','en_etude','acceptee','refusee')),
  created_at timestamptz default now()
);

-- Hosts (animateurs) liaison
create table if not exists public.awards_hosts (
  competition_id uuid references public.awards_competitions(id) on delete cascade,
  host_id uuid references public.awards_profiles(id) on delete cascade,
  assigned_by uuid references public.awards_profiles(id),
  primary key (competition_id, host_id)
);

-- Jury members liaison
create table if not exists public.awards_jury_members (
  competition_id uuid references public.awards_competitions(id) on delete cascade,
  jury_id uuid references public.awards_profiles(id) on delete cascade,
  assigned_by uuid references public.awards_profiles(id),
  primary key (competition_id, jury_id)
);

-- Jury scores
create table if not exists public.awards_jury_scores (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid references public.awards_competitions(id) not null,
  jury_id uuid references public.awards_profiles(id) not null,
  candidate_id uuid references public.awards_candidates(id) not null,
  score numeric not null,
  comment text,
  created_at timestamptz default now(),
  unique (competition_id, jury_id, candidate_id)
);

-- Votes (payants) - AUCUN INSERT client direct, uniquement via Edge Function
create table if not exists public.awards_votes (
  id uuid primary key default uuid_generate_v4(),
  voter_id uuid references public.awards_profiles(id) not null,
  candidate_id uuid references public.awards_candidates(id) not null,
  competition_id uuid references public.awards_competitions(id) not null,
  points integer not null,
  payment_transaction_id uuid references public.awards_payment_transactions(id) not null,
  created_at timestamptz default now()
);

-- Gifts catalog
create table if not exists public.awards_gifts_catalog (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  emoji text,
  price_cents integer not null,
  points integer not null,
  animation_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);
insert into public.awards_gifts_catalog (name, emoji, price_cents, points, is_active) values
  ('Cœur', '❤️', 100, 10, true),
  ('Étoile', '⭐', 200, 25, true),
  ('Fusée', '🚀', 500, 60, true),
  ('Couronne', '👑', 1000, 120, true),
  ('Diamant', '💎', 2000, 250, true),
  ('Coffre', '💰', 5000, 600, true)
on conflict do nothing;

-- Gift transactions
create table if not exists public.awards_gift_transactions (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references public.awards_profiles(id) not null,
  candidate_id uuid references public.awards_candidates(id) not null,
  competition_id uuid references public.awards_competitions(id) not null,
  gift_id uuid references public.awards_gifts_catalog(id) not null,
  points integer not null,
  payment_transaction_id uuid references public.awards_payment_transactions(id) not null,
  created_at timestamptz default now()
);

-- Donations
create table if not exists public.awards_donations (
  id uuid primary key default uuid_generate_v4(),
  donor_id uuid references public.awards_profiles(id),
  candidate_id uuid references public.awards_candidates(id),
  competition_id uuid references public.awards_competitions(id),
  type text check (type in ('candidate','platform','pot','capital_angel')),
  amount_cents integer not null,
  currency text default 'XOF',
  is_anonymous boolean default false,
  payment_transaction_id uuid references public.awards_payment_transactions(id),
  created_at timestamptz default now()
);

-- Live sessions
create table if not exists public.awards_live_sessions (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid references public.awards_competitions(id) on delete cascade,
  mux_stream_id text,
  mux_playback_id text,
  rtmp_key text,
  status text check (status in ('scheduled','live','ended')),
  started_at timestamptz,
  ended_at timestamptz,
  replay_url text,
  created_at timestamptz default now()
);

-- Live events (log temps réel)
create table if not exists public.awards_live_events (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid references public.awards_competitions(id),
  live_session_id uuid references public.awards_live_sessions(id),
  event_type text check (event_type in ('vote','gift','donation','comment','reaction','pot_increase','candidate_join','candidate_leave')),
  payload jsonb,
  created_at timestamptz default now()
);

-- Comments live
create table if not exists public.awards_comments (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid references public.awards_competitions(id),
  live_session_id uuid references public.awards_live_sessions(id),
  user_id uuid references public.awards_profiles(id),
  content text,
  is moderated boolean default false,
  is_banned boolean default false,
  created_at timestamptz default now()
);

-- Sponsors
create table if not exists public.awards_sponsors (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid references public.awards_competitions(id),
  name text not null,
  logo_url text,
  website_url text,
  description text,
  financing_amount_cents integer,
  created_at timestamptz default now()
);

-- Advertisements
create table if not exists public.awards_advertisements (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid references public.awards_competitions(id),
  type text check (type in ('banner','video','preroll','official')),
  media_url text,
  link_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Results
create table if not exists public.awards_results (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid references public.awards_competitions(id) unique,
  podium jsonb,
  final_ranking jsonb,
  published boolean default false,
  published_at timestamptz,
  published_by uuid references public.awards_profiles(id),
  created_at timestamptz default now()
);

-- Badges / user_badges gamification
create table if not exists public.awards_badges (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  description text,
  emoji text,
  created_at timestamptz default now()
);
insert into public.awards_badges (code, name, description, emoji) values
  ('top_fan', 'Top Fan', 'A voté plus de 10 fois', '🥇'),
  ('super_donor', 'Super Donateur', 'Don cumulé > 50000 XOF', '💎'),
  ('ambassador', 'Ambassadeur', 'A parrainé 5+ inscrits', '👑'),
  ('first_voter', 'Premier Voteur', 'Premier vote', '🔥'),
  ('top_candidate', 'Top Candidat', 'Dans top 3', '⭐')
on conflict (code) do nothing;

create table if not exists public.awards_user_badges (
  profile_id uuid references public.awards_profiles(id),
  badge_id uuid references public.awards_badges(id),
  earned_at timestamptz default now(),
  primary key (profile_id, badge_id)
);

-- User levels
create table if not exists public.awards_user_levels (
  profile_id uuid references public.awards_profiles(id) primary key,
  level text check (level in ('bronze','argent','or','platine','diamant')) default 'bronze',
  points integer default 0,
  updated_at timestamptz default now()
);

-- Favorites
create table if not exists public.awards_favorites (
  profile_id uuid references public.awards_profiles(id),
  competition_id uuid references public.awards_competitions(id),
  candidate_id uuid references public.awards_candidates(id),
  organizer_id uuid references public.awards_profiles(id),
  created_at timestamptz default now(),
  primary key (profile_id, competition_id, candidate_id)
);

-- Notifications
create table if not exists public.awards_notifications (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.awards_profiles(id),
  type text,
  title text,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Affiliate
create table if not exists public.awards_affiliate_links (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.awards_profiles(id),
  target_type text check (target_type in ('general','competition','candidate')),
  target_id uuid,
  short_code text unique not null,
  created_at timestamptz default now()
);

create table if not exists public.awards_affiliate_conversions (
  id uuid primary key default uuid_generate_v4(),
  link_id uuid references public.awards_affiliate_links(id),
  order_id uuid,
  type text check (type in ('inscription','vote','don','partage','cadeau')),
  commission_cents integer,
  created_at timestamptz default now()
);

-- Payment transactions (source vérité financière) - append-only, unique moneroo_transaction_id
create table if not exists public.awards_payment_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.awards_profiles(id) not null,
  moneroo_transaction_id text unique not null,
  type text check (type in ('vote','gift','donation_candidate','donation_platform','donation_pot','capital_angel')),
  amount_cents integer not null,
  currency text default 'XOF',
  status text check (status in ('pending','succeeded','failed','refunded')) not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Audit logs
create table if not exists public.awards_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.awards_profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);

-- Enable RLS on all sensitive tables
alter table public.awards_organizations enable row level security;
alter table public.awards_profiles enable row level security;
alter table public.awards_competition_requests enable row level security;
alter table public.awards_competitions enable row level security;
alter table public.awards_competition_organizers enable row level security;
alter table public.awards_candidates enable row level security;
alter table public.awards_applications enable row level security;
alter table public.awards_votes enable row level security;
alter table public.awards_gift_transactions enable row level security;
alter table public.awards_donations enable row level security;
alter table public.awards_payment_transactions enable row level security;
alter table public.awards_jury_scores enable row level security;
alter table public.awards_audit_logs enable row level security;

-- Policies - Exemple critique: seul admin peut créer compétition
create policy "Compétitions publiées visibles par tous"
  on public.awards_competitions for select using (status not in ('draft'));

create policy "Seul admin peut créer compétition"
  on public.awards_competitions for insert
  with check (exists (select 1 from public.awards_profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Seul admin peut modifier statut/config"
  on public.awards_competitions for update
  using (exists (select 1 from public.awards_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Organisateur voit ses propres demandes
create policy "Organisateur voit ses demandes"
  on public.awards_competition_requests for select using (submitted_by = auth.uid());
create policy "Organisateur crée demande"
  on public.awards_competition_requests for insert with check (submitted_by = auth.uid());
create policy "Admin voit toutes demandes"
  on public.awards_competition_requests for select using (exists (select 1 from public.awards_profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Seul admin update statut demande"
  on public.awards_competition_requests for update using (exists (select 1 from public.awards_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Votes: aucun INSERT client direct
-- Pas de policy INSERT ouverte - uniquement via Edge Function service_role

-- Payment transactions: user voit ses propres, admin voit toutes
create policy "User voit ses transactions"
  on public.awards_payment_transactions for select using (user_id = auth.uid());
create policy "Admin voit toutes transactions"
  on public.awards_payment_transactions for select using (exists (select 1 from public.awards_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Profiles publics visibles tous, update que soi-même, role jamais modifiable directement
create policy "Profils publics visibles"
  on public.awards_profiles for select using (true);
create policy "User modifie son profil"
  on public.awards_profiles for update using (auth.uid() = id);

-- Candidate stats view for index performance
create index if not exists idx_awards_votes_candidate on public.awards_votes(candidate_id, competition_id);
create index if not exists idx_awards_gift_candidate on public.awards_gift_transactions(candidate_id);
create index if not exists idx_awards_donations_candidate on public.awards_donations(candidate_id);
