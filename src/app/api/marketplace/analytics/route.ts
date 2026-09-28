import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: userStores, error: storesError } = await supabase
    .from("marketplace_suppliers")
    .select("id, business_name, rating, certification_status, country_code, city, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (storesError || !userStores || userStores.length === 0) {
    return NextResponse.json({ hasStore: false, stats: null, stores: [] });
  }

  const storeIdParam = request.nextUrl.searchParams.get("storeId") || request.nextUrl.searchParams.get("supplierId");
  const allStoreIds = userStores.map((s) => s.id);

  let targetStoreIds: string[] = allStoreIds;
  let activeSupplier = userStores[0];

  if (storeIdParam && storeIdParam !== "all") {
    const found = userStores.find((s) => s.id === storeIdParam);
    if (found) {
      activeSupplier = found;
      targetStoreIds = [found.id];
    }
  }

  // Fetch orders for targeted store(s)
  let ordersQuery = supabase
    .from("marketplace_orders")
    .select("id, product_id, total_xof, payment_mode, status, created_at, marketplace_products(title, price_xof)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (targetStoreIds.length === 1) {
    ordersQuery = ordersQuery.eq("supplier_id", targetStoreIds[0]);
  } else {
    ordersQuery = ordersQuery.in("supplier_id", targetStoreIds);
  }
  const { data: orders } = await ordersQuery;

  // Fetch product counts
  let productsQuery = supabase
    .from("marketplace_products")
    .select("id, title, price_xof, status, stock_quantity, is_boosted");

  if (targetStoreIds.length === 1) {
    productsQuery = productsQuery.eq("supplier_id", targetStoreIds[0]);
  } else {
    productsQuery = productsQuery.in("supplier_id", targetStoreIds);
  }
  const { data: products } = await productsQuery;

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
    supplier: activeSupplier,
    stores: userStores,
    isAllStores: targetStoreIds.length > 1,
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
