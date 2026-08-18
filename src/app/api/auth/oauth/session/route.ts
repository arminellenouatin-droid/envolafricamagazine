import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createUser, findUserByEmail } from "@/lib/core-db";
import { COOKIE_NAME, COOKIE_OPTIONS, generateToken } from "@/lib/auth";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    if (typeof accessToken !== "string" || !accessToken) return NextResponse.json({ error: "Session OAuth manquante." }, { status: 400 });
    const supabase = getSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Authentification sociale indisponible." }, { status: 503 });

    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData.user?.email) return NextResponse.json({ error: "Session sociale invalide ou email non fourni." }, { status: 401 });

    const socialUser = authData.user;
    const metadata = (socialUser.user_metadata || {}) as Record<string, unknown>;
    const email = String(socialUser.email).trim().toLowerCase();
    const fullName = String(metadata.full_name || metadata.name || "").trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const existing = await findUserByEmail(email);
    const user = existing || await createUser({
      nom: String(metadata.family_name || nameParts.slice(1).join(" ") || "Utilisateur"),
      prenom: String(metadata.given_name || nameParts[0] || "Envol"),
      email,
      passwordHash: `oauth:${socialUser.id}`,
      role: "user",
      avatar: typeof metadata.avatar_url === "string" ? metadata.avatar_url : (typeof metadata.picture === "string" ? metadata.picture : undefined),
      lang: "fr",
      currency: "XOF",
      isVerified: true,
      twoFactorEnabled: false,
      country: "BJ",
      affiliateCode: "",
      favorites: [],
      downloads: [],
    });

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role } });
    response.cookies.set(COOKIE_NAME, generateToken(user), COOKIE_OPTIONS as any);
    return response;
  } catch (error) {
    console.error("OAuth session error", error);
    return NextResponse.json({ error: "Impossible de finaliser la connexion sociale." }, { status: 500 });
  }
}
