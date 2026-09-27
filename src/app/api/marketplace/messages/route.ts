import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getMarketplaceMessages,
  insertMarketplaceMessage,
  getMarketplaceConversationById,
} from "@/lib/marketplace/db";
import {
  inspectMarketplaceMessage,
  recordCircumventionAttempt,
} from "@/lib/marketplace/anti-circumvention";
import { MarketplaceAttachment, MarketplaceMessageType } from "@/lib/marketplace/types";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ error: "Identifiant de conversation requis." }, { status: 400 });
  }

  // Vérifier les droits d'accès
  const conversation = await getMarketplaceConversationById(
    conversationId,
    user.id,
    ["admin", "gerant"].includes(user.role)
  );

  if (!conversation) {
    return NextResponse.json({ error: "Conversation non autorisée ou introuvable." }, { status: 403 });
  }

  const messages = await getMarketplaceMessages(conversationId, user.id, true);
  return NextResponse.json({ messages, conversation });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    conversationId?: string;
    body?: string;
    media?: MarketplaceAttachment[];
    messageType?: MarketplaceMessageType;
    isQuickReply?: boolean;
    callMeta?: any;
  } | null;

  if (!body?.conversationId) {
    return NextResponse.json({ error: "Identifiant de conversation manquant." }, { status: 400 });
  }

  const textContent = (body.body || "").trim();
  const mediaList = Array.isArray(body.media) ? body.media : [];

  if (!textContent && mediaList.length === 0 && !body.callMeta) {
    return NextResponse.json({ error: "Le contenu du message ne peut pas être vide." }, { status: 400 });
  }

  // 1. Contrôle d'accès à la conversation
  const conversation = await getMarketplaceConversationById(
    body.conversationId,
    user.id,
    ["admin", "gerant"].includes(user.role)
  );

  if (!conversation) {
    return NextResponse.json({ error: "Accès refusé à cette conversation." }, { status: 403 });
  }

  // 2. Si la conversation est en litige, elle est gelée en lecture seule pour acheteur et vendeur
  if (conversation.status === "disputed" && !["admin", "gerant"].includes(user.role)) {
    return NextResponse.json(
      {
        error: "Cette conversation est actuellement gelée en raison d'un litige en cours d'examen par le support.",
        frozen: true,
      },
      { status: 423 }
    );
  }

  // 3. Filtrage Anti-Contournement strict côté serveur (PRD Section 12)
  if (textContent) {
    const circumventionResult = inspectMarketplaceMessage(textContent);
    if (!circumventionResult.allowed) {
      await recordCircumventionAttempt(
        user.id,
        body.conversationId,
        circumventionResult.matchedCategory || "unknown",
        textContent
      );

      return NextResponse.json(
        {
          error: circumventionResult.reason,
          blocked: true,
          category: circumventionResult.matchedCategory,
        },
        { status: 422 }
      );
    }
  }

  // 4. Déterminer le rôle de l'expéditeur
  const isSupplier = conversation.supplier?.user_id === user.id;
  const senderRole = isSupplier ? "supplier" : "buyer";
  const messageType = body.messageType || (mediaList.length > 0 ? "document" : "text");

  // 5. Insertion garantie non modifiable
  const message = await insertMarketplaceMessage({
    conversationId: body.conversationId,
    senderId: user.id,
    senderRole,
    messageType,
    body: textContent || null,
    media: mediaList,
    isQuickReply: Boolean(body.isQuickReply),
    callMeta: body.callMeta || {},
  });

  if (!message) {
    return NextResponse.json({ error: "Impossible d’enregistrer le message." }, { status: 502 });
  }

  return NextResponse.json({ message }, { status: 201 });
}
