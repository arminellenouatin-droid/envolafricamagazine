import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getCurrentUserForAdmin("gerant");
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Base indisponible" }, { status: 503 });

  try {
    const { data: reports, error } = await supabase
      .from("ad_reports")
      .select(`
        id,
        motif,
        details,
        traite,
        decision,
        created_at,
        ad_creatives (
          id,
          titre,
          media_url,
          destination_url,
          statut_moderation
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reports: reports || [] });
  } catch (err: any) {
    console.error("Erreur récupération signalements:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const access = await getCurrentUserForAdmin("gerant");
  if (access.error || !access.user) return NextResponse.json({ error: access.error || "Non autorisé" }, { status: access.status || 401 });
  const adminUser = access.user;

  const body = await req.json().catch(() => null);
  if (!body || !body.reportId || !body.decision) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Base indisponible" }, { status: 503 });

  try {
    const { data: updatedReport, error: updateErr } = await supabase
      .from("ad_reports")
      .update({
        traite: true,
        decision: body.decision,
      })
      .eq("id", body.reportId)
      .select("*")
      .single();

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Si la décision est de suspendre la créative liée
    if (body.suspendCreative && body.creativeId) {
      await supabase
        .from("ad_creatives")
        .update({
          statut_moderation: "suspendue",
          motif_refus: `Suspendue suite à signalement: ${body.decision}`,
        })
        .eq("id", body.creativeId);
    }

    try {
      await supabase.from("ad_audit_log").insert({
        actor_id: adminUser.id,
        action: "PROCESS_AD_REPORT",
        entite: "ad_reports",
        entite_id: body.reportId,
        apres: updatedReport,
      });
    } catch {
      // Silencieux
    }

    return NextResponse.json({
      success: true,
      report: updatedReport,
      message: "Signalement traité avec succès",
    });
  } catch (err: any) {
    console.error("Erreur traitement signalement:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
