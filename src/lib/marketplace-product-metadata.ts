import { findMagazineById } from "@/lib/core-db";
import { MAGAZINE_MARKETPLACE_PREFIX, toMagazineMarketplaceProduct } from "@/lib/magazine-republication";
import { marketplaceSeed } from "@/lib/marketplace-seed";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type ProductMedia = { url?: unknown; path?: unknown; mimeType?: unknown };

export type ShareableMarketplaceProduct = {
  id: string;
  title: string;
  description: string;
  image: string;
  videoUrl?: string;
  videoMime?: string;
};

function firstImage(media: unknown) {
  if (!Array.isArray(media)) return "";
  for (const item of media) {
    if (typeof item === "string" && item) return item;
    if (item && typeof item === "object") {
      const candidate = item as ProductMedia;
      const mimeType = typeof candidate.mimeType === "string" ? candidate.mimeType : "image/*";
      const url = typeof candidate.url === "string" ? candidate.url : typeof candidate.path === "string" ? candidate.path : "";
      if (url && !mimeType.startsWith("video/")) return url;
    }
  }
  return "";
}

export async function findShareableMarketplaceProduct(id: string): Promise<ShareableMarketplaceProduct | null> {
  if (id.startsWith(MAGAZINE_MARKETPLACE_PREFIX)) {
    const magazine = await findMagazineById(id.slice(MAGAZINE_MARKETPLACE_PREFIX.length));
    if (magazine) {
      const product = toMagazineMarketplaceProduct(magazine);
      return { id: product.id, title: product.title, description: product.description, image: product.image };
    }
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data } = await supabase
      .from("marketplace_products")
      .select("id,title,description,media,product_video_url,product_video_mime")
      .eq("id", id)
      .eq("status", "published")
      .limit(1)
      .maybeSingle();
    if (data) {
      return {
        id: String(data.id),
        title: String(data.title || "Produit Envol Africa"),
        description: String(data.description || "Découvrez ce produit sur la Marketplace Envol Africa."),
        image: firstImage(data.media),
        videoUrl: typeof data.product_video_url === "string" ? data.product_video_url : undefined,
        videoMime: typeof data.product_video_mime === "string" ? data.product_video_mime : undefined,
      };
    }
  }

  const fallback = marketplaceSeed.find((product) => product.id === id);
  return fallback
    ? { id: fallback.id, title: fallback.title, description: fallback.description, image: fallback.image }
    : null;
}
