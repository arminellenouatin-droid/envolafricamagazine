import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Accès numériques indisponibles." }, { status: 503 });
  const { data, error } = await supabase.from("marketplace_download_tokens").select("id,order_id,product_id,download_count,max_downloads,expires_at,created_at,marketplace_products(title,product_type,digital_access_instructions)").eq("buyer_id", user.id).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: "Impossible de charger vos accès numériques." }, { status: 502 });
  return NextResponse.json({ downloads: (data || []).map((item) => ({ ...item, downloadUrl: `/api/marketplace/download/${encodeURIComponent(item.id)}` })) });
}
