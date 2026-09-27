import type { Metadata } from "next";
import MarketplaceMessagesClient from "./MarketplaceMessagesClient";

export const metadata: Metadata = {
  title: "Messagerie Sécurisée Marketplace | Envol Africa",
  description: "Messagerie transactionnelle protégée, gestion de commandes et ComeUp Direct 1:1 sous séquestre EAM.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MarketplaceMessagesPage() {
  return <MarketplaceMessagesClient />;
}
