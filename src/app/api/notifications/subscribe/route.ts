import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function isValidLegacySubscription(value: unknown): value is { endpoint: string; keys: { p256dh: string; auth: string } } {
  if (!value || typeof value !== "object") return false;
  const subscription = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  return typeof subscription.endpoint === "string"
    && subscription.endpoint.startsWith("https://")
    && subscription.endpoint.length <= 2048
    && typeof subscription.keys?.p256dh === "string"
    && subscription.keys.p256dh.length <= 512
    && typeof subscription.keys?.auth === "string"
    && subscription.keys.auth.length <= 512;
}

function extractFcmToken(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const data = body as { provider?: unknown; token?: unknown; fid?: unknown };
  if (data.provider !== "firebase") return null;
  const token = typeof data.token === "string" ? data.token.trim() : (typeof data.fid === "string" ? data.fid.trim() : "");
  return token.length >= 10 && token.length <= 1024 ? token : null;
}

export async function GET() {
  return NextResponse.json({
    fcmServerConfigured: isFirebaseAdminConfigured(),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie().catch(() => null);
  const body = await request.json().catch(() => null);
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Service de notifications non configuré." }, { status: 503 });
  }

  const fcmToken = extractFcmToken(body);

  // 1. Enregistrement FCM (Chrome / Web Push)
  if (fcmToken) {
    const record = {
      profile_id: user?.id || null,
      provider: "firebase",
      fcm_fid: fcmToken,
      endpoint: null,
      keys: null,
      user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(record, { onConflict: "fcm_fid" });

    if (error) {
      console.error("[subscribe] Erreur upsert FCM :", error.message);
      return NextResponse.json({ error: "Impossible d’enregistrer l’appareil pour les notifications." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, provider: "firebase" }, { status: 201 });
  }

  // 2. Enregistrement Legacy Web Push
  if (isValidLegacySubscription(body)) {
    const { error } = await supabase.from("push_subscriptions").upsert({
      profile_id: user?.id || null,
      provider: "web_push",
      endpoint: body.endpoint,
      keys: { p256dh: body.keys.p256dh, auth: body.keys.auth },
      user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "endpoint" });

    if (error) {
      return NextResponse.json({ error: "Impossible d’enregistrer l’abonnement." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, provider: "web_push" }, { status: 201 });
  }

  return NextResponse.json({ error: "Format d'abonnement push non valide." }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUserFromCookie().catch(() => null);
  const body = await request.json().catch(() => null);
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Service de notifications non configuré." }, { status: 503 });
  }

  const fcmToken = extractFcmToken(body);
  const endpoint = body && typeof body.endpoint === "string" ? body.endpoint : null;

  if (fcmToken) {
    await supabase.from("push_subscriptions").delete().eq("fcm_fid", fcmToken);
    return NextResponse.json({ ok: true });
  }

  if (endpoint) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return NextResponse.json({ ok: true });
  }

  if (user?.id) {
    await supabase.from("push_subscriptions").delete().eq("profile_id", user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
}
