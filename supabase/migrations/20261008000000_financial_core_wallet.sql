-- ==============================================================================
-- ENVOL AFRICA — FINANCIAL CORE & WALLET LEDGER
-- Migration : 20261008000000_financial_core_wallet.sql
-- Conforme : Document 1 (Phase 1) & AGENTS.md (§2, §3, §6)
-- Sécurité : RLS activée, droits anon/authenticated révoqués, opérations atomiques
-- ==============================================================================

-- 1. EXTENSION UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE : WALLETS (Portefeuille Central Utilisateur)
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
  available_balance NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  held_balance NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (held_balance >= 0),
  pending_balance NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'suspended', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index sur les clés étrangères et recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON public.wallets(status);

-- 3. TABLE : WALLET_TRANSACTIONS (Ledger Transactionnel Immuable - Append Only)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'DEPOSIT', 'WITHDRAWAL', 'REFUND', 'AWARD_VOTE', 'AWARD_GIFT', 'AWARD_DONATION',
    'CROWDFUNDING_DONATION', 'CROWDFUNDING_INVESTMENT', 'CROWDFUNDING_REPAYMENT',
    'MARKETPLACE_PAYMENT', 'MARKETPLACE_INSTALLMENT', 'MARKETPLACE_ESCROW_HOLD',
    'MARKETPLACE_ESCROW_RELEASE', 'MARKETPLACE_REFUND', 'AFFILIATE_COMMISSION',
    'PLATFORM_FEE', 'PENALTY', 'ADJUSTMENT', 'TRANSFER'
  )),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
  balance_after NUMERIC(15, 2) NOT NULL CHECK (balance_after >= 0),
  held_after NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (held_after >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'reversed')),
  source VARCHAR(50) NOT NULL,
  source_id TEXT,
  provider VARCHAR(50),
  provider_transaction_id TEXT,
  idempotency_key TEXT UNIQUE,
  reference TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_reference ON public.wallet_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_idempotency ON public.wallet_transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON public.wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created_at ON public.wallet_transactions(created_at DESC);

