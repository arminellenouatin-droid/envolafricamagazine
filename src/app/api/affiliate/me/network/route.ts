import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getNetworkTree, getNetworkDepth } from "@/lib/affiliation/matrix";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });
  }

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, magazine_enrolled, level")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!affiliate) {
    return NextResponse.json({ error: "Compte affilié non trouvé" }, { status: 404 });
  }

  const tree = await getNetworkTree(affiliate.id, 5);
  const depth = await getNetworkDepth(affiliate.id, 5);

  // Filleuls directs
  const { data: directReferrals } = await supabase
    .from("affiliates")
    .select("id, referral_code, level, total_earnings, created_at, users:user_id(prenom, nom, email)")
    .eq("sponsor_id", affiliate.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    networkDepth: depth,
    directCount: directReferrals?.length || 0,
    maxDirect: 5,
    directReferrals: (directReferrals || []).map((r: any) => ({
      id: r.id,
      referralCode: r.referral_code,
      name: r.users ? `${r.users.prenom} ${r.users.nom}`.trim() : "Affilié",
      email: r.users?.email || "",
      totalEarnings: Number(r.total_earnings || 0),
      createdAt: r.created_at,
    })),
    tree,
  });
}
