import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB } from "@/lib/wab-db";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Contacts suivis et suggérés
  const followed: Array<{
    id: string;
    userId: string;
    fullName: string;
    headline: string;
    avatarUrl?: string;
  }> = [];

  const suggested: Array<{
    id: string;
    userId: string;
    fullName: string;
    headline: string;
    avatarUrl?: string;
  }> = [];

  if (supabase) {
    try {
      // 1. Profils suivis
      const { data: connections } = await supabase
        .from("wab_connections")
        .select("profile_id")
        .eq("follower_user_id", user.id);

      const followedProfileIds = (connections ?? []).map((c) => c.profile_id);

      if (followedProfileIds.length > 0) {
        const { data: followedProfiles } = await supabase
          .from("wab_profiles")
          .select("id,user_id,full_name,headline,avatar_url")
          .in("id", followedProfileIds);

        (followedProfiles ?? []).forEach((p) => {
          if (p.user_id !== user.id) {
            followed.push({
              id: p.id,
              userId: p.user_id,
              fullName: p.full_name,
              headline: p.headline || "Membre du réseau WAB",
              avatarUrl: p.avatar_url,
            });
          }
        });
      }

      // 2. Profils suggérés (autres profils actifs)
      const { data: otherProfiles } = await supabase
        .from("wab_profiles")
        .select("id,user_id,full_name,headline,avatar_url")
        .neq("user_id", user.id)
        .limit(20);

      (otherProfiles ?? []).forEach((p) => {
        if (!followedProfileIds.includes(p.id)) {
          suggested.push({
            id: p.id,
            userId: p.user_id,
            fullName: p.full_name,
            headline: p.headline || "Professionnel africain",
            avatarUrl: p.avatar_url,
          });
        }
      });
    } catch {}
  }

  // Fallback si base locale ou Supabase vide
  if (followed.length === 0 && suggested.length === 0) {
    try {
      const db = readWabDB();
      const localFollowedIds = db.connections
        .filter((c) => c.followerUserId === user.id)
        .map((c) => c.profileId);

      db.profiles.forEach((p) => {
        if (p.userId === user.id) return;
        const item = {
          id: p.id,
          userId: p.userId,
          fullName: p.fullName,
          headline: p.headline || `${p.companyName || "Entreprise"} · ${p.country}`,
          avatarUrl: undefined,
        };
        if (localFollowedIds.includes(p.id)) {
          followed.push(item);
        } else {
          suggested.push(item);
        }
      });

      // Si toujours vide, injecter quelques profils de référence
      if (suggested.length === 0) {
        suggested.push(
          {
            id: "sugg-1",
            userId: "user-aicha",
            fullName: "Aïcha Bamba",
            headline: "Fondatrice · Abidjan Green Logistics",
            avatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=160&auto=format&fit=crop",
          },
          {
            id: "sugg-2",
            userId: "user-moussa",
            fullName: "Moussa Diallo",
            headline: "Consultant finance & stratégie · Dakar",
            avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop",
          },
          {
            id: "sugg-3",
            userId: "user-njeri",
            fullName: "Njeri Wanjiku",
            headline: "Product Lead · Fintech Africa · Nairobi",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop",
          }
        );
      }
    } catch {}
  }

  return NextResponse.json({ followed, suggested });
}
