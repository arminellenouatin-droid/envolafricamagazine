import type { Metadata } from "next";
import FinancementClient from "./FinancementClient";

export const metadata: Metadata = {
  title: "Financement Participatif & Crowdfunding Panafricain | Envol Africa",
  description: "Investissez dans les entreprises, startups et projets à fort impact en Afrique. Dons, prises de participation et prêts rémunérés avec suivi en temps réel.",
  alternates: {
    canonical: "/financement",
  },
  openGraph: {
    title: "Financement Participatif & Crowdfunding Panafricain | Envol Africa",
    description: "Financez l'Afrique qui entreprend. Découvrez les campagnes ouvertes et devenez investisseur dès aujourd'hui.",
    url: "/financement",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crowdfunding & Investissement Panafricain | Envol Africa",
    description: "Participez au financement des champions économiques africains de demain.",
  },
};

export default function FinancementPage() {
  return <FinancementClient />;
}
