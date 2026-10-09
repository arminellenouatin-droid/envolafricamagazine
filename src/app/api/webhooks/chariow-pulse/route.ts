import { NextRequest, NextResponse } from "next/server";
import { verifyPulseSignature } from "@/lib/chariow";
import {
  confirmOrderPayment,
  findOrderById,
  recordDonation,
  updateUserSubscription,
} from "@/lib/core-db";
import {
  settleAwardVoteSupabase,
  settleAwardRegistrationFeeSupabase,
  settleAwardGiftSupabase,
  settleAwardDonationSupabase,
  settleCrowdfundingContributionSupabase,
} from "@/lib/financial-settlement-supabase";
import { settleMarketplaceOrderByPayment } from "@/lib/marketplace-digital";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { settleWalletDeposit } from "@/lib/wallet/financial-core";

export const dynamic = "force-dynamic";

// Cache mémoire d'idempotence pour dédoublonner les livraisons Pulse répétées
const processedDeliveryIds = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    // 1. Capture impérative du raw body avant tout parsing JSON (Règle Chariow Pulse)
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-chariow-signature");
    const deliveryId = req.headers.get("x-pulse-delivery-id");
    const pulseEvent = req.headers.get("x-pulse-event") || "";

    // 2. Vérification de la signature HMAC-SHA256
    const isSignatureValid = verifyPulseSignature(rawBody, signatureHeader);
    if (!isSignatureValid) {
      // Si en production, rejet catégorique 401
      if (process.env.NODE_ENV === "production" || process.env.CHARIOW_PULSE_SIGNING_SECRET) {
        return NextResponse.json(
          { error: "Signature Pulse invalide ou absente" },
          { status: 401 }
        );
      }
      console.warn("Chariow Pulse: signature ignorée en environnement dev sans clé");
    }

    // 3. Déduplication par Idempotence (x-pulse-delivery-id)
    if (deliveryId) {
      if (processedDeliveryIds.has(deliveryId)) {
        return NextResponse.json({ status: "already_processed", deliveryId }, { status: 200 });
      }
      processedDeliveryIds.add(deliveryId);
      // Nettoyage périodique pour éviter toute fuite mémoire
      if (processedDeliveryIds.size > 5000) {
        const first = Array.from(processedDeliveryIds).slice(0, 1000);
        first.forEach((id) => processedDeliveryIds.delete(id));
      }
    }

    // 4. Analyse du payload JSON
    let payload: any = null;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    }

    const eventName = pulseEvent || payload?.event || "";
    // Chariow Pulse utilise "successful.sale" pour les ventes confirmées
    if (eventName !== "successful.sale" && eventName !== "sale.completed") {
      return NextResponse.json(
        { status: "ignored_event", event: eventName },
        { status: 200 }
      );
    }

    const saleData = payload?.data?.purchase || payload?.data || {};
    const saleId = saleData?.id || payload?.data?.sale_id || "chariow_" + Date.now();
    const customMetadata = saleData?.custom_metadata || payload?.custom_metadata || {};
    const buyerEmail = saleData?.customer?.email || "";
    const amountVal = saleData?.amount?.value || 0;
    const currency = saleData?.amount?.currency || "XOF";

    const orderId = (customMetadata.order_id || customMetadata.order_ref || "").trim();
    const userId = (customMetadata.user_id || "").trim();
    const productType = (customMetadata.product || customMetadata.type || "").trim();

    // 5. Exécution des règlements selon le type de produit
    if (productType === "award_vote") {
      await settleAwardVoteSupabase(customMetadata, saleId);
    } else if (productType === "crowdfunding_contribution") {
      await settleCrowdfundingContributionSupabase(customMetadata, saleId);
    } else if (productType === "award_registration_fee") {
      await settleAwardRegistrationFeeSupabase(customMetadata, saleId);
    } else if (productType === "award_gift") {
      await settleAwardGiftSupabase(customMetadata, saleId);
    } else if (["award_donation", "award_pot_increase"].includes(productType)) {
      await settleAwardDonationSupabase(customMetadata, saleId);
    } else if (productType === "donation" || customMetadata.is_donation === "true") {
      const order = orderId ? await findOrderById(orderId) : null;
      if (order) {
        const confirmedOrder = await confirmOrderPayment(order, {
          providerRef: saleId,
          amount: Number(amountVal) || order.total,
          currency: currency || order.currency,
          payload: saleData,
        });
        await recordDonation({ order: confirmedOrder, paymentId: saleId, email: buyerEmail });
      } else {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          try {
            await supabase.from("donations").insert({
              id: `don_${saleId}`,
              user_id: userId && userId !== "guest" ? userId : null,
              amount: Number(amountVal) || 0,
              currency: currency || "XOF",
              email: buyerEmail || null,
              status: "paid",
              payment_id: saleId,
            });
          } catch (e) {
            console.error("Donation record error:", e);
          }
        }
      }
    } else if (productType === "subscription" || customMetadata.plan_id) {
      if (userId && userId !== "guest") {
        const planId = customMetadata.plan_id || "mensuel";
        const now = new Date();
        const end = new Date(now);
        if (["mensuel", "entreprise", "chef_entreprise"].includes(planId)) {
          end.setMonth(end.getMonth() + 1);
        } else {
          end.setFullYear(end.getFullYear() + 1);
        }

        await updateUserSubscription(userId, {
          planId,
          status: "active",
          startDate: now.toISOString(),
          endDate: end.toISOString(),
          firstMonth: true,
        });
      }
    } else if (orderId) {
      if (productType === "marketplace_order") {
        await settleMarketplaceOrderByPayment(
          orderId,
          saleId,
          Number(amountVal) || 0,
          currency || "XOF"
        );
      } else {
        const order = await findOrderById(orderId);
        if (order) {
          const confirmedOrder = await confirmOrderPayment(order, {
            providerRef: saleId,
            amount: Number(amountVal) || order.total,
            currency: currency || order.currency,
            payload: saleData,
          });
          if (order.items.some((item) => item.type === "don")) {
            await recordDonation({ order: confirmedOrder, paymentId: saleId, email: buyerEmail });
          }
        }
      }
    } else if (userId && (productType === "wallet_topup" || productType === "wallet_deposit")) {
      await settleWalletDeposit({
        userId,
        paymentId: saleId,
        amount: Number(amountVal) || 0,
        currency,
        metadata: { ...customMetadata, gateway: "chariow" },
      });
    }

    return NextResponse.json({
      success: true,
      processed: true,
      sale_id: saleId,
      delivery_id: deliveryId,
    });
  } catch (err: any) {
    console.error("Erreur traitement Webhook Chariow Pulse:", err);
    return NextResponse.json(
      { error: "Erreur interne lors du traitement Pulse" },
      { status: 500 }
    );
  }
}
