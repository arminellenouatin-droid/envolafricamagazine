/**
 * Service centralisé de gestion des Remboursements (Refund Service).
 *
 * Règles absolues :
 * 1. Distinction stricte entre :
 *    - Refund interne (Crédit atomique Portefeuille Central).
 *    - Refund externe (Décaissement Moneroo Payout).
 * 2. Un remboursement ne peut jamais exécuter à la fois un crédit Wallet ET un payout externe.
 * 3. Ne jamais promettre un remboursement Moneroo Payout sur Celtiis Cash (non supporté par le catalogue payout Moneroo).
 * 4. Idempotence garantie par clé unique.
 * 5. Calcul strict du solde restant remboursable (protection contre le sur-remboursement).
 * 6. Impossible de passer un statut à 'PAID' depuis le frontend.
 */

import crypto from 'crypto';
import { getSupabaseAdmin, isProductionRuntime } from '@/lib/supabase-admin';
import { creditWallet } from '@/lib/wallet/financial-core';
import { initMonerooPayout, isPayoutMethodSupported } from '@/lib/moneroo-payout';
import type {
  RefundItem,
  RequestRefundParams,
  ApproveRefundParams,
  RejectRefundParams,
  RefundStatus,
  RefundMode,
} from './types';

// Store local pour les tests et environnement hors-Supabase
const localRefunds = new Map<string, RefundItem>();

function generateRefundRef(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `RFND-${dateStr}-${rand}`;
}

export class RefundDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RefundDomainError';
  }
}

/**
 * Calcule le montant restant remboursable sur une transaction initiale.
 */
export async function getRemainingRefundableAmount(
  originalPaymentId: string,
  originalAmount: number
): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from('financial_refunds')
      .select('amount, status')
      .eq('original_payment_id', originalPaymentId);

    if (!error && Array.isArray(data)) {
      const activeRefundedTotal = data
        .filter((r) => !['REJECTED', 'FAILED'].includes(r.status))
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);
      return Math.max(0, originalAmount - activeRefundedTotal);
    }
  }

  // Fallback local
  let activeRefundedTotal = 0;
  for (const ref of localRefunds.values()) {
    if (
      ref.originalPaymentId === originalPaymentId &&
      !['REJECTED', 'FAILED'].includes(ref.status)
    ) {
      activeRefundedTotal += ref.amount;
    }
  }

  return Math.max(0, originalAmount - activeRefundedTotal);
}

/**
 * Enregistre une demande de remboursement (REQUESTED).
 */
export async function requestRefund(params: RequestRefundParams): Promise<RefundItem> {
  const {
    originalPaymentId,
    orderId,
    userId,
    amount,
    originalAmount,
    currency = 'XOF',
    mode = 'INTERNAL_WALLET',
    reason,
    requestedBy,
    idempotencyKey,
    destinationDetails,
    metadata = {},
  } = params;

  if (!originalPaymentId) throw new RefundDomainError('originalPaymentId requis');
  if (!userId) throw new RefundDomainError('userId requis');
  if (amount <= 0) throw new RefundDomainError('Le montant du remboursement doit être supérieur à zéro');
  if (amount > originalAmount) {
    throw new RefundDomainError('Le montant du remboursement ne peut excéder le montant de la transaction initiale');
  }

  // Vérification idempotence
  if (idempotencyKey) {
    const existing = await findRefundByIdempotencyKey(idempotencyKey);
    if (existing) return existing;
  }

  // Vérification du montant restant remboursable
  const remaining = await getRemainingRefundableAmount(originalPaymentId, originalAmount);
  if (amount > remaining) {
    throw new RefundDomainError(
      `Montant demandé (${amount} ${currency}) supérieur au solde remboursable restant (${remaining} ${currency})`
    );
  }

  // Vérification de compatibilité de la méthode externe (Moneroo Payout)
  if (mode === 'EXTERNAL_PAYOUT') {
    const method = destinationDetails?.method || '';
    const country = destinationDetails?.country || 'BJ';

    if (method.toLowerCase().includes('celtiis')) {
      throw new RefundDomainError(
        'Moneroo ne supporte pas actuellement Celtiis Cash en Payout/Décaissement. ' +
        'Veuillez opter pour un remboursement vers le Portefeuille Central Envol Africa ou par virement manuel.'
      );
    }

    if (!isPayoutMethodSupported(method, country, currency)) {
      throw new RefundDomainError(
        `La méthode '${method}' n'est pas acceptée pour les remboursements externes dans le pays '${country}'.`
      );
    }
  }

  const refundItem: RefundItem = {
    id: crypto.randomUUID(),
    reference: generateRefundRef(),
    originalPaymentId,
    orderId,
    userId,
    amount,
    originalAmount,
    currency: currency.toUpperCase(),
    mode,
    status: 'REQUESTED',
    reason,
    requestedBy,
    destinationDetails,
    idempotencyKey,
    metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from('financial_refunds')
      .insert({
        id: refundItem.id,
        reference: refundItem.reference,
        original_payment_id: refundItem.originalPaymentId,
        order_id: refundItem.orderId,
        user_id: refundItem.userId,
        amount: refundItem.amount,
        original_amount: refundItem.originalAmount,
        currency: refundItem.currency,
        mode: refundItem.mode,
        status: refundItem.status,
        reason: refundItem.reason,
        requested_by: refundItem.requestedBy,
        destination_details: refundItem.destinationDetails,
        idempotency_key: refundItem.idempotencyKey,
        metadata: refundItem.metadata,
      })
      .select('*')
      .single();

    if (!error && data) {
      return mapDbRowToRefund(data);
    }
  }

  // Guard de production
  if (isProductionRuntime() && !supabase) {
    throw new Error('Base de données Supabase non configurée en environnement de production');
  }

  localRefunds.set(refundItem.id, refundItem);
  return refundItem;
}

