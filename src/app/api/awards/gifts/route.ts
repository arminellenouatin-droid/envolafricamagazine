import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Catalogue Awards temporairement indisponible" }, { status: 503 });
  const { data, error } = await supabase.from("awards_gifts_catalog").select("id,name,emoji,price_cents,points,animation_url,is_active").eq("is_active", true).order("price_cents", { ascending: true }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ gifts: data ?? [] });
}
