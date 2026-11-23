-- ==============================================================================
-- Migration : Table agent_api_keys pour Envol Africa Magazine
-- Conforme aux RÈGLES DE SÉCURITÉ OBLIGATOIRES (AGENTS.md)
-- ==============================================================================

create table if not exists public.agent_api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] default array['all'],
  created_at timestamptz default now(),
  created_by text not null,
  last_used_at timestamptz,
  is_revoked boolean default false,
  revoked_at timestamptz,
  revoked_by text
);

-- Index sur le hash pour vérification rapide O(1)
create index if not exists idx_agent_api_keys_hash on public.agent_api_keys(key_hash);

-- Sécurité RLS stricte : table strictement réservée au serveur (Service Role)
-- Aucun accès direct autorisé depuis les clients anonymes ou authentifiés
alter table public.agent_api_keys enable row level security;
revoke all on public.agent_api_keys from anon, authenticated;
