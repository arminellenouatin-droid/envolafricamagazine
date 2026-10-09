import type { Metadata } from "next";
import { getCurrentUserFromCookie } from "@/lib/auth";
import VendreClient from "./VendreClient";

export const metadata: Metadata = {
  title: "Vendre sur la Marketplace | Ouvrir ma boutique Envol Africa",
  description:
    "Ouvrez votre boutique officielle sur Envol Africa Marketplace en 4 étapes simples. Vendez vos produits et formations partout en Afrique avec paiement sécurisé par séquestre.",
  alternates: { canonical: "/marketplace/vendre" },
  openGraph: {
    title: "Ouvrez votre vitrine marchande sur Envol Africa",
    description:
      "Vendez à des millions d'acheteurs en Afrique et dans la diaspora. 0 frais d'inscription, encaissement Mobile Money & CB garanti par séquestre.",
    url: "/marketplace/vendre",
    images: [{ url: "/covers/envol-africa-cover-01.jpg", width: 1200, height: 630 }],
  },
};

export default async function VendrePage() {
  const user = await getCurrentUserFromCookie();
  return (
    <VendreClient
      currentUser={
        user
          ? {
              id: user.id,
              email: user.email,
              name:
                `${user.prenom || ""} ${user.nom || ""}`.trim() ||
                user.email ||
                "Utilisateur",
              role: user.role,
              country: user.country,
            }
          : null
      }
    />
  );
}
