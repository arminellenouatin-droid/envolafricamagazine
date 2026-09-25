import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

const demoSalons = [
  {
    id: "salon-live-panafricain",
    hostUserId: "user-aicha",
    host: "Aïcha Bamba",
    title: "Opportunités Logistiques & Financement en Afrique de l'Ouest",
    description: "Session interactive en direct : retour d'expérience sur la levée de fonds et la structuration logistique à Abidjan et Dakar.",
    startsAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: "live" as const,
    participants: 142,
    createdAt: new Date().toISOString(),
  },
  {
    id: "salon-live-tech",
    hostUserId: "user-moussa",
    host: "Moussa Diallo",
    title: "Masterclass B2B : Vendre et exporter ses services depuis l'Afrique",
    description: "Débat live avec questions-réponses en direct pour les dirigeants de PME et consultants.",
    startsAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    status: "live" as const,
    participants: 89,
    createdAt: new Date().toISOString(),
  },
  {
    id: "salon-scheduled-fintech",
    hostUserId: "user-njeri",
    host: "Njeri Wanjiku",
    title: "Le futur des paiements mobiles et de l'interopérabilité bancaire",
    description: "Analyse des tendances 2026-2027 avec les acteurs clés des fintechs africaines.",
    startsAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    status: "scheduled" as const,
    participants: 45,
    createdAt: new Date().toISOString(),
  },
];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const rawContent = typeof body.content === "string" ? body.content : "";
  const content = rawContent
    .replace(/&amp;nbsp;?/gi, " ")
    .replace(/&nbsp;?/gi, " ")
    .replace(/\u00a0/g, " ")
    .trim();

  if (content.length < 1 || content.length > 1000) {
    return NextResponse.json({ error: "Message invalide." }, { status: 400 });
  }

  const db = readWabDB();
  if (!Array.isArray(db.salons)) db.salons = [];
  if (!Array.isArray(db.salonParticipants)) db.salonParticipants = [];
  if (!Array.isArray(db.salonMessages)) db.salonMessages = [];

  let salon = db.salons.find((item) => item.id === id);
  if (!salon) {
    const demo = demoSalons.find((item) => item.id === id);
    if (demo) {
      salon = { ...demo };
      db.salons.push(salon);
    } else {
      return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });
    }
  }

  const userId = user ? user.id : `guest-${uuid().slice(0, 8)}`;
  const authorName = user
    ? (`${user.prenom || ""} ${user.nom || ""}`.trim() || user.email || "Participant")
    : (typeof body.author === "string" && body.author.trim() ? body.author.trim() : "Spectateur WAB");

  // Auto-join participant si pas encore inscrit
  if (!db.salonParticipants.some((item) => item.salonId === id && item.userId === userId)) {
    db.salonParticipants.push({
      salonId: id,
      userId,
      name: authorName,
      joinedAt: new Date().toISOString(),
    });
    salon.participants = db.salonParticipants.filter((p) => p.salonId === id).length;
  }

  const message = {
    id: uuid(),
    salonId: id,
    userId,
    author: authorName,
    content,
    giftType: typeof body.giftType === "string" ? body.giftType : undefined,
    createdAt: new Date().toISOString(),
  };

  db.salonMessages.push(message);
  writeWabDB(db);

  return NextResponse.json({ message }, { status: 201 });
}
