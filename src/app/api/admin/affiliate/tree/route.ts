import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getNetworkTree } from "@/lib/affiliation/matrix";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("admin");
  if (error || !user) {
    return NextResponse.json({ error: error || "Non autorisé" }, { status: status || 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let affiliateId = searchParams.get("affiliateId");

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });
    }

    if (!affiliateId) {
      // Trouver la première racine / fondateur
      const { data: rootAff } = await supabase
        .from("affiliates")
        .select("id")
        .or("is_root.eq.true,is_founder.eq.true,level.eq.0")
        .order("level", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (rootAff) {
        affiliateId = rootAff.id;
      } else {
        // Prendre le tout premier affilié
        const { data: firstAff } = await supabase
          .from("affiliates")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (firstAff) {
          affiliateId = firstAff.id;
        }
      }
    }

    if (!affiliateId) {
      return NextResponse.json({ tree: null, message: "Aucun affilié trouvé pour construire l'arbre." });
    }

    const tree = await getNetworkTree(affiliateId, 5);

    return NextResponse.json({ tree });
  } catch (err: any) {
    console.error("[api/admin/affiliate/tree] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
