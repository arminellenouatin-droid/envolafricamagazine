import { redirect } from "next/navigation";
import { findSupplierBySlugOrId } from "@/lib/marketplace-slug";

/**
 * Routeur de lien court universel pour les boutiques et produits affiliés
 * Format :
 * - /b/[code] -> Redirige vers /marketplace/boutique/[vendor]/[slug]
 * - /b/[code]?p=[productId] -> Redirige vers la fiche produit /marketplace/produits/[productId]
 * - /b/[code]?p=[productId]&ref=[affCode] -> Redirige vers la fiche produit avec affiliation
 * - /b/[code]?ref=[affCode] -> Redirige vers la boutique avec affiliation
 */
export default async function ShortBoutiqueRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { code } = await params;
  const sp = await searchParams;

  const productId = typeof sp.p === "string" ? sp.p.trim() : typeof sp.prod === "string" ? sp.prod.trim() : "";
  const ref = typeof sp.ref === "string" ? sp.ref.trim() : "";

  // 1. Si un ID produit direct est demandé
  if (productId) {
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    redirect(`/marketplace/produits/${encodeURIComponent(productId)}${q}`);
  }

  // 2. Recherche de la boutique correspondante
  const supplier = await findSupplierBySlugOrId(code);

  if (supplier && supplier.slug) {
    const vSlug = supplier.vendor_slug || "vendeur";
    const sSlug = supplier.slug;
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    redirect(`/marketplace/boutique/${encodeURIComponent(vSlug)}/${encodeURIComponent(sSlug)}${q}`);
  }

  // 3. Fallback catalogue général
  redirect("/marketplace");
}
