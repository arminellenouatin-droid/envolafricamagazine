import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { generateReferralCode, canAcceptDirectReferral } from "./matrix";
import { WITHDRAWAL_THRESHOLD } from "./constants";

export class AffiliationError extends Error {}

export type AffiliationProgram = "MAGAZINE" | "MARKETPLACE";

/**
 * Inscrit un utilisateur à l'affiliation. Un compte unique par utilisateur,
 * avec sélection possible de Magazine et/ou Marketplace.
 */
export async function enrollAffiliate(params: {
  userId: string;
  programs: AffiliationProgram[];
  referralCode?: string;
  isRootByAdmin?: boolean;
  isFounder?: boolean;
  customReferralCode?: string;
}) {
  const {
    userId,
    programs,
    referralCode,
    isRootByAdmin = false,
    isFounder = false,
    customReferralCode,
  } = params;

  if (programs.length === 0) {
    throw new AffiliationError(
      "Sélectionnez au moins un programme d'affiliation (Magazine et/ou Marketplace)."
    );
  }

  const wantsMagazine = programs.includes("MAGAZINE");
  const wantsMarketplace = programs.includes("MARKETPLACE");

  if (wantsMagazine && !isRootByAdmin && !referralCode) {
    throw new AffiliationError(
      "Un code de parrainage est obligatoire pour rejoindre le programme Magazine."
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Base de données indisponible.");

  // Vérifier si un compte affilié existe déjà
  const { data: existingAffiliate } = await supabase
    .from("affiliates")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  let sponsor = null;
  let level = existingAffiliate?.level ?? 0;

  if (wantsMagazine && referralCode) {
    const { data: foundSponsor } = await supabase
      .from("affiliates")
      .select("*")
      .eq("referral_code", referralCode.trim().toUpperCase())
      .maybeSingle();

    if (!foundSponsor) {
      throw new AffiliationError("Code de parrainage invalide.");
    }
    if (!foundSponsor.is_active) {
      throw new AffiliationError("Ce parrain n'est plus actif.");
    }

    const canAccept = await canAcceptDirectReferral(foundSponsor.id);
    if (!canAccept) {
      throw new AffiliationError(
        "Ce parrain a déjà atteint son maximum de 5 filleuls directs (matrice 5x5)."
      );
    }

    sponsor = foundSponsor;
    level = foundSponsor.level + 1;
  }

  const finalCode = customReferralCode?.trim().toUpperCase() || generateReferralCode();

  if (!existingAffiliate) {
    const { data, error } = await supabase
      .from("affiliates")
      .insert({
        user_id: userId,
        sponsor_id: wantsMagazine ? sponsor?.id ?? null : null,
        referral_code: finalCode,
        level: wantsMagazine ? level : 0,
        is_root: isRootByAdmin,
        is_founder: isFounder,
        is_active: true,
        magazine_enrolled: wantsMagazine,
        marketplace_enrolled: wantsMarketplace,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new AffiliationError("Ce code d'affilié existe déjà.");
      }
      throw error;
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from("affiliates")
      .update({
        sponsor_id:
          wantsMagazine && !existingAffiliate.sponsor_id
            ? sponsor?.id ?? existingAffiliate.sponsor_id
            : existingAffiliate.sponsor_id,
        level: wantsMagazine && !existingAffiliate.sponsor_id ? level : existingAffiliate.level,
        magazine_enrolled: existingAffiliate.magazine_enrolled || wantsMagazine,
        marketplace_enrolled: existingAffiliate.marketplace_enrolled || wantsMarketplace,
        is_root: isRootByAdmin || existingAffiliate.is_root,
        is_founder: isFounder || existingAffiliate.is_founder,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingAffiliate.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Crée une demande de retrait Mobile Money (seuil minimal 10 000 XOF).
 */
export async function requestWithdrawal(params: {
  affiliateId: string;
  amount: number;
  mobileMoneyProvider: string;
  mobileMoneyNumber: string;
}) {
  const { affiliateId, amount, mobileMoneyProvider, mobileMoneyNumber } = params;

  if (amount <= 0) {
    throw new AffiliationError("Montant invalide.");
  }
  if (!mobileMoneyProvider?.trim() || !mobileMoneyNumber?.trim()) {
    throw new AffiliationError("Fournisseur et numéro Mobile Money requis.");
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Base de données indisponible.");

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("*")
    .eq("id", affiliateId)
    .single();

  if (!affiliate) throw new AffiliationError("Affilié introuvable.");

  const available = Number(affiliate.total_earnings || 0) - Number(affiliate.withdrawn_total || 0);

  if (available < WITHDRAWAL_THRESHOLD) {
    throw new AffiliationError(
      `Solde insuffisant. Le seuil de retrait minimal est de ${WITHDRAWAL_THRESHOLD.toLocaleString()} XOF (solde actuel : ${available.toLocaleString()} XOF).`
    );
  }
  if (amount > available) {
    throw new AffiliationError(
      `Montant demandé supérieur au solde disponible (${available.toLocaleString()} XOF).`
    );
  }

  // Créer la demande de retrait
  const { data: withdrawal, error: wError } = await supabase
    .from("withdrawals")
    .insert({
      affiliate_id: affiliateId,
      amount,
      mobile_money_provider: mobileMoneyProvider.trim(),
      mobile_money_number: mobileMoneyNumber.trim(),
      status: "PENDING",
    })
    .select()
    .single();

  if (wError) throw wError;

  // Réserver le montant (incrémenter withdrawn_total)
  const newWithdrawnTotal = Number(affiliate.withdrawn_total || 0) + amount;
  await supabase
    .from("affiliates")
    .update({
      withdrawn_total: newWithdrawnTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", affiliateId);

  return withdrawal;
}
