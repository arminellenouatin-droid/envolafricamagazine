import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { AffiliateRecord, AffiliateStats, WithdrawalRecord } from "./types";
import { enrollAffiliate } from "./enrollment";

export async function getAffiliateStats(): Promise<AffiliateStats> {
  const supabase = getSupabaseAdmin();
  const defaultStats: AffiliateStats = {
    totalAffiliates: 0,
    magazineAffiliates: 0,
    marketplaceAffiliates: 0,
    totalCommissionsGenerated: 0,
    totalDistributedToNetwork: 0,
    networkSizeFundTotal: 0,
    ceremonyFundTotal: 0,
    unallocatedFundTotal: 0,
    totalPendingWithdrawals: 0,
    pendingWithdrawalsCount: 0,
    totalPaidWithdrawals: 0,
  };

  if (!supabase) return defaultStats;

  try {
    // 1. Affiliates counts
    const { data: affiliates } = await supabase
      .from("affiliates")
      .select("id, magazine_enrolled, marketplace_enrolled");

    const totalAffiliates = affiliates?.length || 0;
    const magazineAffiliates = affiliates?.filter((a) => a.magazine_enrolled).length || 0;
    const marketplaceAffiliates = affiliates?.filter((a) => a.marketplace_enrolled).length || 0;

    // 2. Commissions totals
    const { data: commissions } = await supabase
      .from("commissions")
      .select("commission_total, network_share_amount, amount_paid");

    const totalCommissionsGenerated = commissions?.reduce(
      (sum, c) => sum + Number(c.commission_total || 0),
      0
    ) || 0;

    const totalDistributedToNetwork = commissions?.reduce(
      (sum, c) => sum + Number(c.amount_paid || 0),
      0
    ) || 0;

    // 3. Reserve funds
    const { data: netFunds } = await supabase
      .from("network_size_funds")
      .select("total_amount");
    const networkSizeFundTotal = netFunds?.reduce(
      (sum, f) => sum + Number(f.total_amount || 0),
      0
    ) || 0;

    const { data: ceremFunds } = await supabase
      .from("ceremony_funds")
      .select("total_amount");
    const ceremonyFundTotal = ceremFunds?.reduce(
      (sum, f) => sum + Number(f.total_amount || 0),
      0
    ) || 0;

    const { data: unallocated } = await supabase
      .from("unallocated_funds")
      .select("amount");
    const unallocatedFundTotal = unallocated?.reduce(
      (sum, u) => sum + Number(u.amount || 0),
      0
    ) || 0;

    // 4. Withdrawals
    const { data: withdrawals } = await supabase
      .from("withdrawals")
      .select("amount, status");

    const pendingList = withdrawals?.filter((w) => w.status === "PENDING") || [];
    const totalPendingWithdrawals = pendingList.reduce(
      (sum, w) => sum + Number(w.amount || 0),
      0
    );
    const pendingWithdrawalsCount = pendingList.length;

    const paidList = withdrawals?.filter((w) => w.status === "PAID") || [];
    const totalPaidWithdrawals = paidList.reduce(
      (sum, w) => sum + Number(w.amount || 0),
      0
    );

    return {
      totalAffiliates,
      magazineAffiliates,
      marketplaceAffiliates,
      totalCommissionsGenerated: Math.round(totalCommissionsGenerated),
      totalDistributedToNetwork: Math.round(totalDistributedToNetwork),
      networkSizeFundTotal: Math.round(networkSizeFundTotal),
      ceremonyFundTotal: Math.round(ceremonyFundTotal),
      unallocatedFundTotal: Math.round(unallocatedFundTotal),
      totalPendingWithdrawals: Math.round(totalPendingWithdrawals),
      pendingWithdrawalsCount,
      totalPaidWithdrawals: Math.round(totalPaidWithdrawals),
    };
  } catch (err) {
    console.error("[service] Error computing affiliate stats:", err);
    return defaultStats;
  }
}

