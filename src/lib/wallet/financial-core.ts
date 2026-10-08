import crypto from 'crypto';
import { getSupabaseAdmin, isProductionRuntime } from '@/lib/supabase-admin';
import type {
  CreditWalletParams,
  DebitWalletParams,
  HoldEscrowParams,
  RefundEscrowParams,
  ReleaseEscrowParams,
  RequestWithdrawalParams,
  Wallet,
  WalletHold,
  WalletTransaction,
  WalletWithdrawal,
} from './types';

// ============================================================================
// STORES EN MÉMOIRE POUR TESTS ET ENVIRONNEMENT LOCAL HORS-SUPABASE
// ============================================================================
interface LocalFinancialStore {
  wallets: Map<string, Wallet>;
  transactions: WalletTransaction[];
  holds: WalletHold[];
  withdrawals: WalletWithdrawal[];
  webhookEvents: Map<string, { eventId: string; status: string; payloadHash: string; createdAt: string }>;
}

const localStore: LocalFinancialStore = {
  wallets: new Map(),
  transactions: [],
  holds: [],
  withdrawals: [],
  webhookEvents: new Map(),
};

function generateRef(prefix: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${dateStr}-${rand}`;
}

function mapWalletRow(row: Record<string, unknown>): Wallet {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    currency: String(row.currency || 'XOF'),
    availableBalance: Number(row.available_balance || 0),
    heldBalance: Number(row.held_balance || 0),
    pendingBalance: Number(row.pending_balance || 0),
    status: (row.status as Wallet['status']) || 'active',
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

function mapTransactionRow(row: Record<string, unknown>): WalletTransaction {
  return {
    id: String(row.id),
    walletId: String(row.wallet_id),
    userId: String(row.user_id),
    type: row.type as WalletTransaction['type'],
    direction: row.direction as WalletTransaction['direction'],
    amount: Number(row.amount || 0),
    currency: String(row.currency || 'XOF'),
    balanceAfter: Number(row.balance_after || 0),
    heldAfter: Number(row.held_after || 0),
    status: (row.status as WalletTransaction['status']) || 'completed',
    source: String(row.source || ''),
    sourceId: typeof row.source_id === 'string' ? row.source_id : undefined,
    provider: typeof row.provider === 'string' ? row.provider : undefined,
    providerTransactionId: typeof row.provider_transaction_id === 'string' ? row.provider_transaction_id : undefined,
    idempotencyKey: typeof row.idempotency_key === 'string' ? row.idempotency_key : undefined,
    reference: String(row.reference || ''),
    description: String(row.description || ''),
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: String(row.created_at || new Date().toISOString()),
    completedAt: typeof row.completed_at === 'string' ? row.completed_at : undefined,
  };
}

function mapHoldRow(row: Record<string, unknown>): WalletHold {
  return {
    id: String(row.id),
    walletId: String(row.wallet_id),
    userId: String(row.user_id),
    amount: Number(row.amount || 0),
    currency: String(row.currency || 'XOF'),
    reason: row.reason as WalletHold['reason'],
    reference: String(row.reference || ''),
    source: String(row.source || ''),
    sourceId: String(row.source_id || ''),
    status: (row.status as WalletHold['status']) || 'held',
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: String(row.created_at || new Date().toISOString()),
    releasedAt: typeof row.released_at === 'string' ? row.released_at : undefined,
  };
}

function mapWithdrawalRow(row: Record<string, unknown>): WalletWithdrawal {
  return {
    id: String(row.id),
    walletId: String(row.wallet_id),
    userId: String(row.user_id),
    amount: Number(row.amount || 0),
    fee: Number(row.fee || 0),
    netAmount: Number(row.net_amount || 0),
    currency: String(row.currency || 'XOF'),
    method: row.method as WalletWithdrawal['method'],
    destinationAccount: String(row.destination_account || ''),
    accountHolder: String(row.account_holder || ''),
    status: (row.status as WalletWithdrawal['status']) || 'pending',
    providerPayoutId: typeof row.provider_payout_id === 'string' ? row.provider_payout_id : undefined,
    reference: String(row.reference || ''),
    adminNotes: typeof row.admin_notes === 'string' ? row.admin_notes : undefined,
    processedBy: typeof row.processed_by === 'string' ? row.processed_by : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    completedAt: typeof row.completed_at === 'string' ? row.completed_at : undefined,
  };
}

// ============================================================================
// OPÉRATIONS SUR LE WALLET
// ============================================================================

/**
 * Récupère ou crée le portefeuille de l'utilisateur de manière sécurisée.
 */
export async function getOrCreateWallet(userId: string): Promise<Wallet> {
  if (!userId) throw new Error('userId requis pour accéder au portefeuille');

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: existing, error: selectError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError) throw selectError;
    if (existing) return mapWalletRow(existing);

    // Création initiale
    const { data: created, error: insertError } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        currency: 'XOF',
        available_balance: 0,
        held_balance: 0,
        pending_balance: 0,
        status: 'active',
      })
      .select('*')
      .single();

    if (insertError) {
      // Concurrence : re-sélectionner
      const { data: retry } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (retry) return mapWalletRow(retry);
      throw insertError;
    }
    return mapWalletRow(created);
  }

  // Fallback local
  if (!localStore.wallets.has(userId)) {
    const newWallet: Wallet = {
      id: crypto.randomUUID(),
      userId,
      currency: 'XOF',
      availableBalance: 0,
      heldBalance: 0,
      pendingBalance: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStore.wallets.set(userId, newWallet);
  }
  return localStore.wallets.get(userId)!;
}

/**
 * Crédit atomique sur le portefeuille de l'utilisateur.
 */
export async function creditWallet(params: CreditWalletParams): Promise<{
  success: boolean;
  wallet: Wallet;
  transactionId: string;
  reference: string;
  duplicate?: boolean;
}> {
  const { userId, amount, type, source, sourceId, description, metadata = {} } = params;
  if (amount <= 0) throw new Error('Le montant du crédit doit être supérieur à zéro');

  const reference = params.reference || generateRef('CR');
  const idempotencyKey = params.idempotencyKey;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.rpc('fn_credit_wallet', {
      p_user_id: userId,
      p_amount: amount,
      p_type: type,
      p_source: source,
      p_source_id: sourceId,
      p_description: description,
      p_reference: reference,
      p_idempotency_key: idempotencyKey ?? null,
      p_metadata: metadata,
    });

    if (error) throw error;
    const wallet = await getOrCreateWallet(userId);
    return {
      success: true,
      wallet,
      transactionId: data?.transaction_id || crypto.randomUUID(),
      reference,
      duplicate: Boolean(data?.duplicate),
    };
  }

  // Fallback local
  if (idempotencyKey) {
    const existingTx = localStore.transactions.find((tx) => tx.idempotencyKey === idempotencyKey);
    if (existingTx) {
      const wallet = await getOrCreateWallet(userId);
      return { success: true, wallet, transactionId: existingTx.id, reference: existingTx.reference, duplicate: true };
    }
  }

  const wallet = await getOrCreateWallet(userId);
  wallet.availableBalance += amount;
  wallet.updatedAt = new Date().toISOString();

  const tx: WalletTransaction = {
    id: crypto.randomUUID(),
    walletId: wallet.id,
    userId,
    type,
    direction: 'CREDIT',
    amount,
    currency: wallet.currency,
    balanceAfter: wallet.availableBalance,
    heldAfter: wallet.heldBalance,
    status: 'completed',
    source,
    sourceId,
    idempotencyKey,
    reference,
    description,
    metadata,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  localStore.transactions.push(tx);
  return { success: true, wallet, transactionId: tx.id, reference };
}

/**
 * Débit atomique sur le portefeuille de l'utilisateur avec contrôle du solde disponible.
 */
export async function debitWallet(params: DebitWalletParams): Promise<{
  success: boolean;
  wallet: Wallet;
  transactionId: string;
  reference: string;
  duplicate?: boolean;
}> {
  const { userId, amount, type, source, sourceId, description, metadata = {} } = params;
  if (amount <= 0) throw new Error('Le montant du débit doit être supérieur à zéro');

  const reference = params.reference || generateRef('DB');
  const idempotencyKey = params.idempotencyKey;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.rpc('fn_debit_wallet', {
      p_user_id: userId,
      p_amount: amount,
      p_type: type,
      p_source: source,
      p_source_id: sourceId,
      p_description: description,
      p_reference: reference,
      p_idempotency_key: idempotencyKey ?? null,
      p_metadata: metadata,
    });

    if (error) throw error;
    const wallet = await getOrCreateWallet(userId);
    return {
      success: true,
      wallet,
      transactionId: data?.transaction_id || crypto.randomUUID(),
      reference,
      duplicate: Boolean(data?.duplicate),
    };
  }

  // Fallback local
  if (idempotencyKey) {
    const existingTx = localStore.transactions.find((tx) => tx.idempotencyKey === idempotencyKey);
    if (existingTx) {
      const wallet = await getOrCreateWallet(userId);
      return { success: true, wallet, transactionId: existingTx.id, reference: existingTx.reference, duplicate: true };
    }
  }

  const wallet = await getOrCreateWallet(userId);
  if (wallet.availableBalance < amount) {
    throw new Error(`Solde insuffisant (Disponible: ${wallet.availableBalance} XOF, Requis: ${amount} XOF)`);
  }

  wallet.availableBalance -= amount;
  wallet.updatedAt = new Date().toISOString();

  const tx: WalletTransaction = {
    id: crypto.randomUUID(),
    walletId: wallet.id,
    userId,
    type,
    direction: 'DEBIT',
    amount,
    currency: wallet.currency,
    balanceAfter: wallet.availableBalance,
    heldAfter: wallet.heldBalance,
    status: 'completed',
    source,
    sourceId,
    idempotencyKey,
    reference,
    description,
    metadata,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  localStore.transactions.push(tx);
  return { success: true, wallet, transactionId: tx.id, reference };
}

/**
 * Mise en séquestre atomique (Escrow Hold) pour Marketplace ou Crowdfunding.
 */
export async function holdWalletEscrow(params: HoldEscrowParams): Promise<{
  success: boolean;
  holdId: string;
  reference: string;
  wallet: Wallet;
}> {
  const { userId, amount, reason, source, sourceId, description = 'Mise en séquestre', metadata = {} } = params;
  if (amount <= 0) throw new Error('Le montant du séquestre doit être supérieur à zéro');

  const reference = params.reference || generateRef('HOLD');

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.rpc('fn_hold_wallet_escrow', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_source: source,
      p_source_id: sourceId,
      p_reference: reference,
      p_description: description,
      p_metadata: metadata,
    });

    if (error) throw error;
    const wallet = await getOrCreateWallet(userId);
    return {
      success: true,
      holdId: data?.hold_id,
      reference,
      wallet,
    };
  }

  // Fallback local
  const wallet = await getOrCreateWallet(userId);
  if (wallet.availableBalance < amount) {
    throw new Error(`Solde insuffisant pour séquestre (Disponible: ${wallet.availableBalance} XOF, Requis: ${amount} XOF)`);
  }

  wallet.availableBalance -= amount;
  wallet.heldBalance += amount;
  wallet.updatedAt = new Date().toISOString();

  const hold: WalletHold = {
    id: crypto.randomUUID(),
    walletId: wallet.id,
    userId,
    amount,
    currency: wallet.currency,
    reason,
    reference,
    source,
    sourceId,
    status: 'held',
    metadata,
    createdAt: new Date().toISOString(),
  };
  localStore.holds.push(hold);

  const tx: WalletTransaction = {
    id: crypto.randomUUID(),
    walletId: wallet.id,
    userId,
    type: 'MARKETPLACE_ESCROW_HOLD',
    direction: 'DEBIT',
    amount,
    currency: wallet.currency,
    balanceAfter: wallet.availableBalance,
    heldAfter: wallet.heldBalance,
    status: 'completed',
    source,
    sourceId,
    reference: `${reference}-HOLD`,
    description,
    metadata,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
  localStore.transactions.push(tx);

  return { success: true, holdId: hold.id, reference, wallet };
}

/**
 * Libération atomique du séquestre vers le destinataire (vendeur).
 */
export async function releaseHeldEscrow(params: ReleaseEscrowParams): Promise<{
  success: boolean;
  holdId: string;
  sellerAmount: number;
  platformFee: number;
}> {
  const { holdId, recipientUserId, platformFee = 0, reference, description = 'Libération séquestre marketplace', metadata = {} } = params;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.rpc('fn_release_held_escrow', {
      p_hold_id: holdId,
      p_recipient_user_id: recipientUserId,
      p_platform_fee: platformFee,
      p_reference: reference ?? null,
      p_description: description,
      p_metadata: metadata,
    });
    if (error) throw error;
    return {
      success: true,
      holdId,
      sellerAmount: data?.net_amount ?? 0,
      platformFee,
    };
  }

  // Fallback local
  const hold = localStore.holds.find((h) => h.id === holdId);
  if (!hold) throw new Error('Séquestre introuvable');
  if (hold.status !== 'held') throw new Error(`Séquestre non actif (statut: ${hold.status})`);
  if (platformFee > hold.amount) throw new Error('La commission dépasse le montant du séquestre');

  const buyerWallet = localStore.wallets.get(hold.userId);
  if (!buyerWallet || buyerWallet.heldBalance < hold.amount) {
    throw new Error('Solde séquestre acheteur insuffisant');
  }

  const sellerAmount = hold.amount - platformFee;
  buyerWallet.heldBalance -= hold.amount;
  buyerWallet.updatedAt = new Date().toISOString();
  hold.status = 'released';
  hold.releasedAt = new Date().toISOString();

  const sellerWallet = await getOrCreateWallet(recipientUserId);
  sellerWallet.availableBalance += sellerAmount;
  sellerWallet.updatedAt = new Date().toISOString();

  const ref = reference || `REL-${hold.reference}`;

  localStore.transactions.push({
    id: crypto.randomUUID(),
    walletId: buyerWallet.id,
    userId: buyerWallet.userId,
    type: 'MARKETPLACE_ESCROW_RELEASE',
    direction: 'DEBIT',
    amount: hold.amount,
    currency: hold.currency,
    balanceAfter: buyerWallet.availableBalance,
    heldAfter: buyerWallet.heldBalance,
    status: 'completed',
    source: hold.source,
    sourceId: hold.sourceId,
    reference: `${ref}-OUT`,
    description: 'Déblocage commande vers vendeur',
    metadata,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  });

  localStore.transactions.push({
    id: crypto.randomUUID(),
    walletId: sellerWallet.id,
    userId: recipientUserId,
    type: 'MARKETPLACE_PAYMENT',
    direction: 'CREDIT',
    amount: sellerAmount,
    currency: hold.currency,
    balanceAfter: sellerWallet.availableBalance,
    heldAfter: sellerWallet.heldBalance,
    status: 'completed',
    source: hold.source,
    sourceId: hold.sourceId,
    reference: `${ref}-IN`,
    description,
    metadata: { platformFee, grossAmount: hold.amount, ...metadata },
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  });

  return { success: true, holdId, sellerAmount, platformFee };
}

/**
 * Remboursement atomique du séquestre vers l'acheteur.
 */
export async function refundHeldEscrow(params: RefundEscrowParams): Promise<{
  success: boolean;
  holdId: string;
  refundedAmount: number;
}> {
  const { holdId, reason = 'Remboursement commande', reference, metadata = {} } = params;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.rpc('fn_refund_held_escrow', {
      p_hold_id: holdId,
      p_reason: reason,
      p_reference: reference ?? null,
      p_metadata: metadata,
    });
    if (error) throw error;
    return {
      success: true,
      holdId,
      refundedAmount: data?.refunded_amount ?? 0,
    };
  }

  // Fallback local
  const hold = localStore.holds.find((h) => h.id === holdId);
  if (!hold) throw new Error('Séquestre introuvable');
  if (hold.status !== 'held') throw new Error(`Séquestre non actif (statut: ${hold.status})`);

  const wallet = localStore.wallets.get(hold.userId);
  if (!wallet || wallet.heldBalance < hold.amount) {
    throw new Error('Solde séquestre insuffisant');
  }

  wallet.heldBalance -= hold.amount;
  wallet.availableBalance += hold.amount;
  wallet.updatedAt = new Date().toISOString();
  hold.status = 'refunded';
  hold.releasedAt = new Date().toISOString();

  const ref = reference || `REF-${hold.reference}`;

  localStore.transactions.push({
    id: crypto.randomUUID(),
    walletId: wallet.id,
    userId: wallet.userId,
    type: 'MARKETPLACE_REFUND',
    direction: 'CREDIT',
    amount: hold.amount,
    currency: hold.currency,
    balanceAfter: wallet.availableBalance,
    heldAfter: wallet.heldBalance,
    status: 'completed',
    source: hold.source,
    sourceId: hold.sourceId,
    reference: ref,
    description: reason,
    metadata,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  });

  return { success: true, holdId, refundedAmount: hold.amount };
}

/**
 * Demande de retrait atomique vers Mobile Money ou compte bancaire.
 */
export async function requestWithdrawal(params: RequestWithdrawalParams): Promise<{
  success: boolean;
  withdrawalId: string;
  reference: string;
  netAmount: number;
  wallet: Wallet;
}> {
  const { userId, amount, method, destinationAccount, accountHolder, metadata = {} } = params;
  if (amount < 1000) throw new Error('Le montant minimum de retrait est de 1 000 XOF');

  // Frais standard de retrait : 1.5% avec minimum de 100 XOF
  const fee = params.fee !== undefined ? params.fee : Math.max(100, Math.round(amount * 0.015));
  if (fee >= amount) throw new Error('Les frais ne peuvent dépasser le montant du retrait');

  const netAmount = amount - fee;
  const reference = params.reference || generateRef('WDR');

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.rpc('fn_request_withdrawal', {
      p_user_id: userId,
      p_amount: amount,
      p_fee: fee,
      p_method: method,
      p_destination_account: destinationAccount,
      p_account_holder: accountHolder,
      p_reference: reference,
      p_metadata: metadata,
    });
    if (error) throw error;
    const wallet = await getOrCreateWallet(userId);
    return {
      success: true,
      withdrawalId: data?.withdrawal_id,
      reference,
      netAmount,
      wallet,
    };
  }

  // Fallback local
  const wallet = await getOrCreateWallet(userId);
  if (wallet.availableBalance < amount) {
    throw new Error(`Solde disponible insuffisant (Disponible: ${wallet.availableBalance} XOF, Requis: ${amount} XOF)`);
  }

  wallet.availableBalance -= amount;
  wallet.pendingBalance += amount;
  wallet.updatedAt = new Date().toISOString();

  const withdrawal: WalletWithdrawal = {
    id: crypto.randomUUID(),
    walletId: wallet.id,
    userId,
    amount,
    fee,
    netAmount,
    currency: wallet.currency,
    method,
    destinationAccount,
    accountHolder,
    status: 'pending',
    reference,
    createdAt: new Date().toISOString(),
  };
  localStore.withdrawals.push(withdrawal);

  localStore.transactions.push({
    id: crypto.randomUUID(),
    walletId: wallet.id,
    userId,
    type: 'WITHDRAWAL',
    direction: 'DEBIT',
    amount,
    currency: wallet.currency,
    balanceAfter: wallet.availableBalance,
    heldAfter: wallet.heldBalance,
    status: 'pending',
    source: 'wallet_withdrawals',
    sourceId: withdrawal.id,
    reference,
    description: `Demande de retrait ${method} vers ${destinationAccount}`,
    metadata,
    createdAt: new Date().toISOString(),
  });

  return { success: true, withdrawalId: withdrawal.id, reference, netAmount, wallet };
}

/**
 * Validation finale d'un retrait (exécuté par admin ou webhook opérateur).
 */
export async function completeWithdrawal(
  withdrawalId: string,
  providerPayoutId?: string,
  adminUserId?: string,
  notes?: string
): Promise<{ success: boolean; status: string }> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.rpc('fn_complete_withdrawal', {
      p_withdrawal_id: withdrawalId,
      p_provider_payout_id: providerPayoutId ?? null,
      p_admin_user_id: adminUserId ?? null,
      p_notes: notes ?? null,
    });
    if (error) throw error;
    return { success: true, status: 'completed' };
  }

  const wdr = localStore.withdrawals.find((w) => w.id === withdrawalId);
  if (!wdr) throw new Error('Demande de retrait introuvable');
  if (wdr.status !== 'pending' && wdr.status !== 'processing') {
    throw new Error(`Statut invalide pour finalisation: ${wdr.status}`);
  }

  const wallet = localStore.wallets.get(wdr.userId);
  if (wallet) {
    wallet.pendingBalance = Math.max(0, wallet.pendingBalance - wdr.amount);
    wallet.updatedAt = new Date().toISOString();
  }

  wdr.status = 'completed';
  wdr.providerPayoutId = providerPayoutId;
  wdr.adminNotes = notes;
  wdr.completedAt = new Date().toISOString();

  const tx = localStore.transactions.find((t) => t.reference === wdr.reference);
  if (tx) {
    tx.status = 'completed';
    tx.completedAt = new Date().toISOString();
  }

  return { success: true, status: 'completed' };
}

/**
 * Rejet d'un retrait et restitution du solde réservé.
 */
export async function rejectWithdrawal(
  withdrawalId: string,
  reason: string,
  adminUserId?: string
): Promise<{ success: boolean; status: string }> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.rpc('fn_reject_withdrawal', {
      p_withdrawal_id: withdrawalId,
      p_reason: reason,
      p_admin_user_id: adminUserId ?? null,
    });
    if (error) throw error;
    return { success: true, status: 'rejected' };
  }

  const wdr = localStore.withdrawals.find((w) => w.id === withdrawalId);
  if (!wdr) throw new Error('Demande de retrait introuvable');
  if (wdr.status !== 'pending' && wdr.status !== 'processing') {
    throw new Error(`Statut invalide pour rejet: ${wdr.status}`);
  }

  const wallet = localStore.wallets.get(wdr.userId);
  if (wallet) {
    wallet.pendingBalance = Math.max(0, wallet.pendingBalance - wdr.amount);
    wallet.availableBalance += wdr.amount;
    wallet.updatedAt = new Date().toISOString();
  }

  wdr.status = 'rejected';
  wdr.adminNotes = reason;
  wdr.completedAt = new Date().toISOString();

  const tx = localStore.transactions.find((t) => t.reference === wdr.reference);
  if (tx) {
    tx.status = 'cancelled';
  }

  if (wallet) {
    localStore.transactions.push({
      id: crypto.randomUUID(),
      walletId: wallet.id,
      userId: wallet.userId,
      type: 'ADJUSTMENT',
      direction: 'CREDIT',
      amount: wdr.amount,
      currency: wallet.currency,
      balanceAfter: wallet.availableBalance,
      heldAfter: wallet.heldBalance,
      status: 'completed',
      source: 'wallet_withdrawals',
      sourceId: wdr.id,
      reference: `${wdr.reference}-REVERSAL`,
      description: `Restitution suite rejet retrait : ${reason}`,
      metadata: { originalWithdrawalId: wdr.id, reason },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
  }

  return { success: true, status: 'rejected' };
}

/**
 * Historique des transactions du portefeuille.
 */
export async function getWalletTransactions(
  userId: string,
  options: { page?: number; limit?: number; type?: string } = {}
): Promise<{ transactions: WalletTransaction[]; total: number }> {
  const { page = 1, limit = 20, type } = options;
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    let query = supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    return {
      transactions: (data || []).map(mapTransactionRow),
      total: count || 0,
    };
  }

  let list = localStore.transactions.filter((tx) => tx.userId === userId);
  if (type) list = list.filter((tx) => tx.type === type);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    transactions: list.slice(offset, offset + limit),
    total: list.length,
  };
}

/**
 * Liste des séquestres actifs ou passés du portefeuille.
 */
export async function getWalletHolds(userId: string): Promise<WalletHold[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from('wallet_holds')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapHoldRow);
  }

  return localStore.holds
    .filter((h) => h.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Liste des demandes de retraits du portefeuille.
 */
export async function getWalletWithdrawals(userId: string): Promise<WalletWithdrawal[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from('wallet_withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapWithdrawalRow);
  }

  return localStore.withdrawals
    .filter((w) => w.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Récupère le résumé complet du portefeuille pour le dashboard utilisateur.
 */
export async function getWalletSummary(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  const [{ transactions, total }, holds, withdrawals] = await Promise.all([
    getWalletTransactions(userId, { limit: 10 }),
    getWalletHolds(userId),
    getWalletWithdrawals(userId),
  ]);

  return {
    wallet,
    recentTransactions: transactions,
    totalTransactions: total,
    activeHolds: holds.filter((h) => h.status === 'held'),
    allHolds: holds,
    pendingWithdrawals: withdrawals.filter((w) => w.status === 'pending' || w.status === 'processing'),
    allWithdrawals: withdrawals,
  };
}

/**
 * Traitement sécurisé d'un rechargement de wallet suite à un paiement Moneroo.
 */
export async function settleWalletDeposit(params: {
  userId: string;
  paymentId: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}) {
  const { userId, paymentId, amount, currency = 'XOF', metadata = {} } = params;
  const idempotencyKey = `dep_moneroo_${paymentId}`;

  return await creditWallet({
    userId,
    amount,
    type: 'DEPOSIT',
    source: 'moneroo',
    sourceId: paymentId,
    reference: `DEP-${paymentId.slice(-8).toUpperCase()}`,
    idempotencyKey,
    description: `Rechargement de portefeuille (${amount} ${currency})`,
    metadata: {
      provider: 'moneroo',
      paymentId,
      currency,
      ...metadata,
    },
  });
}
