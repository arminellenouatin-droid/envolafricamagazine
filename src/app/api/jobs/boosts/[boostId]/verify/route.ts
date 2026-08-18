import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readJobsDB, writeJobsDB } from "@/lib/jobs-db";
import { verifyMonerooPayment } from "@/lib/moneroo";
import { publishBoostedSourceToWab } from "@/lib/wab-boost-sources";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ boostId: string }> }) {
 const user = await getCurrentUserFromCookie(); if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
 const { boostId } = await params; const database = readJobsDB(); const boost = database.boosts.find((item) => item.id === boostId && item.userId === user.id); if (!boost) return NextResponse.json({ error: "Boost introuvable." }, { status: 404 });
 if (boost.status === "active") return NextResponse.json({ active: true }); if (!boost.paymentId) return NextResponse.json({ error: "Paiement introuvable." }, { status: 400 }); const result = await verifyMonerooPayment(boost.paymentId); if (!["success", "paid", "completed"].includes(String(result.status))) return NextResponse.json({ active: false, status: "pending" });
 const start = new Date(); const end = new Date(start.getTime() + boost.days * 86400000); boost.status = "active"; boost.startsAt = start.toISOString(); boost.endsAt = end.toISOString(); if (boost.targetType === "offer") { const offer = database.offers.find((item) => item.id === boost.targetId); if (offer) { offer.isBoosted = true; offer.boostEndsAt = boost.endsAt; } } else { const candidate = database.candidates.find((item) => item.id === boost.targetId); if (candidate) { candidate.isBoosted = true; candidate.boostEndsAt = boost.endsAt; } } writeJobsDB(database); const publication = await publishBoostedSourceToWab({ sourceType: boost.targetType === "offer" ? "jobs_offer" : "jobs_candidate", sourceId: boost.targetId, userId: user.id, boostEndsAt: boost.endsAt }); return NextResponse.json({ active: true, publishedToWab: publication.published });
}
