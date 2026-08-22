import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

export async function GET() {
  const client = getSupabaseAdmin();
  if (!client) return NextResponse.json({ plans: SUBSCRIPTION_PLANS });
  const result = await client.from("magazine_subscription_plans").select("*").order("id");
  if (result.error || !result.data?.length) return NextResponse.json({ plans: SUBSCRIPTION_PLANS });
  return NextResponse.json({ plans: result.data.map((row: any) => ({ id: row.id, name: row.name, price: Number(row.price || 0), firstMonthPrice: row.first_month_price == null ? null : Number(row.first_month_price), monthlyPrice: row.monthly_price == null ? null : Number(row.monthly_price), annualPrice: row.annual_price == null ? null : Number(row.annual_price), annualDiscountPercent: Number(row.annual_discount_percent ?? 30), currency: row.currency || "XOF", interval: row.interval || "month", description: row.description || "", features: Array.isArray(row.features) ? row.features : [], popular: row.id === "annuel" })) });
}
