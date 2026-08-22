import { NextRequest, NextResponse } from "next/server";
import { findUserById } from "@/lib/core-db";
import { COOKIE_NAME, COOKIE_OPTIONS, generateToken } from "@/lib/auth";
import { consumeLoginChallenge, consumeLoginChallengeOnce, incrementLoginChallenge, recordSessionEvent } from "@/lib/security-db";
import { decryptSecret, hashRecoveryCode, verifyTotpCode } from "@/lib/security-crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const challenge = String(body.challenge || "").trim();
    const code = String(body.code || "").trim();
    const userId = String(body.userId || "").trim();
    if (!challenge || !code || !userId) return NextResponse.json({ error: "Challenge et code requis" }, { status: 400 });

    const challengeRow = await consumeLoginChallenge(challenge, userId);
    if (!challengeRow) return NextResponse.json({ error: "Challenge expiré ou invalide" }, { status: 401 });
    const client = getSupabaseAdmin();
    if (!client) return NextResponse.json({ error: "Service 2FA indisponible" }, { status: 503 });
    const { data, error } = await client.from("users").select("two_factor_secret,two_factor_recovery_hashes,two_factor_enabled").eq("id", userId).single();
    if (error) throw error;
    const user = await findUserById(userId);
    if (!user || !data.two_factor_enabled) return NextResponse.json({ error: "2FA non disponible pour ce compte" }, { status: 400 });

    const secret = typeof data.two_factor_secret === "string" ? decryptSecret(data.two_factor_secret) : null;
    const recoveryHashes = Array.isArray(data.two_factor_recovery_hashes) ? data.two_factor_recovery_hashes.map(String) : [];
    const validTotp = Boolean(secret && verifyTotpCode(secret, code));
    const recoveryIndex = recoveryHashes.indexOf(hashRecoveryCode(code));
    if (!validTotp && recoveryIndex < 0) {
      await incrementLoginChallenge(challengeRow.id);
      return NextResponse.json({ error: "Code 2FA invalide" }, { status: 400 });
    }
    if (recoveryIndex >= 0) {
      recoveryHashes.splice(recoveryIndex, 1);
      await client.from("users").update({ two_factor_recovery_hashes: recoveryHashes }).eq("id", userId);
    }
    await consumeLoginChallengeOnce(challengeRow.id);
    await recordSessionEvent({ userId, type: "login", ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(), userAgent: request.headers.get("user-agent") || undefined, country: user.country });
    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role, affiliateCode: user.affiliateCode, subscription: user.subscription } });
    response.cookies.set(COOKIE_NAME, generateToken(user), COOKIE_OPTIONS as any);
    return response;
  } catch (error) {
    console.error("Login 2FA verification failed", error);
    return NextResponse.json({ error: "Vérification 2FA impossible" }, { status: 500 });
  }
}
