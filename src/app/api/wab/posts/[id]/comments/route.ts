import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";
import { addCommentToPost, getCommentsForPost, getWabProfileByUserId } from "@/lib/wab-supabase";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const profile = await getWabProfileByUserId(user.id);
  if (profile.configured && profile.profile) {
    const result = await addCommentToPost(id, profile.profile.id, content);
    if (result.configured && !result.error && result.comment) return NextResponse.json({ comment: result.comment }, { status: 201 });
  }

  const db = readWabDB();
  const post = db.posts.find((item) => item.id === id && item.moderationStatus === "published");
  if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  const comment = { id: uuid(), postId: id, userId: user.id, author: `${user.prenom} ${user.nom}`, content, status: "published" as const, createdAt: new Date().toISOString() };
  db.comments.push(comment); post.comments = Number(post.comments || 0) + 1; writeWabDB(db);
  return NextResponse.json({ comment }, { status: 201 });
}
