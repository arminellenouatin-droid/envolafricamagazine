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

  if (error) {
    console.error("[wab/messages] Erreur lecture conversations:", error.message);
    return NextResponse.json({ error: "Messagerie indisponible." }, { status: 503 });
  }

  const ids = (data ?? []).map((item) => item.id);
  // Tri CHRONOLOGIQUE croissant (oldest to newest) pour un affichage naturel en messagerie
  const { data: rawMessages } = ids.length
    ? await supabase
        .from("wab_messages")
        .select("id,conversation_id,sender_id,body,read_at,created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: true })
        .limit(1000)
    : { data: [] };

  const unreadCount = (rawMessages ?? []).filter((item) => item.sender_id !== user.id && !item.read_at).length;

  // Récupérer les informations des autres participants
  const otherUserIds = Array.from(
    new Set((data ?? []).map((c) => (c.participant_a === user.id ? c.participant_b : c.participant_a)).filter(Boolean))
  );

  const participantMap: Record<string, { id: string; fullName: string; avatarUrl?: string; headline?: string }> = {};

  if (otherUserIds.length > 0) {
    // Récupérer les profils WAB (sans colonne fictive full_name)
    const { data: profiles } = await supabase
      .from("wab_profiles")
      .select("id,user_id,headline,avatar_url")
      .in("user_id", otherUserIds);

    // Récupérer les comptes utilisateurs (nom, prénom, avatar)
    const { data: usersData } = await supabase
      .from("users")
      .select("id,nom,prenom,avatar,email")
      .in("id", otherUserIds);

    const userMap = new Map((usersData ?? []).map((u) => [u.id, u]));
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    otherUserIds.forEach((uid) => {
      const u = userMap.get(uid);
      const p = profileMap.get(uid);
      const fullName = u
        ? `${u.prenom || ""} ${u.nom || ""}`.trim() || u.email || "Membre Envol Africa"
        : "Membre Envol Africa";

      participantMap[uid] = {
        id: uid,
        fullName,
        avatarUrl: p?.avatar_url || u?.avatar,
        headline: p?.headline || "Membre de l'écosystème",
      };
    });
  }

  const conversations = (data ?? []).map((conversation) => {
    const otherId = conversation.participant_a === user.id ? conversation.participant_b : conversation.participant_a;
    const otherParticipant = participantMap[otherId] || {
      id: otherId,
      fullName: "Contact",
      headline: "Membre de l'écosystème",
    };

    // Conserver l'ordre chronologique des 50 derniers messages de la conversation
    const convMessages = (rawMessages ?? []).filter((item) => item.conversation_id === conversation.id);
    const sliced = convMessages.slice(-50);

    return {
      ...conversation,
      otherParticipant,
      messages: sliced,
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

  if (typeof body?.body !== "string" || body.body.trim().length < 1 || body.body.length > 4000) {
    return NextResponse.json({ error: "Message invalide (longueur maximale : 4000 caractères)." }, { status: 400 });
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

  // Si pas de conversationId mais un recipientId fourni
  if (!conversationId && typeof body.recipientId === "string" && body.recipientId.trim().length > 0) {
    const targetUserId = body.recipientId.trim();

    if (targetUserId === user.id) {
      return NextResponse.json({ error: "Impossible de s'envoyer un message à soi-même." }, { status: 400 });
    }

    // 1. Chercher d'abord si une conversation existe déjà entre ces deux utilisateurs
    const { data: existingConv } = await supabase
      .from("wab_conversations")
      .select("id")
      .or(`and(participant_a.eq.${user.id},participant_b.eq.${targetUserId}),and(participant_a.eq.${targetUserId},participant_b.eq.${user.id})`)
      .maybeSingle();

    if (existingConv?.id) {
      conversationId = existingConv.id;
    } else {
      // 2. Si aucune conversation n'existe, en créer une nouvelle ordonnée
      const a = user.id < targetUserId ? user.id : targetUserId;
      const b = user.id < targetUserId ? targetUserId : user.id;

      const { data: newConv, error: createError } = await supabase
        .from("wab_conversations")
        .upsert(
          { participant_a: a, participant_b: b, updated_at: new Date().toISOString() },
          { onConflict: "participant_a,participant_b" }
        )
        .select("id")
        .single();

      if (createError || !newConv) {
        console.error("[wab/messages] Erreur création conversation:", createError?.message);
        return NextResponse.json({ error: "Impossible d’ouvrir la conversation." }, { status: 503 });
      }
      conversationId = newConv.id;
    }
  }

  if (!conversationId) return NextResponse.json({ error: "Destinataire requis." }, { status: 400 });

  // Vérifier les droits d'accès à la conversation
  const { data: access } = await supabase
    .from("wab_conversations")
    .select("id,participant_a,participant_b")
    .eq("id", conversationId)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .maybeSingle();

  if (!access) return NextResponse.json({ error: "Conversation non autorisée." }, { status: 403 });

  // Insérer le message
  const { data: message, error: insertError } = await supabase
    .from("wab_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: body.body.trim(),
    })
    .select("id,conversation_id,sender_id,body,read_at,created_at")
    .single();

  if (insertError || !message) {
    console.error("[wab/messages] Erreur insertion message:", insertError?.message);
    return NextResponse.json({ error: "Impossible d’envoyer le message." }, { status: 503 });
  }

  // Notifier l'autre participant
  const recipientId = access.participant_a === user.id ? access.participant_b : access.participant_a;
  if (recipientId) {
    const notifSnippet = body.body.startsWith("{")
      ? "Vous a envoyé une pièce jointe ou un média"
      : body.body.trim().slice(0, 100);

    createGlobalNotification({
      userId: recipientId,
      platform: "wab",
      type: "message",
      title: "Nouveau message",
      body: notifSnippet,
      link: `/messages?conversationId=${encodeURIComponent(conversationId)}`,
      entityType: "wab_message",
      entityId: message.id,
    }).catch(() => {});
  }

  // Mettre à jour l'horodatage de la conversation
  await supabase
    .from("wab_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json({ message }, { status: 201 });
}
