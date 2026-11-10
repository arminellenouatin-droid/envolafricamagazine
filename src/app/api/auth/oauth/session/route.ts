import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COOKIE_NAME, COOKIE_OPTIONS, generateToken, verifyToken } from "@/lib/auth";
import { getOrCreateSocialUser } from "@/lib/auth-social";
import { findUserById } from "@/lib/core-db";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const accessToken = body?.accessToken;
    const sessionToken = body?.sessionToken;

    // 1. Authentification via sessionToken inter-domaines sécurisé (JWT interne)
    if (sessionToken && typeof sessionToken === "string") {
      const decoded = verifyToken(sessionToken);
      if (decoded && typeof decoded === "object" && "id" in decoded && typeof decoded.id === "string") {
        const user = await findUserById(decoded.id);
        if (user) {
          const token = generateToken(user);
          const response = NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role },
            sessionToken: token,
          });
          response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
          return response;
        }
      }
      return NextResponse.json({ error: "Jeton de session invalide ou expiré." }, { status: 401 });
    }

    // 2. Authentification via accessToken Supabase OAuth
    if (typeof accessToken !== "string" || !accessToken) {
      return NextResponse.json({ error: "Session OAuth manquante." }, { status: 400 });
    }
    const supabase = getSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Authentification sociale indisponible." }, { status: 503 });

    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData.user?.email) {
      return NextResponse.json({ error: "Session sociale invalide ou email non fourni." }, { status: 401 });
    }

    const socialUser = authData.user;
    const metadata = (socialUser.user_metadata || {}) as Record<string, unknown>;
    const email = String(socialUser.email).trim().toLowerCase();
    const fullName = String(metadata.full_name || metadata.name || "").trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const prenom = String(metadata.given_name || nameParts[0] || "Envol").trim();
    const nom = String(metadata.family_name || nameParts.slice(1).join(" ") || "Utilisateur").trim();
    const avatar =
      typeof metadata.avatar_url === "string"
        ? metadata.avatar_url
        : typeof metadata.picture === "string"
        ? metadata.picture
        : undefined;

    const user = await getOrCreateSocialUser({
      provider: "google",
      email,
      prenom,
      nom,
      avatar,
      providerId: socialUser.id,
    });

    const token = generateToken(user);
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role },
      sessionToken: token,
    });
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error("OAuth session error", error);
    return NextResponse.json({ error: "Impossible de finaliser la connexion sociale." }, { status: 500 });
  }
}
