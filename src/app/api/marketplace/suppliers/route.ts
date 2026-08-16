import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const CERTIFICATION_PRICE_XOF = 50000;

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service fournisseur indisponible." }, { status: 503 });
  const { data, error } = await supabase.from("marketplace_suppliers").select("id,user_id,business_name,description,country_code,city,certification_status,certification_expires_at,rating,created_at,updated_at").eq("user_id", user.id).limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: "Impossible de charger la boutique." }, { status: 502 });
  return NextResponse.json({ supplier: data, certificationPriceXof: CERTIFICATION_PRICE_XOF });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { businessName?: string; description?: string; countryCode?: string; city?: string } | null;
  if (!body || typeof body.businessName !== "string" || body.businessName.trim().length < 2 || body.businessName.length > 160) return NextResponse.json({ error: "Nom d’entreprise invalide." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service fournisseur indisponible." }, { status: 503 });
  const { data, error } = await supabase.from("marketplace_suppliers").upsert({ user_id: user.id, business_name: body.businessName.trim(), description: typeof body.description === "string" ? body.description.trim().slice(0, 3000) : null, country_code: typeof body.countryCode === "string" ? body.countryCode.slice(0, 2).toUpperCase() : null, city: typeof body.city === "string" ? body.city.trim().slice(0, 120) : null, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("id,user_id,business_name,description,country_code,city,certification_status,certification_expires_at,rating,created_at,updated_at").single();
  if (error) return NextResponse.json({ error: "Impossible d’enregistrer la boutique." }, { status: 502 });
  return NextResponse.json({ supplier: data, certificationPriceXof: CERTIFICATION_PRICE_XOF }, { status: 201 });
}
