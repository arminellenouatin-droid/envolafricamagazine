import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";
import {
  findSupplierBySlugOrId,
  findVendorStoresBySlug,
  generateStoreSlug,
} from "@/lib/marketplace-slug";
import VendorHubClient from "./VendorHubClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // 1. Vérifier si c'est un vendeur (ex: /marketplace/boutique/arminelle)
  const vendorData = await findVendorStoresBySlug(slug);
  if (vendorData.vendor) {
    const title = `Boutiques de ${vendorData.vendor.name} • Marketplace Envol Africa`;
    const description = `Découvrez l'ensemble des boutiques officielles gérées par ${vendorData.vendor.name} sur Envol Africa Marketplace. Commandes directes et paiement sécurisé par séquestre.`;
    return {
      title,
      description,
      alternates: {
        canonical: `/marketplace/boutique/${encodeURIComponent(vendorData.vendor.slug)}`,
      },
      openGraph: {
        title,
        description,
        type: "website",
      },
    };
  }

  // 2. Vérifier si c'est un nom ou ID de boutique directe (ex: /marketplace/boutique/les-plats-du-roi)
  const supplier = await findSupplierBySlugOrId(slug);
  if (supplier) {
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

  return {
    title: "Boutique introuvable • Marketplace Envol Africa",
    description: "Cette boutique n'existe pas ou a été déplacée sur la Marketplace Envol Africa.",
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

  // 1. Vérifier en priorité si le slug correspond à un vendeur (ex: /marketplace/boutique/arminelle)
  const vendorData = await findVendorStoresBySlug(slug);
  if (vendorData.vendor) {
    const user = await getCurrentUserFromCookie();
    const isOwner = Boolean(user && user.id === vendorData.vendor.id);
    const isAdmin = Boolean(user && ["admin", "administrateur", "gerant"].includes(user.role));
    const canManage = isOwner || isAdmin;

    return (
      <VendorHubClient
        vendor={vendorData.vendor}
        initialStores={vendorData.stores}
        isOwner={isOwner}
        canManage={canManage}
        currentUser={
          user
            ? {
                id: user.id,
                email: user.email,
                name: `${(user as any).prenom || ""} ${(user as any).nom || ""}`.trim() || user.email,
                role: user.role,
              }
            : null
        }
      />
    );
  }

  // 2. Recherche directe par slug de boutique (ex: /marketplace/boutique/les-plats-du-roi) -> redirection canonique
  const supplier = await findSupplierBySlugOrId(slug);
  if (supplier && supplier.vendor_slug) {
    redirect(`/marketplace/boutique/${encodeURIComponent(supplier.vendor_slug)}/${encodeURIComponent(supplier.slug || slug)}${q}`);
  }

  notFound();
}
