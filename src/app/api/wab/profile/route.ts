import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function GET(request: NextRequest) {
  const author = request.nextUrl.searchParams.get("author")?.trim();
  const db = readWabDB();
  if (author) {
    const profile = db.profiles.find((item) => item.status === "active" && item.fullName.toLocaleLowerCase() === author.toLocaleLowerCase()) ?? null;
    const post = db.posts.find((item) => item.author.toLocaleLowerCase() === author.toLocaleLowerCase());
    return NextResponse.json({ profile, author, avatarUrl: post?.authorAvatarUrl, postCount: db.posts.filter((item) => item.author.toLocaleLowerCase() === author.toLocaleLowerCase()).length });
  }
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ profile: null });
  const profile = db.profiles.find((item) => item.userId === user.id) ?? null;
  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json();
  const required = ["headline", "about", "country"];
  const missing = required.find((key) => typeof body[key] !== "string" || !body[key].trim());
  if (missing) return NextResponse.json({ error: `Champ obligatoire : ${missing}` }, { status: 400 });
  const db = readWabDB();
  const now = new Date().toISOString();
  const previous = db.profiles.find((item) => item.userId === user.id);
  const next = { id: previous?.id ?? crypto.randomUUID(), userId: user.id, fullName: `${user.prenom} ${user.nom}`, headline: body.headline.trim().slice(0, 180), about: body.about.trim().slice(0, 3000), companyName: body.companyName?.trim().slice(0, 160), industry: body.industry?.trim().slice(0, 120), country: body.country.trim().slice(0, 100), city: body.city?.trim().slice(0, 100), status: "active" as const, createdAt: previous?.createdAt ?? now, updatedAt: now };
  db.profiles = [next, ...db.profiles.filter((item) => item.userId !== user.id)];
  writeWabDB(db);
  return NextResponse.json({ profile: next });
}
