import type { Metadata } from "next";
import DevelopersClient from "./DevelopersClient";

export const metadata: Metadata = {
  title: "Documentation API & Développeurs | Envol Africa Magazine",
  description:
    "Documentation officielle de l'API Agent et du serveur MCP Envol Africa. Connectez vos agents IA autonomes (Claude, Cursor, Antigravity) et vos applications pour automatiser la rédaction, l'analyse de données et la diffusion.",
  alternates: {
    canonical: "/developpeurs",
  },
  openGraph: {
    title: "Documentation API & Développeurs | Envol Africa Magazine",
    description:
      "Guide complet pour connecter des agents IA et développer des intégrations avec l'écosystème Envol Africa via API REST et MCP.",
    url: "/developpeurs",
    type: "website",
    images: [
      {
        url: "https://www.envolafrica.site/logo-couleur-entete-new.png",
        width: 1200,
        height: 630,
        alt: "Envol Africa Magazine API Développeurs",
      },
    ],
  },
};

export default function DevelopersPage() {
  return <DevelopersClient />;
}
