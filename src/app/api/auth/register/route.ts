import { NextRequest, NextResponse } from "next/server";
import { User, generateAffiliateCode } from "@/lib/db";
import { createUser, findUserByEmail, ProductionDatabaseNotConfiguredError } from "@/lib/core-db";
import { hashPassword } from "@/lib/auth";
import { issueEmailVerificationToken } from "@/lib/security-db";
import { normalizeEmail, isPlausibleEmail } from "@/lib/security-crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, prenom, password, affiliateRef } = body;
    const email = normalizeEmail(body.email);
    if (!nom || !prenom || !email || !password) return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    if (!isPlausibleEmail(email)) return NextResponse.json({ error: "Veuillez saisir une adresse e-mail valide" }, { status: 400 });
    if (String(password).length < 8) return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
    if (await findUserByEmail(email)) return NextResponse.json({ error: "Un compte existe déjà avec cet email" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const affiliateCode = generateAffiliateCode(String(prenom), String(nom));
    const refAffiliate = affiliateRef ? await findUserByEmail(normalizeEmail(affiliateRef)) : null;
    const newUserInput: Omit<User, "id" | "createdAt"> = {
      nom: String(nom).trim(), prenom: String(prenom).trim(), email, passwordHash, role: "user", lang: "fr", currency: "XOF",
      isVerified: false, twoFactorEnabled: false, country: "BJ", affiliateCode, referredBy: refAffiliate?.id, favorites: [], downloads: [],
    };
    const newUser = await createUser(newUserInput);
    const rawToken = await issueEmailVerificationToken(newUser.id);
    const verificationUrl = rawToken ? `${req.nextUrl.origin}/auth/verify-email?token=${encodeURIComponent(rawToken)}` : null;

    return NextResponse.json({
      success: true,
      verificationRequired: true,
      message: "Votre compte a été créé. Confirmez votre adresse e-mail pour vous connecter.",
      ...(process.env.NODE_ENV !== "production" && verificationUrl ? { verificationUrl } : {}),
    }, { status: 201 });
  } catch (e) {
    console.error(e);
    if (e instanceof ProductionDatabaseNotConfiguredError) return NextResponse.json({ error: "Service d’inscription temporairement indisponible" }, { status: 503 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
