import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { WITHDRAWAL_THRESHOLD } from "@/lib/affiliation/constants";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });
  }

  const { data: affiliate, error } = await supabase
    .from("affiliates")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[api/affiliate/me] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  if (!affiliate) {
    return NextResponse.json({
      enrolled: false,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        affiliateCode: user.affiliateCode,
      },
    });
  }

  // Nombre de filleuls directs
  const { count: directCount } = await supabase
    .from("affiliates")
    .select("*", { count: "exact", head: true })
    .eq("sponsor_id", affiliate.id);

  const totalEarnings = Number(affiliate.total_earnings || 0);
  const withdrawnTotal = Number(affiliate.withdrawn_total || 0);
  const availableBalance = Math.max(0, totalEarnings - withdrawnTotal);

  return NextResponse.json({
    enrolled: true,
    affiliate: {
      id: affiliate.id,
      referralCode: affiliate.referral_code,
      level: affiliate.level,
      totalEarnings,
      withdrawnTotal,
      availableBalance,
      withdrawalThreshold: WITHDRAWAL_THRESHOLD,
      canWithdraw: availableBalance >= WITHDRAWAL_THRESHOLD,
      isRoot: affiliate.is_root,
      isFounder: affiliate.is_founder,
      isActive: affiliate.is_active,
      magazineEnrolled: affiliate.magazine_enrolled,
      marketplaceEnrolled: affiliate.marketplace_enrolled,
      directReferralsCount: directCount || 0,
      maxDirectReferrals: 5,
      createdAt: affiliate.created_at,
    },
  });
}
