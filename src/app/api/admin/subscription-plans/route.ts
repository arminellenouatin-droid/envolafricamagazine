import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

function normalizePlan(value: any) {
  return {
    id: String(value.id),
    name: String(value.name || ""),
    price: Math.max(0, Number(value.price) || 0),
    firstMonthPrice: value.firstMonthPrice == null || value.firstMonthPrice === "" ? null : Math.max(0, Number(value.firstMonthPrice) || 0),
    monthlyPrice: value.monthlyPrice == null || value.monthlyPrice === "" ? null : Math.max(0, Number(value.monthlyPrice) || 0),
    annualPrice: value.annualPrice == null || value.annualPrice === "" ? null : Math.max(0, Number(value.annualPrice) || 0),
    annualDiscountPercent: Math.min(100, Math.max(0, Number(value.annualDiscountPercent) || 0)),
    currency: String(value.currency || "XOF"),
    interval: value.interval === "year" ? "year" : "month",
    description: String(value.description || ""),
    features: Array.isArray(value.features) ? value.features.filter((item: unknown): item is string => typeof item === "string").slice(0, 20) : [],
  };
}

function toRow(plan: ReturnType<typeof normalizePlan>) {
  return { id: plan.id, name: plan.name, price: plan.price, first_month_price: plan.firstMonthPrice, monthly_price: plan.monthlyPrice, annual_price: plan.annualPrice, annual_discount_percent: plan.annualDiscountPercent, currency: plan.currency, interval: plan.interval, description: plan.description, features: plan.features, updated_at: new Date().toISOString() };
}

function fromRow(row: any) {
  return { id: row.id, name: row.name, price: Number(row.price || 0), firstMonthPrice: row.first_month_price == null ? null : Number(row.first_month_price), monthlyPrice: row.monthly_price == null ? null : Number(row.monthly_price), annualPrice: row.annual_price == null ? null : Number(row.annual_price), annualDiscountPercent: Number(row.annual_discount_percent ?? 30), currency: row.currency || "XOF", interval: row.interval || "month", description: row.description || "", features: Array.isArray(row.features) ? row.features : [] };
}

export async function GET() {
  const { error, status } = await getCurrentUserForAdmin("admin");
  if (error) return NextResponse.json({ error }, { status });
  const client = getSupabaseAdmin();
  if (!client) return NextResponse.json({ plans: SUBSCRIPTION_PLANS });
  const result = await client.from("magazine_subscription_plans").select("*").order("id");
  if (result.error) return NextResponse.json({ error: `Impossible de charger les tarifs : ${result.error.message}` }, { status: 503 });
  if (!result.data?.length) {
    const defaults = SUBSCRIPTION_PLANS.map(normalizePlan);
    const seeded = await client.from("magazine_subscription_plans").upsert(defaults.map(toRow), { onConflict: "id" }).select("*");
    if (seeded.error) return NextResponse.json({ error: `Impossible d’initialiser les tarifs : ${seeded.error.message}` }, { status: 503 });
    return NextResponse.json({ plans: (seeded.data || []).map(fromRow) });
  }
  return NextResponse.json({ plans: result.data.map(fromRow) });
}

export async function PUT(request: NextRequest) {
  const { error, status } = await getCurrentUserForAdmin("admin");
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await request.json();
    const plan = normalizePlan(body);
    if (!plan.id || !plan.name) return NextResponse.json({ error: "Plan et nom requis" }, { status: 400 });
    const client = getSupabaseAdmin();
    if (!client) return NextResponse.json({ error: "Le stockage persistant des tarifs n’est pas configuré." }, { status: 503 });
    const result = await client.from("magazine_subscription_plans").upsert(toRow(plan), { onConflict: "id" }).select("*").single();
    if (result.error) return NextResponse.json({ error: `Impossible d’enregistrer le tarif : ${result.error.message}` }, { status: 503 });
    return NextResponse.json({ success: true, plan: fromRow(result.data) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 500 });
  }
}
