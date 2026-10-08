import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { findSupplierByVendorAndSlug, generateStoreSlug, generateVendorSlug } from "@/lib/marketplace-slug";
import BoutiqueDetailClient from "../../[slug]/BoutiqueDetailClient";

import { buildShareMetadata } from "@/lib/share-metadata-service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vendor: string; slug: string }>;
}): Promise<Metadata> {
  const { vendor, slug } = await params;
  const supplier = await findSupplierByVendorAndSlug(vendor, slug);

  if (!supplier) {
    return buildShareMetadata({
      type: "boutique",
      vendor,
      slug,
      title: "Boutique introuvable • Marketplace Envol Africa",
      description: "Cette boutique n'existe pas ou a été déplacée sur la Marketplace Envol Africa.",
      badge: "BOUTIQUE",
    });
  }

  const vendorDisplay = supplier.vendor_name || vendor;
  const title = `${supplier.business_name} par ${vendorDisplay} • Boutique Officielle | Envol Africa`;
  const description = (supplier.description || `Découvrez la boutique officielle ${supplier.business_name} gérée par ${vendorDisplay} sur Envol Africa Marketplace. Produits vérifiés et paiement sécurisé.`)
    .slice(0, 180)
    .trim();

  return buildShareMetadata({
    type: "boutique",
    vendor: supplier.vendor_slug || vendor,
    slug: supplier.slug || slug,
    title,
    description,
    imageUrl: supplier.logo_url || supplier.banner_url,
    badge: "BOUTIQUE OFFICIELLE",
  });
}

export default async function VendorStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ vendor: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { vendor, slug } = await params;
  const sp = await searchParams;
  const viewModeParam = typeof sp.view === "string" ? sp.view : "";

  const supplier = await findSupplierByVendorAndSlug(vendor, slug);
  if (!supplier) {
    notFound();
  }

  const user = await getCurrentUserFromCookie();
  const isOwner = Boolean(user && user.id === supplier.user_id);
  const isAdmin = Boolean(user && ["admin", "administrateur", "gerant"].includes(user.role));
  const canManage = isOwner || isAdmin;

  // Récupérer les produits réels de cette boutique spécifique
  const supabase = getSupabaseAdmin();
  let initialProducts: any[] = [];

  if (supabase) {
    let query = supabase
      .from("marketplace_products")
      .select("id,title,description,category,country_code,city,price_xof,stock_quantity,media,product_video_url,product_video_mime,product_video_size,product_type,delivery_type,installment_enabled,installment_months_max,is_boosted,boost_ends_at,status,supplier_id,created_at")
      .eq("supplier_id", supplier.id)
      .order("created_at", { ascending: false });

    if (!canManage) {
      query = query.eq("status", "published");
    }

    const { data: pData } = await query;
    initialProducts = pData || [];

    if (initialProducts.length > 0) {
      try {
        const productIds = initialProducts.map((p) => p.id);
        const { data: affData } = await supabase
          .from("product_affiliations")
          .select("id, product_id, commission_rate, is_active")
          .in("product_id", productIds);

        if (affData) {
          const affMap = new Map<string, Array<{ id: string; commission_rate: number; is_active: boolean }>>();
          for (const aff of affData) {
            if (!affMap.has(aff.product_id)) affMap.set(aff.product_id, []);
            affMap.get(aff.product_id)!.push(aff);
          }
          for (const p of initialProducts) {
            p.product_affiliations = affMap.get(p.id) || [];
          }
        }
      } catch {
        // Silently continue
      }
    }
  }

  // Récupérer les autres boutiques du vendeur pour le sélecteur rapide
  let otherStores: Array<{ id: string; business_name: string; slug: string }> = [];
  if (user && canManage && supabase) {
    const { data: storesData } = await supabase
      .from("marketplace_suppliers")
      .select("id, business_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (storesData) {
      otherStores = storesData.map((s) => ({
        id: s.id,
        business_name: s.business_name,
        slug: `${supplier.vendor_slug || generateVendorSlug(user)}/${generateStoreSlug(s.business_name)}`,
      }));
    }
  }

  return (
    <BoutiqueDetailClient
      supplier={supplier}
      initialProducts={initialProducts}
      isOwner={isOwner}
      canManage={canManage}
      currentUser={user ? { id: user.id, email: user.email, name: `${(user as any).prenom || ""} ${(user as any).nom || ""}`.trim() || user.email, role: user.role } : null}
      initialViewMode={viewModeParam === "public" ? "public" : canManage ? "manage" : "public"}
      otherStores={otherStores}
    />
  );
}
