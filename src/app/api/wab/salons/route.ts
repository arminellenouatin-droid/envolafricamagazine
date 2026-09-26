import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
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
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  const user = await getCurrentUserFromCookie();
  const db = readWabDB();

  // Si aucun salon, initialiser avec les démos live
  if (!db.salons || db.salons.length === 0) {
    db.salons = [...demoSalons];
    writeWabDB(db);
  }

  const salons = db.salons
    .filter((salon) => salon.status !== "cancelled")
    .sort((a, b) => {
      // Les lives en premier
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return Date.parse(a.startsAt) - Date.parse(b.startsAt);
    });

  let followedLiveCount = 0;
  if (user) {
    const followedHostIds = db.connections
      .filter((c) => c.followerUserId === user.id)
      .map((c) => {
        const prof = db.profiles.find((p) => p.id === c.profileId);
        return prof?.userId || c.profileId;
      });

    // Compter les lives des comptes suivis (ou au moins 1 pour démonstration si suivi de démonstration)
    followedLiveCount = salons.filter(
      (s) => s.status === "live" && (followedHostIds.includes(s.hostUserId) || s.hostUserId === "user-aicha")
    ).length;
  } else {
    followedLiveCount = salons.filter((s) => s.status === "live").length;
  }

  return NextResponse.json({ salons, followedLiveCount });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== "string" || body.title.trim().length < 3) {
    return NextResponse.json({ error: "Titre de Salon invalide (au moins 3 caractères requis)." }, { status: 400 });
  }

  const hostUserId = user ? user.id : `guest-${uuid().slice(0, 8)}`;
  const host = user
    ? (`${user.prenom || ""} ${user.nom || ""}`.trim() || user.email || "Hôte")
    : (typeof body.host === "string" && body.host.trim() ? body.host.trim() : "Créateur Envol");

  const isLiveNow = Boolean(body.isLiveNow || body.status === "live");
  const startsAt = isLiveNow ? new Date().toISOString() : body.startsAt || new Date().toISOString();

  const db = readWabDB();
  if (!Array.isArray(db.salons)) db.salons = [];
  if (!Array.isArray(db.salonParticipants)) db.salonParticipants = [];

  let hostAvatarUrl: string | undefined = undefined;
  if (typeof body.hostAvatarUrl === "string" && body.hostAvatarUrl.trim()) {
    hostAvatarUrl = body.hostAvatarUrl.trim();
  } else if (user) {
    const profile = db.profiles.find((p) => p.userId === user.id);
    hostAvatarUrl =
      profile?.avatarUrl ||
      (user as unknown as { avatar_url?: string; photo_url?: string; avatar?: string }).avatar_url ||
      (user as unknown as { photo_url?: string }).photo_url ||
      (user as unknown as { avatar?: string }).avatar;
  }

  const salon = {
    id: uuid(),
    hostUserId,
    host,
    hostAvatarUrl,
    title: body.title.trim().slice(0, 180),
    description: typeof body.description === "string" ? body.description.trim().slice(0, 4000) : "",
    startsAt,
    status: (isLiveNow ? "live" : "scheduled") as "live" | "scheduled",
    participants: 1,
    guestRequests: [],
    createdAt: new Date().toISOString(),
  };

  db.salons.unshift(salon);
  // Auto-join host
  db.salonParticipants.push({
    salonId: salon.id,
    userId: hostUserId,
    name: salon.host,
    joinedAt: new Date().toISOString(),
  });

  writeWabDB(db);
  return NextResponse.json({ salon }, { status: 201 });
}
