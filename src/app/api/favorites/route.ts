import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readDB, writeDB } from "@/lib/db";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const db = readDB();
  return db.users.find(u=>u.id===decoded.id) || null;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  return NextResponse.json({ favorites: user.favorites || [] });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { articleId } = await req.json();
  if (!articleId) return NextResponse.json({ error: "articleId requis" }, { status: 400 });
  const db = readDB();
  const dbUser = db.users.find(u=>u.id===user.id);
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!dbUser.favorites.includes(articleId)) {
    dbUser.favorites.push(articleId);
    writeDB(db);
  }
  return NextResponse.json({ success: true, favorites: dbUser.favorites });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("articleId");
  if (!articleId) return NextResponse.json({ error: "articleId requis" }, { status: 400 });
  const db = readDB();
  const dbUser = db.users.find(u=>u.id===user.id);
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  dbUser.favorites = dbUser.favorites.filter(id=>id!==articleId);
  writeDB(db);
  return NextResponse.json({ success: true, favorites: dbUser.favorites });
}
