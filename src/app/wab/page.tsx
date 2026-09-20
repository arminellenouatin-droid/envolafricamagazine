import type { Metadata } from "next";
import WabClient from "./WabClient";
export const metadata: Metadata = {
  title: "World Africa Business (WAB) | Réseau Professionnel Panafricain",
  description: "Le réseau professionnel africain inspiré de LinkedIn dédié à l'entrepreneuriat, aux opportunités d'affaires, au networking et aux salons virtuels.",
  alternates: {
    canonical: "/wab",
  },
  openGraph: {
    title: "World Africa Business (WAB) | Le réseau des professionnels en Afrique",
    description: "Connectez-vous avec les leaders, entrepreneurs et talents de toute l'Afrique.",
    url: "/wab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "World Africa Business (WAB)",
    description: "Le réseau professionnel dédié au développement économique africain.",
  },
};
export default function WabPage() { return <WabClient />; }
