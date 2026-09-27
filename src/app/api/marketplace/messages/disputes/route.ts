import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getMarketplaceConversationById,
  insertMarketplaceMessage,
} from "@/lib/marketplace/db";
import { getStatusChangeSystemMessage } from "@/lib/marketplace/order-machine";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user || !["admin", "gerant"].includes(user.role)) {
    return NextResponse.json({ error: "Accès support/admin requis." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const disputeId = searchParams.get("id");

  if (disputeId) {
    const { data: dispute, error } = await supabase
      .from("marketplace_disputes")
      .select(`
        *,
        marketplace_conversations (*),
        marketplace_orders (*)
      `)
      .eq("id", disputeId)
      .single();

    if (error || !dispute) {
      return NextResponse.json({ error: "Litige introuvable." }, { status: 404 });
    }

    // Journaliser l'accès administrateur à la conversation (Audit obligatoire PRD Section 20)
    await supabase.from("marketplace_admin_access_logs").insert({
      admin_id: user.id,
      conversation_id: dispute.conversation_id,
      dispute_id: dispute.id,
      reason: `Consultation du litige #${dispute.id.slice(0, 8)} (${dispute.reason})`,
    });

    return NextResponse.json({ dispute });
  }

  // Liste des litiges
  const { data: disputes, error } = await supabase
    .from("marketplace_disputes")
    .select(`
      id,
      conversation_id,
      order_id,
      opened_by,
      reason,
      description,
      status,
      decision,
      created_at,
      resolved_at
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: "Impossible de charger les litiges." }, { status: 502 });

  return NextResponse.json({ disputes });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    conversationId?: string;
    reason?: "non_compliant" | "delays" | "bypass_attempt" | "abusive_behavior" | "other";
    description?: string;
  } | null;

  if (!body?.conversationId || !body?.reason || !body?.description) {
    return NextResponse.json({ error: "Motif et description requis pour ouvrir un litige." }, { status: 400 });
  }

  const conversation = await getMarketplaceConversationById(body.conversationId, user.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation introuvable ou non autorisée." }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const now = new Date().toISOString();

  // 1. Enregistrer le litige
  const { data: dispute, error } = await supabase
    .from("marketplace_disputes")
    .insert({
      conversation_id: conversation.id,
      order_id: conversation.order_id || null,
      opened_by: user.id,
      reason: body.reason,
      description: body.description.trim(),
      status: "open",
    })
    .select("*")
    .single();

  if (error || !dispute) {
    return NextResponse.json({ error: "Impossible d'ouvrir le litige." }, { status: 502 });
  }

  // 2. Geler la conversation (statut disputed)
  await supabase
    .from("marketplace_conversations")
    .update({ status: "disputed", updated_at: now })
    .eq("id", conversation.id);

  if (conversation.order_id) {
    await supabase
      .from("marketplace_orders")
      .update({ status: "disputed", disputed_at: now, updated_at: now })
      .eq("id", conversation.order_id);
  }

  // 3. Message système de gel
  await insertMarketplaceMessage({
    conversationId: conversation.id,
    senderId: user.id,
    senderRole: "system",
    messageType: "system",
    body: getStatusChangeSystemMessage("disputed", undefined, { reason: body.reason }),
  });

  return NextResponse.json({ success: true, dispute }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user || !["admin", "gerant"].includes(user.role)) {
    return NextResponse.json({ error: "Accès administrateur requis pour trancher un litige." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    disputeId?: string;
    decision?: "release_funds" | "refund_buyer" | "dismissed";
    notes?: string;
  } | null;

  if (!body?.disputeId || !body?.decision) {
    return NextResponse.json({ error: "Identifiant de litige et décision requis." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: dispute, error } = await supabase
    .from("marketplace_disputes")
    .select("*")
    .eq("id", body.disputeId)
    .single();

  if (error || !dispute) {
    return NextResponse.json({ error: "Litige introuvable." }, { status: 404 });
  }

  const now = new Date().toISOString();
  let newConvStatus = "completed";
  let resolutionText = "";

  if (body.decision === "release_funds") {
    newConvStatus = "completed";
    resolutionText = "Le support a tranché en faveur du vendeur : les fonds ont été libérés.";
    if (dispute.order_id) {
      await supabase.from("marketplace_orders").update({ status: "received", updated_at: now }).eq("id", dispute.order_id);
    }
  } else if (body.decision === "refund_buyer") {
    newConvStatus = "refunded";
    resolutionText = "Le support a tranché en faveur de l'acheteur : la commande a été remboursée.";
    if (dispute.order_id) {
      await supabase.from("marketplace_orders").update({ status: "cancelled", updated_at: now }).eq("id", dispute.order_id);
    }
  } else {
    newConvStatus = "in_progress";
    resolutionText = "Le litige a été clôturé sans suite par le support. Les échanges reprennent.";
  }

  // 1. Clôturer le litige
  await supabase
    .from("marketplace_disputes")
    .update({
      status: "resolved",
      decision: body.decision,
      resolved_by: user.id,
      resolved_at: now,
    })
    .eq("id", dispute.id);

  // 2. Mettre à jour la conversation
  await supabase
    .from("marketplace_conversations")
    .update({ status: newConvStatus, updated_at: now })
    .eq("id", dispute.conversation_id);

  // 3. Message système de résolution
  await insertMarketplaceMessage({
    conversationId: dispute.conversation_id,
    senderId: user.id,
    senderRole: "system",
    messageType: "system",
    body: `⚖️ Décision du support : ${resolutionText}`,
  });

  // 4. Journal d'audit
  await supabase.from("marketplace_admin_access_logs").insert({
    admin_id: user.id,
    conversation_id: dispute.conversation_id,
    dispute_id: dispute.id,
    reason: `Résolution du litige #${dispute.id.slice(0, 8)} : ${body.decision} (${body.notes || "sans note"})`,
  });

  return NextResponse.json({ success: true, decision: body.decision });
}
