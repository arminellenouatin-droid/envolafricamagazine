import type { Metadata } from "next";
import { findShareableMarketplaceProduct } from "@/lib/marketplace-product-metadata";
import { absoluteSiteUrl, metadataText } from "@/lib/site-metadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await findShareableMarketplaceProduct(id).catch(() => null);
  if (!product) return { title: "Produit introuvable | Marketplace Envol Africa", robots: { index: false, follow: false } };

  const title = `${product.title} | Marketplace Envol Africa`;
  const description = metadataText(product.description, "Découvrez ce produit sur la Marketplace Envol Africa.");
  const image = absoluteSiteUrl(product.image);
  const video = product.videoUrl ? absoluteSiteUrl(product.videoUrl) : null;
  const canonical = `/marketplace/produits/${encodeURIComponent(product.id)}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      siteName: "Envol Africa",
      images: [{ url: image, alt: product.title }],
      ...(video ? { videos: [{ url: video, type: product.videoMime || "video/mp4" }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function MarketplaceProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
