import type { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";

export const metadata: Metadata = {
  title: "Marketplace Envol Africa | Acheter et vendre en Afrique",
  description: "Découvrez des fournisseurs africains, des produits vérifiés et des options de paiement comptant ou échelonné jusqu’à 12 mois.",
  alternates: { canonical: "/marketplace" },
  openGraph: { title: "Marketplace Envol Africa", description: "Le commerce africain, sans détour.", type: "website" },
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
