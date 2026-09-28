import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { initMonerooPayment } from "@/lib/moneroo";
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
  const { data: userStores, error: storesError } = await supabase.from("marketplace_suppliers").select("id").eq("user_id", user.id);
  const storeIds = (userStores || []).map((s) => s.id);
  if (storesError || storeIds.length === 0) return NextResponse.json({ error: "Créez d’abord votre boutique fournisseur." }, { status: 403 });
  const { data: product, error: productError } = await supabase.from("marketplace_products").select("id,title,status,supplier_id").eq("id", body.productId).in("supplier_id", storeIds).single();
  if (productError || !product || product.status !== "published") return NextResponse.json({ error: "Produit non éligible au boost." }, { status: 400 });
  const targetSupplierId = product.supplier_id || storeIds[0];
  const boostId = crypto.randomUUID();
  const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  try {
    const payment = await initMonerooPayment({ amount: amountXof, currency: "XOF", description: `Boost Marketplace — ${product.title}`, customer: { email: user.email, first_name: user.prenom, last_name: user.nom, phone: user.phone }, return_url: `${origin}/marketplace?boost=${boostId}`, metadata: { product: "marketplace_boost", boost_id: boostId, product_id: product.id, supplier_id: targetSupplierId, user_id: user.id } });
    const { data: boost, error } = await supabase.from("marketplace_boosts").insert({ id: boostId, product_id: product.id, supplier_id: targetSupplierId, amount_xof: amountXof, duration_days: durationDays, provider_payment_id: payment.id, status: "pending" }).select("id,product_id,amount_xof,duration_days,status,provider_payment_id,created_at").single();
    if (error) return NextResponse.json({ error: "Impossible d’enregistrer la demande de boost." }, { status: 502 });
    return NextResponse.json({ boost, checkoutUrl: payment.checkout_url, nextStep: "payment_required" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Impossible d’initialiser le paiement Moneroo." }, { status: 502 });
  }
}
