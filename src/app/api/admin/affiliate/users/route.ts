import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { listAffiliatesForAdmin } from "@/lib/affiliation/service";

export async function GET(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("admin");
  if (error || !user) {
    return NextResponse.json({ error: error || "Non autorisé" }, { status: status || 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const program = searchParams.get("program") || undefined;
    const isFounderParam = searchParams.get("isFounder");
    const isFounder = isFounderParam !== null ? isFounderParam === "true" : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100;

    const affiliates = await listAffiliatesForAdmin({
      search,
      program,
      isFounder,
      limit,
    });

    return NextResponse.json({ affiliates });
  } catch (err: any) {
    console.error("[api/admin/affiliate/users] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
