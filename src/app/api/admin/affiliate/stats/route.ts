import { NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getAffiliateStats } from "@/lib/affiliation/service";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { user, error, status } = await getCurrentUserForAdmin("admin");
  if (error || !user) {
    return NextResponse.json({ error: error || "Non autorisé" }, { status: status || 403 });
  }

  try {
    const stats = await getAffiliateStats();

    // Détail des fonds annuels et fonds non alloués récents
    const supabase = getSupabaseAdmin();
    let annualFunds: any[] = [];
    let recentUnallocated: any[] = [];

    if (supabase) {
      const { data: netFunds } = await supabase
        .from("network_size_funds")
        .select("*")
        .order("year", { ascending: false });

      const { data: ceremFunds } = await supabase
        .from("ceremony_funds")
        .select("*")
        .order("year", { ascending: false });

      const { data: unallocated } = await supabase
        .from("unallocated_funds")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      annualFunds = (netFunds || []).map((nf) => {
        const cf = (ceremFunds || []).find((c) => c.year === nf.year);
        return {
          year: nf.year,
          networkSizeFund: Number(nf.total_amount || 0),
          ceremonyFund: Number(cf?.total_amount || 0),
          distributed: nf.distributed,
        };
      });

      recentUnallocated = unallocated || [];
    }

    return NextResponse.json({
      stats,
      annualFunds,
      recentUnallocated,
    });
  } catch (err: any) {
    console.error("[api/admin/affiliate/stats] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
