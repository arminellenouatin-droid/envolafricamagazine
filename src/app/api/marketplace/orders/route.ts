import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { initMonerooPayment } from "@/lib/moneroo";
import {
  holdMarketplaceOrderEscrow,
  releaseMarketplaceOrderEscrow,
  refundMarketplaceOrderEscrow,
} from "@/lib/marketplace/marketplace-escrow-service";

const MONTHLY_PENALTY_RATE = 0.02;

function addMonths(date: Date, months: number) { const next = new Date(date); next.setMonth(next.getMonth() + months); return next; }

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Commandes temporairement indisponibles." }, { status: 503 });

  const role = request.nextUrl.searchParams.get("role");
  const filter = request.nextUrl.searchParams.get("filter");

  let supplierId: string | null = null;
  if (role === "seller") {
    const { data: supplier } = await supabase
      .from("marketplace_suppliers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!supplier) {
      return NextResponse.json({ orders: [], penaltyRateMonthly: MONTHLY_PENALTY_RATE, isSupplier: false });
    }
    supplierId = supplier.id;
  }

  let query = supabase
    .from("marketplace_orders")
    .select("id,product_id,supplier_id,buyer_id,total_xof,payment_mode,status,received_at,created_at,updated_at,marketplace_products(title,price_xof,media),marketplace_installments(id,sequence_no,due_at,principal_xof,penalty_xof,paid_at,status)");

  if (role === "seller" && supplierId) {
    query = query.eq("supplier_id", supplierId);
  } else {
    query = query.eq("buyer_id", user.id);
  }

  if (filter === "installments") {
    query = query.eq("payment_mode", "installment");
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: "Impossible de charger les commandes." }, { status: 502 });
  return NextResponse.json({ orders: data, penaltyRateMonthly: MONTHLY_PENALTY_RATE, isSupplier: Boolean(supplierId) });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as {
    productId?: string;
    paymentMode?: "full" | "installment";
    months?: number;
    referralToken?: string;
    use_wallet?: boolean;
  } | null;

  if (!body?.productId || !["full", "installment"].includes(body.paymentMode || "")) {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  const months = body.paymentMode === "installment" ? Math.min(12, Math.max(1, Number(body.months) || 1)) : 1;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Commandes temporairement indisponibles." }, { status: 503 });

  const { data: product, error: productError } = await supabase
    .from("marketplace_products")
    .select("id,supplier_id,price_xof,stock_quantity,status,installment_enabled,installment_months_max,reserved_until,title")
    .eq("id", body.productId)
    .single();

  if (productError || !product || product.status !== "published" || product.stock_quantity < 1) {
    return NextResponse.json({ error: "Produit indisponible." }, { status: 409 });
  }
  if (product.reserved_until && new Date(product.reserved_until) > new Date()) {
    return NextResponse.json({ error: "Produit déjà réservé par une commande active." }, { status: 409 });
  }
  if (body.paymentMode === "installment" && (!product.installment_enabled || months > (product.installment_months_max || 12))) {
    return NextResponse.json({ error: "Ce produit n’accepte pas cet échéancier." }, { status: 400 });
  }

  const now = new Date();
  const { data: order, error: orderError } = await supabase
    .from("marketplace_orders")
    .insert({
      product_id: product.id,
      buyer_id: user.id,
      supplier_id: product.supplier_id,
      total_xof: product.price_xof,
      payment_mode: body.paymentMode,
      status: "pending_payment",
    })
    .select("id,product_id,total_xof,payment_mode,status,created_at")
    .single();

  if (orderError || !order) return NextResponse.json({ error: "Impossible de créer la commande." }, { status: 502 });

  const principal = Math.ceil(product.price_xof / months);
  const installments = Array.from({ length: months }, (_, index) => ({
    order_id: order.id,
    sequence_no: index + 1,
    due_at: addMonths(now, index + 1).toISOString(),
    principal_xof: index === months - 1 ? product.price_xof - principal * (months - 1) : principal,
    penalty_xof: 0,
    status: index === 0 && body.use_wallet && body.paymentMode === "installment" ? "paid" : "due",
  }));

  const { error: installmentError } = await supabase.from("marketplace_installments").insert(installments);
  if (installmentError) {
    await supabase.from("marketplace_orders").update({ status: "cancelled" }).eq("id", order.id);
    return NextResponse.json({ error: "Impossible de créer l’échéancier." }, { status: 502 });
  }

  const reservedUntil = addMonths(now, months).toISOString();
  const { error: reservationError } = await supabase
    .from("marketplace_products")
    .update({ reserved_until: reservedUntil, updated_at: now.toISOString() })
    .eq("id", product.id)
    .eq("status", "published")
    .is("reserved_until", null);

  if (reservationError) {
    await supabase.from("marketplace_orders").update({ status: "cancelled" }).eq("id", order.id);
    return NextResponse.json({ error: "La réservation doit être confirmée avant paiement." }, { status: 409 });
  }

  // --- OPTION A : Paiement direct avec Portefeuille Central (Séquestre Automatique) ---
  if (body.use_wallet) {
    try {
      const amountToLock = body.paymentMode === "installment" ? principal : product.price_xof;
      const holdRes = await holdMarketplaceOrderEscrow({
        orderId: order.id,
        buyerId: user.id,
        amount: amountToLock,
        description: `Séquestre commande Marketplace #${order.id.slice(0, 8)} - ${product.title}`,
      });

      await supabase
        .from("marketplace_orders")
        .update({
          status: "paid",
          provider_payment_id: holdRes.reference,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      return NextResponse.json(
        {
          order: { ...order, status: "paid" },
          installments,
          reservedUntil,
          holdId: holdRes.holdId,
          use_wallet: true,
          success: true,
          message: "Paiement validé via Portefeuille Central. Vos fonds sont sécurisés en séquestre jusqu'à votre confirmation de réception.",
        },
        { status: 201 }
      );
    } catch (walletErr: any) {
      await supabase.from("marketplace_orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", order.id);
      await supabase.from("marketplace_products").update({ reserved_until: null, updated_at: new Date().toISOString() }).eq("id", product.id).eq("reserved_until", reservedUntil);
      return NextResponse.json(
        { error: walletErr?.message || "Solde insuffisant dans votre portefeuille central." },
        { status: 400 }
      );
    }
  }

  // --- OPTION B : Paiement externe Moneroo ---
  const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const initialAmount = body.paymentMode === "installment" ? principal : product.price_xof;
  try {
    const payment = await initMonerooPayment({
      amount: initialAmount,
      currency: "XOF",
      description: body.paymentMode === "installment"
        ? `Échéance 1/${months} Marketplace — ${product.title || "Commande"}`
        : `Marketplace Envol Africa — ${product.title || "Commande"}`,
      customer: { email: user.email, first_name: user.prenom, last_name: user.nom, phone: user.phone },
      return_url: `${origin}/marketplace?order=${order.id}`,
      metadata: {
        product: "marketplace_order",
        order_id: order.id,
        product_id: product.id,
        buyer_id: user.id,
        payment_mode: body.paymentMode,
        months,
        installment_index: 1,
        referral_token: typeof body?.referralToken === "string" && body.referralToken.trim() ? body.referralToken.trim() : undefined,
      },
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

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    orderId?: string;
    action?: "confirm_delivery" | "cancel_or_refund";
    reason?: string;
  } | null;

  if (!body?.orderId || !body?.action) {
    return NextResponse.json({ error: "Paramètres manquants (orderId et action requis)." }, { status: 400 });
  }

  if (body.action === "confirm_delivery") {
    try {
      const result = await releaseMarketplaceOrderEscrow({
        orderId: body.orderId,
        buyerOrAdminUserId: user.id,
      });
      return NextResponse.json({
        message: "Livraison confirmée et fonds libérés vers le compte du vendeur (déduction commission 5%).",
        ...result,
      });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "Impossible de confirmer la livraison." }, { status: 400 });
    }
  }

  if (body.action === "cancel_or_refund") {
    try {
      const result = await refundMarketplaceOrderEscrow({
        orderId: body.orderId,
        authorizedByUserId: user.id,
        reason: body.reason,
      });
      return NextResponse.json({
        message: "Commande annulée et fonds restitués sur votre Portefeuille Central.",
        ...result,
      });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "Impossible d'annuler la commande." }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Action non reconnue." }, { status: 400 });
}