-- 4. TABLE : WALLET_HOLDS (Séquestres / Escrow pour Marketplace et Financement)
CREATE TABLE IF NOT EXISTS public.wallet_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('marketplace_escrow', 'crowdfunding_pledge', 'withdrawal_pending', 'dispute_hold')),
  reference TEXT NOT NULL UNIQUE,
  source VARCHAR(50) NOT NULL,
  source_id TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'cancelled')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wallet_holds_wallet_id ON public.wallet_holds(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_holds_user_id ON public.wallet_holds(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_holds_reference ON public.wallet_holds(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_holds_source ON public.wallet_holds(source, source_id);

-- 5. TABLE : WALLET_WITHDRAWALS (Demandes de retraits vers Mobile Money / Banque)
CREATE TABLE IF NOT EXISTS public.wallet_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  fee NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  net_amount NUMERIC(15, 2) NOT NULL CHECK (net_amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
  method VARCHAR(50) NOT NULL CHECK (method IN ('mtn_momo', 'moov_money', 'orange_money', 'wave', 'bank_transfer', 'celtiis_cash')),
  destination_account TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled')),
  provider_payout_id TEXT,
  reference TEXT NOT NULL UNIQUE,
  admin_notes TEXT,
  processed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet_id ON public.wallet_withdrawals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.wallet_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.wallet_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_reference ON public.wallet_withdrawals(reference);

-- 6. TABLE : PAYMENT_WEBHOOK_EVENTS (Hub central et idempotent des webhooks de paiement)
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL DEFAULT 'moneroo',
  event_id TEXT NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  payload_hash TEXT NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored')),
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.payment_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.payment_webhook_events(status);

-- 7. SÉCURITÉ ZERO-TRUST (RLS & REVOKE) CONFORME AGENTS.MD
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- Interdiction absolue de lecture/écriture directe pour les clés anon et authenticated
REVOKE ALL ON public.wallets FROM anon, authenticated;
REVOKE ALL ON public.wallet_transactions FROM anon, authenticated;
REVOKE ALL ON public.wallet_holds FROM anon, authenticated;
REVOKE ALL ON public.wallet_withdrawals FROM anon, authenticated;
REVOKE ALL ON public.payment_webhook_events FROM anon, authenticated;

-- ==============================================================================
-- FONCTIONS RPC TRANSACTIONNELLES ATOMIQUES (SECURITY DEFINER)
-- ==============================================================================

-- 8. RPC : CRÉDIT ATOMIQUE DU WALLET AVEC LEDGER
CREATE OR REPLACE FUNCTION public.fn_credit_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_source TEXT,
  p_source_id TEXT,
  p_description TEXT,
  p_reference TEXT,
  p_idempotency_key TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_wallet RECORD;
  v_new_available NUMERIC;
  v_tx_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant à créditer doit être supérieur à zéro.';
  END IF;

  -- Vérification d'idempotence
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE idempotency_key = p_idempotency_key) THEN
      RETURN jsonb_build_object('success', true, 'duplicate', true, 'message', 'Transaction déjà traitée');
    END IF;
  END IF;

  -- Récupérer et verrouiller la ligne du wallet pour éviter toute concurrence
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  -- Création automatique si inexistant
  IF v_wallet IS NULL THEN
    INSERT INTO public.wallets (user_id, currency, available_balance, held_balance, pending_balance)
    VALUES (p_user_id, 'XOF', p_amount, 0, 0)
    RETURNING * INTO v_wallet;
    v_new_available := p_amount;
  ELSE
    v_new_available := v_wallet.available_balance + p_amount;
    UPDATE public.wallets
    SET available_balance = v_new_available, updated_at = now()
    WHERE id = v_wallet.id;
  END IF;

  -- Écriture immuable dans le ledger
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, direction, amount, currency,
    balance_after, held_after, status, source, source_id,
    idempotency_key, reference, description, metadata
  ) VALUES (
    v_wallet.id, p_user_id, p_type, 'CREDIT', p_amount, v_wallet.currency,
    v_new_available, v_wallet.held_balance, 'completed', p_source, p_source_id,
    p_idempotency_key, p_reference, p_description, p_metadata
  ) RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'wallet_id', v_wallet.id,
    'transaction_id', v_tx_id,
    'amount', p_amount,
    'balance_after', v_new_available
  );
END;
$$;

-- 9. RPC : DÉBIT ATOMIQUE DU WALLET AVEC VÉRIFICATION DU SOLDE DISPONIBLE
CREATE OR REPLACE FUNCTION public.fn_debit_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_source TEXT,
  p_source_id TEXT,
  p_description TEXT,
  p_reference TEXT,
  p_idempotency_key TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_wallet RECORD;
  v_new_available NUMERIC;
  v_tx_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant à débiter doit être supérieur à zéro.';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE idempotency_key = p_idempotency_key) THEN
      RETURN jsonb_build_object('success', true, 'duplicate', true, 'message', 'Transaction déjà traitée');
    END IF;
  END IF;

  -- Verrouillage de la ligne wallet
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Portefeuille inexistant pour cet utilisateur.';
  END IF;

  IF v_wallet.status != 'active' THEN
    RAISE EXCEPTION 'Portefeuille inactif ou bloqué.';
  END IF;

  IF v_wallet.available_balance < p_amount THEN
    RAISE EXCEPTION 'Solde disponible insuffisant (Disponible: %, Requis: %)', v_wallet.available_balance, p_amount;
  END IF;

  v_new_available := v_wallet.available_balance - p_amount;

  UPDATE public.wallets
  SET available_balance = v_new_available, updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, direction, amount, currency,
    balance_after, held_after, status, source, source_id,
    idempotency_key, reference, description, metadata
  ) VALUES (
    v_wallet.id, p_user_id, p_type, 'DEBIT', p_amount, v_wallet.currency,
    v_new_available, v_wallet.held_balance, 'completed', p_source, p_source_id,
    p_idempotency_key, p_reference, p_description, p_metadata
  ) RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'wallet_id', v_wallet.id,
    'transaction_id', v_tx_id,
    'amount', p_amount,
    'balance_after', v_new_available
  );
