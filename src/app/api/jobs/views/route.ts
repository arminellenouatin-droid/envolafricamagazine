import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readJobsDB, writeJobsDB } from "@/lib/jobs-db";

export async function POST(request: NextRequest) {
 const { offerId, visitorId } = await request.json(); if (typeof offerId !== "string") return NextResponse.json({ error: "Offre invalide." }, { status: 400 }); const db = readJobsDB(); const offer = db.offers.find((item) => item.id === offerId && item.status === "published"); if (!offer) return NextResponse.json({ error: "Offre introuvable." }, { status: 404 }); const user = await getCurrentUserFromCookie(); const recent = db.events.some((event) => event.type === "offer_view" && event.targetId === offerId && (user ? event.userId === user.id : event.visitorId === visitorId) && Date.now() - Date.parse(event.createdAt) < 1800000); if (!recent) { offer.views += 1; db.events.unshift({ id: uuid(), type: "offer_view", targetId: offerId, userId: user?.id, visitorId: typeof visitorId === "string" ? visitorId.slice(0, 100) : undefined, createdAt: new Date().toISOString() }); writeJobsDB(db); } return NextResponse.json({ ok: true });
}
