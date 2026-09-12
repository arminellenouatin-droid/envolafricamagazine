import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { firebaseAdminConfigured } from "@/lib/firebase-admin";
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

function firebaseFid(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { provider?: unknown; fid?: unknown };
  if (candidate.provider !== "firebase" || typeof candidate.fid !== "string") return null;
  const fid = candidate.fid.trim();
  return /^[A-Za-z0-9_-]{10,256}$/.test(fid) ? fid : null;
}

export async function GET() {
  return NextResponse.json({ enabled: firebaseAdminConfigured() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const subscription = await request.json().catch(() => null);
  const fid = firebaseFid(subscription);
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service de notifications non configuré." }, { status: 503 });

  if (fid) {
    if (!firebaseAdminConfigured()) return NextResponse.json({ error: "L’envoi Firebase doit encore être activé sur le serveur." }, { status: 503 });
    const { data: existing, error: lookupError } = await supabase
      .from("push_subscriptions")
      .select("profile_id")
      .eq("fcm_fid", fid)
      .limit(1)
      .maybeSingle();
    if (lookupError) return NextResponse.json({ error: "Impossible de vérifier cet appareil." }, { status: 502 });
    if (existing?.profile_id && existing.profile_id !== user.id) {
      return NextResponse.json({ error: "Cet appareil est déjà associé à un autre compte. Déconnectez d’abord ce compte sur cet appareil." }, { status: 409 });
    }

    const record = {
      profile_id: user.id,
      provider: "firebase",
      fcm_fid: fid,
      endpoint: null,
      keys: null,
      user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = existing
      ? await supabase.from("push_subscriptions").update(record).eq("fcm_fid", fid).eq("profile_id", user.id)
      : await supabase.from("push_subscriptions").insert(record);
    if (error) return NextResponse.json({ error: "Impossible d’enregistrer cet appareil." }, { status: 502 });
    return NextResponse.json({ ok: true, provider: "firebase" }, { status: 201 });
  }

  if (!isValidLegacySubscription(subscription)) return NextResponse.json({ error: "Abonnement push invalide." }, { status: 400 });
  const { error } = await supabase.from("push_subscriptions").upsert({
    profile_id: user.id,
    provider: "web_push",
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "Impossible d’enregistrer l’abonnement." }, { status: 502 });
  return NextResponse.json({ ok: true, provider: "web_push" }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { provider?: unknown; fid?: unknown; endpoint?: unknown } | null;
  const fid = firebaseFid(body);
  const endpoint = body && typeof body.endpoint === "string" && body.endpoint.length <= 2048 ? body.endpoint : null;
  if (!fid && !endpoint) return NextResponse.json({ error: "Identifiant d’appareil invalide." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service de notifications non configuré." }, { status: 503 });

  const query = supabase.from("push_subscriptions").delete().eq("profile_id", user.id);
  const { error } = fid ? await query.eq("fcm_fid", fid) : await query.eq("endpoint", endpoint!);
  if (error) return NextResponse.json({ error: "Impossible de supprimer l’abonnement." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