export async function listAffiliatesForAdmin(options: {
  search?: string;
  program?: string;
  isFounder?: boolean;
  limit?: number;
}): Promise<AffiliateRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { search, program, isFounder, limit = 100 } = options;

  let query = supabase
    .from("affiliates")
    .select("*, users:user_id(id, nom, prenom, email, role)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (program === "MAGAZINE") {
    query = query.eq("magazine_enrolled", true);
  } else if (program === "MARKETPLACE") {
    query = query.eq("marketplace_enrolled", true);
  }

  if (typeof isFounder === "boolean") {
    query = query.eq("is_founder", isFounder);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[service] Error listing affiliates:", error);
    return [];
  }

  // Obtenir le nombre de filleuls directs pour chaque affilié
  const affiliateIds = (data || []).map((a) => a.id);
  const directCountsMap: Record<string, number> = {};

  if (affiliateIds.length > 0) {
    const { data: counts } = await supabase
      .from("affiliates")
      .select("sponsor_id")
      .in("sponsor_id", affiliateIds);

    (counts || []).forEach((c) => {
      if (c.sponsor_id) {
        directCountsMap[c.sponsor_id] = (directCountsMap[c.sponsor_id] || 0) + 1;
      }
    });
  }

  let result: AffiliateRecord[] = (data || []).map((a) => ({
    id: a.id,
    userId: a.user_id,
    sponsorId: a.sponsor_id,
    referralCode: a.referral_code,
    level: a.level,
    totalEarnings: Number(a.total_earnings || 0),
    withdrawnTotal: Number(a.withdrawn_total || 0),
    isRoot: Boolean(a.is_root),
    isFounder: Boolean(a.is_founder),
    isActive: Boolean(a.is_active),
    magazineEnrolled: Boolean(a.magazine_enrolled),
    marketplaceEnrolled: Boolean(a.marketplace_enrolled),
    createdAt: a.created_at,
    updatedAt: a.updated_at,
    directReferralsCount: directCountsMap[a.id] || 0,
    user: a.users
      ? {
          id: a.users.id,
          nom: a.users.nom,
          prenom: a.users.prenom,
          email: a.users.email,
          role: a.users.role,
        }
      : undefined,
  }));

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    result = result.filter(
      (a) =>
        a.referralCode.toLowerCase().includes(term) ||
        a.user?.nom.toLowerCase().includes(term) ||
        a.user?.prenom.toLowerCase().includes(term) ||
        a.user?.email.toLowerCase().includes(term)
    );
  }

  return result;
}

export async function listWithdrawalsForAdmin(status?: string): Promise<WithdrawalRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  let query = supabase
    .from("withdrawals")
    .select("*, affiliate:affiliate_id(*, users:user_id(id, nom, prenom, email))")
    .order("created_at", { ascending: false });

  if (status && status !== "ALL") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[service] Error listing withdrawals:", error);
    return [];
  }

  return (data || []).map((w: any) => ({
    id: w.id,
    affiliateId: w.affiliate_id,
    amount: Number(w.amount),
    mobileMoneyProvider: w.mobile_money_provider,
    mobileMoneyNumber: w.mobile_money_number,
    status: w.status,
    createdAt: w.created_at,
    processedAt: w.processed_at,
    affiliate: w.affiliate
      ? {
          id: w.affiliate.id,
          userId: w.affiliate.user_id,
          sponsorId: w.affiliate.sponsor_id,
          referralCode: w.affiliate.referral_code,
          level: w.affiliate.level,
          totalEarnings: Number(w.affiliate.total_earnings || 0),
          withdrawnTotal: Number(w.affiliate.withdrawn_total || 0),
          isRoot: Boolean(w.affiliate.is_root),
          isFounder: Boolean(w.affiliate.is_founder),
          isActive: Boolean(w.affiliate.is_active),
          magazineEnrolled: Boolean(w.affiliate.magazine_enrolled),
          marketplaceEnrolled: Boolean(w.affiliate.marketplace_enrolled),
          createdAt: w.affiliate.created_at,
          updatedAt: w.affiliate.updated_at,
          user: w.affiliate.users
            ? {
                id: w.affiliate.users.id,
                nom: w.affiliate.users.nom,
                prenom: w.affiliate.users.prenom,
                email: w.affiliate.users.email,
              }
            : undefined,
        }
      : undefined,
  }));
}

export async function processWithdrawalAction(
  withdrawalId: string,
  action: "PAID" | "REJECTED" | "APPROVED"
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Base de données indisponible.");

  const { data: withdrawal } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("id", withdrawalId)
    .single();

  if (!withdrawal) throw new Error("Demande de retrait introuvable.");

  if (action === "REJECTED" && withdrawal.status === "PENDING") {
    // Si rejetée, on recrédite le montant sur le solde disponible (on soustrait du withdrawn_total)
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("withdrawn_total")
      .eq("id", withdrawal.affiliate_id)
      .single();

    if (affiliate) {
      const restored = Math.max(0, Number(affiliate.withdrawn_total || 0) - Number(withdrawal.amount));
      await supabase
        .from("affiliates")
        .update({
          withdrawn_total: restored,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.affiliate_id);
    }
  }

  const { data, error } = await supabase
    .from("withdrawals")
    .update({
      status: action,
      processed_at: new Date().toISOString(),
    })
    .eq("id", withdrawalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createFounderByAdmin(userId: string, customCode?: string) {
  return enrollAffiliate({
    userId,
    programs: ["MAGAZINE", "MARKETPLACE"],
    isRootByAdmin: true,
    isFounder: true,
    customReferralCode: customCode,
  });
}
