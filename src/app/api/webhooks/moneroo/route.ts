import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyMonerooPayment } from "@/lib/moneroo";
import { readAwardsDB, writeAwardsDB } from "@/lib/awards-db";
import { activateJobsBoostByPayment } from "@/lib/jobs-supabase";
import { activateCrowdfundingBoostByPayment, activateMarketplaceBoostByPayment } from "@/lib/wab-boost-sources";
import {
  confirmOrderPayment,
  findOrderById,
  findOrderByPaymentId,
  findUserById,
  markOrderFailed,
  ProductionDatabaseNotConfiguredError,
  recordDonation,
  updateUserSubscription,
} from "@/lib/core-db";

export const dynamic = "force-dynamic";

type WebhookData = {
  id?: string;
  status?: string;
  amount?: number | string;
  currency?: string;
  metadata?: { order_id?: string; user_id?: string } & Record<string, unknown>;
};

type WebhookEvent = {
  event?: string;
  type?: string;
  data?: WebhookData;
};

function validPaymentStatus(status: unknown) {
  return typeof status === "string" && ["success", "succeeded", "paid", "confirmed"].includes(status.toLowerCase());
}

function hasValidSignature(payload: string, receivedSignature: string, secret: string) {
  if (!receivedSignature) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(receivedSignature.trim(), "utf8");
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

async function settleAwardVote(metadata: Record<string, unknown>, paymentId: string) {
  if (metadata.product !== "award_vote") return;
  const candidateId = String(metadata.candidate_id || "");
  const competitionId = String(metadata.competition_id || "");
  const points = Math.max(1, Math.min(1000, Number(metadata.points) || 1));
  if (!candidateId || !competitionId) throw new Error("Métadonnées de vote Awards invalides");
  const db = readAwardsDB();
  if (db.votes.some((vote) => vote.payment_transaction_id === paymentId)) return;
  db.votes.push({ id: `vote_${paymentId}`, voter_id: String(metadata.user_id || "guest"), candidate_id: candidateId, competition_id: competitionId, points, payment_transaction_id: paymentId, created_at: new Date().toISOString() });
  const candidate = db.candidates.find((item) => item.id === candidateId);
  if (candidate) candidate.votes += points;
  const competition = db.competitions.find((item) => item.id === competitionId);
  if (competition) competition.votes_count = (competition.votes_count || 0) + points;
  writeAwardsDB(db);
}

async function settleSubscription(orderId: string, alreadyPaid: boolean) {
  if (alreadyPaid) return;
  const order = await findOrderById(orderId);
  if (!order || order.userId === "guest") return;
  const subscriptionItem = order.items.find((item) => item.type === "subscription");
  if (!subscriptionItem) return;
  const user = await findUserById(order.userId);
  if (!user) return;
  const now = new Date();
  const end = new Date(now);
  if (["mensuel", "entreprise", "chef_entreprise"].includes(subscriptionItem.planId || "")) end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);
  await updateUserSubscription(order.userId, {
    planId: subscriptionItem.planId || "",
    status: "active",
    startDate: now.toISOString(),
    endDate: end.toISOString(),
    firstMonth: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const receivedSignature = req.headers.get("x-moneroo-signature") || "";
    const webhookSecret = process.env.MONEROO_WEBHOOK_SECRET || "";

    if (!webhookSecret) {
      if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Webhook non configuré" }, { status: 503 });
      console.warn("webhook: MONEROO_WEBHOOK_SECRET manquant hors production");
    } else if (!hasValidSignature(payload, receivedSignature, webhookSecret)) {
      return NextResponse.json({ error: receivedSignature ? "Signature invalide" : "Signature manquante" }, { status: 403 });
    }

    let event: WebhookEvent;
    try {
      event = JSON.parse(payload) as WebhookEvent;
    } catch {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const eventType = event.event || event.type;
    const data = event.data;
    if (!eventType || !data?.id) return NextResponse.json({ error: "Payload invalide, event ou id manquant" }, { status: 400 });
    if (eventType === "payment.initiated" || eventType.startsWith("payout.")) return NextResponse.json({ ok: true }, { status: 200 });

    const metadata = (data.metadata || {}) as Record<string, unknown>;
    if (eventType === "payment.success" && (metadata.product === "marketplace_boost" || metadata.product === "crowdfunding_boost" || metadata.product === "jobs_boost")) {
      const verification = await verifyMonerooPayment(data.id);
      if (!validPaymentStatus(verification.status)) return NextResponse.json({ error: "Paiement non confirmé" }, { status: 409 });
      if (metadata.product === "marketplace_boost") {
        const result = await activateMarketplaceBoostByPayment(data.id);
        return NextResponse.json({ ok: true, boost: result }, { status: result.activated ? 200 : 409 });
      }
      if (metadata.product === "crowdfunding_boost") {
        const result = await activateCrowdfundingBoostByPayment(data.id);
        return NextResponse.json({ ok: true, boost: result }, { status: result.activated ? 200 : 409 });
      }
      if (metadata.user_id) {
        const result = await activateJobsBoostByPayment(String(metadata.user_id), data.id);
        return NextResponse.json({ ok: true, boost: result }, { status: result.activated ? 200 : 409 });
      }
    }

    const order = data.metadata?.order_id ? await findOrderById(data.metadata.order_id) : await findOrderByPaymentId(data.id);
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

    if (eventType === "payment.failed" || eventType === "payment.cancelled") {
      await markOrderFailed(order.id, data.id);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (eventType !== "payment.success") return NextResponse.json({ ok: true }, { status: 200 });
    const verification = await verifyMonerooPayment(data.id);
    if (!validPaymentStatus(verification.status)) return NextResponse.json({ error: "Paiement non confirmé" }, { status: 409 });
    const amount = Number(verification.amount ?? data.amount);
    const currency = String(verification.currency ?? data.currency ?? "").toUpperCase();
    const alreadyPaid = order.status === "paid";
    await settleAwardVote(metadata, String(verification.id || data.id));
    const confirmedOrder = await confirmOrderPayment(order, {
      providerRef: String(verification.id || data.id),
      amount,
      currency,
      payload: verification as Record<string, unknown>,
    });
    await settleSubscription(confirmedOrder.id, alreadyPaid);
    await recordDonation({ order: confirmedOrder, paymentId: String(verification.id || data.id) });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("webhook erreur", error);
    if (error instanceof ProductionDatabaseNotConfiguredError) return NextResponse.json({ error: "Base de données temporairement indisponible" }, { status: 503 });
    if (error instanceof Error && error.message.includes("ne correspond pas")) return NextResponse.json({ error: error.message }, { status: 422 });
    return NextResponse.json({ error: "Webhook non traité" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Webhook Moneroo endpoint - POST avec signature HMAC-SHA256", url: "/api/webhooks/moneroo", method: "POST", headers: ["x-moneroo-signature"] });
}
