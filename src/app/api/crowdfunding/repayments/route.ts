import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readCrowdDB, writeCrowdDB, checkRetards, generateCalendrierRemboursement } from "@/lib/crowdfunding-db";
import { processWalletLoanRepayment } from "@/lib/crowdfunding/crowdfunding-service";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projetId = searchParams.get("projetId");
  const investisseurId = searchParams.get("investisseurId");
  checkRetards(); // Vérifie retards à chaque GET (en prod via cron)
  const db = readCrowdDB();
  let repayments = db.repayments;
  if (projetId) repayments = repayments.filter((r) => r.projetId === projetId);
  if (investisseurId) repayments = repayments.filter((r) => r.investisseurId === investisseurId);
  return NextResponse.json({ repayments });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const body = await req.json();
    const { contributionId, projetId, investisseurId, porteurId, montant, tauxInteret, dureeMois } = body;
    if (!contributionId || !projetId || !investisseurId || !montant) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    const db = readCrowdDB();
    const calendrier = generateCalendrierRemboursement(montant, tauxInteret || 8, dureeMois || 12);
    const newRepayments = calendrier.map((ec: any) => ({
      id: uuidv4(),
      contributionId,
      projetId,
      investisseurId,
      porteurId: porteurId || user.id,
      datePrevue: ec.date,
      capital: ec.capital,
      interet: ec.interet,
      total: ec.total,
      statut: "prevu" as const,
      retardJours: 0,
      montantRetard: 0,
      emailEnvoye: false,
    }));
    db.repayments.push(...newRepayments);
    writeCrowdDB(db);

    return NextResponse.json({ success: true, repayments: newRepayments, calendrier });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise pour régler une échéance" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, use_wallet = true } = body;

  if (!id) {
    return NextResponse.json({ error: "Identifiant d'échéance manquant" }, { status: 400 });
  }

  // RÈGLEMENT ATOMIQUE VIA LE PORTEFEUILLE CENTRAL DU PORTEUR
  if (use_wallet) {
    try {
      const result = await processWalletLoanRepayment({
        porteurUserId: user.id,
        repaymentId: id,
      });

      return NextResponse.json({
        success: true,
        repaymentId: result.repaymentId,
        amount: result.amount,
        paidAt: result.paidAt,
        investisseurId: result.investisseurId,
        message: "Échéance remboursée avec succès depuis votre portefeuille et créditée à l'investisseur !",
      });
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || "Échec du règlement de l'échéance via le portefeuille" },
        { status: 400 }
      );
    }
  }

  // Fallback administratif
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Seul un administrateur peut forcer le statut sans débit" }, { status: 403 });
  }

  const db = readCrowdDB();
  const rep = db.repayments.find((r) => r.id === id);
  if (!rep) return NextResponse.json({ error: "Remboursement introuvable" }, { status: 404 });
  rep.statut = "paye";
  rep.datePayee = new Date().toISOString();
  rep.retardJours = 0;
  writeCrowdDB(db);
  return NextResponse.json({ success: true, repayment: rep });
}
