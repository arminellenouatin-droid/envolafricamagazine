import { NextRequest, NextResponse } from "next/server";
import { readCrowdDB, writeCrowdDB, checkRetards, generateCalendrierRemboursement } from "@/lib/crowdfunding-db";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projetId = searchParams.get("projetId");
  const investisseurId = searchParams.get("investisseurId");
  checkRetards(); // Vérifie retards à chaque GET (en prod via cron)
  const db = readCrowdDB();
  let repayments = db.repayments;
  if (projetId) repayments = repayments.filter(r=>r.projetId===projetId);
  if (investisseurId) repayments = repayments.filter(r=>r.investisseurId===investisseurId);
  return NextResponse.json({ repayments });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contributionId, projetId, investisseurId, porteurId, montant, tauxInteret, dureeMois } = body;
    if (!contributionId || !projetId || !investisseurId || !montant) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    const db = readCrowdDB();
    const calendrier = generateCalendrierRemboursement(montant, tauxInteret||8, dureeMois||12);
    const newRepayments = calendrier.map((ec:any)=>({
      id: uuidv4(),
      contributionId,
      projetId,
      investisseurId,
      porteurId: porteurId||"porteur",
      datePrevue: ec.date,
      capital: ec.capital,
      interet: ec.interet,
      total: ec.total,
      statut: "prevu" as const,
      retardJours: 0,
      montantRetard: 0,
      emailEnvoye: false
    }));
    db.repayments.push(...newRepayments);
    writeCrowdDB(db);

    // En prod: envoyer email automatique via Resend à l'investisseur avec calendrier
    // + créer tâche cron pour vérifier retards quotidiennement et envoyer email auto si retard
    
    return NextResponse.json({ success: true, repayments: newRepayments, calendrier });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Marquer un remboursement comme payé
  const body = await req.json();
  const { id, statut } = body;
  const db = readCrowdDB();
  const rep = db.repayments.find(r=>r.id===id);
  if (!rep) return NextResponse.json({ error: "Remboursement introuvable" }, { status: 404 });
  rep.statut = statut||"paye";
  if (statut==="paye") (rep as any).datePayee = new Date().toISOString();
  writeCrowdDB(db);
  return NextResponse.json({ success: true, repayment: rep });
}
