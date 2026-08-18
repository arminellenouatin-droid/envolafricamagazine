import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { initMonerooPayment } from "@/lib/moneroo";
import { readCrowdDB } from "@/lib/crowdfunding-db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { projectId?: string; amountXof?: number; durationDays?: number } | null;
  const amountXof = Number(body?.amountXof);
  const durationDays = Number(body?.durationDays);
  if (!body?.projectId || !Number.isInteger(amountXof) || amountXof < 1000 || !Number.isInteger(durationDays) || durationDays < 1 || durationDays > 90) return NextResponse.json({ error: "Paramètres de boost invalides." }, { status: 400 });
  const project = readCrowdDB().projets.find((item) => item.id === body.projectId && item.porteurId === user.id && ["en_cours", "objectif_atteint", "objectif_depasse"].includes(item.statut));
  if (!project) return NextResponse.json({ error: "Projet Crowdfunding non éligible au boost." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service de boost indisponible." }, { status: 503 });
  const boostId = crypto.randomUUID();
  const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  try {
    const payment = await initMonerooPayment({ amount: amountXof, currency: "XOF", description: `Boost Crowdfunding — ${project.nom}`, customer: { email: user.email, first_name: user.prenom, last_name: user.nom, phone: user.phone }, return_url: `${origin}/financement/projets/${project.id}?boost=${boostId}`, metadata: { product: "crowdfunding_boost", boost_id: boostId, project_id: project.id, user_id: user.id } });
    const { data: boost, error } = await supabase.from("crowdfunding_boosts").insert({ id: boostId, project_id: project.id, user_id: user.id, amount_xof: amountXof, duration_days: durationDays, provider_payment_id: payment.id, status: "pending" }).select("id,project_id,amount_xof,duration_days,status,provider_payment_id,created_at").single();
    if (error) return NextResponse.json({ error: "Impossible d’enregistrer la demande de boost." }, { status: 502 });
    return NextResponse.json({ boost, checkoutUrl: payment.checkout_url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Impossible d’initialiser le paiement Moneroo." }, { status: 502 });
  }
}