END;
$$;

-- 10. RPC : MISE EN SÉQUESTRE ATOMIQUE (ESCROW HOLD)
CREATE OR REPLACE FUNCTION public.fn_hold_wallet_escrow(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reason TEXT,
  p_source TEXT,
  p_source_id TEXT,
  p_reference TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_wallet RECORD;
  v_new_available NUMERIC;
  v_new_held NUMERIC;
  v_hold_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant à bloquer doit être supérieur à zéro.';
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet IS NULL OR v_wallet.available_balance < p_amount THEN
    RAISE EXCEPTION 'Solde disponible insuffisant pour la mise en séquestre.';
  END IF;

  v_new_available := v_wallet.available_balance - p_amount;
  v_new_held := v_wallet.held_balance + p_amount;

  UPDATE public.wallets
  SET available_balance = v_new_available, held_balance = v_new_held, updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_holds (
    wallet_id, user_id, amount, currency, reason, reference,
    source, source_id, status, metadata
  ) VALUES (
    v_wallet.id, p_user_id, p_amount, v_wallet.currency, p_reason, p_reference,
    p_source, p_source_id, 'held', p_metadata
  ) RETURNING id INTO v_hold_id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, direction, amount, currency,
    balance_after, held_after, status, source, source_id,
    reference, description, metadata
  ) VALUES (
    v_wallet.id, p_user_id, 'MARKETPLACE_ESCROW_HOLD', 'DEBIT', p_amount, v_wallet.currency,
    v_new_available, v_new_held, 'completed', p_source, p_source_id,
    p_reference || '-HOLD', p_description, p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'hold_id', v_hold_id,
    'amount', p_amount,
    'available_after', v_new_available,
    'held_after', v_new_held
  );
END;
$$;

