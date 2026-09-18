import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function isValidSubscription(value: unknown): value is { endpoint: string; keys: { p256dh: string; auth: string } } {
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

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const subscription = await request.json().catch(() => null);
  if (!isValidSubscription(subscription)) return NextResponse.json({ error: "Abonnement push invalide." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service de notifications non configuré." }, { status: 503 });

  const { error } = await supabase.from("push_subscriptions").upsert({
    profile_id: user.id,
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "Impossible d’enregistrer l’abonnement." }, { status: 502 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { endpoint?: unknown } | null;
  if (!body || typeof body.endpoint !== "string" || body.endpoint.length > 2048) return NextResponse.json({ error: "Endpoint invalide." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service de notifications non configuré." }, { status: 503 });
  const { error } = await supabase.from("push_subscriptions").delete().eq("profile_id", user.id).eq("endpoint", body.endpoint);
  if (error) return NextResponse.json({ error: "Impossible de supprimer l’abonnement." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
