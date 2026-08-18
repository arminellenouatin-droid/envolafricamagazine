import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin, isProductionRuntime } from "@/lib/supabase-admin";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    if (!user) return NextResponse.json({ stories: [] });
    const { data: connections } = await supabase.from("wab_connections").select("profile_id").eq("follower_user_id", user.id).limit(500);
    const profileIds = (connections ?? []).map((item) => item.profile_id);
    const { data: followedProfiles } = profileIds.length ? await supabase.from("wab_profiles").select("id,user_id,avatar_url").in("id", profileIds) : { data: [] };
    const userIds = [user.id, ...(followedProfiles ?? []).map((item) => item.user_id)];
    const { data, error } = await supabase.from("wab_stories").select("id,user_id,author,media_url,mime_type,caption,views,likes,created_at,expires_at").eq("moderation_status", "published").gt("expires_at", new Date().toISOString()).in("user_id", userIds).order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: "Stories indisponibles." }, { status: 503 });
    const avatars = new Map((followedProfiles ?? []).map((item) => [item.user_id, item.avatar_url]));
    avatars.set(user.id, (user as { avatar?: string }).avatar ?? "");
    return NextResponse.json({ stories: (data ?? []).map((story) => ({ id: story.id, author: story.author, authorUserId: story.user_id, avatarUrl: avatars.get(story.user_id) || undefined, mediaUrl: story.media_url, mimeType: story.mime_type, caption: story.caption, views: story.views, likes: story.likes })) });
  }
  const db = readWabDB();
  const followedProfileIds = user ? db.connections.filter((item) => item.followerUserId === user.id).map((item) => item.profileId) : [];
  const followedUserIds = user ? [user.id, ...db.profiles.filter((profile) => followedProfileIds.includes(profile.id)).map((profile) => profile.userId)] : [];
  const stories = db.stories.filter((story) => story.moderationStatus === "published" && Date.parse(story.expiresAt) > Date.now() && (!user || followedUserIds.includes(story.authorUserId ?? ""))).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return NextResponse.json({ stories });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour publier une Story." }, { status: 401 });
  const body = await request.json().catch(() => null) as { mediaUrl?: unknown; mimeType?: unknown; caption?: unknown } | null;
  if (typeof body?.mediaUrl !== "string" || !/^https:\/\//.test(body.mediaUrl)) return NextResponse.json({ error: "Le média n’est pas disponible. Veuillez réessayer le téléversement." }, { status: 400 });
  const now = new Date(); const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); const supabase = getSupabaseAdmin();
  if (supabase) { const { data, error } = await supabase.from("wab_stories").insert({ user_id: user.id, author: `${user.prenom} ${user.nom}`, media_url: body.mediaUrl, mime_type: typeof body.mimeType === "string" ? body.mimeType : "image/jpeg", caption: typeof body.caption === "string" ? body.caption.slice(0, 300) : "", created_at: now.toISOString(), expires_at: expiresAt, moderation_status: "published" }).select("id,user_id,author,media_url,mime_type,caption,views,likes").single(); if (error || !data) return NextResponse.json({ error: "Impossible d’enregistrer la Story dans Supabase." }, { status: 503 }); return NextResponse.json({ story: { id: data.id, author: data.author, authorUserId: data.user_id, mediaUrl: data.media_url, mimeType: data.mime_type, caption: data.caption, views: data.views, likes: data.likes } }, { status: 201 }); }
  if (isProductionRuntime()) return NextResponse.json({ error: "Le stockage des Stories n’est pas configuré." }, { status: 503 });
  const story = { id: crypto.randomUUID(), author: `${user.prenom} ${user.nom}`, authorUserId: user.id, mediaUrl: body.mediaUrl, mimeType: typeof body.mimeType === "string" ? body.mimeType : "image/jpeg", caption: typeof body.caption === "string" ? body.caption.slice(0, 300) : "", createdAt: now.toISOString(), expiresAt, views: 0, likes: 0, moderationStatus: "published" as const };
  const db = readWabDB(); db.stories.unshift(story); writeWabDB(db); return NextResponse.json({ story }, { status: 201 });
}
