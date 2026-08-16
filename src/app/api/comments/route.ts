import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDB, writeDB } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

function mapComment(comment: Record<string, unknown>) {
  return {
    id: String(comment.id),
    articleId: String(comment.article_id ?? comment.articleId),
    userId: String(comment.user_id ?? comment.userId),
    content: String(comment.content ?? ""),
    createdAt: String(comment.created_at ?? comment.createdAt),
    likes: Number(comment.likes ?? 0),
    isModerated: Boolean(comment.is_moderated ?? comment.isModerated ?? false),
  };
}

export async function GET(req: NextRequest) {
  const articleId = req.nextUrl.searchParams.get("articleId");
  const client = getSupabaseAdmin();
  if (!client) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Base de données temporairement indisponible" }, { status: 503 });
    }
    const db = readDB();
    let comments = db.comments;
    if (articleId) comments = comments.filter((comment) => comment.articleId === articleId);
    comments = comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);
    return NextResponse.json({ comments });
  }

  let query = client
    .from("comments")
    .select("id, article_id, user_id, content, created_at, likes, is_moderated")
    .order("created_at", { ascending: false })
    .limit(100);
  if (articleId) query = query.eq("article_id", articleId);
  const { data, error } = await query;
  if (error) {
    console.error("Comments lookup failed", error);
    return NextResponse.json({ error: "Impossible de charger les commentaires" }, { status: 500 });
  }
  return NextResponse.json({ comments: (data ?? []).map((comment) => mapComment(comment as Record<string, unknown>)) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { articleId, content } = await req.json();
  if (typeof articleId !== "string" || typeof content !== "string" || content.trim().length < 2 || content.length > 2000) {
    return NextResponse.json({ error: "articleId et content valides requis" }, { status: 400 });
  }

  const client = getSupabaseAdmin();
  if (!client) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Base de données temporairement indisponible" }, { status: 503 });
    }
    const db = readDB();
    const comment = { id: uuidv4(), articleId, userId: user.id, content: content.trim(), createdAt: new Date().toISOString(), likes: 0, isModerated: false };
    db.comments.push(comment);
    writeDB(db);
    return NextResponse.json({ success: true, comment }, { status: 201 });
  }

  const { data, error } = await client.from("comments").insert({
    id: uuidv4(),
    article_id: articleId,
    user_id: user.id,
    content: content.trim(),
    likes: 0,
    is_moderated: false,
  }).select("id, article_id, user_id, content, created_at, likes, is_moderated").single();
  if (error) {
    console.error("Comment creation failed", error);
    return NextResponse.json({ error: "Impossible de créer le commentaire" }, { status: 500 });
  }
  return NextResponse.json({ success: true, comment: mapComment(data as Record<string, unknown>) }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["gerant", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Rôle gerant/admin requis pour modération" }, { status: 403 });
  }

  const { id, isModerated } = await req.json();
  if (typeof id !== "string" || typeof isModerated !== "boolean") {
    return NextResponse.json({ error: "id et isModerated requis" }, { status: 400 });
  }

  const client = getSupabaseAdmin();
  if (!client) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Base de données temporairement indisponible" }, { status: 503 });
    }
    const db = readDB();
    const comment = db.comments.find((item) => item.id === id);
    if (!comment) return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 });
    comment.isModerated = isModerated;
    writeDB(db);
    return NextResponse.json({ success: true, comment });
  }

  const { data, error } = await client.from("comments").update({ is_moderated: isModerated }).eq("id", id).select("id, article_id, user_id, content, created_at, likes, is_moderated").maybeSingle();
  if (error) {
    console.error("Comment moderation failed", error);
    return NextResponse.json({ error: "Impossible de modérer le commentaire" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 });
  return NextResponse.json({ success: true, comment: mapComment(data as Record<string, unknown>) });
}
