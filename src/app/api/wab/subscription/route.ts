import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { initMonerooPayment, verifyMonerooPayment } from "@/lib/moneroo";
import { getActiveWabBusinessSubscription, readWabSubscriptions, writeWabSubscriptions, type WabSubscription } from "@/lib/wab-subscriptions";

const AMOUNT_XOF = 5000;

function success(status: unknown) { return typeof status === "string" && ["success", "succeeded", "paid", "confirmed"].includes(status.toLowerCase()); }

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ subscription: null }, { status: 401 });
  return NextResponse.json({ subscription: getActiveWabBusinessSubscription(user.id) });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour activer le compte Entreprise WAB." }, { status: 401 });
  const existing = getActiveWabBusinessSubscription(user.id);
  if (existing) return NextResponse.json({ subscription: existing, active: true });
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const pending: WabSubscription = { id, userId: user.id, planId: "wab-business", amountXof: AMOUNT_XOF, currency: "XOF", status: "pending", createdAt: now };
  const items = readWabSubscriptions();
  writeWabSubscriptions([pending, ...items]);
  try {
    const payment = await initMonerooPayment({ amount: AMOUNT_XOF, currency: "XOF", description: "Compte Entreprise WAB — abonnement mensuel", customer: { email: user.email, first_name: user.prenom, last_name: user.nom, phone: user.phone }, return_url: `${request.nextUrl.origin}/wab?wab_subscription_id=${id}&verify=1`, metadata: { product: "wab-business", wab_subscription_id: id, user_id: user.id, amount_xof: AMOUNT_XOF } });
    const next = readWabSubscriptions().map((item) => item.id === id ? { ...item, paymentId: payment.id } : item);
    writeWabSubscriptions(next);
    return NextResponse.json({ checkout_url: payment.checkout_url, subscriptionId: id, mock: payment.mock === true });
  } catch (error) {
    writeWabSubscriptions(readWabSubscriptions().map((item) => item.id === id ? { ...item, status: "failed" as const } : item));
    return NextResponse.json({ error: error instanceof Error ? error.message : "Paiement WAB indisponible." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json();
  const subscriptionId = typeof body.subscriptionId === "string" ? body.subscriptionId : "";
  const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
  const item = readWabSubscriptions().find((candidate) => candidate.id === subscriptionId && candidate.userId === user.id);
  if (!item || !paymentId || (item.paymentId && item.paymentId !== paymentId)) return NextResponse.json({ error: "Abonnement ou paiement WAB invalide." }, { status: 403 });
  const verification = await verifyMonerooPayment(paymentId);
  if (!success(verification.status)) return NextResponse.json({ success: false, error: "Paiement WAB non confirmé.", verification }, { status: 402 });
  const start = new Date();
  const end = new Date(start); end.setMonth(end.getMonth() + 1);
  const active: WabSubscription = { ...item, status: "active", startDate: start.toISOString(), endDate: end.toISOString(), paymentId };
  writeWabSubscriptions(readWabSubscriptions().map((candidate) => candidate.id === item.id ? active : candidate));
  return NextResponse.json({ success: true, subscription: active });
}
