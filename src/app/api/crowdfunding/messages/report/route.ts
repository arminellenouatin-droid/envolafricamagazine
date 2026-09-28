import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { reportAbuse } from "@/lib/crowdfunding-messages-db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

    const body = await req.json();
    const { spaceId, targetType, targetId, reason } = body;
    if (!spaceId || !targetType || !targetId || !reason) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }

    const success = await reportAbuse({
      spaceId,
      reporterId: user.id,
      targetType,
      targetId,
      reason,
    });

    if (!success) {
      return NextResponse.json({ error: "Impossible d'enregistrer le signalement." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Signalement transmis à l'équipe de modération." });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
