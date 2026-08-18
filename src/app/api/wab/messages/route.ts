import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ conversations: [], unreadCount: 0 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ conversations: [], unreadCount: 0 });
  const { data, error } = await supabase.from("wab_conversations").select("id,participant_a,participant_b,created_at,updated_at").or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`).order("updated_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: "Messagerie indisponible." }, { status: 503 });
  const ids = (data ?? []).map((item) => item.id);
  const { data: messages } = ids.length ? await supabase.from("wab_messages").select("id,conversation_id,sender_id,body,read_at,created_at").in("conversation_id", ids).order("created_at", { ascending: false }).limit(200) : { data: [] };
  const unreadCount = (messages ?? []).filter((item) => item.sender_id !== user.id && !item.read_at).length;
  return NextResponse.json({ conversations: (data ?? []).map((conversation) => ({ ...conversation, messages: (messages ?? []).filter((item) => item.conversation_id === conversation.id).slice(0, 20) })), unreadCount });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { recipientId?: unknown; conversationId?: unknown; body?: unknown } | null;
  if (typeof body?.body !== "string" || body.body.trim().length < 1 || body.body.length > 4000) return NextResponse.json({ error: "Message invalide." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Messagerie temporairement indisponible." }, { status: 503 });
  let conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  if (!conversationId && typeof body.recipientId === "string") {
    const a = user.id < body.recipientId ? user.id : body.recipientId;
    const b = user.id < body.recipientId ? body.recipientId : user.id;
    const { data, error } = await supabase.from("wab_conversations").upsert({ participant_a: a, participant_b: b, updated_at: new Date().toISOString() }, { onConflict: "participant_a,participant_b" }).select("id").single();
    if (error || !data) return NextResponse.json({ error: "Impossible d’ouvrir la conversation." }, { status: 503 });
    conversationId = data.id;
  }
  if (!conversationId) return NextResponse.json({ error: "Destinataire requis." }, { status: 400 });
  const { data: access } = await supabase.from("wab_conversations").select("id").eq("id", conversationId).or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`).maybeSingle();
  if (!access) return NextResponse.json({ error: "Conversation non autorisée." }, { status: 403 });
  const { data: message, error } = await supabase.from("wab_messages").insert({ conversation_id: conversationId, sender_id: user.id, body: body.body.trim() }).select("id,conversation_id,sender_id,body,read_at,created_at").single();
  if (error || !message) return NextResponse.json({ error: "Impossible d’envoyer le message." }, { status: 503 });
  await supabase.from("wab_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  return NextResponse.json({ message }, { status: 201 });
}
