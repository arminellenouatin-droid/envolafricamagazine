import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB, writeWabDB } from "@/lib/wab-db";
import { sanitizeRichText } from "@/lib/rich-text";
import { getWabProfileByUserId } from "@/lib/wab-supabase";

type Context = { params: Promise<{ id: string }> };

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
