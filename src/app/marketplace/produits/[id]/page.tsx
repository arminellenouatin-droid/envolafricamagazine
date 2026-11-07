import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getMarketplaceProductSchema, getBreadcrumbSchema } from "@/lib/schema-org";
import { getCurrentUserFromCookie } from "@/lib/auth";
import ProductDetailClient from "./ProductDetailClient";

async function getProduct(id: string) {
  if (id.startsWith("seed-")) return null;
  const supabase = getSupabaseAdmin();
  let product: any = null;

  if (supabase) {
    const { data } = await supabase
      .from("marketplace_products")
      .select("*, marketplace_suppliers(*)")
      .eq("id", id)
      .maybeSingle();
    product = data;

    if (product) {
      try {
        const { data: affData } = await supabase
          .from("product_affiliations")
          .select("id, product_id, commission_rate, is_active")
          .eq("product_id", id);
        product.product_affiliations = affData || [];
      } catch {
        product.product_affiliations = [];
      }
    }
  }

  return product;
}

import { buildShareMetadata } from "@/lib/share-metadata-service";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return buildShareMetadata({
      type: "product",
      id,
      title: "Produit vérifié • Marketplace Envol Africa",
      description: "Découvrez nos produits et services vérifiés sur la Marketplace Envol Africa.",
      badge: "MARKETPLACE",
    });
  }

  const image =
    Array.isArray(product.media) && typeof product.media[0] === "string"
      ? product.media[0]
      : (product.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&h=630&fit=crop");

  const priceFormatted = product.price_xof
    ? ` • ${new Intl.NumberFormat("fr-FR").format(product.price_xof)} XOF`
    : "";
  const title = `${product.title}${priceFormatted} | Marketplace Envol Africa`;
  const description = (product.description || "Produit vérifié disponible sur la Marketplace Envol Africa. Paiement sécurisé par séquestre.")
    .replace(/<[^>]*>/g, "")
    .slice(0, 180)
    .trim();

  return buildShareMetadata({
    type: "product",
    id,
    title,
    description,
    imageUrl: image,
    badge: "MARKETPLACE VÉRIFIÉE",
  });
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { id } = await params;
  const { ref } = (await searchParams) || {};
  const [product, currentUser] = await Promise.all([
    getProduct(id),
    getCurrentUserFromCookie(),
  ]);

  if (!product) {
    notFound();
  }

  const productSchema = getMarketplaceProductSchema(product);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: "Marketplace", url: "/marketplace" },
    { name: product?.title || "Produit", url: `/marketplace/produits/${encodeURIComponent(id)}` },
  ]);

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetailClient
        id={id}
        initialProduct={product}
        refToken={ref}
        currentUser={
          currentUser
            ? {
                id: currentUser.id,
                name: `${(currentUser as any).prenom || ""} ${(currentUser as any).nom || ""}`.trim() || currentUser.email,
                email: currentUser.email,
              }
            : null
        }
      />
    </>
  );
}
