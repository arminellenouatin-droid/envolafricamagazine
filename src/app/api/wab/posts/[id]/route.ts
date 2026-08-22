import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB, writeWabDB } from "@/lib/wab-db";
import { sanitizeRichText } from "@/lib/rich-text";
import { getWabProfileByUserId } from "@/lib/wab-supabase";

type Context = { params: Promise<{ id: string }> };

type PublicPostRow = {
  id: string;
  author_id: string;
  content: string;
  content_type: string;
  media: Array<{ path: string; mimeType: string; name: string; size?: number }> | null;
  visibility: "public" | "community" | "group";
  moderation_status: string;
  is_boosted: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  source_type?: string | null;
  source_title?: string | null;
  source_url?: string | null;
  page_id?: string | null;
  group_id?: string | null;
  wab_profiles?: { id: string; user_id: string; headline: string | null; avatar_url: string | null; city: string | null; country_code: string | null; users?: { prenom?: string | null; nom?: string | null; full_name?: string | null; avatar?: string | null } | Array<{ prenom?: string | null; nom?: string | null; full_name?: string | null; avatar?: string | null }> } | null;
  wab_pages?: { id: string; name: string; logo_url: string | null } | null;
  wab_groups?: { id: string; name: string; logo_url: string | null } | null;
};

function toPublicPost(row: PublicPostRow) {
  const user = Array.isArray(row.wab_profiles?.users) ? row.wab_profiles.users[0] : row.wab_profiles?.users;
  return { id: row.id, author: user?.full_name || [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Membre WAB", authorAvatarUrl: row.wab_profiles?.avatar_url || user?.avatar || undefined, authorUserId: row.wab_profiles?.user_id, pageId: row.page_id || undefined, pageName: row.wab_pages?.name || undefined, pageLogoUrl: row.wab_pages?.logo_url || undefined, groupId: row.group_id || undefined, groupName: row.wab_groups?.name || undefined, visibility: row.visibility, publisherName: user?.full_name || [user?.prenom, user?.nom].filter(Boolean).join(" ") || undefined, headline: row.wab_profiles?.headline || "Professionnel Envol Africa", location: [row.wab_profiles?.city, row.wab_profiles?.country_code].filter(Boolean).join(", ") || "Afrique", content: row.content, type: row.content_type, media: row.media ?? [], tags: [], views: row.views_count ?? 0, watchSeconds: 0, likes: row.likes_count ?? 0, comments: row.comments_count ?? 0, shares: row.shares_count ?? 0, isBoosted: row.is_boosted ?? false, sourceType: row.source_type ?? undefined, sourceTitle: row.source_title ?? undefined, sourceUrl: row.source_url ?? undefined, createdAt: row.created_at, moderationStatus: row.moderation_status };
}

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const viewer = await getCurrentUserFromCookie();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from("wab_posts").select("*, wab_profiles:author_id(id,user_id,headline,avatar_url,city,country_code,users:user_id(prenom,nom,full_name,avatar)), wab_pages:page_id(id,name,logo_url), wab_groups:group_id(id,name,logo_url)").eq("id", id).eq("moderation_status", "published").maybeSingle();
    if (error) return NextResponse.json({ error: "Lecture de la publication impossible." }, { status: 500 });
    const post = data as PublicPostRow | null;
    if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
    const authorUserId = post.wab_profiles?.user_id;
    let allowed = post.visibility === "public" || post.is_boosted || Boolean(viewer?.id && viewer.id === authorUserId);
    if (viewer?.id && !allowed && post.visibility === "group" && post.group_id) { const { data: membership } = await supabase.from("wab_group_members").select("status").eq("group_id", post.group_id).eq("user_id", viewer.id).eq("status", "active").maybeSingle(); allowed = Boolean(membership); }
    if (viewer?.id && !allowed && post.visibility === "community" && post.author_id) { const { data: connection } = await supabase.from("wab_connections").select("profile_id").eq("follower_user_id", viewer.id).eq("profile_id", post.author_id).maybeSingle(); allowed = Boolean(connection); }
    if (!allowed) return NextResponse.json({ error: "Cette publication n’est pas accessible." }, { status: 404 });
    return NextResponse.json({ post: toPublicPost(post) });
  }
  const db = readWabDB();
  const post = db.posts.find((item) => item.id === id && item.moderationStatus === "published");
  if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  let allowed = post.visibility === "public" || post.isBoosted || Boolean(viewer?.id && post.authorUserId === viewer.id);
  if (viewer?.id && !allowed && post.visibility === "group" && post.groupId) allowed = db.groupMembers.some((member) => member.groupId === post.groupId && member.userId === viewer.id && member.status === "active");
  if (viewer?.id && !allowed && post.authorUserId) { const authorProfile = db.profiles.find((profile) => profile.userId === post.authorUserId); allowed = Boolean(authorProfile && db.connections.some((connection) => connection.followerUserId === viewer.id && connection.profileId === authorProfile.id)); }
  if (!allowed) return NextResponse.json({ error: "Cette publication n’est pas accessible." }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(request: NextRequest, context: Context) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const content = typeof body.content === "string" ? sanitizeRichText(body.content).trim().slice(0, 10000) : "";
  if (content.length < 2) return NextResponse.json({ error: "Le contenu doit contenir au moins deux caractères." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const profile = await getWabProfileByUserId(user.id);
    if (!profile.profile) return NextResponse.json({ error: "Profil WAB introuvable." }, { status: 404 });
    const { data: post, error: readError } = await supabase.from("wab_posts").select("id, author_id").eq("id", id).maybeSingle();
    if (readError) return NextResponse.json({ error: "Lecture de la publication impossible." }, { status: 500 });
    if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
    if (post.author_id !== profile.profile.id) return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres publications." }, { status: 403 });
    const { data: updated, error } = await supabase.from("wab_posts").update({ content, updated_at: new Date().toISOString() }).eq("id", id).eq("author_id", profile.profile.id).select("id, content, updated_at").single();
    if (error) return NextResponse.json({ error: "Modification impossible." }, { status: 500 });
    return NextResponse.json({ post: updated });
  }

  const db = readWabDB();
  const post = db.posts.find((item) => item.id === id);
  if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  if (post.authorUserId !== user.id) return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres publications." }, { status: 403 });
  post.content = content;
  writeWabDB(db);
  return NextResponse.json({ post });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { id } = await context.params;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const profile = await getWabProfileByUserId(user.id);
    if (!profile.profile) return NextResponse.json({ error: "Profil WAB introuvable." }, { status: 404 });
    const { data: post, error: readError } = await supabase.from("wab_posts").select("id, author_id").eq("id", id).maybeSingle();
    if (readError) return NextResponse.json({ error: "Lecture de la publication impossible." }, { status: 500 });
    if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
    if (post.author_id !== profile.profile.id) return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres publications." }, { status: 403 });
    const { error } = await supabase.from("wab_posts").delete().eq("id", id).eq("author_id", profile.profile.id);
    if (error) return NextResponse.json({ error: "Suppression impossible." }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const db = readWabDB();
  const index = db.posts.findIndex((item) => item.id === id);
  if (index < 0) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  if (db.posts[index].authorUserId !== user.id) return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres publications." }, { status: 403 });
  db.posts.splice(index, 1);
  writeWabDB(db);
  return NextResponse.json({ success: true });
}
