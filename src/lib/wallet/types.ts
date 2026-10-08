export type WalletTransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'REFUND'
  | 'AWARD_VOTE'
  | 'AWARD_GIFT'
  | 'AWARD_DONATION'
  | 'CROWDFUNDING_DONATION'
  | 'CROWDFUNDING_INVESTMENT'
  | 'CROWDFUNDING_REPAYMENT'
  | 'CROWDFUNDING_PAYOUT'
  | 'MARKETPLACE_PAYMENT'
  | 'MARKETPLACE_INSTALLMENT'
  | 'MARKETPLACE_ESCROW_HOLD'
  | 'MARKETPLACE_ESCROW_RELEASE'
  | 'MARKETPLACE_REFUND'
  | 'AFFILIATE_COMMISSION'
  | 'PLATFORM_FEE'
  | 'PENALTY'
  | 'ADJUSTMENT'
  | 'TRANSFER';

export type TransactionDirection = 'CREDIT' | 'DEBIT';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'reversed';

export type WalletStatus = 'active' | 'frozen' | 'suspended' | 'closed';

export type HoldReason = 'marketplace_escrow' | 'crowdfunding_pledge' | 'withdrawal_pending' | 'dispute_hold';

export type HoldStatus = 'held' | 'released' | 'refunded' | 'cancelled';

export type WithdrawalMethod =
  | 'mtn_momo'
  | 'moov_money'
  | 'orange_money'
  | 'wave'
  | 'bank_transfer'
  | 'celtiis_cash';

export type WithdrawalStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  availableBalance: number;
  heldBalance: number;
  pendingBalance: number;
  status: WalletStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: WalletTransactionType;
  direction: TransactionDirection;
  amount: number;
  currency: string;
  balanceAfter: number;
  heldAfter: number;
  status: TransactionStatus;
  source: string;
  sourceId?: string;
  provider?: string;
  providerTransactionId?: string;
  idempotencyKey?: string;
  reference: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}

export interface WalletHold {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  currency: string;
  reason: HoldReason;
  reference: string;
  source: string;
  sourceId: string;
  status: HoldStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  releasedAt?: string;
}

export interface WalletWithdrawal {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  method: WithdrawalMethod;
  destinationAccount: string;
  accountHolder: string;
  status: WithdrawalStatus;
  providerPayoutId?: string;
  reference: string;
  adminNotes?: string;
  processedBy?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreditWalletParams {
  userId: string;
  amount: number;
  type: WalletTransactionType;
  source: string;
  sourceId: string;
  description: string;
  reference?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface DebitWalletParams {
  userId: string;
  amount: number;
  type: WalletTransactionType;
  source: string;
  sourceId: string;
  description: string;
  reference?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface HoldEscrowParams {
  userId: string;
  amount: number;
  reason: HoldReason;
  source: string;
  sourceId: string;
  description?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface ReleaseEscrowParams {
  holdId: string;
  recipientUserId: string;
  platformFee?: number;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface RefundEscrowParams {
  holdId: string;
  reason?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface RequestWithdrawalParams {
  userId: string;
  amount: number;
  fee?: number;
  method: WithdrawalMethod;
  destinationAccount: string;
  accountHolder: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}
