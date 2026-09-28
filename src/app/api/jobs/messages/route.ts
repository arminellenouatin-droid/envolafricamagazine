import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import {
  listJobsMessages,
  sendJobsMessage,
  getJobsConversation,
} from "@/lib/jobs-messages-db";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId requis." }, { status: 400 });
    }

    const conversation = await getJobsConversation(conversationId, user.id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation introuvable ou accès non autorisé." }, { status: 404 });
    }

    const messages = await listJobsMessages(conversationId, user.id);

    return NextResponse.json({
      conversation,
      messages,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, content, type, replyToId, attachments } = body;

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId requis." }, { status: 400 });
    }

    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: "Le contenu du message ne peut pas être vide." }, { status: 400 });
    }

    const message = await sendJobsMessage({
      conversationId,
      senderId: user.id,
      senderName: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email || "Utilisateur Jobs",
      senderAvatar: user.avatar,
      content: content ? content.trim() : "",
      type: type || (attachments && attachments[0]?.type ? attachments[0].type : "text"),
      replyToId,
      attachments,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Impossible d'envoyer le message." }, { status: 400 });
  }
}
