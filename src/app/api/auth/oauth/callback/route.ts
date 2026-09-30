import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { COOKIE_NAME, COOKIE_OPTIONS, generateToken } from "@/lib/auth";
import { getOrCreateSocialUser } from "@/lib/auth-social";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export async function GET(request: NextRequest) {
  try {
    const rawNext = request.nextUrl.searchParams.get("next") || "/";
    const safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
    const redirectUrl = new URL(safeNext, request.url);
    const code = request.nextUrl.searchParams.get("code");
    const config = getSupabaseConfig();
    if (!code || !config) {
      return NextResponse.redirect(new URL("/auth/login?oauthError=configuration", request.url));
    }

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
    if (error || !data.user?.email) {
      console.error("[oauth/callback] Exchange code error:", error);
      return NextResponse.redirect(
        new URL(`/auth/login?oauthError=${encodeURIComponent(error?.message || "email_missing")}`, request.url)
      );
    }

    const socialUser = data.user;
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

    response.cookies.set(COOKIE_NAME, generateToken(user), COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error("[oauth/callback] Unhandled OAuth callback error:", error);
    return NextResponse.redirect(new URL("/auth/login?oauthError=internal_error", request.url));
  }
}
