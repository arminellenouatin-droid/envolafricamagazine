import type { Metadata } from "next";
import { listMagazines } from "@/lib/core-db";
import KiosqueExperience from "@/components/kiosque/KiosqueExperience";

export const metadata: Metadata = {
  title: "Kiosque Numérique & Éditions Magazine | Envol Africa",
  description: "Feuilletez, téléchargez et commandez les éditions imprimées et numériques d'Envol Africa Magazine. Dossiers économiques, enquêtes et analyses panafricaines.",
  alternates: {
    canonical: "/kiosque",
  },
  openGraph: {
    title: "Kiosque Numérique & Éditions Magazine | Envol Africa",
    description: "Toutes les éditions et dossiers économiques d'Envol Africa Magazine au format numérique et papier.",
    url: "/kiosque",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kiosque Numérique Envol Africa Magazine",
    description: "Feuilletez nos éditions exclusives et grands dossiers économiques africains.",
  },
};

export default async function KiosquePage() {
  const magazines = await listMagazines();
  return <KiosqueExperience initialMagazines={magazines} />;
}

