import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { toggleJobsBlock } from "@/lib/jobs-messages-db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    const body = await req.json();
    const { blockedId, reason } = body;

    if (!blockedId) {
      return NextResponse.json({ error: "blockedId requis." }, { status: 400 });
    }

    if (blockedId === user.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous bloquer vous-même." }, { status: 400 });
    }

    const result = await toggleJobsBlock(user.id, blockedId, reason);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
