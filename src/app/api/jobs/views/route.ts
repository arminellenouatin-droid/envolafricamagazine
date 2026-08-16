import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { isProductionRuntime } from "@/lib/supabase-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { incrementJobsOfferView } from "@/lib/jobs-supabase";
import { readJobsDB, writeJobsDB } from "@/lib/jobs-db";

export async function POST(request: NextRequest) {
  const { offerId, visitorId } = await request.json();
  if (typeof offerId !== "string") return NextResponse.json({ error: "Offre invalide." }, { status: 400 });
  const user = await getCurrentUserFromCookie();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const result = await incrementJobsOfferView(offerId, user?.id);
    if (result.error) return NextResponse.json({ error: "Impossible d’enregistrer la vue." }, { status: 503 });
    if (!result.found) return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
    return NextResponse.json({ ok: true, deduplicated: result.deduplicated === true });
  }

  if (isProductionRuntime()) return NextResponse.json({ error: "Jobs non configuré." }, { status: 503 });

  const db = readJobsDB();
  const offer = db.offers.find((item) => item.id === offerId && item.status === "published");
  if (!offer) return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
  const recent = db.events.some((event) => event.type === "offer_view" && event.targetId === offerId && (user ? event.userId === user.id : event.visitorId === visitorId) && Date.now() - Date.parse(event.createdAt) < 1800000);
  if (!recent) {
    offer.views += 1;
    db.events.unshift({ id: uuid(), type: "offer_view", targetId: offerId, userId: user?.id, visitorId: typeof visitorId === "string" ? visitorId.slice(0, 100) : undefined, createdAt: new Date().toISOString() });
    writeJobsDB(db);
  }
  return NextResponse.json({ ok: true, deduplicated: recent });
}
