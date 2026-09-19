import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getNetworkTree, getNetworkDepth, flattenDownline } from "@/lib/affiliation/matrix";

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
  const flatMembers = tree ? flattenDownline(tree) : [];

  const byLevel: Record<number, typeof flatMembers> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };

  for (const m of flatMembers) {
    if (byLevel[m.relativeLevel]) {
      byLevel[m.relativeLevel].push(m);
    }
  }

  const branches = (tree?.children || []).map((branchRoot) => {
    const branchMembers = flatMembers.filter(
      (m) => m.branchRootCode === branchRoot.referralCode
    );
    return {
      branchRootId: branchRoot.id,
      branchRootCode: branchRoot.referralCode,
      branchRootName: branchRoot.userName,
      branchRootEmail: branchRoot.userEmail,
      branchRootEarnings: branchRoot.totalEarnings,
      totalBranchMembers: branchMembers.length,
      members: branchMembers,
    };
  });

  return NextResponse.json({
    networkDepth: depth,
    directCount: tree?.children.length || 0,
    maxDirect: 5,
    totalNetworkCount: flatMembers.length,
    countsByLevel: {
      1: byLevel[1].length,
      2: byLevel[2].length,
      3: byLevel[3].length,
      4: byLevel[4].length,
      5: byLevel[5].length,
    },
    byLevel,
    branches,
    flatMembers,
    tree,
  });
}
