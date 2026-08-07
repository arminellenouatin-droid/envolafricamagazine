import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { verifyPassword, generateToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }
    const db = readDB();
    const user = db.users.find(u=>u.email.toLowerCase()===email.toLowerCase());
    if (!user) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }
    const token = generateToken(user);
    const res = NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role, affiliateCode: user.affiliateCode, subscription: user.subscription }
    });
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS as any);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
