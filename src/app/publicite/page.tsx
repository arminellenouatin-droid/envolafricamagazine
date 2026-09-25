import type { Metadata } from "next";
import PubliciteClient from "./PubliciteClient";
import { getCurrentUserFromCookie } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Publicité & Régie Commerciale | Envol Africa Magazine",
  description: "Valorisez votre marque auprès des décideurs économiques africains. Découvrez nos formats publicitaires print (magazine papier) et web, et téléchargez notre Kit Média.",
  alternates: {
    canonical: "/publicite",
  },
  openGraph: {
    title: "Publicité & Régie Commerciale | Envol Africa Magazine",
    description: "Formats publicitaires magazine et web : encarts, pages entières, bannières, articles sponsorisés.",
    url: "/publicite",
    type: "website",
    images: [
      {
        url: "https://www.envolafrica.site/logo-couleur-entete-new.png",
        width: 1200,
        height: 630,
        alt: "Publicité Envol Africa Magazine",
      },
    ],
  },
};

export default async function PublicitePage() {
  const user = await getCurrentUserFromCookie();
  const isAdmin = Boolean(user && ["admin", "gerant", "redacteur_chef"].includes(user.role));

  return <PubliciteClient isAdmin={isAdmin} user={user ? { email: user.email, nom: user.nom, prenom: user.prenom } : null} />;
}
