import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type AdvisoryPlan = { id: string; code: string; name: string; monthlyPriceXof: number; serviceLevel: string; description: string; active: boolean; sortOrder: number };

export function mapAdvisoryPlan(row: Record<string, unknown>): AdvisoryPlan {
  return { id: String(row.id), code: String(row.code), name: String(row.name), monthlyPriceXof: Number(row.monthly_price_xof || 0), serviceLevel: String(row.service_level || ""), description: String(row.description || ""), active: Boolean(row.active), sortOrder: Number(row.sort_order || 0) };
}

export async function getAdvisoryPlans() {
  const client = getSupabaseAdmin();
  if (!client) return { configured: false as const, plans: [] as AdvisoryPlan[] };
  const { data, error } = await client.from("crowdfunding_advisory_plans").select("id,code,name,monthly_price_xof,service_level,description,active,sort_order").eq("active", true).order("sort_order", { ascending: true }).limit(20);
  if (error) throw error;
  return { configured: true as const, plans: (data || []).map((row) => mapAdvisoryPlan(row as Record<string, unknown>)) };
}