/**
 * Valide une demande de remboursement par un administrateur ou le système.
 */
export async function approveRefund(params: ApproveRefundParams): Promise<RefundItem> {
  const { refundId, approvedBy, adminNotes } = params;
  const refund = await getRefundById(refundId);
  if (!refund) throw new RefundDomainError('Demande de remboursement introuvable');

  if (refund.status !== 'REQUESTED' && refund.status !== 'UNDER_REVIEW') {
    throw new RefundDomainError(`Impossible d'approuver un remboursement au statut '${refund.status}'`);
  }

  refund.status = 'APPROVED';
  refund.approvedBy = approvedBy;
  refund.updatedAt = new Date().toISOString();
  if (adminNotes) {
    refund.metadata = { ...(refund.metadata || {}), adminNotes };
  }

  await persistRefundUpdate(refund);
  return refund;
}

/**
 * Rejette une demande de remboursement.
 */
export async function rejectRefund(params: RejectRefundParams): Promise<RefundItem> {
  const { refundId, rejectedBy, reason } = params;
  const refund = await getRefundById(refundId);
  if (!refund) throw new RefundDomainError('Demande de remboursement introuvable');

  if (['PAID', 'INITIALIZED', 'REJECTED'].includes(refund.status)) {
    throw new RefundDomainError(`Impossible de rejeter un remboursement au statut '${refund.status}'`);
  }

  refund.status = 'REJECTED';
  refund.rejectedBy = rejectedBy;
  refund.rejectionReason = reason;
  refund.updatedAt = new Date().toISOString();

  await persistRefundUpdate(refund);
  return refund;
}

/**
 * Exécute financièrement un remboursement approuvé (soit Wallet Interne, soit Moneroo Payout).
 * GARANTIE : Exclusivité financière stricte entre Wallet et Payout externe.
 */
export async function executeApprovedRefund(refundId: string, executedBy: string): Promise<RefundItem> {
  const refund = await getRefundById(refundId);
  if (!refund) throw new RefundDomainError('Remboursement introuvable');

  if (refund.status !== 'APPROVED') {
    throw new RefundDomainError(`Le remboursement doit être 'APPROVED' pour être exécuté (statut actuel: ${refund.status})`);
  }

  // --- BRANCHE A : Remboursement interne Portefeuille Central ---
  if (refund.mode === 'INTERNAL_WALLET') {
    const creditResult = await creditWallet({
      userId: refund.userId,
      amount: refund.amount,
      type: 'REFUND',
      source: 'refunds',
      sourceId: refund.id,
      reference: refund.reference,
      idempotencyKey: `exec_${refund.id}`,
      description: `Remboursement commande #${refund.orderId || refund.originalPaymentId.slice(0, 8)}`,
      metadata: {
        refundId: refund.id,
        originalPaymentId: refund.originalPaymentId,
        executedBy,
      },
    });

    refund.status = 'PAID';
    refund.completedAt = new Date().toISOString();
    refund.updatedAt = new Date().toISOString();
    refund.metadata = {
      ...(refund.metadata || {}),
      walletTransactionId: creditResult.transactionId,
    };

    await persistRefundUpdate(refund);
    return refund;
  }

  // --- BRANCHE B : Remboursement externe via Moneroo Payout ---
  if (refund.mode === 'EXTERNAL_PAYOUT') {
    refund.status = 'INITIALIZED';
    refund.updatedAt = new Date().toISOString();
    await persistRefundUpdate(refund);

    try {
      const payoutResult = await initMonerooPayout({
        amount: refund.amount,
        currency: refund.currency,
        method: refund.destinationDetails?.method || 'mtn_bj',
        description: `Remboursement Envol Africa ref #${refund.reference}`,
        recipient: {
          phone: refund.destinationDetails?.phone,
          country: refund.destinationDetails?.country || 'BJ',
          account_holder: refund.destinationDetails?.accountHolder,
        },
        idempotencyKey: refund.idempotencyKey || refund.reference,
        metadata: {
          refundId: refund.id,
          originalPaymentId: refund.originalPaymentId,
          userId: refund.userId,
        },
      });

      refund.providerPayoutId = payoutResult.id;
      refund.status = payoutResult.status === 'success' ? 'PAID' : 'PENDING';
      if (refund.status === 'PAID') {
        refund.completedAt = new Date().toISOString();
      }
      refund.updatedAt = new Date().toISOString();

      await persistRefundUpdate(refund);
      return refund;
    } catch (error: any) {
      refund.status = 'FAILED';
      refund.metadata = {
        ...(refund.metadata || {}),
        failureError: error?.message || 'Échec initialisation Payout',
      };
      refund.updatedAt = new Date().toISOString();
      await persistRefundUpdate(refund);
      throw error;
    }
  }

  // --- BRANCHE C : Manuel opérateur ---
  if (refund.mode === 'MANUAL_OPERATOR') {
    refund.status = 'PENDING';
    refund.updatedAt = new Date().toISOString();
    await persistRefundUpdate(refund);
    return refund;
  }

  throw new RefundDomainError(`Mode de remboursement non supporté: ${refund.mode}`);
}