-- 11. RPC : LIBÉRATION ATOMIQUE DU SÉQUESTRE (RELEASE ESCROW VERS VENDEUR)
CREATE OR REPLACE FUNCTION public.fn_release_held_escrow(
  p_hold_id UUID,
  p_recipient_user_id UUID,
  p_platform_fee NUMERIC DEFAULT 0,
  p_reference TEXT DEFAULT NULL,
  p_description TEXT DEFAULT 'Libération séquestre marketplace',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_hold RECORD;
  v_buyer_wallet RECORD;
  v_seller_wallet RECORD;
  v_seller_amount NUMERIC;
  v_ref TEXT;
BEGIN
  IF p_platform_fee < 0 THEN
    RAISE EXCEPTION 'La commission plateforme ne peut pas être négative.';
  END IF;

  SELECT * INTO v_hold FROM public.wallet_holds WHERE id = p_hold_id FOR UPDATE;
  IF v_hold IS NULL THEN
    RAISE EXCEPTION 'Séquestre non trouvé.';
  END IF;

  IF v_hold.status != 'held' THEN
    RAISE EXCEPTION 'Ce séquestre n''est plus actif (statut: %).', v_hold.status;
  END IF;

  IF p_platform_fee > v_hold.amount THEN
    RAISE EXCEPTION 'La commission ne peut pas dépasser le montant du séquestre.';
  END IF;

  v_seller_amount := v_hold.amount - p_platform_fee;
  v_ref := COALESCE(p_reference, 'REL-' || v_hold.reference);

  -- 1. Débloquer le held_balance de l'acheteur
  SELECT * INTO v_buyer_wallet FROM public.wallets WHERE id = v_hold.wallet_id FOR UPDATE;
  IF v_buyer_wallet IS NULL THEN
    RAISE EXCEPTION 'Portefeuille acheteur introuvable.';
  END IF;

  IF v_buyer_wallet.held_balance < v_hold.amount THEN
    RAISE EXCEPTION 'Solde séquestre de l''acheteur insuffisant.';
  END IF;

  UPDATE public.wallets
  SET held_balance = held_balance - v_hold.amount, updated_at = now()
  WHERE id = v_buyer_wallet.id;

  -- 2. Marquer le hold comme 'released'
  UPDATE public.wallet_holds
  SET status = 'released', released_at = now()
  WHERE id = v_hold.id;

  -- 3. Créditer le portefeuille du vendeur
  SELECT * INTO v_seller_wallet FROM public.wallets WHERE user_id = p_recipient_user_id FOR UPDATE;
  IF v_seller_wallet IS NULL THEN
    INSERT INTO public.wallets (user_id, currency, available_balance, held_balance, pending_balance)
    VALUES (p_recipient_user_id, v_hold.currency, v_seller_amount, 0, 0)
    RETURNING * INTO v_seller_wallet;
  ELSE
    UPDATE public.wallets
    SET available_balance = available_balance + v_seller_amount, updated_at = now()
    WHERE id = v_seller_wallet.id;
  END IF;

  -- 4. Écritures dans le Ledger
  -- Débit définitif de l'acheteur (libération séquestre)
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, direction, amount, currency,
    balance_after, held_after, status, source, source_id,
    reference, description, metadata
  ) VALUES (
    v_buyer_wallet.id, v_buyer_wallet.user_id, 'MARKETPLACE_ESCROW_RELEASE', 'DEBIT',
    v_hold.amount, v_hold.currency, v_buyer_wallet.available_balance,
    (v_buyer_wallet.held_balance - v_hold.amount), 'completed',
    v_hold.source, v_hold.source_id, v_ref || '-OUT',
    'Déblocage commande vers vendeur', p_metadata
  );

  -- Crédit du vendeur (montant net après commission)
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, direction, amount, currency,
    balance_after, held_after, status, source, source_id,
    reference, description, metadata
  ) VALUES (
    v_seller_wallet.id, p_recipient_user_id, 'MARKETPLACE_PAYMENT', 'CREDIT',
    v_seller_amount, v_hold.currency, (v_seller_wallet.available_balance + v_seller_amount),
    v_seller_wallet.held_balance, 'completed',
    v_hold.source, v_hold.source_id, v_ref || '-IN',
    p_description, jsonb_build_object('platform_fee', p_platform_fee, 'gross_amount', v_hold.amount) || p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'hold_id', v_hold.id,
    'seller_user_id', p_recipient_user_id,
    'gross_amount', v_hold.amount,
    'fee', p_platform_fee,
    'net_amount', v_seller_amount
  );
END;
$$;

-- 12. RPC : REMBOURSEMENT ATOMIQUE DU SÉQUESTRE (REFUND ESCROW VERS ACHETEUR)
CREATE OR REPLACE FUNCTION public.fn_refund_held_escrow(
  p_hold_id UUID,
  p_reason TEXT DEFAULT 'Remboursement commande annulée',
  p_reference TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_hold RECORD;
  v_wallet RECORD;
  v_ref TEXT;
BEGIN
  SELECT * INTO v_hold FROM public.wallet_holds WHERE id = p_hold_id FOR UPDATE;
  IF v_hold IS NULL THEN
    RAISE EXCEPTION 'Séquestre non trouvé.';
  END IF;

  IF v_hold.status != 'held' THEN
    RAISE EXCEPTION 'Ce séquestre n''est plus actif (statut: %).', v_hold.status;
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE id = v_hold.wallet_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Portefeuille utilisateur introuvable.';
  END IF;

  IF v_wallet.held_balance < v_hold.amount THEN
    RAISE EXCEPTION 'Solde séquestre insuffisant pour le remboursement.';
  END IF;

  -- Remettre l'argent du held_balance vers available_balance
  UPDATE public.wallets
  SET held_balance = held_balance - v_hold.amount,
      available_balance = available_balance + v_hold.amount,
      updated_at = now()
  WHERE id = v_wallet.id;

  -- Marquer le hold comme 'refunded'
  UPDATE public.wallet_holds
  SET status = 'refunded', released_at = now()
  WHERE id = v_hold.id;

  v_ref := COALESCE(p_reference, 'REF-' || v_hold.reference);

  -- Écriture dans le Ledger
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, direction, amount, currency,
    balance_after, held_after, status, source, source_id,
    reference, description, metadata
  ) VALUES (
    v_wallet.id, v_wallet.user_id, 'MARKETPLACE_REFUND', 'CREDIT',
    v_hold.amount, v_hold.currency, (v_wallet.available_balance + v_hold.amount),
    (v_wallet.held_balance - v_hold.amount), 'completed',
    v_hold.source, v_hold.source_id, v_ref,
    p_reason, p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'hold_id', v_hold.id,
    'refunded_amount', v_hold.amount,
    'new_available', (v_wallet.available_balance + v_hold.amount),
    'new_held', (v_wallet.held_balance - v_hold.amount)
  );
