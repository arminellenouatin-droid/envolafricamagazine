import { Volet } from "./constants";

export interface AffiliateRecord {
  id: string;
  userId: string;
  sponsorId: string | null;
  referralCode: string;
  level: number;
  totalEarnings: number;
  withdrawnTotal: number;
  isRoot: boolean;
  isFounder: boolean;
  isActive: boolean;
  magazineEnrolled: boolean;
  marketplaceEnrolled: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role?: string;
  };
  directReferralsCount?: number;
}

export interface CommissionRecord {
  id: string;
  sourceSaleId: string;
  sourceVolet: Volet;
  saleAmount: number;
  commissionRate: number;
  commissionTotal: number;
  networkShareAmount: number;
  networkSizeFundAmount: number;
  ceremonyFundAmount: number;
  beneficiaryId: string;
  levelPaid: number;
  amountPaid: number;
  createdAt: string;
  beneficiary?: AffiliateRecord;
}

export interface UnallocatedFundRecord {
  id: string;
  amount: number;
  sourceSaleId: string;
  levelMissing: number;
  reason: string;
  createdAt: string;
}

export interface AnnualFundRecord {
  id: string;
  year: number;
  totalAmount: number;
  distributed: boolean;
  updatedAt: string;
}

export interface WithdrawalRecord {
  id: string;
  affiliateId: string;
  amount: number;
  mobileMoneyProvider: string;
  mobileMoneyNumber: string;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  createdAt: string;
  processedAt: string | null;
  affiliate?: AffiliateRecord;
}

export interface TreeNode {
  id: string;
  referralCode: string;
  level: number;
  userName: string;
  userEmail: string;
  totalEarnings: number;
  directCount: number;
  magazineEnrolled: boolean;
  marketplaceEnrolled: boolean;
  isFounder: boolean;
  children: TreeNode[];
}

export interface AffiliateStats {
  totalAffiliates: number;
  magazineAffiliates: number;
  marketplaceAffiliates: number;
  totalCommissionsGenerated: number;
  totalDistributedToNetwork: number;
  networkSizeFundTotal: number;
  ceremonyFundTotal: number;
  unallocatedFundTotal: number;
  totalPendingWithdrawals: number;
  pendingWithdrawalsCount: number;
  totalPaidWithdrawals: number;
}
