import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const db = readWabDB();
  const salons = (db.salons || []).slice(0, 100);
  const liveSalons = salons.filter((s) => s.status === "live");
  const reports = (db.liveReports || []).slice(0, 100);
  const withdrawals = (db.withdrawalRequests || []).slice(0, 100);
  const settings = db.liveSettings || {
    coinRateXof: 10,
    giftCommissionRate: 0.30,
    salesCommissionRate: 0.10,
    minWithdrawalXof: 5000,
    retentionDaysReplay: 30,
  };

  return NextResponse.json({
    salons,
    liveSalons,
    reports,
    withdrawals,
    settings,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { action } = body;
  const db = readWabDB();

  // 1. ARRÊT FORCÉ D'UN LIVE PAR L'ADMINISTRATEUR (PRD Section 3.3 & Lot 5)
  if (action === "force_stop_salon") {
    const { salonId, reason } = body;
    const salon = db.salons.find((s) => s.id === salonId);
    if (!salon) return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });

    salon.status = "ended";
    salon.endsAt = new Date().toISOString();
    salon.description = `[Interrompu par la modération : ${reason || "Infraction aux règles de la communauté"}] ${salon.description || ""}`;

    writeWabDB(db);
    return NextResponse.json({ success: true, message: "Le salon a été arrêté à distance.", salon });
  }

  // 2. TRAITEMENT D'UN SIGNALEMENT
  if (action === "handle_report") {
    const { reportId, decision, banTarget } = body; // decision: "approved" | "rejected"
    const report = (db.liveReports || []).find((r) => r.id === reportId);
    if (!report) return NextResponse.json({ error: "Signalement introuvable." }, { status: 404 });

    report.status = decision === "approved" ? "approved" : "rejected";
    report.resolvedAt = new Date().toISOString();

    if (decision === "approved" && banTarget) {
      const salon = db.salons.find((s) => s.id === report.salonId);
      if (salon && report.targetId) {
        if (!Array.isArray(salon.bannedUserIds)) salon.bannedUserIds = [];
        if (!salon.bannedUserIds.includes(report.targetId)) {
          salon.bannedUserIds.push(report.targetId);
        }
      }
    }

    writeWabDB(db);
    return NextResponse.json({ success: true, report });
  }

  // 3. TRAITEMENT D'UNE DEMANDE DE RETRAIT CRÉATEUR
  if (action === "handle_withdrawal") {
    const { withdrawalId, decision, notes } = body; // decision: "approved" | "rejected"
    const withdrawal = (db.withdrawalRequests || []).find((w) => w.id === withdrawalId);
    if (!withdrawal) return NextResponse.json({ error: "Demande de retrait introuvable." }, { status: 404 });

    const wallet = (db.creatorWallets || []).find((w) => w.userId === withdrawal.userId);

    if (decision === "approved") {
      withdrawal.status = "approved";
      withdrawal.processedAt = new Date().toISOString();
      withdrawal.notes = notes || "Paiement validé par la direction financière.";
      if (wallet) {
        wallet.pendingXof = Math.max(0, wallet.pendingXof - withdrawal.amountXof);
        wallet.updatedAt = new Date().toISOString();
      }
    } else {
      withdrawal.status = "rejected";
      withdrawal.processedAt = new Date().toISOString();
      withdrawal.notes = notes || "Demande refusée (coordonnées erronées ou solde contesté).";
      if (wallet) {
        // Restitution des fonds au solde disponible
        wallet.pendingXof = Math.max(0, wallet.pendingXof - withdrawal.amountXof);
        wallet.availableXof += withdrawal.amountXof;
        wallet.updatedAt = new Date().toISOString();
      }
    }

    writeWabDB(db);
    return NextResponse.json({ success: true, withdrawal, wallet });
  }

  // 4. MISE À JOUR DES PARAMÈTRES GLOBAUX DU LIVE
  if (action === "update_settings") {
    const { coinRateXof, giftCommissionRate, salesCommissionRate, minWithdrawalXof, retentionDaysReplay } = body;

    db.liveSettings = {
      coinRateXof: Math.max(1, Number(coinRateXof) || 10),
      giftCommissionRate: Math.max(0.05, Math.min(0.70, Number(giftCommissionRate) || 0.30)),
      salesCommissionRate: Math.max(0.01, Math.min(0.50, Number(salesCommissionRate) || 0.10)),
      minWithdrawalXof: Math.max(1000, Number(minWithdrawalXof) || 5000),
      retentionDaysReplay: Math.max(1, Number(retentionDaysReplay) || 30),
    };

    writeWabDB(db);
    return NextResponse.json({ success: true, settings: db.liveSettings });
  }

  return NextResponse.json({ error: "Action non reconnue." }, { status: 400 });
}
