import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const { id } = await params;
  const { content, giftType } = await request.json().catch(() => ({}));

  if (typeof content !== "string" || content.trim().length < 1 || content.length > 1000) {
    return NextResponse.json({ error: "Message invalide." }, { status: 400 });
  }

  const db = readWabDB();
  const salon = db.salons.find((item) => item.id === id);
  if (!salon) return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });

  // Auto-join participant si pas encore inscrit
  if (!db.salonParticipants.some((item) => item.salonId === id && item.userId === user.id)) {
    db.salonParticipants.push({
      salonId: id,
      userId: user.id,
      name: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email,
      joinedAt: new Date().toISOString(),
    });
    salon.participants = db.salonParticipants.filter((p) => p.salonId === id).length;
  }

  const authorName = `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email || "Participant";
  const message = {
    id: uuid(),
    salonId: id,
    userId: user.id,
    author: authorName,
    content: content.trim(),
    giftType: typeof giftType === "string" ? giftType : undefined,
    createdAt: new Date().toISOString(),
  };

  db.salonMessages.push(message);
  writeWabDB(db);

  return NextResponse.json({ message }, { status: 201 });
}
