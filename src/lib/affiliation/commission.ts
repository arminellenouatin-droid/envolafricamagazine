import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  COMMISSION_RATES,
  ACTIVE_VOLETS,
  NETWORK_SHARE,
  NETWORK_SIZE_FUND_SHARE,
  CEREMONY_FUND_SHARE,
  LEVEL_RATES,
  MAX_LEVELS,
  Volet,
} from "./constants";
import { getSponsorChain } from "./matrix";

export interface SaleInput {
  sourceSaleId: string; // référence unique de la vente (ex: id de la commande)
  volet: Volet;
  sellerAffiliateId: string; // affilié qui a réalisé la vente
  amount: number; // montant total de la vente (XOF)
  when?: Date;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Point d'entrée UNIQUE pour calculer et distribuer les commissions
 * PROGRAMME MAGAZINE (MLM matrice 5x5 sur 5 niveaux).
 */
export async function calculateAndDistributeCommission(sale: SaleInput) {
  const when = sale.when ?? new Date();

  if (!ACTIVE_VOLETS.includes(sale.volet)) {
    return { skipped: true, reason: "volet_inactif_ou_exclu" as const };
  }

  const rate = COMMISSION_RATES[sale.volet];
  const commissionTotal = round2(sale.amount * rate);

  const networkShareAmount = round2(commissionTotal * NETWORK_SHARE);
  const networkSizeFundAmount = round2(commissionTotal * NETWORK_SIZE_FUND_SHARE);
  const ceremonyFundAmount = round2(commissionTotal * CEREMONY_FUND_SHARE);

  const year = when.getFullYear();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    // 1) Alimenter les deux fonds annuels de réserve
    const { data: existingNetFund } = await supabase
      .from("network_size_funds")
      .select("*")
      .eq("year", year)
      .maybeSingle();

    if (existingNetFund) {
      await supabase
        .from("network_size_funds")
        .update({
          total_amount: round2(Number(existingNetFund.total_amount || 0) + networkSizeFundAmount),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingNetFund.id);
    } else {
      await supabase.from("network_size_funds").insert({
        year,
        total_amount: networkSizeFundAmount,
        distributed: false,
      });
    }

    const { data: existingCeremonyFund } = await supabase
      .from("ceremony_funds")
      .select("*")
      .eq("year", year)
      .maybeSingle();

    if (existingCeremonyFund) {
      await supabase
        .from("ceremony_funds")
        .update({
          total_amount: round2(Number(existingCeremonyFund.total_amount || 0) + ceremonyFundAmount),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCeremonyFund.id);
    } else {
      await supabase.from("ceremony_funds").insert({
        year,
        total_amount: ceremonyFundAmount,
        distributed: false,
      });
    }

    // 2) Remonter la chaîne de parrainage (jusqu'à 5 niveaux)
    const chain = await getSponsorChain(sale.sellerAffiliateId, MAX_LEVELS);

    const distributed: { level: number; affiliateId: string; amount: number }[] = [];
    const unallocated: { level: number; amount: number; reason: string }[] = [];

    for (const { level, affiliate } of chain) {
      const levelRate = LEVEL_RATES[level];
      const amount = round2(networkShareAmount * levelRate);

      // Insérer la commission
      await supabase.from("commissions").insert({
        source_sale_id: sale.sourceSaleId,
        source_volet: sale.volet,
        sale_amount: sale.amount,
        commission_rate: rate,
        commission_total: commissionTotal,
        network_share_amount: networkShareAmount,
        network_size_fund_amount: networkSizeFundAmount,
        ceremony_fund_amount: ceremonyFundAmount,
        beneficiary_id: affiliate.id,
        level_paid: level,
        amount_paid: amount,
      });

      // Mettre à jour le solde de gains de l'affilié
      const { data: affRecord } = await supabase
        .from("affiliates")
        .select("total_earnings")
        .eq("id", affiliate.id)
        .single();

      const newEarnings = round2(Number(affRecord?.total_earnings || 0) + amount);
      await supabase
        .from("affiliates")
        .update({
          total_earnings: newEarnings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", affiliate.id);

      distributed.push({ level, affiliateId: affiliate.id, amount });
    }

    // 3) Niveaux manquants (généalogie encore jeune) => fonds système
    for (let level = chain.length + 1; level <= MAX_LEVELS; level++) {
      const levelRate = LEVEL_RATES[level];
      const amount = round2(networkShareAmount * levelRate);

      await supabase.from("unallocated_funds").insert({
        amount,
        source_sale_id: sale.sourceSaleId,
        level_missing: level,
        reason: "NIVEAU_INCOMPLET",
      });

      unallocated.push({ level, amount, reason: "NIVEAU_INCOMPLET" });
    }

    return {
      skipped: false as const,
      commissionTotal,
      networkShareAmount,
      networkSizeFundAmount,
      ceremonyFundAmount,
      distributed,
      unallocated,
    };
  }

  return { skipped: true, reason: "database_unavailable" as const };
}
