import { NextRequest, NextResponse } from "next/server";
import { recordImpression } from "@/lib/ads/engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body.token || "").trim();

    if (!token) {
      return NextResponse.json({ error: "Jeton d'impression requis" }, { status: 400 });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "";
    const userAgent = req.headers.get("user-agent") || "";
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const country = req.headers.get("x-vercel-ip-country") || "BJ";

    const result = await recordImpression(token, {
      ip: clientIp,
      session: body.session,
      country,
      device: isMobile ? "mobile" : "desktop",
      pageRef: body.pageRef,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Erreur serveur ad impression:", err);
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
