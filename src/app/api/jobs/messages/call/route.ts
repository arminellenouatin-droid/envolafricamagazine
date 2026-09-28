import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { handleJobsCall } from "@/lib/jobs-messages-db";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    const res = await handleJobsCall({
      action: "poll",
      userId: user.id,
    });

    return NextResponse.json(res);
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
    const { action, conversationId, callId, callType, isGroup, sdpOffer, sdpAnswer, iceCandidate } = body;

    const res = await handleJobsCall({
      action,
      conversationId,
      callId,
      userId: user.id,
      userName: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email || "Utilisateur Jobs",
      callType,
      isGroup,
      sdpOffer,
      sdpAnswer,
      iceCandidate,
    });

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Impossible de gérer l'appel." }, { status: 400 });
  }
}
