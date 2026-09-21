import type { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";
import { marketplaceSeed } from "@/lib/marketplace-seed";

export const metadata: Metadata = {
  title: "Marketplace Envol Africa | Acheter et vendre en Afrique",
  description: "Découvrez des fournisseurs africains, des produits vérifiés et des options de paiement comptant ou échelonné jusqu’à 12 mois.",
  alternates: { canonical: "/marketplace" },
  openGraph: {
    title: "Marketplace Envol Africa | Le commerce africain sans détour",
    description: "Découvrez des fournisseurs africains, des produits vérifiés et des facilités de paiement échelonné jusqu’à 12 mois.",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://envolafrica.site"}/marketplace`,
    images: [
      {
        url: "/covers/envol-africa-cover-01.jpg",
        width: 1200,
        height: 630,
        alt: "Marketplace Envol Africa Magazine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketplace Envol Africa | Acheter et vendre en Afrique",
    description: "Découvrez des fournisseurs africains, des produits vérifiés et des facilités de paiement.",
    images: ["/covers/envol-africa-cover-01.jpg"],
  },
};

export default function MarketplacePage() {
  return <MarketplaceClient initialProducts={marketplaceSeed} />;
}

