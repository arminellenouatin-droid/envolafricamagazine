import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { productId?: string; amountXof?: number; durationDays?: number } | null;
  const amountXof = Number(body?.amountXof);
  const durationDays = Number(body?.durationDays);
  if (!body?.productId || !Number.isInteger(amountXof) || amountXof < 1000 || !Number.isInteger(durationDays) || durationDays < 1 || durationDays > 90) return NextResponse.json({ error: "Paramètres de boost invalides." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service de boost indisponible." }, { status: 503 });
  const { data: supplier, error: supplierError } = await supabase.from("marketplace_suppliers").select("id").eq("user_id", user.id).single();
  if (supplierError || !supplier) return NextResponse.json({ error: "Créez d’abord votre boutique fournisseur." }, { status: 403 });
  const { data: product, error: productError } = await supabase.from("marketplace_products").select("id,supplier_id,status").eq("id", body.productId).eq("supplier_id", supplier.id).single();
  if (productError || !product || product.status !== "published") return NextResponse.json({ error: "Produit non éligible au boost." }, { status: 400 });
  const { data: boost, error } = await supabase.from("marketplace_boosts").insert({ product_id: product.id, supplier_id: supplier.id, amount_xof: amountXof, duration_days: durationDays, status: "pending" }).select("id,product_id,amount_xof,duration_days,status,created_at").single();
  if (error) return NextResponse.json({ error: "Impossible de créer la demande de boost." }, { status: 502 });
  return NextResponse.json({ boost, nextStep: "payment_required", message: "La demande est créée. Le paiement Moneroo doit être confirmé avant l’activation et la diffusion WAB." }, { status: 201 });
}
