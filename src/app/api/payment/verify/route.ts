import { NextRequest, NextResponse } from "next/server";
import { verifyMonerooPayment } from "@/lib/moneroo";
import { confirmOrderPayment, findOrderById, findUserById, recordDonation, updateUserSubscription, ProductionDatabaseNotConfiguredError } from "@/lib/core-db";

function isSuccessStatus(status: unknown) {
  return typeof status === "string" && ["success", "succeeded", "paid", "confirmed"].includes(status.toLowerCase());
}

async function verifyAndConfirm(orderId: string, requestedPaymentId?: string) {
  const order = await findOrderById(orderId);
  if (!order) return { response: NextResponse.json({ error: "Commande introuvable" }, { status: 404 }) };

  const paymentId = requestedPaymentId || order.paymentId;
  if (!paymentId) return { response: NextResponse.json({ error: "paymentId manquant" }, { status: 400 }) };
  if (order.paymentId && paymentId !== order.paymentId) return { response: NextResponse.json({ error: "Paiement non associé à cette commande" }, { status: 403 }) };

  const alreadyPaid = order.status === "paid";
  const verification = await verifyMonerooPayment(paymentId);
  if (!isSuccessStatus(verification.status)) {
    return { response: NextResponse.json({ success: false, order, verification }, { status: 402 }) };
  }

  const verifiedAmount = verification.mock ? order.total : Number(verification.amount);
  const verifiedCurrency = verification.mock ? order.currency : String(verification.currency || "").toUpperCase();
  const providerRef = String(verification.id || paymentId);
  const confirmedOrder = await confirmOrderPayment(order, {
    providerRef,
    amount: verifiedAmount,
    currency: verifiedCurrency,
    payload: verification as Record<string, unknown>,
  });

  const subscriptionItem = confirmedOrder.items.find((item) => item.type === "subscription");
  if (!alreadyPaid && subscriptionItem && confirmedOrder.userId !== "guest") {
    const user = await findUserById(confirmedOrder.userId);
    if (user) {
      const now = new Date();
      const end = new Date(now);
      if (["mensuel", "entreprise", "chef_entreprise"].includes(subscriptionItem.planId || "")) end.setMonth(end.getMonth() + 1);
      else end.setFullYear(end.getFullYear() + 1);
      await updateUserSubscription(confirmedOrder.userId, {
        planId: subscriptionItem.planId || "",
        status: "active",
        startDate: now.toISOString(),
        endDate: end.toISOString(),
        firstMonth: true,
      });
    }
  }

  await recordDonation({ order: confirmedOrder, paymentId: providerRef });
  return { response: NextResponse.json({ success: true, order: confirmedOrder, verification }) };
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId requis" }, { status: 400 });
    return (await verifyAndConfirm(String(orderId), paymentId ? String(paymentId) : undefined)).response;
  } catch (error) {
    console.error(error);
    if (error instanceof ProductionDatabaseNotConfiguredError) return NextResponse.json({ error: "Base de données temporairement indisponible" }, { status: 503 });
    if (error instanceof Error && error.message.includes("ne correspond pas")) return NextResponse.json({ error: error.message }, { status: 422 });
    return NextResponse.json({ error: "Erreur verification" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get("order_id");
    const paymentId = req.nextUrl.searchParams.get("payment_id");
    if (!orderId) return NextResponse.json({ error: "orderId requis" }, { status: 400 });
    return (await verifyAndConfirm(orderId, paymentId || undefined)).response;
  } catch (error) {
    console.error(error);
    if (error instanceof ProductionDatabaseNotConfiguredError) return NextResponse.json({ error: "Base de données temporairement indisponible" }, { status: 503 });
    return NextResponse.json({ error: "Erreur verification" }, { status: 500 });
  }
}
