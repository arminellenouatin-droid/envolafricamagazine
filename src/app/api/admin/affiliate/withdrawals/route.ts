import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { listWithdrawalsForAdmin, processWithdrawalAction } from "@/lib/affiliation/service";

export async function GET(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("admin");
  if (error || !user) {
    return NextResponse.json({ error: error || "Non autorisé" }, { status: status || 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get("status") || "ALL";

    const withdrawals = await listWithdrawalsForAdmin(filterStatus);
    return NextResponse.json({ withdrawals });
  } catch (err: any) {
    console.error("[api/admin/affiliate/withdrawals GET] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("admin");
  if (error || !user) {
    return NextResponse.json({ error: error || "Non autorisé" }, { status: status || 403 });
  }

  try {
    const body = await req.json();
    const { withdrawalId, action } = body;

    if (!withdrawalId || !["PAID", "REJECTED", "APPROVED"].includes(action)) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const updated = await processWithdrawalAction(withdrawalId, action);

    return NextResponse.json({
      success: true,
      withdrawal: updated,
      message:
        action === "PAID"
          ? "Retrait marqué comme payé avec succès."
          : action === "REJECTED"
          ? "Demande rejetée. Le montant a été recrédité sur le solde disponible de l'affilié."
          : "Demande approuvée.",
    });
  } catch (err: any) {
    console.error("[api/admin/affiliate/withdrawals POST] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors du traitement du retrait" },
      { status: 500 }
    );
  }
}
