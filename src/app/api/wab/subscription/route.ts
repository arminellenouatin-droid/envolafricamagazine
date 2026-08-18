import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { initMonerooPayment, verifyMonerooPayment } from "@/lib/moneroo";
import { getActiveWabBusinessSubscription, readWabSubscriptions, writeWabSubscriptions, type WabSubscription } from "@/lib/wab-subscriptions";

const AMOUNT_XOF = 5000;

function success(status: unknown) { return typeof status === "string" && ["success", "succeeded", "paid", "confirmed"].includes(status.toLowerCase()); }

export async function GET() {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) return NextResponse.json({ subscription: null }, { status: 401 });
    return NextResponse.json({ subscription: await getActiveWabBusinessSubscription(user.id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Impossible de vérifier l’abonnement WAB." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour activer le compte Entreprise WAB." }, { status: 401 });
  try {
    const existing = await getActiveWabBusinessSubscription(user.id);
    if (existing) return NextResponse.json({ subscription: existing, active: true });
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pending: WabSubscription = { id, userId: user.id, planId: "wab-business", amountXof: AMOUNT_XOF, currency: "XOF", status: "pending", createdAt: now };
    await writeWabSubscriptions([pending]);
    try {
      const payment = await initMonerooPayment({ amount: AMOUNT_XOF, currency: "XOF", description: "Compte Entreprise WAB — abonnement mensuel", customer: { email: user.email, first_name: user.prenom, last_name: user.nom, phone: user.phone }, return_url: `${request.nextUrl.origin}/wab?wab_subscription_id=${id}&verify=1`, metadata: { product: "wab-business", wab_subscription_id: id, user_id: user.id, amount_xof: AMOUNT_XOF } });
      const current = await readWabSubscriptions(user.id);
      const saved = current.find((item) => item.id === id) ?? pending;
      await writeWabSubscriptions([{ ...saved, paymentId: payment.id }]);
      return NextResponse.json({ checkout_url: payment.checkout_url, subscriptionId: id, mock: payment.mock === true });
    } catch (error) {
      await writeWabSubscriptions([{ ...pending, status: "failed" }]);
      throw error;
    }
  } catch (error) {
    console.error("WAB subscription initialization failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Paiement WAB indisponible." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  try {
    const body = await request.json();
    const subscriptionId = typeof body.subscriptionId === "string" ? body.subscriptionId : "";
    const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
    const item = (await readWabSubscriptions(user.id)).find((candidate) => candidate.id === subscriptionId);
    if (!item || !paymentId || (item.paymentId && item.paymentId !== paymentId)) return NextResponse.json({ error: "Abonnement ou paiement WAB invalide." }, { status: 403 });
    const verification = await verifyMonerooPayment(paymentId);
    if (!success(verification.status)) return NextResponse.json({ success: false, error: "Paiement WAB non confirmé.", verification }, { status: 402 });
    const start = new Date();
    const end = new Date(start); end.setMonth(end.getMonth() + 1);
    const active: WabSubscription = { ...item, status: "active", startDate: start.toISOString(), endDate: end.toISOString(), paymentId };
    await writeWabSubscriptions([active]);
    return NextResponse.json({ success: true, subscription: active });
  } catch (error) {
    console.error("WAB subscription verification failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Vérification du paiement WAB impossible." }, { status: 503 });
  }
}
