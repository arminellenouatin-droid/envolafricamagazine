import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { calculateAndDistributeCommission } from "@/lib/affiliation/commission";

export async function POST(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("admin");
  if (error || !user) {
    return NextResponse.json({ error: error || "Non autorisé" }, { status: status || 403 });
  }

  try {
    const body = await req.json();
    const { sourceSaleId, volet = "MAGAZINE", sellerAffiliateId, amount } = body;

    if (!sourceSaleId || !sellerAffiliateId || !amount) {
      return NextResponse.json(
        { error: "sourceSaleId, sellerAffiliateId et amount requis" },
        { status: 400 }
      );
    }

    const result = await calculateAndDistributeCommission({
      sourceSaleId,
      volet,
      sellerAffiliateId,
      amount: Number(amount),
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[api/admin/commissions/process] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors du calcul de la commission" },
      { status: 500 }
    );
  }
}
