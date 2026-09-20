import type { Metadata } from "next";
import JobsClient from "./JobsClient";

export const metadata: Metadata = {
  title: "Envol Africa Jobs | Emploi & Recrutement dans les 54 pays d’Afrique",
  description: "Trouvez une opportunité professionnelle, publiez votre candidature ou recrutez les meilleurs talents africains avec Envol Africa Jobs.",
  alternates: {
    canonical: "/emploi",
  },
  openGraph: {
    title: "Envol Africa Jobs | Emploi & Recrutement Panafricain",
    description: "La plateforme de référence pour recruter et postuler en Afrique. Offres vérifiées et profils qualifiés.",
    url: "/emploi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Envol Africa Jobs",
    description: "Opportunités professionnelles et talents dans toute l'Afrique.",
  },
};

export default function EmploiPage() {
  return <JobsClient />;
}
