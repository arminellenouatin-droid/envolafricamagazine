import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { checkAccess, createCallSession, endCallSession } from "@/lib/crowdfunding-messages-db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise pour lancer un appel." }, { status: 401 });
    }

    const body = await req.json();
    const { action, spaceId, callId, callType, isGroup, participants, durationSeconds } = body;

    if (action === "start") {
      if (!spaceId) return NextResponse.json({ error: "spaceId requis." }, { status: 400 });

      const participant = await checkAccess(spaceId, user.id, user.role === "admin");
      if (!participant) {
        return NextResponse.json({ error: "Accès refusé : vous devez être participant à l'espace pour démarrer un appel." }, { status: 403 });
      }

      const initiatorName = `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email || "Participant";
      const call = await createCallSession({
        spaceId,
        initiatorId: user.id,
        initiatorName,
        callType: callType || "video",
        isGroup: Boolean(isGroup),
        participants: Array.isArray(participants) && participants.length ? participants : [user.id],
      });

      return NextResponse.json({ success: true, call });
    }

    if (action === "end") {
      if (!callId) return NextResponse.json({ error: "callId requis." }, { status: 400 });
      const duration = Number(durationSeconds) || 0;
      await endCallSession(callId, duration);
      return NextResponse.json({ success: true, message: "Appel terminé et enregistré." });
    }

    return NextResponse.json({ error: "Action non reconnue." }, { status: 400 });
  } catch (error) {
    console.error("Error in crowdfunding call route:", error);
    return NextResponse.json({ error: "Erreur serveur appel." }, { status: 500 });
  }
}
