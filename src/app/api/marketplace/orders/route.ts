import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { initMonerooPayment } from "@/lib/moneroo";

const MONTHLY_PENALTY_RATE = 0.02;

function addMonths(date: Date, months: number) { const next = new Date(date); next.setMonth(next.getMonth() + months); return next; }

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Commandes temporairement indisponibles." }, { status: 503 });
  const { data, error } = await supabase.from("marketplace_orders").select("id,product_id,supplier_id,total_xof,payment_mode,status,received_at,created_at,updated_at,marketplace_installments(id,sequence_no,due_at,principal_xof,penalty_xof,paid_at,status)").eq("buyer_id", user.id).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: "Impossible de charger les commandes." }, { status: 502 });
  return NextResponse.json({ orders: data, penaltyRateMonthly: MONTHLY_PENALTY_RATE });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { productId?: string; paymentMode?: "full" | "installment"; months?: number } | null;
  if (!body?.productId || !["full", "installment"].includes(body.paymentMode || "")) return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  const months = body.paymentMode === "installment" ? Math.min(12, Math.max(1, Number(body.months) || 1)) : 1;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Commandes temporairement indisponibles." }, { status: 503 });
  const { data: product, error: productError } = await supabase.from("marketplace_products").select("id,supplier_id,price_xof,stock_quantity,status,installment_enabled,installment_months_max,reserved_until,title").eq("id", body.productId).single();
  if (productError || !product || product.status !== "published" || product.stock_quantity < 1) return NextResponse.json({ error: "Produit indisponible." }, { status: 409 });
  if (product.reserved_until && new Date(product.reserved_until) > new Date()) return NextResponse.json({ error: "Produit déjà réservé par une commande active." }, { status: 409 });
  if (body.paymentMode === "installment" && (!product.installment_enabled || months > (product.installment_months_max || 12))) return NextResponse.json({ error: "Ce produit n’accepte pas cet échéancier." }, { status: 400 });
  const now = new Date();
  const { data: order, error: orderError } = await supabase.from("marketplace_orders").insert({ product_id: product.id, buyer_id: user.id, supplier_id: product.supplier_id, total_xof: product.price_xof, payment_mode: body.paymentMode, status: "pending_payment" }).select("id,product_id,total_xof,payment_mode,status,created_at").single();
  if (orderError || !order) return NextResponse.json({ error: "Impossible de créer la commande." }, { status: 502 });
  const principal = Math.ceil(product.price_xof / months);
  const installments = Array.from({ length: months }, (_, index) => ({ order_id: order.id, sequence_no: index + 1, due_at: addMonths(now, index + 1).toISOString(), principal_xof: index === months - 1 ? product.price_xof - principal * (months - 1) : principal, penalty_xof: 0, status: "due" }));
  const { error: installmentError } = await supabase.from("marketplace_installments").insert(installments);
  if (installmentError) { await supabase.from("marketplace_orders").update({ status: "cancelled" }).eq("id", order.id); return NextResponse.json({ error: "Impossible de créer l’échéancier." }, { status: 502 }); }
  const reservedUntil = addMonths(now, months).toISOString();
  const { error: reservationError } = await supabase.from("marketplace_products").update({ reserved_until: reservedUntil, updated_at: now.toISOString() }).eq("id", product.id).eq("status", "published").is("reserved_until", null);
  if (reservationError) {
    await supabase.from("marketplace_orders").update({ status: "cancelled" }).eq("id", order.id);
    return NextResponse.json({ error: "La réservation doit être confirmée avant paiement." }, { status: 409 });
  }

  const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  try {
    const payment = await initMonerooPayment({
      amount: product.price_xof,
      currency: "XOF",
      description: `Marketplace Envol Africa — ${product.title || "Commande"}`,
      customer: { email: user.email, first_name: user.prenom, last_name: user.nom, phone: user.phone },
      return_url: `${origin}/marketplace?order=${order.id}`,
      metadata: { product: "marketplace_order", order_id: order.id, product_id: product.id, buyer_id: user.id, payment_mode: body.paymentMode, months },
    });
    const { error: paymentLinkError } = await supabase.from("marketplace_orders").update({ provider_payment_id: payment.id, updated_at: new Date().toISOString() }).eq("id", order.id);
    if (paymentLinkError) throw paymentLinkError;
    return NextResponse.json({ order, installments, reservedUntil, checkoutUrl: payment.checkout_url, paymentId: payment.id, penaltyRateMonthly: MONTHLY_PENALTY_RATE, nextStep: "payment_required", message: "Le paiement est traité par Moneroo. Le fournisseur ne reçoit les fonds qu’après confirmation de réception." }, { status: 201 });
  } catch {
    await supabase.from("marketplace_orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", order.id);
    await supabase.from("marketplace_products").update({ reserved_until: null, updated_at: new Date().toISOString() }).eq("id", product.id).eq("reserved_until", reservedUntil);
    return NextResponse.json({ error: "Impossible d’initialiser le paiement Moneroo." }, { status: 502 });
  }
}