END;
$$;

-- 13. RPC : DEMANDE ATOMIQUE DE RETRAIT (MOBILE MONEY OU BANQUE)
CREATE OR REPLACE FUNCTION public.fn_request_withdrawal(
  p_user_id UUID,
  p_amount NUMERIC,
  p_fee NUMERIC,
  p_method TEXT,
  p_destination_account TEXT,
  p_account_holder TEXT,
  p_reference TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_wallet RECORD;
  v_net_amount NUMERIC;
  v_withdrawal_id UUID;
  v_tx_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant du retrait doit être supérieur à zéro.';
  END IF;

  IF p_fee < 0 OR p_fee >= p_amount THEN
    RAISE EXCEPTION 'Frais invalides.';
  END IF;

  v_net_amount := p_amount - p_fee;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Portefeuille inexistant.';
  END IF;

  IF v_wallet.status != 'active' THEN
    RAISE EXCEPTION 'Portefeuille non actif.';
  END IF;

  IF v_wallet.available_balance < p_amount THEN
    RAISE EXCEPTION 'Solde disponible insuffisant pour ce retrait (Disponible: %, Requis: %).', v_wallet.available_balance, p_amount;
  END IF;

  -- Déplacer le montant vers pending_balance
  UPDATE public.wallets
  SET available_balance = available_balance - p_amount,
      pending_balance = pending_balance + p_amount,
      updated_at = now()
  WHERE id = v_wallet.id;

  -- Enregistrer la demande de retrait
  INSERT INTO public.wallet_withdrawals (
    wallet_id, user_id, amount, fee, net_amount, currency,
    method, destination_account, account_holder, status,
    reference, metadata
  ) VALUES (
    v_wallet.id, p_user_id, p_amount, p_fee, v_net_amount, v_wallet.currency,
    p_method, p_destination_account, p_account_holder, 'pending',
    p_reference, p_metadata
  ) RETURNING id INTO v_withdrawal_id;

  -- Écriture dans le Ledger (DEBIT en attente)
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, direction, amount, currency,
    balance_after, held_after, status, source, source_id,
    reference, description, metadata
  ) VALUES (
    v_wallet.id, p_user_id, 'WITHDRAWAL', 'DEBIT',
    p_amount, v_wallet.currency, (v_wallet.available_balance - p_amount),
    v_wallet.held_balance, 'pending',
    'wallet_withdrawals', v_withdrawal_id::text,
    p_reference, 'Demande de retrait ' || p_method || ' vers ' || p_destination_account,
    p_metadata
  ) RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'transaction_id', v_tx_id,
    'amount', p_amount,
    'fee', p_fee,
    'net_amount', v_net_amount,
    'new_available', (v_wallet.available_balance - p_amount),
    'new_pending', (v_wallet.pending_balance + p_amount)
  );
END;
$$;

