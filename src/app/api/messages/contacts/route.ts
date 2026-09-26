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
      // 1. Profils suivis via wab_connections
      const { data: connections } = await supabase
        .from("wab_connections")
        .select("profile_id")
        .eq("follower_user_id", user.id);

      const followedProfileIds = (connections ?? []).map((c) => c.profile_id).filter(Boolean);

      if (followedProfileIds.length > 0) {
        // Sélectionner les profils sans la colonne fictive 'full_name'
        const { data: followedProfiles } = await supabase
          .from("wab_profiles")
          .select("id, user_id, headline, avatar_url")
          .in("id", followedProfileIds);

        const followedUserIds = (followedProfiles ?? [])
          .map((p) => p.user_id)
          .filter((uid): uid is string => Boolean(uid));

        const userMap = new Map<string, { prenom?: string | null; nom?: string | null; avatar?: string | null; email?: string | null }>();

        if (followedUserIds.length > 0) {
          const { data: usersData } = await supabase
            .from("users")
            .select("id, prenom, nom, avatar, email")
            .in("id", followedUserIds);

          (usersData ?? []).forEach((u) => userMap.set(u.id, u));
        }

        (followedProfiles ?? []).forEach((p) => {
          if (p.user_id !== user.id) {
            const u = userMap.get(p.user_id);
            const fullName = u ? `${u.prenom || ""} ${u.nom || ""}`.trim() || u.email || "Ami WAB" : "Ami WAB";
            followed.push({
              id: p.id,
              userId: p.user_id,
              fullName,
              headline: p.headline || "Membre du réseau WAB",
              avatarUrl: p.avatar_url || u?.avatar,
            });
          }
        });
      }

      // 2. Profils suggérés (autres profils WAB actifs)
      const { data: otherProfiles } = await supabase
        .from("wab_profiles")
        .select("id, user_id, headline, avatar_url")
        .neq("user_id", user.id)
        .limit(30);

      const otherUserIds = (otherProfiles ?? [])
        .map((p) => p.user_id)
        .filter((uid): uid is string => Boolean(uid && !followed.some((f) => f.userId === uid)));

      if (otherUserIds.length > 0) {
        const { data: otherUsers } = await supabase
          .from("users")
          .select("id, prenom, nom, avatar, email")
          .in("id", otherUserIds);

        const otherUserMap = new Map((otherUsers ?? []).map((u) => [u.id, u]));

        (otherProfiles ?? []).forEach((p) => {
          if (p.user_id !== user.id && !followed.some((f) => f.userId === p.user_id)) {
            const u = otherUserMap.get(p.user_id);
            const fullName = u ? `${u.prenom || ""} ${u.nom || ""}`.trim() || u.email || "Professionnel africain" : "Professionnel africain";
            suggested.push({
              id: p.id,
              userId: p.user_id,
              fullName,
              headline: p.headline || "Professionnel africain",
              avatarUrl: p.avatar_url || u?.avatar,
            });
          }
        });
      }

      // 3. Compléter si nécessaire avec les autres membres réels de la plateforme
      if (suggested.length < 10) {
        const knownUserIds = new Set([user.id, ...followed.map((f) => f.userId), ...suggested.map((s) => s.userId)]);
        const { data: generalUsers } = await supabase
          .from("users")
          .select("id, prenom, nom, avatar, email")
          .limit(30);

        (generalUsers ?? []).forEach((u) => {
          if (!knownUserIds.has(u.id)) {
            knownUserIds.add(u.id);
            const fullName = `${u.prenom || ""} ${u.nom || ""}`.trim() || u.email || "Membre Envol Africa";
            suggested.push({
              id: u.id,
              userId: u.id,
              fullName,
              headline: "Membre de l'écosystème",
              avatarUrl: u.avatar,
            });
          }
        });
      }
    } catch (err) {
      console.error("[contacts] Erreur lors de la récupération des contacts Supabase:", err);
    }
  }

  // Fallback si base locale ou Supabase non configuré
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
    } catch {}
  }

  return NextResponse.json({ followed, suggested });
}
