import type { Metadata } from "next";
import DonClient from "./DonClient";

export const metadata: Metadata = {
  title: "Soutenir Envol Africa | Don & Mécénat Éditorial",
  description: "Soutenez un média économique panafricain indépendant, rigoureux et engagé. Vos dons financent nos enquêtes d'impact, nos correspondants locaux et la traduction en langues africaines.",
  alternates: {
    canonical: "/don",
  },
  openGraph: {
    title: "Soutenir Envol Africa | Don & Mécénat Éditorial",
    description: "Financez le journalisme économique qui compte en Afrique. Indépendance, rigueur et impact mesurable.",
    url: "/don",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Soutenir l'information économique africaine",
    description: "Faites un don sécurisé pour soutenir les enquêtes et correspondants d'Envol Africa.",
  },
};

export default function DonPage() {
  return <DonClient />;
}
