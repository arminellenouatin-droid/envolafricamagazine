import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readJobsDB, writeJobsDB } from "@/lib/jobs-db";
import { initMonerooPayment } from "@/lib/moneroo";
import { getPublishedJobsOfferForPayment } from "@/lib/jobs-supabase";
import { createPendingJobsUnlock, getPaidJobsUnlock } from "@/lib/jobs-payments-supabase";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connectez-vous avant de décrypter une offre." }, { status: 401 });
  const { offerId } = await request.json();
  const supabaseOffer = await getPublishedJobsOfferForPayment(offerId);
  const database = readJobsDB();
  const localOffer = database.offers.find((item) => item.id === offerId && item.status === "published");
  const offer = supabaseOffer.offer ?? localOffer;
  if (!offer) return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
  const supabaseUnlock = await getPaidJobsUnlock(user.id, offerId);
  const existing = supabaseUnlock.configured ? supabaseUnlock.unlocked : database.unlocks.some((item) => item.userId === user.id && item.offerId === offerId && item.status === "paid");
  if (existing) return NextResponse.json({ unlocked: true });

  const unlockId = uuid();
  const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  try {
    const payment = await initMonerooPayment({
      amount: 200, currency: "XOF", description: `Décryptage d'offre Jobs : ${offer.title}`,
      customer: { email: user.email, first_name: user.prenom, last_name: user.nom, phone: user.phone },
      return_url: `${origin}/emploi/offres/${offer.id}/decrypter?unlock=${unlockId}&payment_id={payment_id}`,
      metadata: { product: "jobs_offer_unlock", unlock_id: unlockId, offer_id: offer.id, user_id: user.id },
    });
    const persisted = await createPendingJobsUnlock(user.id, offerId, payment.id);
    if (persisted.configured && !persisted.unlock) return NextResponse.json({ error: "Impossible d’enregistrer le décryptage en attente." }, { status: 503 });
    if (!persisted.configured) {
      database.unlocks.push({ id: unlockId, userId: user.id, offerId, amount: 200, paymentId: payment.id, status: "pending", createdAt: new Date().toISOString() });
      writeJobsDB(database);
    }
    return NextResponse.json({ checkoutUrl: payment.checkout_url, unlockId: persisted.unlock?.id ?? unlockId, mock: payment.mock });
  } catch {
    return NextResponse.json({ error: "Le paiement ne peut pas être initialisé actuellement." }, { status: 502 });
  }
}
