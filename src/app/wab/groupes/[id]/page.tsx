import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB } from "@/lib/wab-db";
import { buildShareMetadata } from "@/lib/share-metadata-service";
import WabGroupClient from "./WabGroupClient";

async function getGroup(id: string) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("wab_groups")
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
          privacy: data.privacy,
        };
      }
    } catch {}
  }
  try {
    const local = readWabDB().groups.find((g) => g.id === id);
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
  const group = await getGroup(id);

  if (!group) {
    return buildShareMetadata({
      type: "group",
      id,
      title: "Groupe Communautaire • World Africa Business (WAB)",
      description: "Rejoignez ce groupe professionnel sur le réseau World Africa Business d'Envol Africa.",
      badge: "GROUPE WAB",
    });
  }

  const title = `${group.name} • Groupe WAB | Envol Africa`;
  const description =
    group.description ||
    `Rejoignez le groupe ${group.name} sur World Africa Business (WAB) pour échanger avec des professionnels panafricains.`;

  return buildShareMetadata({
    type: "group",
    id: group.id,
    title,
    description,
    imageUrl: group.coverUrl || group.avatarUrl || group.logoUrl,
    badge: "COMMUNAUTÉ WAB",
  });
}

export default async function WabGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WabGroupClient id={id} />;
}
