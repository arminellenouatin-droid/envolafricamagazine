import type { Metadata } from "next";
import FaqClient from "./FaqClient";

export const metadata: Metadata = {
  title: "Foire Aux Questions (FAQ) | Envol Africa Magazine",
  description: "Toutes les réponses à vos questions sur l'écosystème Envol Africa : Magazine, Kiosque, Emploi, Marketplace, Crowdfunding, Africa Awards, WAB et paiements.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Foire Aux Questions (FAQ) | Envol Africa",
    description: "Guide complet et assistance pour toutes les plateformes et fonctionnalités d'Envol Africa.",
    url: "/faq",
    type: "website",
  },
};

export default function FaqPage() {
  return <FaqClient />;
}
