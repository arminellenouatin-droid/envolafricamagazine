import type { Metadata } from "next";
import DonClient from "./DonClient";

export const metadata: Metadata = {
  title: "Soutenir Envol Africa | Combat pour l'envol de l'Afrique",
  description: "Votre don aide dans notre combat pour l'envol de l'Afrique. Soutenez l'écosystème Envol Africa : Magazine d'impact, Africa Awards, Crowdfunding, Marketplace, Emploi et WAB.",
  alternates: {
    canonical: "/don",
  },
  openGraph: {
    title: "Soutenir Envol Africa | Combat pour l'envol de l'Afrique",
    description: "Votre don aide dans notre combat pour l'envol de l'Afrique. Soutenez l'écosystème Envol Africa et participez à l'émergence économique du continent.",
    url: "/don",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Votre don aide dans notre combat pour l'envol de l'Afrique",
    description: "Faites un don sécurisé pour soutenir l'écosystème Envol Africa et nos 6 piliers d'action.",
  },
};

export default function DonPage() {
  return <DonClient />;
}
