import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCrowdProjects } from "@/lib/crowdfunding-supabase";
import { readCrowdDB } from "@/lib/crowdfunding-db";
import ProjetDetailClient from "./ProjetDetailClient";

async function getProjet(id: string) {
  let projet: any = null;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const res = await getCrowdProjects({ id });
      projet = res?.projets?.[0] || null;
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

  return projet;
}

import { buildShareMetadata } from "@/lib/share-metadata-service";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const projet = await getProjet(id);

  if (!projet) {
    return buildShareMetadata({
      type: "crowdfunding",
      id,
      title: "Projet d'investissement • AfricaCrowdFunding",
      description: "Découvrez les opportunités d'investissement et projets panafricains à financer sur Envol Africa.",
      badge: "CROWDFUNDING",
    });
  }

  const title = `${projet.nom} • Campagne de Financement | Envol Africa`;
  const description = (projet.description || "Participez au financement de ce projet à fort impact sur Envol Africa.")
    .replace(/<[^>]*>/g, "")
    .slice(0, 180)
    .trim();
  const image = (Array.isArray(projet.images) && projet.images[0]) || projet.image;

  return buildShareMetadata({
    type: "crowdfunding",
    id,
    title,
    description,
    imageUrl: image,
    badge: projet.secteur ? `FINANCEMENT • ${projet.secteur.toUpperCase()}` : "CROWDFUNDING AFRIQUE",
  });
}

export default async function ProjetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projet = await getProjet(id);
  return <ProjetDetailClient id={id} initialProjet={projet} />;
}
