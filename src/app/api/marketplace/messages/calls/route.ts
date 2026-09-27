import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getMarketplaceConversationById,
  insertMarketplaceMessage,
} from "@/lib/marketplace/db";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId requis." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: calls, error } = await supabase
    .from("marketplace_calls")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: "Impossible de charger les appels." }, { status: 502 });

  return NextResponse.json({ calls });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    conversationId?: string;
    action?: "initiate" | "ringing" | "accept" | "reject" | "end";
    callId?: string;
    callType?: "audio" | "video";
    durationSeconds?: number;
  } | null;

  if (!body?.conversationId || !body?.action) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  const conversation = await getMarketplaceConversationById(body.conversationId, user.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation introuvable ou non autorisée." }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const isBuyer = conversation.buyer_id === user.id;
  const isSupplier = conversation.supplier?.user_id === user.id;
  const receiverId = isBuyer ? conversation.supplier?.user_id : conversation.buyer_id;

  if (!receiverId) {
    return NextResponse.json({ error: "Destinataire introuvable." }, { status: 400 });
  }

  // Vérifier la disponibilité des appels pour le fournisseur si l'acheteur appelle
  if (isBuyer && conversation.supplier && conversation.supplier.call_available === false) {
    return NextResponse.json(
      { error: "Ce fournisseur n'est pas disponible pour les appels ComeUp Direct pour le moment." },
      { status: 403 }
    );
  }

  // 1. Initier un appel
  if (body.action === "initiate") {
    const callType = body.callType || "audio";
    const { data: newCall, error } = await supabase
      .from("marketplace_calls")
      .insert({
        conversation_id: conversation.id,
        caller_id: user.id,
        receiver_id: receiverId,
        call_type: callType,
        status: "initiated",
      })
      .select("*")
      .single();

    if (error || !newCall) {
      return NextResponse.json({ error: "Impossible d'initier l'appel." }, { status: 502 });
    }

    return NextResponse.json({ call: newCall }, { status: 201 });
  }

  if (!body.callId) {
    return NextResponse.json({ error: "callId requis pour cette action." }, { status: 400 });
  }

  // 2. Accepter l'appel
  if (body.action === "accept") {
    const { data: updatedCall } = await supabase
      .from("marketplace_calls")
      .update({ status: "accepted" })
      .eq("id", body.callId)
      .select("*")
      .single();

    return NextResponse.json({ call: updatedCall });
  }

  // 3. Refuser l'appel
  if (body.action === "reject") {
    const { data: updatedCall } = await supabase
      .from("marketplace_calls")
      .update({ status: "rejected", ended_at: new Date().toISOString() })
      .eq("id", body.callId)
      .select("*")
      .single();

    await insertMarketplaceMessage({
      conversationId: conversation.id,
      senderId: user.id,
      senderRole: "system",
      messageType: "call",
      body: `Appel ${updatedCall?.call_type === "video" ? "vidéo" : "vocal"} refusé.`,
      callMeta: {
        call_type: updatedCall?.call_type,
        status: "rejected",
        duration_seconds: 0,
      },
    });

    return NextResponse.json({ call: updatedCall });
  }

  // 4. Terminer l'appel
  if (body.action === "end") {
    const duration = Math.max(0, Number(body.durationSeconds) || 0);
    const now = new Date().toISOString();

    const { data: updatedCall } = await supabase
      .from("marketplace_calls")
      .update({
        status: duration > 0 ? "ended" : "missed",
        duration_seconds: duration,
        ended_at: now,
      })
      .eq("id", body.callId)
      .select("*")
      .single();

    const callLabel = updatedCall?.call_type === "video" ? "vidéo" : "vocal";
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const durationText = duration > 0 ? `${minutes > 0 ? `${minutes}m ` : ""}${seconds}s` : "";

    const msgBody =
      duration > 0
        ? `📞 Appel ${callLabel} terminé — Durée : ${durationText}`
        : `📞 Appel ${callLabel} manqué`;

    await insertMarketplaceMessage({
      conversationId: conversation.id,
      senderId: user.id,
      senderRole: "system",
      messageType: "call",
      body: msgBody,
      callMeta: {
        call_type: updatedCall?.call_type,
        status: duration > 0 ? "ended" : "missed",
        duration_seconds: duration,
      },
    });

    return NextResponse.json({ call: updatedCall });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
