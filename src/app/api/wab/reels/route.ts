import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function GET() {
  const db = readWabDB();
  const reels = db.reels.filter((reel) => reel.moderationStatus === "published").sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return NextResponse.json({ reels });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour publier un Reel." }, { status: 401 });
  const body = await request.json();
  if (typeof body.mediaUrl !== "string" || !/^https:\/\//.test(body.mediaUrl)) return NextResponse.json({ error: "Une URL vidéo HTTPS est requise." }, { status: 400 });
  const reel = { id: crypto.randomUUID(), author: `${user.prenom} ${user.nom}`, authorUserId: user.id, mediaUrl: body.mediaUrl, mimeType: typeof body.mimeType === "string" ? body.mimeType : "video/mp4", caption: typeof body.caption === "string" ? body.caption.slice(0, 500) : "", createdAt: new Date().toISOString(), views: 0, likes: 0, moderationStatus: "pending_review" as const };
  const db = readWabDB(); db.reels.unshift(reel); writeWabDB(db);
  return NextResponse.json({ reel }, { status: 201 });
}
