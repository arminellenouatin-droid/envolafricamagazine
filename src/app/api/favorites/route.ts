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
  const body = await req.json().catch(() => ({}));
  const rawId = body.id || body.productId || body.articleId || body.itemId;
  if (typeof rawId !== "string" || rawId.trim().length < 1 || rawId.length > 120) {
    return NextResponse.json({ error: "Identifiant de favori requis (id, productId ou articleId)" }, { status: 400 });
  }
  const cleanId = rawId.trim();
  const currentFavs = Array.isArray(user.favorites) ? user.favorites : [];
  const nextFavs = currentFavs.includes(cleanId) ? currentFavs : [...currentFavs, cleanId];
  const favorites = await updateUserFavorites(user.id, nextFavs);
  return NextResponse.json({ success: true, favorites });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const rawId =
    req.nextUrl.searchParams.get("id") ||
    req.nextUrl.searchParams.get("productId") ||
    req.nextUrl.searchParams.get("articleId") ||
    req.nextUrl.searchParams.get("itemId");
  if (!rawId) {
    return NextResponse.json({ error: "Identifiant de favori requis (id, productId ou articleId)" }, { status: 400 });
  }
  const cleanId = rawId.trim();
  const currentFavs = Array.isArray(user.favorites) ? user.favorites : [];
  const favorites = await updateUserFavorites(user.id, currentFavs.filter((id) => id !== cleanId));
  return NextResponse.json({ success: true, favorites });
}
