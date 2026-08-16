import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readJobsDB, writeJobsDB } from "@/lib/jobs-db";
import { createJobsApplicationInSupabase, updateJobsApplicationStatus } from "@/lib/jobs-supabase";

type ApplicationStatus = "sent" | "seen" | "shortlisted" | "rejected";
export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { offerId, message } = await request.json();

  const persisted = await createJobsApplicationInSupabase(user.id, offerId, message);
  if (persisted.configured) {
    if (persisted.application) return NextResponse.json({ success: true, application: persisted.application }, { status: 201 });
    if (persisted.reason === "offer") return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
    if (persisted.reason === "candidate") return NextResponse.json({ error: "Publiez dâ€™abord votre candidature afin de postuler." }, { status: 400 });
    if (persisted.reason === "access") return NextResponse.json({ error: "DÃ©cryptez cette offre ou activez un abonnement candidat avant de postuler." }, { status: 403 });
    return NextResponse.json({ error: "Impossible dâ€™enregistrer votre candidature." }, { status: 503 });
  }

  const db = readJobsDB();
  const offer = db.offers.find((item) => item.id === offerId && item.status === "published");
  if (!offer) return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
  const unlocked = db.unlocks.some((item) => item.userId === user.id && item.offerId === offerId && item.status === "paid");
  const subscription = db.subscriptions.some((item) => item.userId === user.id && item.audience === "candidate" && item.status === "active" && (!item.endsAt || new Date(item.endsAt) > new Date()));
  if (!unlocked && !subscription) return NextResponse.json({ error: "DÃ©cryptez cette offre ou activez un abonnement candidat avant de postuler." }, { status: 403 });
  const candidate = db.candidates.find((item) => item.createdBy === user.id);
  if (!candidate) return NextResponse.json({ error: "Publiez dâ€™abord votre candidature afin de postuler." }, { status: 400 });
  if (db.applications.some((item) => item.offerId === offerId && item.userId === user.id)) return NextResponse.json({ error: "Vous avez dÃ©jÃ  postulÃ© Ã  cette offre." }, { status: 409 });
  db.applications.push({ id: uuid(), offerId, userId: user.id, message: typeof message === "string" ? message.trim().slice(0, 2000) : undefined, status: "sent", createdAt: new Date().toISOString() });
  offer.applications += 1;
  writeJobsDB(db);
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { applicationId, status } = await request.json();
  const allowed = ["seen", "shortlisted", "rejected"];
  if (!allowed.includes(status)) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });

  const persisted = await updateJobsApplicationStatus(applicationId, user.id, status as ApplicationStatus);
  if (persisted.configured) {
    if (persisted.unauthorized) return NextResponse.json({ error: "Action non autorisÃ©e." }, { status: 403 });
    if (!persisted.application) return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    return NextResponse.json({ application: persisted.application });
  }

  const db = readJobsDB();
  const application = db.applications.find((item) => item.id === applicationId);
  if (!application) return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
  const offer = db.offers.find((item) => item.id === application.offerId && item.createdBy === user.id);
  if (!offer) return NextResponse.json({ error: "Action non autorisÃ©e." }, { status: 403 });
  application.status = status as ApplicationStatus;
  writeJobsDB(db);
  return NextResponse.json({ application });
}
