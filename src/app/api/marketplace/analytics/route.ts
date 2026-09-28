import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const isAdmin = ["admin", "administrateur", "gerant"].includes(user.role);
  const storeIdParam = request.nextUrl.searchParams.get("storeId") || request.nextUrl.searchParams.get("supplierId");

  // 1. Récupérer les boutiques de l'utilisateur ou la boutique ciblée si admin
  let userStores: any[] = [];
  if (isAdmin && storeIdParam && storeIdParam !== "all") {
    const { data: targetStore } = await supabase
      .from("marketplace_suppliers")
      .select("id, user_id, business_name, rating, certification_status, country_code, city, created_at")
      .eq("id", storeIdParam)
      .maybeSingle();
    if (targetStore) {
      userStores = [targetStore];
    }
  }

  if (userStores.length === 0) {
    const { data: stores, error: storesError } = await supabase
      .from("marketplace_suppliers")
      .select("id, user_id, business_name, rating, certification_status, country_code, city, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (storesError || !stores || stores.length === 0) {
      return NextResponse.json({ hasStore: false, stats: null, stores: [] });
    }
    userStores = stores;
  }

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

  // 2. Récupérer les commandes avec informations d'acheteurs et produits
  let ordersQuery = supabase
    .from("marketplace_orders")
    .select("id, product_id, buyer_id, total_xof, payment_mode, status, created_at, marketplace_products(title, price_xof), users:buyer_id(id, email, nom, prenom)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (targetStoreIds.length === 1) {
    ordersQuery = ordersQuery.eq("supplier_id", targetStoreIds[0]);
  } else {
    ordersQuery = ordersQuery.in("supplier_id", targetStoreIds);
  }
  const { data: orders } = await ordersQuery;

  // 3. Récupérer les produits pour statistiques de catalogue et de vues
  let productsQuery = supabase
    .from("marketplace_products")
    .select("id, title, price_xof, status, stock_quantity, is_boosted, views_count")
    .order("views_count", { ascending: false });

  if (targetStoreIds.length === 1) {
    productsQuery = productsQuery.eq("supplier_id", targetStoreIds[0]);
  } else {
    productsQuery = productsQuery.in("supplier_id", targetStoreIds);
  }
  const { data: products } = await productsQuery;

  const orderList = orders || [];
  const productList = products || [];

  // Vues cumulées de la boutique et de ses produits
  const totalViews = productList.reduce((acc, p: any) => acc + (Number(p.views_count) || 0), 0);

  // Commandes réussies et montants
  const successfulStatuses = ["completed", "confirmed", "paid", "shipped", "received"];
  const completedOrders = orderList.filter((o) => successfulStatuses.includes(o.status));
  const totalRevenueXof = completedOrders.reduce((acc, o) => acc + (Number(o.total_xof) || 0), 0);

  // Fonds sous séquestre (payé ou expédié mais pas encore clôturé 'received')
  const escrowOrders = orderList.filter((o) => ["paid", "shipped", "active_installment"].includes(o.status));
  const escrowBalanceXof = escrowOrders.reduce((acc, o) => acc + (Number(o.total_xof) || 0), 0);

  // Commandes en attente de paiement ou abandonnées
  const pendingOrders = orderList.filter((o) => ["pending_payment", "processing"].includes(o.status));
  const pendingRevenueXof = pendingOrders.reduce((acc, o) => acc + (Number(o.total_xof) || 0), 0);
  const cancelledOrders = orderList.filter((o) => ["cancelled", "disputed"].includes(o.status));

  // Taux d'abandon de panier estimé
  const totalCheckouts = orderList.length;
  const abandonedCount = pendingOrders.length + cancelledOrders.length;
  const cartDropRate = totalCheckouts > 0 ? Math.round((abandonedCount / totalCheckouts) * 100) : 0;

  const averageBasketXof = completedOrders.length > 0 ? Math.round(totalRevenueXof / completedOrders.length) : 0;
  const boostedProductsCount = productList.filter((p) => p.is_boosted).length;
  const publishedProductsCount = productList.filter((p) => p.status === "published").length;

  return NextResponse.json({
    hasStore: true,
    supplier: activeSupplier,
    stores: userStores,
    isAllStores: targetStoreIds.length > 1,
    stats: {
      totalViews,
      totalRevenueXof,
      escrowBalanceXof,
      pendingRevenueXof,
      totalOrders: orderList.length,
      completedOrdersCount: completedOrders.length,
      pendingOrdersCount: pendingOrders.length,
      cancelledOrdersCount: cancelledOrders.length,
      cartDropRate,
      averageBasketXof,
      totalProductsCount: productList.length,
      publishedProductsCount,
      boostedProductsCount,
      recentSales: orderList.slice(0, 15).map((o: any) => ({
        id: o.id,
        total_xof: o.total_xof,
        payment_mode: o.payment_mode,
        status: o.status,
        created_at: o.created_at,
        buyer_name: o.users ? `${o.users.prenom || ""} ${o.users.nom || ""}`.trim() || o.users.email : "Client Envol Africa",
        product_title: o.marketplace_products?.title || "Produit boutique",
        product_price: o.marketplace_products?.price_xof || o.total_xof,
      })),
      topProducts: productList.slice(0, 5),
    },
  });
}
