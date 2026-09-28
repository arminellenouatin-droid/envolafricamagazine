import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { user, error, status } = await getCurrentUserForAdmin("gerant");
  if (error || !user) {
    return NextResponse.json({ error: error || "Accès refusé" }, { status: status || 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });
  }

  try {
    // 1. Fetch all suppliers
    const { data: rawSuppliers, error: suppError } = await supabase
      .from("marketplace_suppliers")
      .select("id, user_id, business_name, description, country_code, city, logo_url, certification_status, rating, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (suppError) {
      console.error("[api/admin/marketplace] Error fetching suppliers:", suppError);
    }

    const suppliersList = rawSuppliers || [];

    // 2. Fetch all products
    const { data: rawProducts, error: prodError } = await supabase
      .from("marketplace_products")
      .select("id, supplier_id, title, slug, category, price_xof, stock_quantity, status, product_type, delivery_type, is_boosted, views_count, media, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (prodError) {
      console.error("[api/admin/marketplace] Error fetching products:", prodError);
    }

    const productsList = rawProducts || [];

    // 3. Fetch all orders
    const { data: rawOrders, error: orderError } = await supabase
      .from("marketplace_orders")
      .select("id, product_id, buyer_id, supplier_id, total_xof, payment_mode, status, received_at, provider_payment_id, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (orderError) {
      console.error("[api/admin/marketplace] Error fetching orders:", orderError);
    }

    const ordersList = rawOrders || [];

    // 4. Fetch all boosts
    const { data: rawBoosts } = await supabase
      .from("marketplace_boosts")
      .select("id, product_id, supplier_id, amount_xof, duration_days, status, starts_at, ends_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    const boostsList = rawBoosts || [];

    // 5. Fetch users for suppliers and buyers
    const userIds = Array.from(
      new Set([
        ...suppliersList.map((s) => s.user_id),
        ...ordersList.map((o) => o.buyer_id),
      ].filter(Boolean))
    );

    const usersMap: Record<string, { email?: string; nom?: string; prenom?: string }> = {};
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, email, nom, prenom")
        .in("id", userIds);

      (usersData || []).forEach((u) => {
        usersMap[u.id] = { email: u.email, nom: u.nom, prenom: u.prenom };
      });
    }

    // Attach product counts and owner info to suppliers
    const suppliers = suppliersList.map((s) => {
      const storeProducts = productsList.filter((p) => p.supplier_id === s.id);
      const owner = usersMap[s.user_id] || null;
      return {
        ...s,
        owner,
        products_count: storeProducts.length,
        published_count: storeProducts.filter((p) => p.status === "published").length,
      };
    });

    // Attach supplier name to products
    const suppliersDict = Object.fromEntries(suppliersList.map((s) => [s.id, s.business_name]));
    const products = productsList.map((p) => ({
      ...p,
      supplier_name: suppliersDict[p.supplier_id] || "Boutique inconnue",
    }));

    // Attach product title, supplier name, buyer info to orders
    const productsDict = Object.fromEntries(productsList.map((p) => [p.id, p.title]));
    const orders = ordersList.map((o) => ({
      ...o,
      product_title: productsDict[o.product_id] || "Produit Marketplace",
      supplier_name: suppliersDict[o.supplier_id] || "Boutique",
      buyer: usersMap[o.buyer_id] || null,
    }));

    // KPIs calculation
    const completedStatuses = ["paid", "shipped", "received"];
    const completedOrders = ordersList.filter((o) => completedStatuses.includes(o.status));
    const totalVolumeXof = completedOrders.reduce((sum, o) => sum + (Number(o.total_xof) || 0), 0);
    const escrowStatuses = ["paid", "shipped", "reserved", "active_installment"];
    const escrowLockedXof = ordersList
      .filter((o) => escrowStatuses.includes(o.status))
      .reduce((sum, o) => sum + (Number(o.total_xof) || 0), 0);
    const totalBoostsRevenueXof = boostsList
      .filter((b) => b.status === "active" || b.status === "ended")
      .reduce((sum, b) => sum + (Number(b.amount_xof) || 0), 0);

    const kpis = {
      totalSuppliers: suppliers.length,
      certifiedSuppliers: suppliers.filter((s) => s.certification_status === "certified").length,
      pendingCertifications: suppliers.filter((s) => s.certification_status === "pending").length,
      totalProducts: products.length,
      publishedProducts: products.filter((p) => p.status === "published").length,
      pendingReviewProducts: products.filter((p) => p.status === "pending_review").length,
      totalOrders: orders.length,
      disputedOrders: orders.filter((o) => o.status === "disputed").length,
      totalVolumeXof,
      escrowLockedXof,
      totalBoostsRevenueXof,
    };

    return NextResponse.json({
      success: true,
      kpis,
      suppliers,
      products,
      orders,
      boosts: boostsList,
    });
  } catch (err: any) {
    console.error("[api/admin/marketplace] GET Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("gerant");
  if (error || !user) {
    return NextResponse.json({ error: error || "Accès refusé" }, { status: status || 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { action, targetId, status: newStatus } = body;

    if (!action || !targetId) {
      return NextResponse.json({ error: "action et targetId sont requis" }, { status: 400 });
    }

    // 1. Modération / Certification de boutique
    if (action === "update_supplier_status") {
      const allowed = ["certified", "pending", "unverified", "rejected", "expired"];
      if (!allowed.includes(newStatus)) {
        return NextResponse.json({ error: "Statut de certification invalide" }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {
        certification_status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "certified") {
        updateData.certification_expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      }

      const { data, error: updateError } = await supabase
        .from("marketplace_suppliers")
        .update(updateData)
        .eq("id", targetId)
        .select()
        .single();

      if (updateError) throw updateError;
      return NextResponse.json({ success: true, supplier: data });
    }

    // 2. Modération de produit
    if (action === "update_product_status") {
      const allowed = ["published", "draft", "pending_review", "paused", "sold_out", "archived"];
      if (!allowed.includes(newStatus)) {
        return NextResponse.json({ error: "Statut de produit invalide" }, { status: 400 });
      }

      const { data, error: updateError } = await supabase
        .from("marketplace_products")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", targetId)
        .select()
        .single();

      if (updateError) throw updateError;
      return NextResponse.json({ success: true, product: data });
    }

    // 3. Suppression définitive d'un produit (ex: offre interdite)
    if (action === "delete_product") {
      const { error: deleteError } = await supabase
        .from("marketplace_products")
        .delete()
        .eq("id", targetId);

      if (deleteError) throw deleteError;
      return NextResponse.json({ success: true, message: "Produit supprimé avec succès." });
    }

    // 4. Mise à jour de commande ou arbitrage de litige
    if (action === "update_order_status" || action === "resolve_dispute") {
      const allowed = ["pending_payment", "active_installment", "paid", "reserved", "shipped", "received", "cancelled", "disputed"];
      if (!allowed.includes(newStatus)) {
        return NextResponse.json({ error: "Statut de commande invalide" }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "received") {
        updateData.received_at = new Date().toISOString();
      }

      const { data, error: updateError } = await supabase
        .from("marketplace_orders")
        .update(updateData)
        .eq("id", targetId)
        .select()
        .single();

      if (updateError) throw updateError;
      return NextResponse.json({ success: true, order: data });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (err: any) {
    console.error("[api/admin/marketplace] PATCH Error:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
