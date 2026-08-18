import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB, writeWabDB } from "@/lib/wab-db";
import { addCommentToPost, getCommentsForPost, getWabProfileByUserId } from "@/lib/wab-supabase";

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (supabase && !isUuid(id)) {
    const { data, error } = await supabase.from("wab_legacy_comments").select("id,post_id,user_id,author,content,created_at").eq("post_id", id).order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: "Commentaires indisponibles." }, { status: 503 });
    return NextResponse.json({ comments: (data ?? []).map((item) => ({ id: item.id, postId: item.post_id, userId: item.user_id, author: item.author, content: item.content, status: "published", createdAt: item.created_at })) });
  }
  const supabaseResult = await getCommentsForPost(id);
  if (supabaseResult.configured && !supabaseResult.error) return NextResponse.json({ comments: supabaseResult.comments ?? [] });
  const comments = readWabDB().comments.filter((item) => item.postId === id && item.status === "published");
  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as { content?: unknown } | null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (content.length < 2 || content.length > 2000) return NextResponse.json({ error: "Le commentaire doit contenir entre 2 et 2 000 caractères." }, { status: 400 });
  const supabase = getSupabaseAdmin();

  if (supabase && !isUuid(id)) {
    const { data, error } = await supabase.from("wab_legacy_comments").insert({ post_id: id, user_id: user.id, author: `${user.prenom} ${user.nom}`, content }).select("id,post_id,user_id,author,content,created_at").single();
    if (error || !data) return NextResponse.json({ error: "Impossible d’enregistrer le commentaire." }, { status: 503 });
    const { count } = await supabase.from("wab_legacy_comments").select("id", { count: "exact", head: true }).eq("post_id", id);
    await supabase.from("wab_legacy_post_metrics").upsert({ post_id: id, comments_count: count ?? 0, updated_at: new Date().toISOString() });
    return NextResponse.json({ comment: { id: data.id, postId: data.post_id, userId: data.user_id, author: data.author, content: data.content, status: "published", createdAt: data.created_at } }, { status: 201 });
  }

  const profile = await getWabProfileByUserId(user.id);
  if (profile.configured && profile.profile) {
    const result = await addCommentToPost(id, profile.profile.id, content);
    if (result.configured && !result.error && result.comment) return NextResponse.json({ comment: result.comment }, { status: 201 });
  }
  const db = readWabDB();
  const post = db.posts.find((item) => item.id === id && item.moderationStatus === "published");
  if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  const comment = { id: uuid(), postId: id, userId: user.id, author: `${user.prenom} ${user.nom}`, content, status: "published" as const, createdAt: new Date().toISOString() };
  db.comments.push(comment); post.comments = Number(post.comments || 0) + 1;
  try { writeWabDB(db); } catch { return NextResponse.json({ error: "Le stockage des commentaires est indisponible." }, { status: 503 }); }
  return NextResponse.json({ comment }, { status: 201 });
}
