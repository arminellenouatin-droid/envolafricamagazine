import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, COOKIE_OPTIONS, generateToken } from "@/lib/auth";
import { getOrCreateSocialUser } from "@/lib/auth-social";
import { v4 as uuidv4 } from "uuid";
import { writeDB, readDB } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const credential = typeof body.credential === "string" ? body.credential.trim() : "";
    const rawNext = typeof body.next === "string" ? body.next : "/";
    const safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

    if (!credential) {
      return NextResponse.json({ error: "Jeton d'authentification Google manquant." }, { status: 400 });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[AUTH][ONE_TAP] credential received");
      console.log("[AUTH][ONE_TAP] API request started");
    }

    // Validation du token auprès du endpoint officiel de Google
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!googleRes.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[AUTH][ONE_TAP] Échec validation tokeninfo Google:", googleRes.status);
      }
      return NextResponse.json({ error: "Le jeton Google n'a pas pu être validé par les serveurs Google." }, { status: 401 });
    }

    const payload = await googleRes.json();
    const expectedClientId = (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
    if (expectedClientId) {
      const audMatches = payload.aud === expectedClientId;
      const azpMatches = payload.azp === expectedClientId;
      if (!audMatches && !azpMatches) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[AUTH][ONE_TAP] Mismatch Client ID aud/azp:", { aud: payload.aud, azp: payload.azp, expected: expectedClientId });
        }
        return NextResponse.json({ error: "L'identifiant client Google ne correspond pas à cette application." }, { status: 401 });
      }
    }

    const email = String(payload.email || "").trim().toLowerCase();
    if (!email || (payload.email_verified !== "true" && payload.email_verified !== true)) {
      return NextResponse.json({ error: "Cette adresse email Google n'est pas vérifiée." }, { status: 400 });
    }

    const prenom = String(payload.given_name || payload.name?.split(" ")[0] || "Envol").trim();
    const nom = String(payload.family_name || payload.name?.split(" ").slice(1).join(" ") || "Utilisateur").trim();
    const avatar = typeof payload.picture === "string" ? payload.picture : undefined;

    // Récupérer ou créer l'utilisateur avec la fonction unifiée
    const user = await getOrCreateSocialUser({
      provider: "google",
      email,
      prenom,
      nom,
      avatar,
      providerId: payload.sub ? `google_${payload.sub}` : undefined,
    });

    // Vérification 2FA si activée sur le compte
    if (user.twoFactorEnabled) {
      const challenge = uuidv4();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const supabase = getSupabaseAdmin();
      if (supabase) {
        await supabase.from("login_challenges").insert({
          challenge,
          user_id: user.id,
          expires_at: expiresAt,
        });
      } else {
        const db = readDB() as unknown as Record<string, unknown>;
        if (!Array.isArray(db.loginChallenges)) db.loginChallenges = [];
        (db.loginChallenges as Array<{ challenge: string; userId: string; expiresAt: string }>).push({
          challenge,
          userId: user.id,
          expiresAt,
        });
        writeDB(db as unknown as Parameters<typeof writeDB>[0]);
      }
      return NextResponse.json({
        success: true,
        twoFactorRequired: true,
        challenge,
        userId: user.id,
        redirectUrl: `/auth/login?challenge=${encodeURIComponent(challenge)}&userId=${encodeURIComponent(user.id)}`,
      });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[AUTH][ONE_TAP] API response: 200");
      console.log("[AUTH][ONE_TAP] session cookie expected for user:", user.id);
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        prenom: user.prenom,
        nom: user.nom,
        role: user.role,
      },
      redirectUrl: safeNext,
    });

    response.cookies.set(COOKIE_NAME, generateToken(user), COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error("Erreur Google One Tap:", error);
    const msg = error instanceof Error ? error.message : "Erreur serveur lors de la connexion Google.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
