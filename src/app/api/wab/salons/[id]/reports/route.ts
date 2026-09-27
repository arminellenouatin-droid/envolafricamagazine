import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const { targetType, targetId, reason } = body;
  if (!targetType || !reason || typeof reason !== "string" || reason.trim().length < 3) {
    return NextResponse.json({ error: "Motif du signalement invalide." }, { status: 400 });
  }

  const db = readWabDB();
  const salon = db.salons.find((s) => s.id === id);
  if (!salon) return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });

  const reporterId = user ? user.id : `anonymous-${uuid().slice(0, 8)}`;
  const reporterName = user
    ? (`${user.prenom || ""} ${user.nom || ""}`.trim() || user.email)
    : "Spectateur anonyme";

  const report = {
    id: uuid(),
    salonId: id,
    reporterId,
    reporterName,
    targetType: (targetType === "message" || targetType === "user" ? targetType : "salon") as "salon" | "message" | "user",
    targetId: typeof targetId === "string" ? targetId : id,
    reason: reason.trim().slice(0, 1000),
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };

  if (!Array.isArray(db.liveReports)) db.liveReports = [];
  db.liveReports.unshift(report);

  // Également insérer dans la table générale des signalements WAB
  if (!Array.isArray(db.reports)) db.reports = [];
  db.reports.unshift({
    id: report.id,
    targetType: "post",
    targetId: id,
    reporterId,
    reason: `[Signalement Live WAB : ${targetType}] ${reason.trim()}`,
    status: "open",
    createdAt: report.createdAt,
  });

  writeWabDB(db);

  return NextResponse.json({
    success: true,
    message: "Votre signalement a bien été transmis aux modérateurs de la plateforme.",
    reportId: report.id,
  });
}
