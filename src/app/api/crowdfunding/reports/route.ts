import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function numberOrNull(value: unknown) { return value === "" || value === null || value === undefined ? null : Number(value); }

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    const projectId = req.nextUrl.searchParams.get("projetId");
    if (!projectId) return NextResponse.json({ error: "projetId requis" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ reports: [] });
    const { data: project, error: projectError } = await supabase.from("crowdfunding_projects").select("id,porteur_id").eq("id", projectId).maybeSingle();
    if (projectError) return NextResponse.json({ error: projectError.message }, { status: 500 });
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    let allowed = project.porteur_id === user.id;
    if (!allowed) {
      const { data: contribution } = await supabase.from("crowdfunding_contributions").select("id").eq("projet_id", projectId).eq("investisseur_id", user.id).limit(1).maybeSingle();
      allowed = Boolean(contribution);
    }
    if (!allowed) return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    const { data, error } = await supabase.from("crowdfunding_monthly_reports").select("*").eq("project_id", projectId).order("period_end", { ascending: false }).limit(24);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reports: data || [] });
  } catch { return NextResponse.json({ error: "Erreur serveur" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    const body = await req.json();
    const projectId = String(body.projetId || "");
    const periodStart = String(body.periodeDebut || "");
    const periodEnd = String(body.periodeFin || "");
    if (!projectId || !periodStart || !periodEnd) return NextResponse.json({ error: "Projet et période requis" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "Supabase indisponible" }, { status: 503 });
    const { data: project, error: projectError } = await supabase.from("crowdfunding_projects").select("id,porteur_id").eq("id", projectId).maybeSingle();
    if (projectError) return NextResponse.json({ error: projectError.message }, { status: 500 });
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    if (project.porteur_id !== user.id) return NextResponse.json({ error: "Seul le porteur peut publier ce rapport" }, { status: 403 });
    const report = { project_id: projectId, author_id: user.id, period_start: periodStart, period_end: periodEnd, status: body.soumettre === false ? "draft" : "submitted", revenue: numberOrNull(body.chiffreAffaires), gross_margin: numberOrNull(body.margeBrute), operating_expenses: numberOrNull(body.depensesExploitation), operating_profit: numberOrNull(body.resultatExploitation), cash_start: numberOrNull(body.tresorerieDebut), cash_end: numberOrNull(body.tresorerieFin), cash_inflows: numberOrNull(body.entreesTresorerie), cash_outflows: numberOrNull(body.sortiesTresorerie), operating_cashflow: numberOrNull(body.fluxOperationnel), free_cashflow: numberOrNull(body.fluxDisponible), burn_rate: numberOrNull(body.burnRate), runway_months: numberOrNull(body.autonomieMois), debt_service: numberOrNull(body.serviceDette), dscr: numberOrNull(body.ratioCouvertureDette), customers_active: numberOrNull(body.clientsActifs), customers_new: numberOrNull(body.nouveauxClients), customers_lost: numberOrNull(body.clientsPerdus), employees_count: numberOrNull(body.effectif), milestones_completed: numberOrNull(body.jalonsAtteints), milestones_delayed: numberOrNull(body.jalonsEnRetard), narrative: String(body.resume || ""), risks: String(body.risques || ""), next_actions: String(body.prochainesActions || ""), attachments: Array.isArray(body.piecesJointes) ? body.piecesJointes : [], submitted_at: body.soumettre === false ? null : new Date().toISOString() };
    const { data, error } = await supabase.from("crowdfunding_monthly_reports").upsert(report, { onConflict: "project_id,period_start,period_end" }).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, report: data });
  } catch { return NextResponse.json({ error: "Erreur serveur" }, { status: 500 }); }
}
