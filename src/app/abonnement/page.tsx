import type { Metadata } from "next";
import AbonnementClient from "./AbonnementClient";

export const metadata: Metadata = {
  title: "Abonnement Numérique & Papier",
  description: "Abonnez-vous à Envol Africa Magazine : accédez à toutes nos enquêtes économiques, analyses sectorielles, éditions numériques et versions audio en 12 langues.",
  alternates: {
    canonical: "/abonnement",
  },
  openGraph: {
    title: "Abonnement Numérique & Papier | Envol Africa",
    description: "Rejoignez la communauté des décideurs et investisseurs panafricains. Analyses économiques exclusives, enquêtes terrain et 1 magazine offert par mois.",
    url: "/abonnement",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Formules d'Abonnement | Envol Africa Magazine",
    description: "Découvrez nos abonnements mensuels, annuels et prestige pour décideurs panafricains.",
  },
};

export default function AbonnementPage() {
  return <AbonnementClient />;
}
