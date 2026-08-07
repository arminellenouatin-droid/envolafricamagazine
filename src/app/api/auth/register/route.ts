import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, User, generateAffiliateCode } from "@/lib/db";
import { hashPassword, generateToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, prenom, email, password, affiliateRef } = body;
    if (!nom || !prenom || !email || !password) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    const db = readDB();
    if (db.users.find(u=>u.email.toLowerCase()===email.toLowerCase())) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email" }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const affiliateCode = generateAffiliateCode(prenom, nom);
    const refAffiliate = affiliateRef ? db.users.find(u=>u.affiliateCode===affiliateRef || u.id===affiliateRef) : null;

    const newUser: User = {
      id: uuidv4(),
      nom,
      prenom,
      email,
      passwordHash,
      role: "user",
      lang: "fr",
      currency: "XOF",
      createdAt: new Date().toISOString(),
      isVerified: true,
      twoFactorEnabled: false,
      country: "BJ",
      affiliateCode,
      referredBy: refAffiliate?.id,
      favorites: [],
      downloads: [],
    };
    db.users.push(newUser);
    writeDB(db);
    const token = generateToken(newUser);
    const res = NextResponse.json({ success: true, user: { id: newUser.id, email: newUser.email, nom: newUser.nom, prenom: newUser.prenom, role: newUser.role, affiliateCode } });
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS as any);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
