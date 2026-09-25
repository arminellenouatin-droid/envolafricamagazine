import type { Metadata } from "next";
import SalonsClient from "@/app/wab/salons/SalonsClient";

export const metadata: Metadata = {
  title: "Salons Professionnels & Directs Vidéo | Envol Africa",
  description: "Participez aux échanges en direct, posez vos questions aux leaders économiques et découvrez les salons professionnels en direct.",
  alternates: {
    canonical: "/salons",
  },
  openGraph: {
    title: "Salons Professionnels & Directs Vidéo | Envol Africa",
    description: "Le fil d'actualité des salons et directs vidéo d'Envol Africa.",
    url: "/salons",
    type: "website",
  },
};

export default function SalonsPage() {
  return <SalonsClient />;
}
