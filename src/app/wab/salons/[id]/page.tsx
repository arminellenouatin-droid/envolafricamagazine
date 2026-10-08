import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB } from "@/lib/wab-db";
import { buildShareMetadata } from "@/lib/share-metadata-service";
import SalonClient from "./SalonClient";

async function getSalon(id: string) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("wab_salons")
        .select("*, wab_profiles:host_profile_id(headline, avatar_url, users:user_id(full_name, avatar))")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        const hostProfile = Array.isArray(data.wab_profiles) ? data.wab_profiles[0] : data.wab_profiles;
        const hostUser = Array.isArray(hostProfile?.users) ? hostProfile.users[0] : hostProfile?.users;
        return {
          id: data.id,
          title: data.title,
          description: data.description,
          host: hostUser?.full_name || data.host || "Hôte WAB",
          startsAt: data.starts_at,
          status: data.status,
          coverUrl: data.cover_url,
          theme: data.theme,
        };
      }
    } catch {}
  }
  try {
    const local = readWabDB().salons.find((s) => s.id === id);
    if (local) return local;
  } catch {}
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const salon = await getSalon(id);

  if (!salon) {
    return buildShareMetadata({
      type: "salon",
      id,
      title: "Salon Live • World Africa Business (WAB)",
      description: "Rejoignez ce salon interactif et participez aux discussions économiques panafricaines en direct sur Envol Africa.",
      badge: "SALON LIVE",
    });
  }

  const isLive = salon.status === "live";
  const title = isLive
    ? `🔴 EN DIRECT : ${salon.title} | Avec ${salon.host}`
    : `🎙 Salon : ${salon.title} | Animé par ${salon.host}`;

  return buildShareMetadata({
    type: "salon",
    id: salon.id,
    title,
    description: salon.description || `Salon interactif ${salon.theme ? `sur le thème "${salon.theme}"` : ""} sur World Africa Business.`,
    imageUrl: salon.coverUrl,
    author: salon.host,
    badge: isLive ? "🔴 EN DIRECT MAINTENANT" : "🎙 SALON WAB",
  });
}

export default async function SalonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SalonClient id={id} />;
}
