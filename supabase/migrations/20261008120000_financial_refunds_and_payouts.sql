-- ============================================================================
-- MIGRATION: Table financial_refunds et politiques RLS strictes
-- Phase 5 & 17 : Remboursements, Payouts et Sécurité RLS
-- ============================================================================

create table if not exists public.financial_refunds (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  original_payment_id text not null,
  order_id text,
  user_id text not null,
  amount numeric(15, 2) not null check (amount > 0),
  original_amount numeric(15, 2) not null check (original_amount >= amount),
  currency text not null default 'XOF',
  mode text not null check (mode in ('INTERNAL_WALLET', 'EXTERNAL_PAYOUT', 'MANUAL_OPERATOR')),
  status text not null default 'REQUESTED' check (status in ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'INITIALIZED', 'PENDING', 'PAID', 'REJECTED', 'FAILED')),
  reason text not null,
  requested_by text not null,
  approved_by text,
  rejected_by text,
  rejection_reason text,
  provider_payout_id text unique,
  destination_details jsonb default '{}'::jsonb,
  idempotency_key text unique,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Index de performance et de contrainte
create index if not exists idx_financial_refunds_original_payment on public.financial_refunds(original_payment_id);
create index if not exists idx_financial_refunds_user on public.financial_refunds(user_id);
create index if not exists idx_financial_refunds_payout on public.financial_refunds(provider_payout_id);
create index if not exists idx_financial_refunds_idempotency on public.financial_refunds(idempotency_key);

-- Activation stricte de la sécurité Row Level Security (RLS)
alter table public.financial_refunds enable row level security;

-- Révocation de tous les droits par défaut aux rôles client
revoke all on public.financial_refunds from anon, authenticated;

-- Politique de lecture : l'utilisateur authentifié peut uniquement consulter ses propres remboursements
create policy "users_select_own_refunds"
  on public.financial_refunds
  for select
  to authenticated
  using ((select auth.uid())::text = user_id);

-- Seul le service role serveur peut insérer ou modifier les remboursements
grant select on public.financial_refunds to authenticated;
