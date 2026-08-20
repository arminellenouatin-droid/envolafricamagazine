import { NextResponse } from "next/server";
import { getAdvisoryPlans } from "@/lib/crowdfunding-advisory-supabase";

export async function GET() {
  try {
    const result = await getAdvisoryPlans();
    return NextResponse.json({ plans: result.plans });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Impossible de charger les formules" }, { status: 500 });
  }
}
