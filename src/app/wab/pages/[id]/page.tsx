import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB } from "@/lib/wab-db";
import { buildShareMetadata } from "@/lib/share-metadata-service";
import WabPageClient from "./WabPageClient";

async function getPage(id: string) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("wab_pages")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        return {
          id: data.id,
          name: data.name,
          description: data.description,
          logoUrl: data.logo_url,
          avatarUrl: data.avatar_url,
          coverUrl: data.cover_url,
        };
      }
    } catch {}
  }
  try {
    const local = readWabDB().pages.find((p) => p.id === id);
    if (local) return local;
  } catch {}
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const page = await getPage(id);

  if (!page) {
    return buildShareMetadata({
      type: "page",
      id,
      title: "Page Professionnelle • World Africa Business (WAB)",
      description: "Découvrez cette page entreprise et ses actualités sur World Africa Business.",
      badge: "PAGE WAB",
    });
  }

  const title = `${page.name} • Page Professionnelle | Envol Africa`;
  const description =
    page.description ||
    `Suivez les publications, actualités et opportunités de ${page.name} sur World Africa Business (WAB).`;

  return buildShareMetadata({
    type: "page",
    id: page.id,
    title,
    description,
    imageUrl: page.coverUrl || page.logoUrl || page.avatarUrl,
    badge: "PAGE PROFESSIONNELLE",
  });
}

export default async function WabPageDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WabPageClient id={id} />;
}
