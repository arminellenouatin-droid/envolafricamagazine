import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const CONTACT_PATTERNS = [
  /(?:https?:\/\/|www\.)\S+/i,
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/i,
  /(?:\+|00)?\d[\d .()/-]{7,}\d/i,
  /(?:whatsapp|telegram|signal|t[ée]l[ée]gram|imo|wechat|facebook\.com|instagram\.com)/i,
];

function inspectMessage(body: string) {
  const match = CONTACT_PATTERNS.find((pattern) => pattern.test(body));
  return match ? "Les coordonnées, liens et moyens de contact externes sont interdits dans la messagerie Marketplace." : null;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { conversationId?: string; productId?: string; supplierId?: string; message?: string; warningAcknowledged?: boolean } | null;
  if (!body || typeof body.message !== "string" || body.message.trim().length < 1 || body.message.length > 4000) return NextResponse.json({ error: "Message invalide." }, { status: 400 });
  if (!body.warningAcknowledged) return NextResponse.json({ error: "Veuillez confirmer que vous restez dans la messagerie EAM.", requiresWarning: true }, { status: 428 });
  const moderationReason = inspectMessage(body.message.trim());
  if (moderationReason) return NextResponse.json({ error: moderationReason, blocked: true }, { status: 422 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Messagerie temporairement indisponible." }, { status: 503 });

  let conversationId = body.conversationId;
  if (!conversationId) {
    if (!body.productId || !body.supplierId) return NextResponse.json({ error: "Conversation incomplète." }, { status: 400 });
    const { data: conversation, error: conversationError } = await supabase.from("marketplace_conversations").upsert({ product_id: body.productId, buyer_id: user.id, supplier_id: body.supplierId, warning_acknowledged_at: new Date().toISOString() }, { onConflict: "product_id,buyer_id,supplier_id" }).select("id").single();
    if (conversationError || !conversation) return NextResponse.json({ error: "Impossible d’ouvrir la conversation." }, { status: 502 });
    conversationId = conversation.id;
  } else {
    const { error: accessError } = await supabase.from("marketplace_conversations").select("id").eq("id", conversationId).or(`buyer_id.eq.${user.id},supplier_id.eq.${user.id}`).limit(1).single();
    if (accessError) return NextResponse.json({ error: "Conversation non autorisée." }, { status: 403 });
  }

  const { data: message, error } = await supabase.from("marketplace_messages").insert({ conversation_id: conversationId, sender_id: user.id, body: body.message.trim(), moderation_status: "pending" }).select("id,conversation_id,body,moderation_status,created_at").single();
  if (error) return NextResponse.json({ error: "Impossible d’envoyer le message." }, { status: 502 });
  return NextResponse.json({ message, notice: "Message transmis à la modération technique avant livraison au destinataire." }, { status: 201 });
}
