import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ user: null });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ user: null });
    const db = readDB();
    const user = db.users.find(u=>u.id===decoded.id);
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({ user: { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role, affiliateCode: user.affiliateCode, subscription: user.subscription, favorites: user.favorites, lang: user.lang, currency: user.currency, createdAt: user.createdAt } });
  } catch (e) {
    return NextResponse.json({ user: null });
  }
}
