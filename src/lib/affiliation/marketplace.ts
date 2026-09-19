import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { MARKETPLACE_PLATFORM_FEE } from "./constants";
import { round2 } from "./commission";

export class MarketplaceAffiliationError extends Error {}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateToken(length = 10): string {
  let res = "";
  for (let i = 0; i < length; i++) {
    res += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return res;
}

// ============================================================================
// CÔTÉ VENDEUR
// ============================================================================

export async function enableProductAffiliation(params: {
  productId: string;
  vendorId: string;
  commissionRate: number;
}) {
  const { productId, vendorId, commissionRate } = params;

  if (commissionRate <= 0 || commissionRate >= 1) {
    throw new MarketplaceAffiliationError(
      "Le taux de commission doit être compris entre 0 et 1 (ex: 0.12 pour 12%)."
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Base de données indisponible.");

  const { data: existing } = await supabase
    .from("product_affiliations")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("product_affiliations")
      .update({
        commission_rate: commissionRate,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("product_affiliations")
    .insert({
      product_id: productId,
      vendor_id: vendorId,
      commission_rate: commissionRate,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function disableProductAffiliation(params: {
  productId: string;
  vendorId: string;
}) {
  const { productId, vendorId } = params;
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Base de données indisponible.");

  const { data: affiliation } = await supabase
    .from("product_affiliations")
    .select("*, wallets:affiliate_product_wallets(id)")
    .eq("product_id", productId)
    .maybeSingle();

  if (!affiliation) {
    throw new MarketplaceAffiliationError("Ce produit n'est pas configuré en affiliation.");
  }
  if (affiliation.vendor_id !== vendorId) {
    throw new MarketplaceAffiliationError("Vous n'êtes pas le vendeur de ce produit.");
  }
  if (affiliation.wallets && affiliation.wallets.length > 0) {
    throw new MarketplaceAffiliationError(
      `Impossible de retirer ce produit de l'affiliation : ${affiliation.wallets.length} affilié(s) l'ont déjà en portefeuille.`
    );
  }

  const { data, error } = await supabase
    .from("product_affiliations")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", affiliation.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// CÔTÉ AFFILIÉ
// ============================================================================

export async function listAffiliatableProducts() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("product_affiliations")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addProductToWallet(params: {
  affiliateId: string;
  productAffiliationId: string;
  baseUrl: string;
}) {
  const { affiliateId, productAffiliationId, baseUrl } = params;
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Base de données indisponible.");

  const { data: affiliation } = await supabase
    .from("product_affiliations")
    .select("*")
    .eq("id", productAffiliationId)
    .maybeSingle();

  if (!affiliation || !affiliation.is_active) {
    throw new MarketplaceAffiliationError("Ce produit n'est plus disponible en affiliation.");
  }

  const { data: existing } = await supabase
    .from("affiliate_product_wallets")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .eq("product_affiliation_id", productAffiliationId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const referralToken = generateToken(10);
  const referralLink = `${baseUrl}/p/${affiliation.product_id}?ref=${referralToken}`;

  const { data, error } = await supabase
    .from("affiliate_product_wallets")
    .insert({
      affiliate_id: affiliateId,
      product_affiliation_id: productAffiliationId,
      locked_commission_rate: affiliation.commission_rate,
      referral_link: referralLink,
      clicks: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeProductFromWallet(params: {
  affiliateId: string;
  walletId: string;
}) {
  const { affiliateId, walletId } = params;
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Base de données indisponible.");

  const { data: wallet } = await supabase
    .from("affiliate_product_wallets")
    .select("*")
    .eq("id", walletId)
    .maybeSingle();

  if (!wallet || wallet.affiliate_id !== affiliateId) {
    throw new MarketplaceAffiliationError("Ce produit ne se trouve pas dans votre portefeuille.");
  }

  const { error } = await supabase
    .from("affiliate_product_wallets")
    .delete()
    .eq("id", walletId);

  if (error) throw error;
  return { success: true };
}

// ============================================================================
// CALCUL COMMISSION MARKETPLACE (à la vente)
// ============================================================================

export interface MarketplaceSaleInput {
  sourceSaleId: string;
  referralToken: string;
  saleAmount: number;
}

export async function calculateMarketplaceCommission(input: MarketplaceSaleInput) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Base de données indisponible.");

  const { data: wallet } = await supabase
    .from("affiliate_product_wallets")
    .select("*")
    .ilike("referral_link", `%ref=${input.referralToken}%`)
    .maybeSingle();

  if (!wallet) {
    throw new MarketplaceAffiliationError("Lien d'affiliation marketplace introuvable ou invalide.");
  }

  const rate = Number(wallet.locked_commission_rate);
  const commissionGross = round2(input.saleAmount * rate);
  const platformFeeAmount = round2(commissionGross * MARKETPLACE_PLATFORM_FEE);
  const commissionNet = round2(commissionGross - platformFeeAmount);

  // Insérer la commission marketplace
  await supabase.from("marketplace_commissions").insert({
    source_sale_id: input.sourceSaleId,
    wallet_id: wallet.id,
    sale_amount: input.saleAmount,
    commission_rate: rate,
    commission_gross: commissionGross,
    platform_fee_amount: platformFeeAmount,
    commission_net: commissionNet,
  });

  // Créditer le portefeuille de gains unique (partagé avec le Magazine)
  const { data: affRecord } = await supabase
    .from("affiliates")
    .select("total_earnings")
    .eq("id", wallet.affiliate_id)
    .single();

  const newTotal = round2(Number(affRecord?.total_earnings || 0) + commissionNet);
  await supabase
    .from("affiliates")
    .update({
      total_earnings: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wallet.affiliate_id);

  return { commissionGross, platformFeeAmount, commissionNet, walletId: wallet.id };
}
