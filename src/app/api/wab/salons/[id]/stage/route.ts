import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUserFromCookie();
  const body = await request.json().catch(() => ({}));
  const action = body.action;

  const db = readWabDB();
  if (!Array.isArray(db.salons)) db.salons = [];

  const salon = db.salons.find((item) => item.id === id);
  if (!salon) {
    return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });
  }

  if (!Array.isArray(salon.guestRequests)) {
    salon.guestRequests = [];
  }

  // 1. Spectateur demande à monter sur scène
  if (action === "request") {
    const userId = user ? user.id : body.userId || `guest-${Date.now().toString(36)}`;
    const name = user
      ? (`${user.prenom || ""} ${user.nom || ""}`.trim() || user.email?.split("@")[0] || "Spectateur WAB")
      : (typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Spectateur WAB");

    let avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl : undefined;
    if (!avatarUrl && user) {
      const profile = db.profiles.find((p) => p.userId === user.id);
      avatarUrl = profile?.avatarUrl || (user as unknown as { photo_url?: string; avatar_url?: string }).photo_url || (user as unknown as { avatar_url?: string }).avatar_url;
    }

    // Retirer une demande précédente éventuelle de cet utilisateur
    salon.guestRequests = salon.guestRequests.filter((r) => r.userId !== userId);

    const newRequest = {
      userId,
      name,
      avatarUrl,
      requestedAt: new Date().toISOString(),
      status: "pending" as const,
    };

    salon.guestRequests.push(newRequest);
    writeWabDB(db);

    return NextResponse.json({ success: true, request: newRequest });
  }

  // 2. L'hôte accepte un spectateur sur scène
  if (action === "accept") {
    if (!user || user.id !== salon.hostUserId) {
      return NextResponse.json({ error: "Seul l'animateur du Live peut accepter un invité." }, { status: 403 });
    }

    const targetUserId = body.targetUserId;
    if (!targetUserId) {
      return NextResponse.json({ error: "ID du participant manquant." }, { status: 400 });
    }

    const targetReq = salon.guestRequests.find((r) => r.userId === targetUserId);
    if (!targetReq) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    targetReq.status = "accepted";
    salon.coHostUserId = targetReq.userId;
    salon.coHostName = targetReq.name;
    salon.coHostAvatarUrl = targetReq.avatarUrl;

    writeWabDB(db);
    return NextResponse.json({ success: true, salon });
  }

  // 3. L'hôte refuse une demande
  if (action === "reject") {
    if (!user || user.id !== salon.hostUserId) {
      return NextResponse.json({ error: "Seul l'animateur du Live peut refuser une demande." }, { status: 403 });
    }

    const targetUserId = body.targetUserId;
    salon.guestRequests = salon.guestRequests.filter((r) => r.userId !== targetUserId);

    writeWabDB(db);
    return NextResponse.json({ success: true, salon });
  }

  // 4. Quitter la scène ou faire descendre l'invité
  if (action === "leave" || action === "kick") {
    const isHost = user && user.id === salon.hostUserId;
    const isCoHost = user && user.id === salon.coHostUserId;

    if (!isHost && !isCoHost && !body.force) {
      return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
    }

    salon.coHostUserId = undefined;
    salon.coHostName = undefined;
    salon.coHostAvatarUrl = undefined;
    if (salon.guestRequests) {
      salon.guestRequests = salon.guestRequests.filter((r) => r.status !== "accepted");
    }

    writeWabDB(db);
    return NextResponse.json({ success: true, salon });
  }

  return NextResponse.json({ error: "Action de scène inconnue." }, { status: 400 });
}
