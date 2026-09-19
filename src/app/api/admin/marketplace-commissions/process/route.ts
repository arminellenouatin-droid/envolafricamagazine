import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { calculateMarketplaceCommission } from "@/lib/affiliation/marketplace";

export async function POST(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("admin");
  if (error || !user) {
    return NextResponse.json({ error: error || "Non autorisé" }, { status: status || 403 });
  }

  try {
    const body = await req.json();
    const { sourceSaleId, referralToken, saleAmount } = body;

    if (!sourceSaleId || !referralToken || !saleAmount) {
      return NextResponse.json(
        { error: "sourceSaleId, referralToken et saleAmount requis" },
        { status: 400 }
      );
    }

    const result = await calculateMarketplaceCommission({
      sourceSaleId,
      referralToken,
      saleAmount: Number(saleAmount),
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[api/admin/marketplace-commissions/process] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors du calcul marketplace" },
      { status: 500 }
    );
  }
}
