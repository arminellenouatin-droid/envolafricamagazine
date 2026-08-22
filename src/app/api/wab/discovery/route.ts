/*
 * Direction Atelier de preuve WAB : découverte réelle, sobre et utile.
 * Ce handler expose uniquement des contenus publiés/actifs et ne renvoie jamais d’e-mail.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB } from "@/lib/wab-db";

const DISCOVERY_TYPES = ["people", "reels", "pages", "groups"] as const;
type DiscoveryType = (typeof DISCOVERY_TYPES)[number];

function isDiscoveryType(value: string | null): value is DiscoveryType {
  return Boolean(value && DISCOVERY_TYPES.includes(value as DiscoveryType));
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "people";
  if (!isDiscoveryType(type)) return NextResponse.json({ error: "Type de découverte invalide." }, { status: 400 });

  const viewer = await getCurrentUserFromCookie();
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ type, items: [] });

  if (type === "reels") {
    const reels = readWabDB().reels
      .filter((reel) => reel.moderationStatus === "published")
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 24)
      .map((reel) => ({ id: reel.id, title: reel.caption || "Reel WAB", subtitle: reel.author, imageUrl: reel.mediaUrl, href: "/wab", mediaUrl: reel.mediaUrl }));
    return NextResponse.json({ type, items: reels });
  }

  if (type === "people") {
    const { data: connections } = viewer ? await supabase.from("wab_connections").select("profile_id").eq("follower_user_id", viewer.id).limit(500) : { data: [] };
    const followedProfileIds = new Set((connections ?? []).map((item) => item.profile_id));
    const { data, error } = await supabase
      .from("wab_profiles")
      .select("id,user_id,headline,avatar_url,city,country_code,users:user_id(prenom,nom,full_name,avatar)")
      .eq("status", "active")
      .limit(60);
    if (error) return NextResponse.json({ type, items: [] });
    const items = (data ?? [])
      .filter((profile) => profile.user_id !== viewer?.id && !followedProfileIds.has(profile.id))
      .slice(0, 24)
      .map((profile) => {
        const user = Array.isArray(profile.users) ? profile.users[0] : profile.users;
        const name = user?.full_name || [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Membre WAB";
        return { id: profile.id, title: name, subtitle: profile.headline || [profile.city, profile.country_code].filter(Boolean).join(" · ") || "Membre WAB", imageUrl: profile.avatar_url || user?.avatar || "", href: `/wab/profil?author=${encodeURIComponent(name)}`, targetUserId: profile.user_id };
      });
    return NextResponse.json({ type, items });
  }

  if (type === "pages") {
    const { data, error } = await supabase.from("wab_pages").select("id,name,slug,logo_url,avatar_url,description").eq("status", "active").order("created_at", { ascending: false }).limit(24);
    if (error) return NextResponse.json({ type, items: [] });
    return NextResponse.json({ type, items: (data ?? []).map((page) => ({ id: page.id, title: page.name, subtitle: page.description || "Page WAB", imageUrl: page.logo_url || page.avatar_url || "", href: `/wab/pages/${page.id}`, targetPageId: page.id })) });
  }

  const { data, error } = await supabase.from("wab_groups").select("id,name,slug,logo_url,avatar_url,description,privacy").eq("status", "active").order("created_at", { ascending: false }).limit(24);
  if (error) return NextResponse.json({ type, items: [] });
  return NextResponse.json({ type, items: (data ?? []).map((group) => ({ id: group.id, title: group.name, subtitle: group.description || (group.privacy === "private" ? "Groupe privé" : "Groupe communautaire"), imageUrl: group.logo_url || group.avatar_url || "", href: `/wab/groupes/${group.id}`, targetGroupId: group.id })) });
}
