import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: supplier, error: supplierError } = await supabase
    .from("marketplace_suppliers")
    .select("id, business_name, rating, certification_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (supplierError || !supplier) {
    return NextResponse.json({ hasStore: false, stats: null });
  }

  // Fetch orders for this supplier
  const { data: orders } = await supabase
    .from("marketplace_orders")
    .select("id, product_id, total_xof, payment_mode, status, created_at, marketplace_products(title, price_xof)")
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: false })
    .limit(100);

  // Fetch product counts
  const { data: products } = await supabase
    .from("marketplace_products")
    .select("id, title, price_xof, status, stock_quantity, is_boosted")
    .eq("supplier_id", supplier.id);

  const orderList = orders || [];
  const productList = products || [];

  const successfulStatuses = ["completed", "confirmed", "paid", "delivered"];
  const completedOrders = orderList.filter((o) => successfulStatuses.includes(o.status));
  const totalRevenueXof = completedOrders.reduce((acc, o) => acc + (Number(o.total_xof) || 0), 0);
  const pendingOrders = orderList.filter((o) => ["pending_payment", "processing", "escrow_locked"].includes(o.status));
  const pendingRevenueXof = pendingOrders.reduce((acc, o) => acc + (Number(o.total_xof) || 0), 0);

  const averageBasketXof = completedOrders.length > 0 ? Math.round(totalRevenueXof / completedOrders.length) : 0;
  const boostedProductsCount = productList.filter((p) => p.is_boosted).length;
  const publishedProductsCount = productList.filter((p) => p.status === "published").length;

  return NextResponse.json({
    hasStore: true,
    supplier,
    stats: {
      totalRevenueXof,
      pendingRevenueXof,
      totalOrders: orderList.length,
      completedOrdersCount: completedOrders.length,
      pendingOrdersCount: pendingOrders.length,
      averageBasketXof,
      totalProductsCount: productList.length,
      publishedProductsCount,
      boostedProductsCount,
      recentSales: orderList.slice(0, 10),
    },
  });
}
