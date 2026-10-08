import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getMarketplaceConversationById,
  insertMarketplaceMessage,
} from "@/lib/marketplace/db";
import {
  calculateAutoValidationDeadline,
  isAcceptanceExpired,
  getStatusChangeSystemMessage,
} from "@/lib/marketplace/order-machine";
import { MarketplaceAttachment } from "@/lib/marketplace/types";
import {
  releaseMarketplaceOrderEscrow,
  refundMarketplaceOrderEscrow,
} from "@/lib/marketplace/marketplace-escrow-service";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    conversationId?: string;
    action?: "accept_order" | "reject_order" | "submit_delivery" | "request_revision" | "validate_delivery";
    deliveryNotes?: string;
    deliveryAssets?: MarketplaceAttachment[];
    revisionReason?: string;
  } | null;

  if (!body?.conversationId || !body?.action) {
    return NextResponse.json({ error: "Action ou conversation manquante." }, { status: 400 });
  }

  const conversation = await getMarketplaceConversationById(body.conversationId, user.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation introuvable ou non autorisée." }, { status: 404 });
  }

  if (!conversation.order_id || !conversation.order) {
    return NextResponse.json({ error: "Cette conversation n'est pas liée à une commande active." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const isBuyer = conversation.buyer_id === user.id;
  const isSupplier = conversation.supplier?.user_id === user.id;
  const order = conversation.order;
  const now = new Date().toISOString();

  // ==========================================
  // ACTION 1 : Vendeur accepte la commande (48h)
  // ==========================================
  if (body.action === "accept_order") {
    if (!isSupplier) {
      return NextResponse.json({ error: "Seul le fournisseur peut accepter la commande." }, { status: 403 });
    }
    if (conversation.status !== "order_pending_acceptance") {
      return NextResponse.json({ error: "La commande n'est plus en attente d'acceptation." }, { status: 400 });
    }
    if (isAcceptanceExpired(order.acceptance_deadline)) {
      // Dépassé -> auto-annulation et remboursement de l'acheteur si fonds bloqués
      await supabase.from("marketplace_conversations").update({ status: "order_rejected", updated_at: now }).eq("id", conversation.id);
      await supabase.from("marketplace_orders").update({ status: "cancelled", updated_at: now }).eq("id", order.id);
      try {
        await refundMarketplaceOrderEscrow({
          orderId: order.id,
          authorizedByUserId: user.id,
          reason: "Délai d'acceptation de 48h expiré",
        });
      } catch {}
      await insertMarketplaceMessage({
        conversationId: conversation.id,
        senderId: user.id,
        senderRole: "system",
        messageType: "system",
        body: getStatusChangeSystemMessage("order_rejected"),
      });
      return NextResponse.json({ error: "Le délai d'acceptation de 48h a expiré. La commande est annulée." }, { status: 410 });
    }

    await supabase.from("marketplace_conversations").update({ status: "in_progress", updated_at: now }).eq("id", conversation.id);
    await supabase.from("marketplace_orders").update({ status: "paid", updated_at: now }).eq("id", order.id);

    await insertMarketplaceMessage({
      conversationId: conversation.id,
      senderId: user.id,
      senderRole: "system",
      messageType: "system",
      body: getStatusChangeSystemMessage("in_progress", conversation.supplier?.business_name),
    });

    const updated = await getMarketplaceConversationById(conversation.id, user.id);
    return NextResponse.json({ success: true, conversation: updated });
  }

  // ==========================================
  // ACTION 2 : Vendeur refuse la commande
  // ==========================================
  if (body.action === "reject_order") {
    if (!isSupplier) {
      return NextResponse.json({ error: "Seul le fournisseur peut refuser la commande." }, { status: 403 });
    }
    if (conversation.status !== "order_pending_acceptance") {
      return NextResponse.json({ error: "La commande ne peut plus être refusée." }, { status: 400 });
    }

    await supabase.from("marketplace_conversations").update({ status: "order_rejected", updated_at: now }).eq("id", conversation.id);
    await supabase.from("marketplace_orders").update({ status: "cancelled", updated_at: now }).eq("id", order.id);

    // Rembourser l'acheteur si un séquestre existait
    try {
      await refundMarketplaceOrderEscrow({
        orderId: order.id,
        authorizedByUserId: user.id,
        reason: "Refus de la commande par le fournisseur",
      });
    } catch {}

    await insertMarketplaceMessage({
      conversationId: conversation.id,
      senderId: user.id,
      senderRole: "system",
      messageType: "system",
      body: getStatusChangeSystemMessage("order_rejected", conversation.supplier?.business_name),
    });

    const updated = await getMarketplaceConversationById(conversation.id, user.id);
    return NextResponse.json({ success: true, conversation: updated });
  }

  // ==========================================
  // ACTION 3 : Vendeur livre la commande
  // ==========================================
  if (body.action === "submit_delivery") {
    if (!isSupplier) {
      return NextResponse.json({ error: "Seul le fournisseur peut soumettre la livraison." }, { status: 403 });
    }
    if (!["in_progress", "revision_requested"].includes(conversation.status)) {
      return NextResponse.json({ error: "La commande n'est pas dans un statut permettant la livraison." }, { status: 400 });
    }

    const assets = Array.isArray(body.deliveryAssets) ? body.deliveryAssets : [];
    const notes = (body.deliveryNotes || "").trim();

    if (!notes && assets.length === 0) {
      return NextResponse.json({ error: "Veuillez joindre les fichiers livrables ou un message explicatif." }, { status: 400 });
    }

    const autoValidationDeadline = calculateAutoValidationDeadline().toISOString();

    await supabase
      .from("marketplace_conversations")
      .update({ status: "delivered_pending_validation", updated_at: now })
      .eq("id", conversation.id);

    await supabase
      .from("marketplace_orders")
      .update({
        status: "shipped",
        delivered_at: now,
        auto_validation_deadline: autoValidationDeadline,
        updated_at: now,
      })
      .eq("id", order.id);

    // Message de livraison dédié
    await insertMarketplaceMessage({
      conversationId: conversation.id,
      senderId: user.id,
      senderRole: "supplier",
      messageType: "delivery",
      body: notes || "Voici la livraison de votre commande.",
      isDelivery: true,
      deliveryAssets: assets,
    });

    // Message système
    await insertMarketplaceMessage({
      conversationId: conversation.id,
      senderId: user.id,
      senderRole: "system",
      messageType: "system",
      body: getStatusChangeSystemMessage("delivered_pending_validation", conversation.supplier?.business_name),
    });

    const updated = await getMarketplaceConversationById(conversation.id, user.id);
    return NextResponse.json({ success: true, conversation: updated });
  }

  // ==========================================
  // ACTION 4 : Acheteur demande une révision
  // ==========================================
  if (body.action === "request_revision") {
    if (!isBuyer) {
      return NextResponse.json({ error: "Seul l'acheteur peut demander une révision." }, { status: 403 });
    }
    if (conversation.status !== "delivered_pending_validation") {
      return NextResponse.json({ error: "Une révision ne peut être demandée que suite à une livraison." }, { status: 400 });
    }

    const reason = (body.revisionReason || "").trim();
    if (!reason || reason.length < 5) {
      return NextResponse.json({ error: "Veuillez expliquer en détail ce qui doit être révisé (minimum 5 caractères)." }, { status: 400 });
    }

    const newRevisionCount = (order.revisions_used || 0) + 1;

    await supabase
      .from("marketplace_conversations")
      .update({ status: "revision_requested", updated_at: now })
      .eq("id", conversation.id);

    await supabase
      .from("marketplace_orders")
      .update({
        revisions_used: newRevisionCount,
        auto_validation_deadline: null,
        updated_at: now,
      })
      .eq("id", order.id);

    // Message de révision
    await insertMarketplaceMessage({
      conversationId: conversation.id,
      senderId: user.id,
      senderRole: "buyer",
      messageType: "revision",
      body: `Demande de révision (#${newRevisionCount}) : ${reason}`,
    });

    // Message système
    await insertMarketplaceMessage({
      conversationId: conversation.id,
      senderId: user.id,
      senderRole: "system",
      messageType: "system",
      body: getStatusChangeSystemMessage("revision_requested", conversation.buyer?.name, { reason }),
    });

    const updated = await getMarketplaceConversationById(conversation.id, user.id);
    return NextResponse.json({ success: true, conversation: updated });
  }

  // ==========================================
  // ACTION 5 : Acheteur valide la livraison (libération des fonds)
  // ==========================================
  if (body.action === "validate_delivery") {
    if (!isBuyer) {
      return NextResponse.json({ error: "Seul l'acheteur peut valider la commande." }, { status: 403 });
    }
    if (conversation.status !== "delivered_pending_validation") {
      return NextResponse.json({ error: "La commande ne peut pas être validée dans son état actuel." }, { status: 400 });
    }

    // Libération financière du séquestre vers le portefeuille du vendeur
    let escrowResult = null;
    try {
      escrowResult = await releaseMarketplaceOrderEscrow({
        orderId: order.id,
        buyerOrAdminUserId: user.id,
      });
    } catch (escrowErr) {
      console.error("[marketplace] Erreur libération séquestre:", escrowErr);
    }

    await supabase
      .from("marketplace_conversations")
      .update({ status: "completed", updated_at: now })
      .eq("id", conversation.id);

    await supabase
      .from("marketplace_orders")
      .update({
        status: "received",
        received_at: now,
        updated_at: now,
      })
      .eq("id", order.id);

    await insertMarketplaceMessage({
      conversationId: conversation.id,
      senderId: user.id,
      senderRole: "system",
      messageType: "system",
      body: getStatusChangeSystemMessage("completed"),
    });

    const updated = await getMarketplaceConversationById(conversation.id, user.id);
    return NextResponse.json({ success: true, conversation: updated, escrow: escrowResult });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
