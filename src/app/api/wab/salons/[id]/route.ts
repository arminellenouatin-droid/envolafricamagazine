import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

const demoSalons = [
  {
    id: "salon-live-panafricain",
    hostUserId: "user-aicha",
    host: "Aïcha Bamba",
    hostAvatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&auto=format&fit=crop",
    title: "Opportunités Logistiques & Financement en Afrique de l'Ouest",
    description: "Session interactive en direct : retour d'expérience sur la levée de fonds et la structuration logistique à Abidjan et Dakar.",
    startsAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: "live" as const,
    participants: 142,
    guestRequests: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "salon-live-tech",
    hostUserId: "user-moussa",
    host: "Moussa Diallo",
    hostAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop",
    title: "Masterclass B2B : Vendre et exporter ses services depuis l'Afrique",
    description: "Débat live avec questions-réponses en direct pour les dirigeants de PME et consultants.",
    startsAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    status: "live" as const,
    participants: 89,
    guestRequests: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "salon-scheduled-fintech",
    hostUserId: "user-njeri",
    host: "Njeri Wanjiku",
    hostAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop",
    title: "Le futur des paiements mobiles et de l'interopérabilité bancaire",
    description: "Analyse des tendances 2026-2027 avec les acteurs clés des fintechs africaines.",
    startsAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    status: "scheduled" as const,
    participants: 45,
    guestRequests: [],
    createdAt: new Date().toISOString(),
  },
];

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readWabDB();
  if (!Array.isArray(db.salons)) db.salons = [];

  let salon = db.salons.find((item) => item.id === id);
  if (!salon) {
    const demo = demoSalons.find((item) => item.id === id);
    if (demo) {
      salon = { ...demo };
      db.salons.push(salon);
      writeWabDB(db);
    } else {
      return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });
    }
  }

  // Si l'hôte n'a pas d'avatar mais existe dans les profils
  if (!salon.hostAvatarUrl) {
    const hostProfile = db.profiles.find((p) => p.userId === salon!.hostUserId);
    if (hostProfile?.avatarUrl) {
      salon.hostAvatarUrl = hostProfile.avatarUrl;
      writeWabDB(db);
    }
  }

  return NextResponse.json({
    salon,
    participants: db.salonParticipants.filter((item) => item.salonId === id),
    messages: db.salonMessages.filter((item) => item.salonId === id).slice(-100),
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  const { id } = await params;
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const db = readWabDB();
  const salon = db.salons.find((item) => item.id === id && item.hostUserId === user.id);
  if (!salon) return NextResponse.json({ error: "Action réservée à l’animateur." }, { status: 403 });

  const body = await request.json().catch(() => ({}));

  if (body.status) {
    if (!["scheduled", "live", "ended", "cancelled"].includes(body.status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }
    salon.status = body.status;
    if (body.status === "ended") salon.endsAt = new Date().toISOString();
  }

  if (typeof body.replayUrl === "string") {
    salon.replayUrl = body.replayUrl.slice(0, 1000);
  }

  if ("coHostUserId" in body) {
    salon.coHostUserId = body.coHostUserId || undefined;
    salon.coHostName = body.coHostName || undefined;
    salon.coHostAvatarUrl = body.coHostAvatarUrl || undefined;
  }

  if (Array.isArray(body.guestRequests)) {
    salon.guestRequests = body.guestRequests;
  }

  writeWabDB(db);
  return NextResponse.json({ salon });
}
