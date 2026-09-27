import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import {
  getUserMarketplaceConversations,
  getOrCreateMarketplaceConversation,
  getMarketplaceConversationById,
} from "@/lib/marketplace/db";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const role = (searchParams.get("role") as "all" | "buyer" | "supplier") || "all";
  const conversationId = searchParams.get("id");

  if (conversationId) {
    const conv = await getMarketplaceConversationById(
      conversationId,
      user.id,
      ["admin", "gerant"].includes(user.role)
    );
    if (!conv) {
      return NextResponse.json({ error: "Conversation introuvable ou non autorisée." }, { status: 404 });
    }
    return NextResponse.json({ conversation: conv });
  }

  const conversations = await getUserMarketplaceConversations(user.id, role);
  return NextResponse.json({ conversations });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    supplierId?: string;
    productId?: string | null;
    orderId?: string | null;
  } | null;

  if (!body?.supplierId) {
    return NextResponse.json({ error: "Identifiant du fournisseur requis." }, { status: 400 });
  }

  const conversation = await getOrCreateMarketplaceConversation({
    buyerId: user.id,
    supplierId: body.supplierId,
    productId: body.productId,
    orderId: body.orderId,
  });

  if (!conversation) {
    return NextResponse.json({ error: "Impossible de créer la conversation." }, { status: 502 });
  }

  return NextResponse.json({ conversation }, { status: 201 });
}
