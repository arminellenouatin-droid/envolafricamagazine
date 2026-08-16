import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { isProductionRuntime } from "@/lib/supabase-admin";
import { recordJobsEvent } from "@/lib/jobs-supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readJobsDB, writeJobsDB } from "@/lib/jobs-db";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const type = payload.type;
  if (!["search", "offer_view", "candidate_view"].includes(type)) return NextResponse.json({ error: "Événement invalide." }, { status: 400 });
  const user = await getCurrentUserFromCookie();
  const input = { type: type as "search" | "offer_view" | "candidate_view", userId: user?.id, targetId: typeof payload.targetId === "string" ? payload.targetId : undefined, query: typeof payload.query === "string" ? payload.query.slice(0, 200) : undefined, country: typeof payload.country === "string" ? payload.country.slice(0, 80) : undefined, city: typeof payload.city === "string" ? payload.city.slice(0, 80) : undefined };
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const result = await recordJobsEvent(input);
    if (result.error) return NextResponse.json({ error: "Impossible d’enregistrer l’événement." }, { status: 503 });
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (isProductionRuntime()) return NextResponse.json({ error: "Jobs non configuré." }, { status: 503 });

  const db = readJobsDB();
  db.events.unshift({ id: uuid(), userId: user?.id, visitorId: typeof payload.visitorId === "string" ? payload.visitorId.slice(0, 100) : undefined, type: input.type, query: input.query, targetId: input.targetId, country: input.country, city: input.city, createdAt: new Date().toISOString() });
  db.events = db.events.slice(0, 50000);
  writeJobsDB(db);
  return NextResponse.json({ ok: true }, { status: 201 });
}
