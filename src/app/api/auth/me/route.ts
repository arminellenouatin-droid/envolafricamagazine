import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        avatar: user.avatar,
        affiliateCode: user.affiliateCode,
        subscription: user.subscription,
        favorites: user.favorites,
        lang: user.lang,
        currency: user.currency,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
