import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createUser, findUserByEmail } from "@/lib/core-db";
import { COOKIE_NAME, COOKIE_OPTIONS, generateToken } from "@/lib/auth";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export async function GET(request: NextRequest) {
  const rawNext = request.nextUrl.searchParams.get("next") || "/";
  const safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const redirectUrl = new URL(safeNext, request.url);
  const code = request.nextUrl.searchParams.get("code");
  const config = getSupabaseConfig();
  if (!code || !config) return NextResponse.redirect(new URL("/auth/login?oauthError=configuration", request.url));

  const response = NextResponse.redirect(redirectUrl);
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user?.email) return NextResponse.redirect(new URL(`/auth/login?oauthError=${encodeURIComponent(error?.message || "email_missing")}`, request.url));

  const socialUser = data.user;
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

  response.cookies.set(COOKIE_NAME, generateToken(user), COOKIE_OPTIONS as any);
  return response;
}
