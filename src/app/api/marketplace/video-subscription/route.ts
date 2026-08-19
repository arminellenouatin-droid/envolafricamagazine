import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { initMonerooPayment, verifyMonerooPayment } from "@/lib/moneroo";

const AMOUNT_XOF = 5000;
const success = (status: unknown) => ["success", "paid", "completed"].includes(String(status).toLowerCase());

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ active: false, authenticated: false });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });
  const { data } = await supabase.from("marketplace_video_subscriptions").select("id,status,amount_xof,starts_at,ends_at,video_count").eq("user_id", user.id).maybeSingle();
  const active = Boolean(data?.status === "active" && data.ends_at && Date.parse(data.ends_at) > Date.now());
  return NextResponse.json({ active, subscription: data || null, remaining: Math.max(0, 10 - Number(data?.video_count || 0)), authenticated: true });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });
  const existing = await supabase.from("marketplace_video_subscriptions").select("id,status,ends_at").eq("user_id", user.id).maybeSingle();
  if (existing.data?.status === "active" && existing.data.ends_at && Date.parse(existing.data.ends_at) > Date.now()) return NextResponse.json({ active: true, subscription: existing.data });
  const id = crypto.randomUUID();
  const { error } = await supabase.from("marketplace_video_subscriptions").upsert({ id, user_id: user.id, amount_xof: AMOUNT_XOF, currency: "XOF", status: "pending", provider_payment_id: null, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "Impossible de préparer l’option vidéo." }, { status: 503 });
  try {
    const payment = await initMonerooPayment({ amount: AMOUNT_XOF, currency: "XOF", description: "Option vidéo Marketplace — abonnement mensuel", customer: { email: user.email, first_name: user.prenom, last_name: user.nom, phone: user.phone }, return_url: `${request.nextUrl.origin}/marketplace/boutique?video_subscription_id=${id}&verify=1`, metadata: { product: "marketplace-video", marketplace_video_subscription_id: id, user_id: user.id, amount_xof: AMOUNT_XOF } });
    await supabase.from("marketplace_video_subscriptions").update({ provider_payment_id: payment.id, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ checkout_url: payment.checkout_url, subscriptionId: id });
  } catch (cause) {
    await supabase.from("marketplace_video_subscriptions").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Paiement indisponible." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { subscriptionId?: string; paymentId?: string } | null;
  const supabase = getSupabaseAdmin();
  if (!supabase || !body?.subscriptionId || !body.paymentId) return NextResponse.json({ error: "Vérification invalide." }, { status: 400 });
  const { data: subscription } = await supabase.from("marketplace_video_subscriptions").select("id,provider_payment_id,status").eq("id", body.subscriptionId).eq("user_id", user.id).maybeSingle();
  if (!subscription || subscription.provider_payment_id !== body.paymentId) return NextResponse.json({ error: "Abonnement ou paiement invalide." }, { status: 403 });
  const verification = await verifyMonerooPayment(body.paymentId);
  if (!success(verification.status)) return NextResponse.json({ active: false, status: "pending" });
  const start = new Date(); const end = new Date(start); end.setMonth(end.getMonth() + 1);
  const { data: active, error } = await supabase.from("marketplace_video_subscriptions").update({ status: "active", starts_at: start.toISOString(), ends_at: end.toISOString(), updated_at: new Date().toISOString() }).eq("id", subscription.id).eq("user_id", user.id).select("id,status,amount_xof,starts_at,ends_at,video_count").single();
  if (error) return NextResponse.json({ error: "Activation impossible." }, { status: 503 });
  return NextResponse.json({ active: true, subscription: active, remaining: Math.max(0, 10 - Number(active.video_count || 0)) });
}
