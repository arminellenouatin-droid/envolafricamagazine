import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { kickParticipant } from "@/lib/crowdfunding-messages-db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

    const body = await req.json();
    const { spaceId, targetUserId, reason } = body;
    if (!spaceId || !targetUserId || !reason) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }

    const success = await kickParticipant(spaceId, user.id, targetUserId, reason);
    if (!success) {
      return NextResponse.json({ error: "Seul le porteur du projet peut exclure un participant." }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: "Participant exclu de la messagerie." });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
