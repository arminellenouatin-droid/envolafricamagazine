import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readJobsDB } from "@/lib/jobs-db";

export async function GET() {
 const user = await getCurrentUserFromCookie(); if (!user) return NextResponse.json({ notifications: [] });
 const database = readJobsDB(); const notifications = database.applications.filter((application) => application.userId === user.id && application.status !== "sent").map((application) => { const offer = database.offers.find((item) => item.id === application.offerId); const labels: Record<string, string> = { seen: "Votre candidature a été consultée", shortlisted: "Vous êtes présélectionné(e)", rejected: "Votre candidature n’a pas été retenue" }; return { id: application.id, type: application.status, title: labels[application.status] ?? "Mise à jour de candidature", body: offer?.title ?? "Offre Jobs", href: `/emploi/offres/${application.offerId}`, createdAt: application.createdAt }; }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)); return NextResponse.json({ notifications });
}
