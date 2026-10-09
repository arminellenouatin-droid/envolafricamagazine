import { NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getCurrentUserForAdmin("gerant");
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });
  }

  try {
    const [
      campaignsRes,
      pendingCreativesRes,
      reportsRes,
      slotsRes,
      dailyStatsRes,
    ] = await Promise.all([
      supabase.from("ad_campaigns").select("id, statut, budget_total, budget_consomme"),
      supabase.from("ad_creatives").select("id", { count: "exact", head: true }).eq("statut_moderation", "en_attente"),
      supabase.from("ad_reports").select("id", { count: "exact", head: true }).eq("traite", false),
      supabase.from("ad_slots").select("id, actif, type"),
      supabase.from("ad_impressions_daily").select("impressions, clics, depense").limit(1000),
    ]);

    const campaigns = campaignsRes.data || [];
    const activeCampaigns = campaigns.filter((c) => c.statut === "active").length;
    const inModerationCampaigns = campaigns.filter((c) => c.statut === "en_moderation").length;
    const totalBudgetConsomme = campaigns.reduce((sum, c) => sum + (Number(c.budget_consomme) || 0), 0);

    const dailyStats = dailyStatsRes.data || [];
    const totalImpressions = dailyStats.reduce((sum, d) => sum + (Number(d.impressions) || 0), 0);
    const totalClicks = dailyStats.reduce((sum, d) => sum + (Number(d.clics) || 0), 0);
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

    const slots = slotsRes.data || [];
    const activeSlots = slots.filter((s) => s.actif).length;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      stats: {
        activeCampaigns,
        inModerationCampaigns,
        pendingCreatives: pendingCreativesRes.count || 0,
        unresolvedReports: reportsRes.count || 0,
        totalRevenue: totalBudgetConsomme,
        totalImpressions,
        totalClicks,
        ctr: `${ctr}%`,
        activeSlots,
        totalSlots: slots.length,
      },
    });
  } catch (err: any) {
    console.error("Erreur overview ads admin:", err);
    return NextResponse.json({ error: "Erreur calcul indicateurs pub" }, { status: 500 });
  }
}
