import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";
import { toggleReactionOnPost } from "@/lib/wab-supabase";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { id } = await params;

  const supabaseResult = await toggleReactionOnPost(id, user.id);
  if (supabaseResult.configured) {
    if ("error" in supabaseResult && supabaseResult.error) {
      return NextResponse.json({ error: "Impossible d’enregistrer votre réaction." }, { status: 500 });
    }
    return NextResponse.json({ liked: supabaseResult.reacted, likes: supabaseResult.likes ?? 0 });
  }

  const db = readWabDB();
  const post = db.posts.find((item) => item.id === id && item.moderationStatus === "published");
  if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  const index = db.reactions.findIndex((item) => item.postId === id && item.userId === user.id);
  let liked: boolean;
  if (index >= 0) {
    db.reactions.splice(index, 1);
    post.likes = Math.max(0, post.likes - 1);
    liked = false;
  } else {
    db.reactions.push({ postId: id, userId: user.id, createdAt: new Date().toISOString() });
    post.likes += 1;
    liked = true;
  }
  writeWabDB(db);
  return NextResponse.json({ liked, likes: post.likes });
}
