import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import {
  listJobsConversations,
  createJobsConversation,
  getJobsConversation,
  checkUserJobsSubscription,
} from "@/lib/jobs-messages-db";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const conv = await getJobsConversation(conversationId, user.id);
      if (!conv) {
        return NextResponse.json({ error: "Conversation introuvable ou accès refusé." }, { status: 404 });
      }
      return NextResponse.json({ conversation: conv });
    }

    const conversations = await listJobsConversations(user.id);
    const userSubscription = await checkUserJobsSubscription(user.id);

    return NextResponse.json({
      conversations,
      userSubscription,
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
    const { targetUserId, targetUserName, title, type, jobOfferId, jobOfferTitle, initialMessage } = body;

    if (!targetUserId && type !== "group") {
      return NextResponse.json({ error: "targetUserId obligatoire pour un échange direct." }, { status: 400 });
    }

    const conversation = await createJobsConversation({
      creatorId: user.id,
      creatorName: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email || "Utilisateur Jobs",
      targetUserId,
      targetUserName,
      title,
      type,
      jobOfferId,
      jobOfferTitle,
      initialMessage,
    });

    return NextResponse.json({ conversation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Impossible d'initier la conversation." }, { status: 400 });
  }
}
