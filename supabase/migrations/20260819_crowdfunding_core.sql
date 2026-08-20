-- Crowdfunding core persistence. Additive migration: no JSON data is deleted.
create table if not exists public.crowdfunding_projects (
  id uuid primary key,
  nom text not null,
  secteur text not null,
  description text not null default '',
  videos text[] not null default '{}',
  images text[] not null default '{}',
  pdf text,
  montant_recherche numeric not null default 0,
  montant_collecte numeric not null default 0,
  niveau_risque text not null default 'moyen',
  duree_jours integer not null default 30,
  types_financement text[] not null default '{}',
  statut text not null default 'en_attente_validation',
  porteur_id text not null,
  pays text not null,
  taux_interet numeric,
  pourcentage_vendu numeric,
  valorisation numeric,
  created_at timestamptz not null default now(),
  date_fin timestamptz,
  vues integer not null default 0,
  investisseurs integer not null default 0,
  repartition jsonb not null default '{"dons":0,"prise_part":0,"pret":0}'::jsonb
);

create table if not exists public.crowdfunding_contributions (
  id uuid primary key,
  projet_id uuid not null references public.crowdfunding_projects(id) on delete cascade,
  investisseur_id text not null,
  type text not null,
  montant numeric not null,
  pourcentage numeric,
  taux_interet numeric,
  calendrier_remboursement jsonb,
  contrat_pdf text,
  created_at timestamptz not null default now()
);

create table if not exists public.crowdfunding_documents (
  id uuid primary key,
  projet_id uuid not null references public.crowdfunding_projects(id) on delete cascade,
  user_id text not null,
  type text not null,
  nom text not null,
  url text not null,
  taille bigint not null default 0,
  mime_type text not null,
  created_at timestamptz not null default now(),
  statut text not null default 'en_attente_verification'
);

create table if not exists public.crowdfunding_messages (
  id uuid primary key,
  projet_id uuid not null references public.crowdfunding_projects(id) on delete cascade,
  from_id text not null,
  from_nom text not null default '',
  to_id text not null,
  to_nom text not null default '',
  content text not null,
  created_at timestamptz not null default now(),
  lu boolean not null default false
);

create table if not exists public.crowdfunding_repayments (
  id uuid primary key,
  contribution_id uuid not null references public.crowdfunding_contributions(id) on delete cascade,
  projet_id uuid not null references public.crowdfunding_projects(id) on delete cascade,
  investisseur_id text not null,
  porteur_id text not null,
  date_prevue date not null,
  date_payee date,
  capital numeric not null default 0,
  interet numeric not null default 0,
  total numeric not null default 0,
  statut text not null default 'prevu',
  retard_jours integer not null default 0,
  montant_retard numeric,
  email_envoye boolean not null default false
);

create table if not exists public.crowdfunding_payment_transactions (
  id uuid primary key,
  provider_ref text unique not null,
  user_id text not null,
  project_id uuid references public.crowdfunding_projects(id) on delete set null,
  contribution_id uuid references public.crowdfunding_contributions(id) on delete set null,
  amount numeric not null default 0,
  currency text not null default 'XOF',
  status text not null default 'pending',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_crowdfunding_contributions_project on public.crowdfunding_contributions(projet_id, created_at desc);
create index if not exists idx_crowdfunding_documents_project on public.crowdfunding_documents(projet_id, created_at desc);
create index if not exists idx_crowdfunding_messages_project on public.crowdfunding_messages(projet_id, created_at desc);
create index if not exists idx_crowdfunding_repayments_project on public.crowdfunding_repayments(projet_id, date_prevue);

alter table public.crowdfunding_projects enable row level security;
alter table public.crowdfunding_contributions enable row level security;
alter table public.crowdfunding_documents enable row level security;
alter table public.crowdfunding_messages enable row level security;
alter table public.crowdfunding_repayments enable row level security;
alter table public.crowdfunding_payment_transactions enable row level security;