/**
 * Règlement webhook pour les payouts Moneroo (payout.success / payout.failed).
 */
export async function settlePayoutRefundWebhook(
  providerPayoutId: string,
  eventStatus: 'success' | 'failed'
): Promise<RefundItem | null> {
  const refund = await findRefundByPayoutId(providerPayoutId);
  if (!refund) return null;

  if (refund.status === 'PAID') {
    // Idempotent : déjà payé
    return refund;
  }

  if (eventStatus === 'success') {
    refund.status = 'PAID';
    refund.completedAt = new Date().toISOString();
  } else {
    refund.status = 'FAILED';
  }
  refund.updatedAt = new Date().toISOString();

  await persistRefundUpdate(refund);
  return refund;
}

export async function getRefundById(id: string): Promise<RefundItem | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data } = await supabase
      .from('financial_refunds')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (data) return mapDbRowToRefund(data);
  }
  return localRefunds.get(id) || null;
}

async function findRefundByIdempotencyKey(key: string): Promise<RefundItem | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data } = await supabase
      .from('financial_refunds')
      .select('*')
      .eq('idempotency_key', key)
      .maybeSingle();
    if (data) return mapDbRowToRefund(data);
  }
  for (const ref of localRefunds.values()) {
    if (ref.idempotencyKey === key) return ref;
  }
  return null;
}

async function findRefundByPayoutId(payoutId: string): Promise<RefundItem | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data } = await supabase
      .from('financial_refunds')
      .select('*')
      .eq('provider_payout_id', payoutId)
      .maybeSingle();
    if (data) return mapDbRowToRefund(data);
  }
  for (const ref of localRefunds.values()) {
    if (ref.providerPayoutId === payoutId) return ref;
  }
  return null;
}

async function persistRefundUpdate(refund: RefundItem): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    await supabase
      .from('financial_refunds')
      .update({
        status: refund.status,
        approved_by: refund.approvedBy,
        rejected_by: refund.rejectedBy,
        rejection_reason: refund.rejectionReason,
        provider_payout_id: refund.providerPayoutId,
        metadata: refund.metadata,
        updated_at: refund.updatedAt,
        completed_at: refund.completedAt,
      })
      .eq('id', refund.id);
  }
  localRefunds.set(refund.id, { ...refund });
}

function mapDbRowToRefund(row: Record<string, unknown>): RefundItem {
  return {
    id: String(row.id),
    reference: String(row.reference),
    originalPaymentId: String(row.original_payment_id),
    orderId: typeof row.order_id === 'string' ? row.order_id : undefined,
    userId: String(row.user_id),
    amount: Number(row.amount),
    originalAmount: Number(row.original_amount),
    currency: String(row.currency || 'XOF'),
    mode: row.mode as RefundMode,
    status: row.status as RefundStatus,
    reason: String(row.reason || ''),
    requestedBy: String(row.requested_by),
    approvedBy: typeof row.approved_by === 'string' ? row.approved_by : undefined,
    rejectedBy: typeof row.rejected_by === 'string' ? row.rejected_by : undefined,
    rejectionReason: typeof row.rejection_reason === 'string' ? row.rejection_reason : undefined,
    providerPayoutId: typeof row.provider_payout_id === 'string' ? row.provider_payout_id : undefined,
    destinationDetails: row.destination_details as RefundItem['destinationDetails'],
    idempotencyKey: typeof row.idempotency_key === 'string' ? row.idempotency_key : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
    completedAt: typeof row.completed_at === 'string' ? row.completed_at : undefined,
    metadata: (row.metadata as Record<string, unknown>) || {},
  };
}
