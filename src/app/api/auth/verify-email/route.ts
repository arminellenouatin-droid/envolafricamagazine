import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { consumeEmailVerificationToken } from "@/lib/security-db";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) return NextResponse.redirect(new URL("/auth/login?verification=missing", request.url));
  try {
    const client = getSupabaseAdmin();
    if (!client) return NextResponse.redirect(new URL("/auth/login?verification=unavailable", request.url));
    const { data: tokenRow } = await client.from("email_verification_tokens").select("subscriber_id").eq("token_hash", (await import("@/lib/security-crypto")).hashOpaqueToken(token)).eq("purpose", "newsletter_verification").maybeSingle();
    if (tokenRow?.subscriber_id) {
      const { error } = await client.from("newsletter_subscribers").update({ status: "active", verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", tokenRow.subscriber_id);
      if (error) throw error;
      await client.from("email_verification_tokens").update({ consumed_at: new Date().toISOString() }).eq("token_hash", (await import("@/lib/security-crypto")).hashOpaqueToken(token));
      return NextResponse.redirect(new URL("/kiosque?newsletter=verified", request.url));
    }

    const userId = await consumeEmailVerificationToken(token, "account_verification");
    if (!userId) return NextResponse.redirect(new URL("/auth/login?verification=invalid", request.url));
    const { error } = await client.from("users").update({ is_verified: true }).eq("id", userId);
    if (error) throw error;
    return NextResponse.redirect(new URL("/auth/login?verification=success", request.url));
  } catch (error) {
    console.error("Email verification failed", error);
    return NextResponse.redirect(new URL("/auth/login?verification=error", request.url));
  }
}
