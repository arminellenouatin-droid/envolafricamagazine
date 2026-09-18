import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCrowdProjects } from "@/lib/crowdfunding-supabase";
import { readCrowdDB } from "@/lib/crowdfunding-db";
import ProjetDetailClient from "./ProjetDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  let projet: any = null;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const res = await getCrowdProjects({ id });
      projet = res.projets[0];
    } catch {
      // Ignorer l'erreur et tenter la base locale
    }
  }

  if (!projet) {
    try {
      projet = readCrowdDB().projets.find((p) => p.id === id);
    } catch {
      // Ignorer l'erreur
    }
  }

  if (!projet) {
    return {
      title: "Projet de Financement | Envol Africa",
      description: "Découvrez les opportunités d'investissement et projets panafricains à financer.",
    };
  }

  const title = `${projet.nom} • Crowdfunding Envol Africa`;
  const description = (projet.description || "Participez au financement de ce projet à fort impact sur Envol Africa.")
    .replace(/<[^>]*>/g, "")
    .slice(0, 180)
    .trim();
  const image = (Array.isArray(projet.images) && projet.images[0]) || "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800";

  return {
    title,
    description,
    alternates: {
      canonical: `/financement/projets/${encodeURIComponent(id)}`,
    },
    openGraph: {
      title,
      description,
      url: `/financement/projets/${encodeURIComponent(id)}`,
      type: "website",
      images: [
        {
          url: image,
          alt: projet.nom,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function ProjetDetail() {
  return <ProjetDetailClient />;
}
