import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const db = readWabDB();
  const minWithdrawalXof = db.liveSettings?.minWithdrawalXof || 5000;

  let wallet = db.creatorWallets.find((w) => w.userId === user.id);
  if (!wallet) {
    wallet = {
      userId: user.id,
      availableXof: 0,
      pendingXof: 0,
      totalEarnedXof: 0,
      totalCoinsReceived: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  const withdrawals = (db.withdrawalRequests || [])
    .filter((w) => w.userId === user.id)
    .sort((a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt));

  return NextResponse.json({
    wallet,
    minWithdrawalXof,
    withdrawals,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { amountXof, paymentMethod, phoneOrAccount, operator, notes } = body;
  const amount = Number(amountXof);

  const db = readWabDB();
  const minWithdrawalXof = db.liveSettings?.minWithdrawalXof || 5000;

  let wallet = db.creatorWallets.find((w) => w.userId === user.id);
  if (!wallet || wallet.availableXof < amount) {
    return NextResponse.json(
      { error: "Solde disponible insuffisant pour ce montant de retrait." },
      { status: 400 }
    );
  }

  if (amount < minWithdrawalXof) {
    return NextResponse.json(
      { error: `Le montant minimum de retrait est de ${minWithdrawalXof.toLocaleString("fr-FR")} XOF.` },
      { status: 400 }
    );
  }

  if (!phoneOrAccount || typeof phoneOrAccount !== "string" || phoneOrAccount.trim().length < 6) {
    return NextResponse.json(
      { error: "Veuillez renseigner un numéro de téléphone Mobile Money ou coordonnées bancaires valides." },
      { status: 400 }
    );
  }

  // Débit atomique du solde disponible vers le solde en attente
  wallet.availableXof -= amount;
  wallet.pendingXof += amount;
  wallet.updatedAt = new Date().toISOString();

  const withdrawal = {
    id: uuid(),
    userId: user.id,
    amountXof: amount,
    paymentMethod: paymentMethod === "bank_transfer" ? ("bank_transfer" as const) : ("mobile_money" as const),
    phoneOrAccount: phoneOrAccount.trim(),
    operator: typeof operator === "string" ? operator.trim() : undefined,
    status: "pending" as const,
    requestedAt: new Date().toISOString(),
    notes: typeof notes === "string" ? notes.trim().slice(0, 500) : undefined,
  };

  if (!Array.isArray(db.withdrawalRequests)) db.withdrawalRequests = [];
  db.withdrawalRequests.unshift(withdrawal);

  writeWabDB(db);

  return NextResponse.json({
    success: true,
    message: "Votre demande de retrait a été enregistrée avec succès et est en cours de traitement par notre équipe financière.",
    withdrawal,
    wallet,
  });
}
