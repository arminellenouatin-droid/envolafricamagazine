import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createGlobalNotification } from "@/lib/ecosystem-inbox";
import { hasWabBusinessVideoAccess } from "@/lib/wab-access-server";
import { readWabDB } from "@/lib/wab-db";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ conversations: [], unreadCount: 0, canSendVideo: false });

  const canSendVideo = await hasWabBusinessVideoAccess(user);
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    // Fallback local/demo
    return NextResponse.json({ conversations: [], unreadCount: 0, canSendVideo });
  }

  const { data, error } = await supabase
    .from("wab_conversations")
    .select("id,participant_a,participant_b,created_at,updated_at")
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: "Messagerie indisponible." }, { status: 503 });

  const ids = (data ?? []).map((item) => item.id);
  const { data: messages } = ids.length
    ? await supabase
        .from("wab_messages")
        .select("id,conversation_id,sender_id,body,read_at,created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false })
        .limit(300)
    : { data: [] };

  const unreadCount = (messages ?? []).filter((item) => item.sender_id !== user.id && !item.read_at).length;

  // Récupérer les informations des autres participants
  const otherUserIds = Array.from(
    new Set((data ?? []).map((c) => (c.participant_a === user.id ? c.participant_b : c.participant_a)))
  );

  const participantMap: Record<string, { id: string; fullName: string; avatarUrl?: string; headline?: string }> = {};

  if (otherUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("wab_profiles")
      .select("user_id,full_name,avatar_url,headline")
      .in("user_id", otherUserIds);

    (profiles ?? []).forEach((p) => {
      participantMap[p.user_id] = {
        id: p.user_id,
        fullName: p.full_name,
        avatarUrl: p.avatar_url,
        headline: p.headline,
      };
    });

    // Chercher les profils manquants dans les comptes utilisateurs
    const missingUserIds = otherUserIds.filter((uid) => !participantMap[uid]);
    if (missingUserIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id,nom,prenom,avatar,email")
        .in("id", missingUserIds);

      (usersData ?? []).forEach((u) => {
        participantMap[u.id] = {
          id: u.id,
          fullName: `${u.prenom || ""} ${u.nom || ""}`.trim() || u.email || "Utilisateur Envol Africa",
          avatarUrl: u.avatar,
          headline: "Membre Envol Africa",
        };
      });
    }
  }

  const conversations = (data ?? []).map((conversation) => {
    const otherId = conversation.participant_a === user.id ? conversation.participant_b : conversation.participant_a;
    const otherParticipant = participantMap[otherId] || {
      id: otherId,
      fullName: "Contact",
      headline: "Membre de l'écosystème",
    };

    return {
      ...conversation,
      otherParticipant,
      messages: (messages ?? [])
        .filter((item) => item.conversation_id === conversation.id)
        .slice(0, 30),
    };
  });

  return NextResponse.json({ conversations, unreadCount, canSendVideo });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    recipientId?: unknown;
    conversationId?: unknown;
    body?: unknown;
    type?: unknown;
  } | null;

  if (typeof body?.body !== "string" || body.body.trim().length < 1 || body.body.length > 15000) {
    return NextResponse.json({ error: "Message invalide." }, { status: 400 });
  }

  // Vérifier la restriction sur l'envoi de vidéos
  const isVideoMessage =
    body.type === "video" ||
    (body.body.startsWith("{") && body.body.includes('"type":"video"')) ||
    (body.body.startsWith("{") && body.body.includes('"type": "video"'));

  if (isVideoMessage) {
    const canSendVideo = await hasWabBusinessVideoAccess(user);
    if (!canSendVideo) {
      return NextResponse.json(
        { error: "L'envoi de messages vidéo est réservé aux créateurs et abonnés WAB Business." },
        { status: 403 }
      );
    }
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Messagerie temporairement indisponible." }, { status: 503 });

  let conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  if (!conversationId && typeof body.recipientId === "string") {
    const a = user.id < body.recipientId ? user.id : body.recipientId;
    const b = user.id < body.recipientId ? body.recipientId : user.id;
    const { data, error } = await supabase
      .from("wab_conversations")
      .upsert({ participant_a: a, participant_b: b, updated_at: new Date().toISOString() }, { onConflict: "participant_a,participant_b" })
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: "Impossible d’ouvrir la conversation." }, { status: 503 });
    conversationId = data.id;
  }

  if (!conversationId) return NextResponse.json({ error: "Destinataire requis." }, { status: 400 });

  const { data: access } = await supabase
    .from("wab_conversations")
    .select("id")
    .eq("id", conversationId)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .maybeSingle();

  if (!access) return NextResponse.json({ error: "Conversation non autorisée." }, { status: 403 });

  const { data: message, error } = await supabase
    .from("wab_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: body.body.trim(),
    })
    .select("id,conversation_id,sender_id,body,read_at,created_at")
    .single();

  if (error || !message) return NextResponse.json({ error: "Impossible d’envoyer le message." }, { status: 503 });

  const { data: conversation } = await supabase
    .from("wab_conversations")
    .select("participant_a,participant_b")
    .eq("id", conversationId)
    .single();

  const recipientId = conversation && conversation.participant_a === user.id ? conversation.participant_b : conversation?.participant_a;
  if (recipientId) {
    const notifSnippet = body.body.startsWith("{") ? "Vous a envoyé une pièce jointe ou un média" : body.body.trim().slice(0, 100);
    await createGlobalNotification({
      userId: recipientId,
      platform: "wab",
      type: "message",
      title: "Nouveau message",
      body: notifSnippet,
      link: `/messages?conversationId=${encodeURIComponent(conversationId)}`,
      entityType: "wab_message",
      entityId: message.id,
    });
  }

  await supabase.from("wab_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

  return NextResponse.json({ message }, { status: 201 });
}
