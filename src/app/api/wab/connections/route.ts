import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { followProfile, isFollowingProfile, notifyWabUser } from "@/lib/wab-supabase";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ connections: [] });
  const targetUserId = request.nextUrl.searchParams.get("targetUserId");
  const supabase = getSupabaseAdmin();
  if (supabase) {
    if (targetUserId) {
      const { data: profile } = await supabase.from("wab_profiles").select("id").eq("user_id", targetUserId).maybeSingle();
      if (!profile) return NextResponse.json({ following: false });
      const status = await isFollowingProfile(user.id, profile.id);
      return NextResponse.json({ following: status.following });
    }
    const { data, error } = await supabase.from("wab_connections").select("profile_id, created_at, wab_profiles:profile_id(id,user_id,headline,about,company_name,industry,country_code,city,avatar_url,status)").eq("follower_user_id", user.id).order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: "Abonnements indisponibles." }, { status: 503 });
    return NextResponse.json({ connections: data ?? [] });
  }
  const db = readWabDB();
  if (targetUserId) { const profile = db.profiles.find((item) => item.userId === targetUserId); return NextResponse.json({ following: Boolean(profile && db.connections.some((item) => item.followerUserId === user.id && item.profileId === profile.id)) }); }
  return NextResponse.json({ connections: db.connections.filter((item) => item.followerUserId === user.id).map((item) => db.profiles.find((profile) => profile.id === item.profileId)).filter(Boolean) });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { profileId?: unknown; userId?: unknown } | null;
  const targetUserId = typeof body?.userId === "string" ? body.userId : "";
  const supabase = getSupabaseAdmin();
  if (supabase) {
    let profileQuery = supabase.from("wab_profiles").select("id,user_id").eq("status", "active");
    profileQuery = typeof body?.profileId === "string" ? profileQuery.eq("id", body.profileId) : profileQuery.eq("user_id", targetUserId);
    const { data: target } = await profileQuery.maybeSingle();
    if (!target || target.user_id === user.id) return NextResponse.json({ error: "Profil indisponible." }, { status: 400 });
    const result = await followProfile(user.id, target.id);
    if (result.followed) await notifyWabUser(target.user_id, { type: "new_follower", title: `${user.prenom} ${user.nom} s’est abonné à votre profil`, body: "Vous avez un nouvel abonné sur WAB.", href: `/wab/profil?author=${encodeURIComponent(`${user.prenom} ${user.nom}`)}` });
    return NextResponse.json({ following: result.followed });
  }
  const db = readWabDB();
  const profile = db.profiles.find((item) => (typeof body?.profileId === "string" ? item.id === body.profileId : item.userId === targetUserId) && item.status === "active");
  if (!profile || profile.userId === user.id) return NextResponse.json({ error: "Profil indisponible." }, { status: 400 });
  const index = db.connections.findIndex((item) => item.followerUserId === user.id && item.profileId === profile.id);
  let following = false;
  if (index >= 0) db.connections.splice(index, 1); else { db.connections.push({ followerUserId: user.id, profileId: profile.id, createdAt: new Date().toISOString() }); following = true; }
  writeWabDB(db); return NextResponse.json({ following });
}

export async function PUT(request: NextRequest) { return POST(request); }
