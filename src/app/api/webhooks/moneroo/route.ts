import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyMonerooPayment } from "@/lib/moneroo";
import { settleAwardVoteSupabase, settleAwardRegistrationFeeSupabase, settleAwardGiftSupabase, settleAwardDonationSupabase, settleCrowdfundingContributionSupabase } from "@/lib/financial-settlement-supabase";
import { activateJobsBoostByPayment } from "@/lib/jobs-supabase";
import { activateMonerooEntitlements } from "@/lib/moneroo-entitlements";
import { activateCrowdfundingBoostByPayment, activateMarketplaceBoostByPayment } from "@/lib/wab-boost-sources";
import { settleMarketplaceOrderByPayment } from "@/lib/marketplace-digital";
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
  return typeof status === "string" && ["success", "succeeded", "paid", "confirmed", "completed"].includes(status.toLowerCase());
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
  await settleAwardVoteSupabase(metadata, paymentId);
}

async function settleCrowdfundingContribution(metadata: Record<string, unknown>, paymentId: string) {
  if (metadata.product !== "crowdfunding_contribution") return;
  await settleCrowdfundingContributionSupabase(metadata, paymentId);
}

async function settleAwardProduct(metadata: Record<string, unknown>, paymentId: string) {
  if (metadata.product === "award_registration_fee") return settleAwardRegistrationFeeSupabase(metadata, paymentId);
  if (metadata.product === "award_gift") return settleAwardGiftSupabase(metadata, paymentId);
  if (["award_donation", "award_pot_increase"].includes(String(metadata.product))) return settleAwardDonationSupabase(metadata, paymentId);
  return null;
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
    if (eventType === "payment.initiated" || eventType === "payout.initiated") {
      return NextResponse.json({ ok: true, received: true }, { status: 200 });
    }

    const metadata = (data.metadata || {}) as Record<string, unknown>;

    // Traitement centralisé des événements de décaissement (Payout / Refund externe)
    if (eventType.startsWith("payout.")) {
      const payoutId = data.id;
      const { verifyMonerooPayout } = await import("@/lib/moneroo-payout");
      const payoutVerification = await verifyMonerooPayout(payoutId);
      const isSuccess = payoutVerification.status === "success" || eventType === "payout.success";
      const isFailed = ["failed", "cancelled"].includes(payoutVerification.status) || eventType === "payout.failed";

      if (isSuccess || isFailed) {
        // 1. Traitement des remboursements externes
        const { settlePayoutRefundWebhook } = await import("@/lib/refunds/refund-service");
        const settledRefund = await settlePayoutRefundWebhook(payoutId, isSuccess ? "success" : "failed");
        if (settledRefund) {
          return NextResponse.json({ ok: true, payout_refund: settledRefund }, { status: 200 });
        }

        // 2. Traitement des retraits portefeuille
        const withdrawalId = (metadata?.withdrawal_id || metadata?.withdrawalId) as string | undefined;
        if (withdrawalId) {
          const { completeWithdrawal, rejectWithdrawal } = await import("@/lib/wallet/financial-core");
          if (isSuccess) {
            await completeWithdrawal(withdrawalId, payoutId, "moneroo_webhook", "Confirmé par Moneroo payout webhook");
            return NextResponse.json({ ok: true, withdrawal_completed: true }, { status: 200 });
          } else {
            await rejectWithdrawal(withdrawalId, "Échec du décaissement Moneroo Payout", "moneroo_webhook");
            return NextResponse.json({ ok: true, withdrawal_rejected: true }, { status: 200 });
          }
        }
      }

      return NextResponse.json({ ok: true, processed: true }, { status: 200 });
    }

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

    if (eventType === "payment.success" && metadata.product === "marketplace_order") {
      const verification = await verifyMonerooPayment(data.id);
      if (!validPaymentStatus(verification.status)) return NextResponse.json({ error: "Paiement non confirmé" }, { status: 409 });
      const result = await settleMarketplaceOrderByPayment(String(metadata.order_id || ""), data.id, Number(verification.amount ?? data.amount), String(verification.currency ?? data.currency ?? "XOF"));
      if (metadata.referral_token) {
        try {
          const { calculateMarketplaceCommission } = await import("@/lib/affiliation/marketplace");
          await calculateMarketplaceCommission({
            sourceSaleId: String(metadata.order_id || ""),
            referralToken: String(metadata.referral_token),
            saleAmount: Number(verification.amount ?? data.amount),
          });
        } catch (affError) {
          console.error("Affiliation commission settlement error:", affError);
        }
      }
      return NextResponse.json({ ok: true, marketplace: result }, { status: 200 });
    }

    if (eventType === "payment.success" && ["award_vote", "award_registration_fee", "award_gift", "award_donation", "award_pot_increase"].includes(String(metadata.product))) {
      const verification = await verifyMonerooPayment(data.id);
      if (!validPaymentStatus(verification.status)) return NextResponse.json({ error: "Paiement non confirmé" }, { status: 409 });
      if (metadata.product === "award_vote") await settleAwardVote(metadata, data.id);
      else await settleAwardProduct(metadata, data.id);
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    if (eventType === "payment.success" && (metadata.product === "wallet_deposit" || metadata.purpose === "wallet_deposit")) {
      const verification = await verifyMonerooPayment(data.id);
      if (!validPaymentStatus(verification.status)) return NextResponse.json({ error: "Paiement non confirmé" }, { status: 409 });
      const amount = Number(verification.amount ?? data.amount);
      const currency = String(verification.currency ?? data.currency ?? "XOF");
      const userId = String(metadata.user_id || "");
      if (!userId) return NextResponse.json({ error: "user_id manquant pour le dépôt de portefeuille" }, { status: 400 });
      const { settleWalletDeposit } = await import("@/lib/wallet/financial-core");
      const depositResult = await settleWalletDeposit({
        userId,
        paymentId: data.id,
        amount,
        currency,
        metadata: { ...metadata, verified: true },
      });
      return NextResponse.json({ ok: true, wallet_deposit: depositResult }, { status: 200 });
    }

    if (eventType === "payment.success" && metadata.product === "crowdfunding_contribution") {
      const verification = await verifyMonerooPayment(data.id);
      if (!validPaymentStatus(verification.status)) return NextResponse.json({ error: "Paiement non confirmé" }, { status: 409 });
      await settleCrowdfundingContribution(metadata, data.id);
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    const order = data.metadata?.order_id ? await findOrderById(data.metadata.order_id) : await findOrderByPaymentId(data.id);
    if (!order) {
      await activateMonerooEntitlements(data.id);
      return NextResponse.json({ ok: true, pending: true }, { status: 200 });
    }

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
    await activateMonerooEntitlements(String(verification.id || data.id));
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
