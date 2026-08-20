import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, ProductionDatabaseNotConfiguredError } from "@/lib/core-db";
import { verifyPassword, generateToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth";
import { isLoginBlocked, recordLoginAttempt, recordSessionEvent, issueLoginChallenge } from "@/lib/security-db";
import { normalizeEmail } from "@/lib/security-crypto";

function requestIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;
}

export async function POST(req: NextRequest) {
  const ip = requestIp(req);
  try {
    const body = await req.json().catch(() => ({}));
    const password = body.password;
    const email = normalizeEmail(body.email);
    if (!email || !password) return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    if (await isLoginBlocked(email, ip)) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });

    const user = await findUserByEmail(email);
    if (!user) {
      await recordLoginAttempt(email, ip, false);
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await recordLoginAttempt(email, ip, false);
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }
    if (!user.isVerified) {
      await recordLoginAttempt(email, ip, false);
      return NextResponse.json({ error: "Veuillez confirmer votre adresse e-mail avant de vous connecter.", verificationRequired: true }, { status: 403 });
    }

    await recordLoginAttempt(email, ip, true);
    if (user.twoFactorEnabled) {
      const challenge = await issueLoginChallenge(user.id);
      if (!challenge) return NextResponse.json({ error: "Service 2FA indisponible" }, { status: 503 });
      return NextResponse.json({ success: true, twoFactorRequired: true, challenge, userId: user.id });
    }
    await recordSessionEvent({ userId: user.id, type: "login", ip, userAgent: req.headers.get("user-agent") || undefined, country: user.country });
    const token = generateToken(user);
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role, affiliateCode: user.affiliateCode, subscription: user.subscription } });
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS as any);
    return res;
  } catch (e) {
    console.error(e);
    if (e instanceof ProductionDatabaseNotConfiguredError) return NextResponse.json({ error: "Service de connexion temporairement indisponible" }, { status: 503 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
