import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { findSupplierBySlugOrId, generateStoreSlug, generateVendorSlug, normalizeStoreSlug } from "@/lib/marketplace-slug";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supplier = await findSupplierBySlugOrId(slug);

  if (!supplier) {
    return {
      title: "Boutique introuvable • Marketplace Envol Africa",
      description: "Cette boutique n'existe pas ou a été déplacée sur la Marketplace Envol Africa.",
    };
  }

  const vendorDisplay = supplier.vendor_name || supplier.vendor_slug || "Vendeur";
  const title = `${supplier.business_name} par ${vendorDisplay} • Boutique Officielle | Envol Africa`;
  const description = (supplier.description || `Découvrez la boutique officielle ${supplier.business_name} gérée par ${vendorDisplay} sur Envol Africa Marketplace. Paiement sécurisé par séquestre.`)
    .slice(0, 180)
    .trim();

  return {
    title,
    description,
    alternates: {
      canonical: `/marketplace/boutique/${encodeURIComponent(supplier.vendor_slug || "vendeur")}/${encodeURIComponent(supplier.slug || generateStoreSlug(supplier.business_name))}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: supplier.logo_url ? [supplier.logo_url] : [],
    },
  };
}

export default async function BoutiqueSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const searchEntries = Object.entries(sp).flatMap(([k, v]) =>
    Array.isArray(v) ? v.map((item) => [k, item]) : v ? [[k, v]] : []
  );
  const q = searchEntries.length > 0 ? `?${new URLSearchParams(searchEntries).toString()}` : "";

  // 1. Recherche directe par slug de boutique
  const supplier = await findSupplierBySlugOrId(slug);

  if (supplier && supplier.vendor_slug) {
    redirect(`/marketplace/boutique/${encodeURIComponent(supplier.vendor_slug)}/${encodeURIComponent(supplier.slug || slug)}${q}`);
  }

  // 2. Si pas trouvé par nom de boutique, vérifier si c'est un slug de vendeur (ex: /marketplace/boutique/arminelle)
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: allSuppliers } = await supabase
      .from("marketplace_suppliers")
      .select("*, users(id, email, nom, prenom)")
      .order("created_at", { ascending: false });

    const targetNorm = normalizeStoreSlug(slug);
    const vendorStore = (allSuppliers || []).find((s: any) => {
      const u = s.users;
      if (!u) return false;
      const vSlug = generateVendorSlug(u);
      return vSlug === targetNorm || normalizeStoreSlug(vSlug) === targetNorm || u.id === slug;
    });

    if (vendorStore) {
      const sSlug = generateStoreSlug(vendorStore.business_name);
      const vSlug = generateVendorSlug((vendorStore as any).users);
      redirect(`/marketplace/boutique/${encodeURIComponent(vSlug)}/${encodeURIComponent(sSlug)}${q}`);
    }
  }

  notFound();
}
