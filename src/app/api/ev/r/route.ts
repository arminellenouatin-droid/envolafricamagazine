import { NextRequest, NextResponse } from "next/server";
import { reportAd } from "@/lib/ads/engine";
import { getCurrentUserFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const creativeId = (body.creativeId || "").trim();
    const motif = (body.motif || "Autre").trim();
    const details = typeof body.details === "string" ? body.details.trim() : undefined;

    if (!creativeId) {
      return NextResponse.json({ error: "Identifiant d'annonce requis" }, { status: 400 });
    }

    const user = await getCurrentUserFromCookie().catch(() => null);
    const result = await reportAd(creativeId, motif, details, user?.id);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Erreur serveur ad report:", err);
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
