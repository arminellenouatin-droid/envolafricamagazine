import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readJobsDB, writeJobsDB } from "@/lib/jobs-db";

export async function POST(request: NextRequest) {
 const payload = await request.json(); const type = payload.type; if (!["search", "offer_view", "candidate_view"].includes(type)) return NextResponse.json({ error: "Événement invalide." }, { status: 400 }); const user = await getCurrentUserFromCookie(); const db = readJobsDB(); db.events.unshift({ id: uuid(), userId: user?.id, visitorId: typeof payload.visitorId === "string" ? payload.visitorId.slice(0, 100) : undefined, type, query: typeof payload.query === "string" ? payload.query.slice(0, 200) : undefined, targetId: typeof payload.targetId === "string" ? payload.targetId : undefined, country: typeof payload.country === "string" ? payload.country.slice(0, 80) : undefined, city: typeof payload.city === "string" ? payload.city.slice(0, 80) : undefined, createdAt: new Date().toISOString() }); db.events = db.events.slice(0, 50000); writeJobsDB(db); return NextResponse.json({ ok: true }, { status: 201 });
}
