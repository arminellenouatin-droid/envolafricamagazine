import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { togglePinMessage } from "@/lib/crowdfunding-messages-db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

    const body = await req.json();
    const { spaceId, messageId } = body;
    if (!spaceId || !messageId) {
      return NextResponse.json({ error: "spaceId et messageId requis." }, { status: 400 });
    }

    const success = await togglePinMessage(spaceId, messageId, user.id);
    if (!success) {
      return NextResponse.json({ error: "Seul le porteur du projet ou un admin peut épingler un message." }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
