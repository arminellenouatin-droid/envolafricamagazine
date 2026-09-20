import type { Metadata } from "next";
import ServiceClient from "./ServiceClient";

export const metadata: Metadata = {
  title: "Demande de Services & Partenariats Groupe",
  description: "Contactez l'équipe Envol Africa : Emploi, Marketplace, Financement Participatif, Africa Awards, Salons Professionnels et Régie Publicitaire. Réponse sous 24h.",
  alternates: {
    canonical: "/service",
  },
  openGraph: {
    title: "Demande de Services & Contact Groupe | Envol Africa",
    description: "Un interlocuteur unique pour l'ensemble des services de l'écosystème Envol Africa.",
    url: "/service",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Services & Partenariats | Envol Africa",
    description: "Contactez nos équipes pour vos besoins en recrutement, régie pub, marketplace ou investissement.",
  },
};

export default function ServicePage() {
  return <ServiceClient />;
}
