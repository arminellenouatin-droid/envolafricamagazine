import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";
import EspaceAnnonceurClient from "./EspaceAnnonceurClient";

export const metadata: Metadata = {
  title: "Espace Annonceur - Régie Envol Ads | Envol Africa Magazine",
  description: "Gérez vos campagnes publicitaires, diffusez vos annonces sur Envol Africa et suivez vos performances en temps réel.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EspaceAnnonceurPage() {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    redirect("/auth/login?redirect=/publicite/espace");
  }

  const safeUser = {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    country: user.country,
  };

  return <EspaceAnnonceurClient user={safeUser} />;
}
