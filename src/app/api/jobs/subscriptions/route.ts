import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { EMPLOYER_PLANS, JOB_SEEKER_PLANS, readJobsDB, writeJobsDB } from "@/lib/jobs-db";
import { initMonerooPayment } from "@/lib/moneroo";
import { createPendingJobsSubscription } from "@/lib/jobs-payments-supabase";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour choisir un abonnement Jobs." }, { status: 401 });
  const { planId, audience } = await request.json();
  if (audience !== "candidate" && audience !== "employer") return NextResponse.json({ error: "Type de compte invalide." }, { status: 400 });
  const plan = (audience === "candidate" ? JOB_SEEKER_PLANS : EMPLOYER_PLANS).find((item) => item.id === planId);
  if (!plan) return NextResponse.json({ error: "Plan introuvable." }, { status: 404 });
  const subscriptionId = uuid();
  const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  try {
    const payment = await initMonerooPayment({
      amount: plan.price, currency: "XOF", description: `Envol Africa Jobs — ${plan.label}`,
      customer: { email: user.email, first_name: user.prenom, last_name: user.nom, phone: user.phone },
      return_url: `${origin}/emploi/abonnements?subscription=${subscriptionId}`,
      methods: ["card", "mtn_bj", "moov_bj", "mtn_ci", "orange_ci", "wave", "orange_sn"],
      metadata: { product: "jobs_subscription", subscription_id: subscriptionId, plan_id: plan.id, audience, user_id: user.id },
    });
    const persisted = await createPendingJobsSubscription(user.id, audience, plan.id, plan.price, payment.id);
    if (persisted.configured && !persisted.subscription) return NextResponse.json({ error: "Impossible d’enregistrer l’abonnement en attente." }, { status: 503 });
    if (!persisted.configured) {
      const database = readJobsDB();
      database.subscriptions.push({ id: subscriptionId, userId: user.id, audience, planId: plan.id, amount: plan.price, paymentId: payment.id, status: "pending", createdAt: new Date().toISOString() });
      writeJobsDB(database);
    }
    return NextResponse.json({ checkoutUrl: payment.checkout_url, subscriptionId: persisted.subscription?.id ?? subscriptionId });
  } catch { return NextResponse.json({ error: "Le paiement ne peut pas être initialisé actuellement." }, { status: 502 }); }
}
