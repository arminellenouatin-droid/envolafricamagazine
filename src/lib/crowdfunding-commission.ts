import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type CrowdfundingFundingType = "angel" | "reward" | "equity" | "lending" | "don" | "prise_part" | "pret";

export function normalizeFundingType(value: unknown): CrowdfundingFundingType {
  const type = String(value || "don");
  if (type === "angel" || type === "reward" || type === "equity" || type === "lending" || type === "don" || type === "prise_part" || type === "pret") return type;
  return "don";
}

export function calculateCommission(grossAmount: number, ratePercent: number) {
  const gross = Math.max(0, Math.round(Number(grossAmount) || 0));
  const rate = Math.max(0, Math.min(100, Number(ratePercent) || 0));
  const commission = Math.round(gross * rate / 100);
  return { grossAmount: gross, commissionRate: rate, commissionAmount: commission, netAmount: Math.max(0, gross - commission) };
}

export async function getCommissionRate(fundingType: unknown) {
  const client = getSupabaseAdmin();
  const normalized = normalizeFundingType(fundingType);
  if (!client) return { configured: false as const, fundingType: normalized, ratePercent: 4 };
  const { data, error } = await client.from("crowdfunding_commission_rates").select("funding_type,rate_percent").eq("funding_type", normalized).eq("active", true).maybeSingle();
  if (error) throw error;
  return { configured: true as const, fundingType: normalized, ratePercent: Number(data?.rate_percent ?? 4) };
}
