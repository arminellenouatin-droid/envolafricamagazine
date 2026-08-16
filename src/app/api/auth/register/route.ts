import { NextRequest, NextResponse } from "next/server";
import { User, generateAffiliateCode } from "@/lib/db";
import { createUser, findUserByEmail, ProductionDatabaseNotConfiguredError } from "@/lib/core-db";
import { hashPassword, generateToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, prenom, email, password, affiliateRef } = body;
    if (!nom || !prenom || !email || !password) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
    }
    if (await findUserByEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email" }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const affiliateCode = generateAffiliateCode(String(prenom), String(nom));
    const refAffiliate = affiliateRef ? await findUserByEmail(String(affiliateRef)) : null;

    const newUserInput: Omit<User, "id" | "createdAt"> = {
      nom: String(nom).trim(),
      prenom: String(prenom).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "user",
      lang: "fr",
      currency: "XOF",
      isVerified: true,
      twoFactorEnabled: false,
      country: "BJ",
      affiliateCode,
      referredBy: refAffiliate?.id,
      favorites: [],
      downloads: [],
    };
    const newUser = await createUser(newUserInput);
    const token = generateToken(newUser);
    const res = NextResponse.json({ success: true, user: { id: newUser.id, email: newUser.email, nom: newUser.nom, prenom: newUser.prenom, role: newUser.role, affiliateCode } });
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS as any);
    return res;
  } catch (e) {
    console.error(e);
    if (e instanceof ProductionDatabaseNotConfiguredError) {
      return NextResponse.json({ error: "Service d’inscription temporairement indisponible" }, { status: 503 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
