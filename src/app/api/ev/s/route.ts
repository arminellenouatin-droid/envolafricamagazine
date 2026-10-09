import { NextRequest, NextResponse } from "next/server";
import { serveAd } from "@/lib/ads/engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const slotCode = (body.slot || body.slotCode || "").trim();

    if (!slotCode) {
      return NextResponse.json({ error: "Code d'emplacement requis" }, { status: 400 });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "";
    const userAgent = req.headers.get("user-agent") || "";
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

    const result = await serveAd({
      slotCode,
      pageType: body.pageType,
      pageRef: body.pageRef,
      category: body.category,
      country: body.country || req.headers.get("x-vercel-ip-country") || undefined,
      device: isMobile ? "mobile" : "desktop",
      lang: body.lang || "fr",
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Erreur serveur ad serve:", err);
    return NextResponse.json(
      { served: false, type: "empty", error: "Erreur interne" },
      { status: 500 }
    );
  }
}
