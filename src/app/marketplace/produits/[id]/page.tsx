import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { marketplaceSeed } from "@/lib/marketplace-seed";
import { getMarketplaceProductSchema, getBreadcrumbSchema } from "@/lib/schema-org";
import { getCurrentUserFromCookie } from "@/lib/auth";
import ProductDetailClient from "./ProductDetailClient";

async function getProduct(id: string) {
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

  if (!product) {
    product = marketplaceSeed.find((item) => item.id === id);
  }

  return product;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Produit non trouvé",
      description: "Découvrez nos produits vérifiés sur la Marketplace Envol Africa.",
    };
  }

  const image =
    Array.isArray(product.media) && typeof product.media[0] === "string"
      ? product.media[0]
      : (product.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800");

  const priceFormatted = product.price_xof
    ? ` • ${new Intl.NumberFormat("fr-FR").format(product.price_xof)} XOF`
    : "";
  const title = `${product.title}${priceFormatted}`;
  const description = (product.description || "Produit vérifié disponible sur la Marketplace Envol Africa.")
    .replace(/<[^>]*>/g, "")
    .slice(0, 180)
    .trim();

  return {
    title,
    description,
    alternates: {
      canonical: `/marketplace/produits/${encodeURIComponent(id)}`,
    },
    openGraph: {
      title,
      description,
      url: `/marketplace/produits/${encodeURIComponent(id)}`,
      type: "website",
      images: [
        {
          url: image,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
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

  const productSchema = product ? getMarketplaceProductSchema(product) : null;
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
