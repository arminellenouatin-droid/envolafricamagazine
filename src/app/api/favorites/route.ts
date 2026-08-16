import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { updateUserFavorites } from "@/lib/core-db";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  return NextResponse.json({ favorites: user.favorites || [] });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { articleId } = await req.json();
  if (typeof articleId !== "string" || articleId.trim().length < 1 || articleId.length > 120) {
    return NextResponse.json({ error: "articleId requis" }, { status: 400 });
  }
  const favorites = await updateUserFavorites(user.id, [...(user.favorites || []), articleId.trim()]);
  return NextResponse.json({ success: true, favorites });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const articleId = req.nextUrl.searchParams.get("articleId");
  if (!articleId) return NextResponse.json({ error: "articleId requis" }, { status: 400 });
  const favorites = await updateUserFavorites(user.id, (user.favorites || []).filter((id) => id !== articleId));
  return NextResponse.json({ success: true, favorites });
}
