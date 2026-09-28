import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { reportJobsIncident } from "@/lib/jobs-messages-db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, reportedUserId, reportedMessageId, category, description } = body;

    if (!conversationId || !description) {
      return NextResponse.json({ error: "conversationId et description requis." }, { status: 400 });
    }

    const report = await reportJobsIncident({
      reporterId: user.id,
      conversationId,
      reportedUserId,
      reportedMessageId,
      category: category || "other",
      description: description.trim(),
    });

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur lors du signalement." }, { status: 500 });
  }
}
