import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { interactJobsMessage } from "@/lib/jobs-messages-db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    const body = await req.json();
    const { messageId, action, emoji, newContent } = body;

    if (!messageId || !action) {
      return NextResponse.json({ error: "messageId et action requis." }, { status: 400 });
    }

    const updatedMessage = await interactJobsMessage({
      messageId,
      userId: user.id,
      action,
      emoji,
      newContent,
    });

    return NextResponse.json({ message: updatedMessage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Action impossible." }, { status: 400 });
  }
}
