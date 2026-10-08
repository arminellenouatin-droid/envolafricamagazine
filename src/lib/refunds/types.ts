/**
 * Types et interfaces pour le domaine centralisé des Remboursements (Refunds).
 */

export type RefundStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'INITIALIZED'
  | 'PENDING'
  | 'PAID'
  | 'REJECTED'
  | 'FAILED';

export type RefundMode =
  | 'INTERNAL_WALLET'   // Crédit direct dans le Portefeuille Central
  | 'EXTERNAL_PAYOUT'   // Décaissement direct Moneroo Payout (MTN / Moov)
  | 'MANUAL_OPERATOR';  // Traitement manuel par l'équipe financière (ex: Celtiis Cash)

export interface RefundItem {
  id: string;
  reference: string;
  originalPaymentId: string;
  orderId?: string;
  userId: string;
  amount: number;
  originalAmount: number;
  currency: string;
  mode: RefundMode;
  status: RefundStatus;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  providerPayoutId?: string;
  destinationDetails?: {
    method?: string;
    phone?: string;
    accountHolder?: string;
    country?: string;
  };
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface RequestRefundParams {
  originalPaymentId: string;
  orderId?: string;
  userId: string;
  amount: number;
  originalAmount: number;
  currency?: string;
  mode?: RefundMode;
  reason: string;
  requestedBy: string;
  idempotencyKey?: string;
  destinationDetails?: RefundItem['destinationDetails'];
  metadata?: Record<string, unknown>;
}

export interface ApproveRefundParams {
  refundId: string;
  approvedBy: string;
  adminNotes?: string;
}

export interface RejectRefundParams {
  refundId: string;
  rejectedBy: string;
  reason: string;
}

export interface ExecuteRefundParams {
  refundId: string;
  executedBy: string;
}
