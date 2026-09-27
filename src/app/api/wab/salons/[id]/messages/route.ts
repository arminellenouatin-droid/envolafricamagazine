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

  let authorName = "Spectateur WAB";
  if (user) {
    const fullName = `${user.prenom || ""} ${user.nom || ""}`.trim();
    authorName = fullName || user.email?.split("@")[0] || "Participant WAB";
  } else if (typeof body.author === "string" && body.author.trim() && body.author.trim() !== "Moi") {
    authorName = body.author.trim();
  }

  let authorAvatarUrl: string | undefined = undefined;
  if (typeof body.authorAvatarUrl === "string" && body.authorAvatarUrl.trim()) {
    authorAvatarUrl = body.authorAvatarUrl.trim();
  } else if (user) {
    const profile = db.profiles.find((p) => p.userId === user.id);
    authorAvatarUrl =
      profile?.avatarUrl ||
      (user as unknown as { avatar_url?: string; photo_url?: string; avatar?: string }).avatar_url ||
      (user as unknown as { photo_url?: string }).photo_url ||
      (user as unknown as { avatar?: string }).avatar;
  }

  // Vérifier exclusion ou mise en sourdine
  if (Array.isArray(salon.bannedUserIds) && salon.bannedUserIds.includes(userId)) {
    return NextResponse.json({ error: "Vous avez été exclu de ce salon." }, { status: 403 });
  }
  if (Array.isArray(salon.mutedUserIds) && salon.mutedUserIds.includes(userId)) {
    return NextResponse.json({ error: "Vous êtes actuellement en sourdine dans ce salon." }, { status: 403 });
  }

  // Règle anti-contournement WAB (PRD Section 8.3 & 22.3) :
  // Détection des numéros de téléphone (ex: +229 97 ..., 06 12 34 56 78), WhatsApp et liens externes non WAB
  const phonePattern = /(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g;
  const digitsOnly = content.replace(/\D/g, "");
  const hasSuspiciousPhone = digitsOnly.length >= 8 && phonePattern.test(content);
  const hasOffPlatformLink = /(?:wa\.me|whatsapp\.com|t\.me|telegram|virement|paiement direct|cash|contactez-moi sur whatsapp)/i.test(content);

  if (hasSuspiciousPhone || hasOffPlatformLink) {
    return NextResponse.json(
      {
        error: "Règle anti-contournement WAB : Les coordonnées personnelles (téléphone, WhatsApp, paiement direct) sont strictement interdites dans le chat en direct pour garantir la traçabilité et la protection des acheteurs.",
      },
      { status: 400 }
    );
  }

  // Filtre mots sensibles / injures
  const vulgarWords = ["con", "connard", "salope", "merde", "putain", "arnaque", "escroc", "fdp", "bâtard"];
  let sanitizedContent = content;
  vulgarWords.forEach((word) => {
    const reg = new RegExp(`\\b${word}\\b`, "gi");
    sanitizedContent = sanitizedContent.replace(reg, "*".repeat(word.length));
  });

  // Auto-join participant si pas encore inscrit
  if (!db.salonParticipants.some((item) => item.salonId === id && item.userId === userId)) {
    db.salonParticipants.push({
      salonId: id,
      userId,
      name: authorName,
      role: salon.hostUserId === userId ? "host" : "viewer",
      joinedAt: new Date().toISOString(),
    });
    salon.participants = db.salonParticipants.filter((p) => p.salonId === id).length;
  }

  const message = {
    id: uuid(),
    salonId: id,
    userId,
    author: authorName,
    authorAvatarUrl,
    content: sanitizedContent,
    giftType: typeof body.giftType === "string" ? body.giftType : undefined,
    giftAmount: Number(body.giftAmount) || undefined,
    createdAt: new Date().toISOString(),
  };

  db.salonMessages.push(message);
  writeWabDB(db);

  return NextResponse.json({ message }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  const { id } = await params;
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get("messageId");
  if (!messageId) return NextResponse.json({ error: "Identifiant de message manquant." }, { status: 400 });

  const db = readWabDB();
  const salon = db.salons.find((item) => item.id === id);
  if (!salon) return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });

  const message = db.salonMessages.find((m) => m.id === messageId && m.salonId === id);
  if (!message) return NextResponse.json({ error: "Message introuvable." }, { status: 404 });

  const isHost = salon.hostUserId === user.id;
  const isModerator = Array.isArray(salon.moderatorUserIds) && salon.moderatorUserIds.includes(user.id);
  const isAuthor = message.userId === user.id;
  const isAdmin = user.role === "admin";

  if (!isHost && !isModerator && !isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  }

  db.salonMessages = db.salonMessages.filter((m) => m.id !== messageId);
  writeWabDB(db);

  return NextResponse.json({ success: true, deletedMessageId: messageId });
}
