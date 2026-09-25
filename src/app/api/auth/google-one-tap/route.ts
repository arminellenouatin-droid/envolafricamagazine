import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/core-db";
import { COOKIE_NAME, COOKIE_OPTIONS, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const credential = typeof body.credential === "string" ? body.credential.trim() : "";
    const rawNext = typeof body.next === "string" ? body.next : "/";
    const safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

    if (!credential) {
      return NextResponse.json({ error: "Jeton Google manquant." }, { status: 400 });
    }

    // Validation du token auprès du endpoint officiel de Google
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!googleRes.ok) {
      return NextResponse.json({ error: "Validation du jeton Google échouée." }, { status: 401 });
    }

    const payload = await googleRes.json();
    const expectedClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (expectedClientId && payload.aud !== expectedClientId) {
      return NextResponse.json({ error: "Client ID Google non correspondant." }, { status: 401 });
    }

    const email = String(payload.email || "").trim().toLowerCase();
    if (!email || payload.email_verified !== "true" && payload.email_verified !== true) {
      return NextResponse.json({ error: "Adresse email Google non vérifiée." }, { status: 400 });
    }

    const prenom = String(payload.given_name || payload.name?.split(" ")[0] || "Envol").trim();
    const nom = String(payload.family_name || payload.name?.split(" ").slice(1).join(" ") || "Utilisateur").trim();
    const avatar = typeof payload.picture === "string" ? payload.picture : undefined;

    const existing = await findUserByEmail(email);
    const user = existing || (await createUser({
      nom,
      prenom,
      email,
      passwordHash: `google:${payload.sub}`,
      role: "user",
      avatar,
      lang: "fr",
      currency: "XOF",
      isVerified: true,
      twoFactorEnabled: false,
      country: "BJ",
      affiliateCode: "",
      favorites: [],
      downloads: [],
    }));

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        prenom: user.prenom,
        nom: user.nom,
      },
      redirectUrl: safeNext,
    });

    response.cookies.set(COOKIE_NAME, generateToken(user), COOKIE_OPTIONS as any);
    return response;
  } catch (error) {
    console.error("Erreur Google One Tap:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la connexion Google." }, { status: 500 });
  }
}
