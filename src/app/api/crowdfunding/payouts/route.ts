import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { calculateCommission, getCommissionRate } from "@/lib/crowdfunding-commission";
import { processPayoutApproval } from "@/lib/crowdfunding/crowdfunding-service";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const client = getSupabaseAdmin();
  if (!client) return NextResponse.json({ error: "Service de reversement indisponible." }, { status: 503 });
  const projectId = request.nextUrl.searchParams.get("projetId");
  let query = client
    .from("crowdfunding_payout_requests")
    .select("id,project_id,porteur_id,gross_amount,commission_rate,commission_amount,net_amount,currency,status,requested_at,reviewed_at,paid_at,note")
    .order("requested_at", { ascending: false })
    .limit(50);
  query = user.role === "admin" ? query : query.eq("porteur_id", String(user.id));
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Impossible de charger les reversements." }, { status: 502 });
  return NextResponse.json({ payouts: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const client = getSupabaseAdmin();
  if (!client) return NextResponse.json({ error: "Service de reversement indisponible." }, { status: 503 });
  const body = (await request.json().catch(() => null)) as { projetId?: string; note?: string } | null;
  const projectId = String(body?.projetId || "");
  if (!projectId) return NextResponse.json({ error: "Projet requis." }, { status: 400 });

  const { data: project, error: projectError } = await client
    .from("crowdfunding_projects")
    .select("id,porteur_id,montant_collecte,types_financement,statut")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) return NextResponse.json({ error: "Impossible de vérifier le projet." }, { status: 502 });
  if (!project || String(project.porteur_id) !== String(user.id)) {
    return NextResponse.json({ error: "Projet introuvable ou accès non autorisé." }, { status: 403 });
  }
  if (!['objectif_atteint', 'objectif_depasse', 'completed_success'].includes(String(project.statut))) {
    return NextResponse.json({ error: "Le projet doit avoir atteint son objectif avant un reversement." }, { status: 409 });
  }

  const { data: openPayout } = await client
    .from("crowdfunding_payout_requests")
    .select("id,status")
    .eq("project_id", projectId)
    .in("status", ["requested", "approved"])
    .limit(1)
    .maybeSingle();
  if (openPayout) {
    return NextResponse.json({ error: "Une demande de reversement est déjà ouverte pour ce projet." }, { status: 409 });
  }

  const fundingType = Array.isArray(project.types_financement) ? project.types_financement[0] : "don";
  const rate = await getCommissionRate(fundingType);
  const amounts = calculateCommission(Number(project.montant_collecte), rate.ratePercent);
  const { data: payout, error } = await client
    .from("crowdfunding_payout_requests")
    .insert({
      project_id: projectId,
      porteur_id: String(user.id),
      gross_amount: amounts.grossAmount,
      commission_rate: amounts.commissionRate,
      commission_amount: amounts.commissionAmount,
      net_amount: amounts.netAmount,
      currency: "XOF",
      status: "requested",
      note: String(body?.note || ""),
    })
    .select("id,project_id,porteur_id,gross_amount,commission_rate,commission_amount,net_amount,currency,status,requested_at,note")
    .single();
  if (error) return NextResponse.json({ error: "Impossible de créer la demande de reversement." }, { status: 502 });
  return NextResponse.json({ payout }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé : rôle administrateur requis" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    payoutId?: string;
    approve?: boolean;
    note?: string;
  } | null;

  if (!body?.payoutId) {
    return NextResponse.json({ error: "payoutId requis" }, { status: 400 });
  }

  try {
    const result = await processPayoutApproval({
      adminUserId: user.id,
      payoutId: body.payoutId,
      approve: Boolean(body.approve),
      adminNote: body.note,
    });

    return NextResponse.json({
      success: true,
      payoutId: result.payoutId,
      status: result.status,
      netAmountCredited: result.netAmountCredited,
      message:
        result.status === "approved"
          ? "Reversement validé avec succès et crédité sur le portefeuille du porteur !"
          : "Demande de reversement rejetée.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erreur lors du traitement du reversement" },
      { status: 400 }
    );
  }
}
