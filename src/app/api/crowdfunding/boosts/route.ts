import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { initMonerooPayment } from "@/lib/moneroo";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { projectId?: string; durationDays?: number } | null;
  const projectId = String(body?.projectId || "");
  const durationDays = Number(body?.durationDays);
  if (!projectId || !Number.isInteger(durationDays) || durationDays < 1 || durationDays > 90) return NextResponse.json({ error: "La durée du boost doit être comprise entre 1 et 90 jours." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service de boost indisponible." }, { status: 503 });

  const { data: project, error: projectError } = await supabase.from("crowdfunding_projects").select("id,nom,porteur_id,statut").eq("id", projectId).maybeSingle();
  if (projectError) return NextResponse.json({ error: "Impossible de vérifier le projet." }, { status: 502 });
  if (!project || String(project.porteur_id) !== String(user.id)) return NextResponse.json({ error: "Projet introuvable ou accès non autorisé." }, { status: 403 });
  if (!["active", "en_cours", "objectif_atteint", "objectif_depasse"].includes(String(project.statut))) return NextResponse.json({ error: "Le projet doit être actif pour être boosté." }, { status: 409 });

  const { data: settings, error: settingsError } = await supabase.from("crowdfunding_boost_settings").select("price_per_day_xof").eq("code", "default").eq("active", true).maybeSingle();
  if (settingsError) return NextResponse.json({ error: "Impossible de charger le tarif du boost." }, { status: 502 });
  const pricePerDay = Math.max(1, Number(settings?.price_per_day_xof || 500));
  const amountXof = pricePerDay * durationDays;
  const boostId = crypto.randomUUID();
  const { error: insertError } = await supabase.from("crowdfunding_boosts").insert({ id: boostId, project_id: projectId, user_id: user.id, amount_xof: amountXof, duration_days: durationDays, provider: "moneroo", status: "pending" });
  if (insertError) return NextResponse.json({ error: "Impossible d’enregistrer la demande de boost." }, { status: 502 });

  const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  try {
    const payment = await initMonerooPayment({ amount: amountXof, currency: "XOF", description: `Boost Crowdfunding — ${String(project.nom)}`, customer: { email: user.email, first_name: user.prenom, last_name: user.nom, phone: user.phone }, return_url: `${origin}/financement/projets/${projectId}?boost=${boostId}`, metadata: { product: "crowdfunding_boost", boost_id: boostId, project_id: projectId, user_id: user.id, duration_days: durationDays, price_per_day_xof: pricePerDay } });
    const { data: boost, error: updateError } = await supabase.from("crowdfunding_boosts").update({ provider_payment_id: payment.id }).eq("id", boostId).eq("status", "pending").select("id,project_id,amount_xof,duration_days,status,provider_payment_id,created_at").single();
    if (updateError) {
      await supabase.from("crowdfunding_boosts").delete().eq("id", boostId).eq("status", "pending");
      return NextResponse.json({ error: "Impossible de lier le paiement au boost." }, { status: 502 });
    }
    return NextResponse.json({ boost, checkoutUrl: payment.checkout_url, pricePerDayXof: pricePerDay }, { status: 201 });
  } catch {
    await supabase.from("crowdfunding_boosts").delete().eq("id", boostId).eq("status", "pending");
    return NextResponse.json({ error: "Impossible d’initialiser le paiement Moneroo." }, { status: 502 });
  }
}