-- 14. RPC : FINALISATION DU RETRAIT APRÈS EXÉCUTION DU VIREMENT
CREATE OR REPLACE FUNCTION public.fn_complete_withdrawal(
  p_withdrawal_id UUID,
  p_provider_payout_id TEXT DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_withdrawal RECORD;
  v_wallet RECORD;
BEGIN
  SELECT * INTO v_withdrawal FROM public.wallet_withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF v_withdrawal IS NULL THEN
    RAISE EXCEPTION 'Demande de retrait introuvable.';
  END IF;

  IF v_withdrawal.status != 'pending' AND v_withdrawal.status != 'processing' THEN
    RAISE EXCEPTION 'Cette demande ne peut pas être complétée (statut actuel: %).', v_withdrawal.status;
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE id = v_withdrawal.wallet_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Portefeuille introuvable.';
  END IF;

  -- Déduire de pending_balance
  UPDATE public.wallets
  SET pending_balance = GREATEST(0, pending_balance - v_withdrawal.amount),
      updated_at = now()
  WHERE id = v_wallet.id;

  -- Marquer retrait comme completed
  UPDATE public.wallet_withdrawals
  SET status = 'completed',
      provider_payout_id = COALESCE(p_provider_payout_id, provider_payout_id),
      processed_by = COALESCE(p_admin_user_id, processed_by),
      admin_notes = COALESCE(p_notes, admin_notes),
      completed_at = now()
  WHERE id = v_withdrawal.id;

  -- Mettre à jour la transaction ledger associée
  UPDATE public.wallet_transactions
  SET status = 'completed', completed_at = now()
  WHERE reference = v_withdrawal.reference;

  RETURN jsonb_build_object('success', true, 'withdrawal_id', v_withdrawal.id, 'status', 'completed');
END;
$$;

-- 15. RPC : REJET D''UN RETRAIT ET RESTITUTION DU SOLDE
CREATE OR REPLACE FUNCTION public.fn_reject_withdrawal(
  p_withdrawal_id UUID,
  p_reason TEXT,
  p_admin_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_withdrawal RECORD;
  v_wallet RECORD;
BEGIN
  SELECT * INTO v_withdrawal FROM public.wallet_withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF v_withdrawal IS NULL THEN
    RAISE EXCEPTION 'Demande de retrait introuvable.';
  END IF;

  IF v_withdrawal.status != 'pending' AND v_withdrawal.status != 'processing' THEN
    RAISE EXCEPTION 'Cette demande ne peut pas être rejetée (statut actuel: %).', v_withdrawal.status;
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE id = v_withdrawal.wallet_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Portefeuille introuvable.';
  END IF;

  -- Restituer le montant du pending_balance vers available_balance
  UPDATE public.wallets
  SET pending_balance = GREATEST(0, pending_balance - v_withdrawal.amount),
      available_balance = available_balance + v_withdrawal.amount,
      updated_at = now()
  WHERE id = v_wallet.id;

  UPDATE public.wallet_withdrawals
  SET status = 'rejected',
      admin_notes = p_reason,
      processed_by = COALESCE(p_admin_user_id, processed_by),
      completed_at = now()
  WHERE id = v_withdrawal.id;

  UPDATE public.wallet_transactions
  SET status = 'cancelled'
  WHERE reference = v_withdrawal.reference;

  -- Écrire une écriture compensatoire dans le ledger
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, direction, amount, currency,
    balance_after, held_after, status, source, source_id,
    reference, description, metadata
  ) VALUES (
    v_wallet.id, v_wallet.user_id, 'ADJUSTMENT', 'CREDIT',
    v_withdrawal.amount, v_wallet.currency,
    (v_wallet.available_balance + v_withdrawal.amount),
    v_wallet.held_balance, 'completed',
    'wallet_withdrawals', v_withdrawal.id::text,
    v_withdrawal.reference || '-REVERSAL',
    'Restitution suite rejet retrait : ' || p_reason,
    jsonb_build_object('original_withdrawal_id', v_withdrawal.id, 'reason', p_reason)
  );

  RETURN jsonb_build_object('success', true, 'withdrawal_id', v_withdrawal.id, 'status', 'rejected');
END;
$$;
