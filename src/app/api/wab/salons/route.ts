import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";
import { getServiceClient } from "@/lib/live/agora/db";

const demoSalons = [
  {
    id: "salon-live-panafricain",
    hostUserId: "user-aicha",
    host: "Aïcha Bamba",
    hostAvatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&auto=format&fit=crop",
    title: "Opportunités Logistiques & Financement en Afrique de l'Ouest",
    description: "Session interactive : retour d'expérience sur la levée de fonds et la structuration logistique à Abidjan et Dakar.",
    startsAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: "ended" as const,
    participants: 142,
    createdAt: new Date().toISOString(),
  },
  {
    id: "salon-live-tech",
    hostUserId: "user-moussa",
    host: "Moussa Diallo",
    hostAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop",
    title: "Masterclass B2B : Vendre et exporter ses services depuis l'Afrique",
    description: "Débat avec questions-réponses pour les dirigeants de PME et consultants.",
    startsAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    status: "ended" as const,
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

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  const db = readWabDB();
  const { searchParams } = new URL(request.url);
  const themeParam = searchParams.get("theme");
  const statusParam = searchParams.get("status");

  // Réconciliation temps réel avec agora_live_channels (source de vérité officielle)
  try {
    const agoraDb = getServiceClient();
    const { data: channels } = await agoraDb
      .from("agora_live_channels")
      .select("live_id, status");

    if (channels && channels.length > 0) {
      const channelStatusMap = new Map(channels.map((c) => [c.live_id, c.status]));
      let modified = false;
      if (Array.isArray(db.salons)) {
        db.salons.forEach((salon) => {
          const keyWithPrefix = `wab_${salon.id}`;
          const keyWithoutPrefix = salon.id.startsWith("wab_") ? salon.id.slice(4) : salon.id;
          const agoraStatus =
            channelStatusMap.get(keyWithPrefix) ||
            channelStatusMap.get(salon.id) ||
            channelStatusMap.get(keyWithoutPrefix);

          if (agoraStatus === "ended" && salon.status === "live") {
            salon.status = "ended";
            salon.endsAt = salon.endsAt || new Date().toISOString();
            modified = true;
          }
        });
      }
      if (modified) {
        writeWabDB(db);
      }
    }
  } catch {}

  // Si aucun salon, initialiser avec les démos live
  if (!db.salons || db.salons.length === 0) {
    db.salons = [...demoSalons];
    writeWabDB(db);
  }

  let salons = db.salons
    .filter((salon) => salon.status !== "cancelled")
    .sort((a, b) => {
      // Les lives en premier
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return Date.parse(a.startsAt) - Date.parse(b.startsAt);
    });

  if (themeParam && themeParam !== "all") {
    salons = salons.filter((s) => s.theme?.toLowerCase() === themeParam.toLowerCase());
  }

  if (statusParam && (statusParam === "live" || statusParam === "scheduled" || statusParam === "ended")) {
    salons = salons.filter((s) => s.status === statusParam);
  }

  let followedLiveCount = 0;
  if (user) {
    const followedHostIds = db.connections
      .filter((c) => c.followerUserId === user.id)
      .map((c) => {
        const prof = db.profiles.find((p) => p.id === c.profileId);
        return prof?.userId || c.profileId;
      });

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

  const theme = typeof body.theme === "string" && body.theme.trim() ? body.theme.trim() : "Networking";
  const visibility = body.visibility === "followers" || body.visibility === "invite" ? body.visibility : "public";
  const salesModeEnabled = Boolean(body.salesModeEnabled);
  const allowStageRequests = body.allowStageRequests !== false; // Default true
  const coverUrl = typeof body.coverUrl === "string" && body.coverUrl.trim() ? body.coverUrl.trim() : undefined;

  const salon = {
    id: uuid(),
    hostUserId,
    host,
    hostAvatarUrl,
    title: body.title.trim().slice(0, 180),
    description: typeof body.description === "string" ? body.description.trim().slice(0, 4000) : "",
    theme,
    visibility,
    salesModeEnabled,
    allowStageRequests,
    coverUrl,
    startsAt,
    status: (isLiveNow ? "live" : "scheduled") as "live" | "scheduled",
    participants: 1,
    guestRequests: [],
    moderatorUserIds: [],
    mutedUserIds: [],
    bannedUserIds: [],
    stats: {
      peakViewers: 1,
      totalViews: 1,
      totalCoinsReceived: 0,
      totalSalesXof: 0,
    },
    createdAt: new Date().toISOString(),
  };

  db.salons.unshift(salon);
  // Auto-join host
  db.salonParticipants.push({
    salonId: salon.id,
    userId: hostUserId,
    name: salon.host,
    role: "host",
    joinedAt: new Date().toISOString(),
  });

  writeWabDB(db);
  return NextResponse.json({ salon }, { status: 201 });
}
