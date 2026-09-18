import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { sendPushToAllSubscribers } from "@/lib/push";

export async function POST(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("redacteur");
  if (error || !user) {
    return NextResponse.json({ error: error || "Accès non autorisé" }, { status: status || 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const title = body.title || "Test Envol Africa";
    const content = body.body || "Ceci est un test de notification Chrome avec l'image principale de la publication.";
    const href = body.href || "/";
    const image = body.image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800";

    const result = await sendPushToAllSubscribers({
      title,
      body: content,
      href,
      image,
      tag: `test-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      result,
      preview: {
        title,
        body: content,
        href,
        image,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erreur lors de l'envoi du push test" },
      { status: 500 }
    );
  }
}
