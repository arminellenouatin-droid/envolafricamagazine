import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function GET() {
  const db = readWabDB();
  const stories = db.stories.filter((story) => story.moderationStatus === "published" && Date.parse(story.expiresAt) > Date.now()).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return NextResponse.json({ stories });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour publier une Story." }, { status: 401 });
  const body = await request.json();
  if (typeof body.mediaUrl !== "string" || !/^https:\/\//.test(body.mediaUrl)) return NextResponse.json({ error: "Une URL média HTTPS est requise." }, { status: 400 });
  const now = new Date();
  const story = { id: crypto.randomUUID(), author: `${user.prenom} ${user.nom}`, authorUserId: user.id, mediaUrl: body.mediaUrl, mimeType: typeof body.mimeType === "string" ? body.mimeType : "image/jpeg", caption: typeof body.caption === "string" ? body.caption.slice(0, 300) : "", createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), views: 0, likes: 0, moderationStatus: "pending_review" as const };
  const db = readWabDB(); db.stories.unshift(story); writeWabDB(db);
  return NextResponse.json({ story }, { status: 201 });
}
