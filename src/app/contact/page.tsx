import type { Metadata } from "next";
import ContactClientView from "./ContactClientView";

export const metadata: Metadata = {
  title: "Contact & Rédaction Panafricaine",
  description: "Contactez les équipes d'Envol Africa Magazine : Rédaction, Régie Publicitaire, Support Abonnements et Partenariats institutionnels.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact & Rédaction Panafricaine | Envol Africa",
    description: "Un interlocuteur dédié pour vos questions, propositions d'articles, partenariats et régie publicitaire.",
    url: "/contact",
    type: "website",
  },
};

export default function ContactPage() {
  return <ContactClientView />;
}
