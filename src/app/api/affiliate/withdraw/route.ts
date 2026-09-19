import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requestWithdrawal, AffiliationError } from "@/lib/affiliation/enrollment";
import { WITHDRAWAL_THRESHOLD } from "@/lib/affiliation/constants";

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { amount, mobileMoneyProvider, mobileMoneyNumber } = body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    if (numAmount < WITHDRAWAL_THRESHOLD) {
      return NextResponse.json(
        { error: `Le montant minimum de retrait est de ${WITHDRAWAL_THRESHOLD.toLocaleString()} XOF.` },
        { status: 400 }
      );
    }

    if (!mobileMoneyProvider || !mobileMoneyNumber) {
      return NextResponse.json(
        { error: "Veuillez préciser l'opérateur Mobile Money et votre numéro." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });
    }

    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!affiliate) {
      return NextResponse.json(
        { error: "Vous n'avez pas de compte affilié actif." },
        { status: 400 }
      );
    }

    const withdrawal = await requestWithdrawal({
      affiliateId: affiliate.id,
      amount: numAmount,
      mobileMoneyProvider,
      mobileMoneyNumber,
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: Number(withdrawal.amount),
        provider: withdrawal.mobile_money_provider,
        number: withdrawal.mobile_money_number,
        status: withdrawal.status,
      },
      message: "Demande de retrait enregistrée avec succès. Traitement sous 24h à 48h.",
    });
  } catch (err: any) {
    if (err instanceof AffiliationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[api/affiliate/withdraw] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la demande de retrait" },
      { status: 500 }
    );
  }
}
