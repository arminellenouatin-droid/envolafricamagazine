import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB, writeWabDB } from "@/lib/wab-db";
import { notifyWabPostFollowers, toggleReactionOnPost } from "@/lib/wab-supabase";

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  if (supabase && !isUuid(id)) {
    const { data: existing, error: findError } = await supabase.from("wab_legacy_reactions").select("post_id").eq("post_id", id).eq("user_id", user.id).maybeSingle();
    if (findError) return NextResponse.json({ error: "Impossible de lire votre réaction." }, { status: 503 });
    let liked = false;
    if (existing) {
      const { error } = await supabase.from("wab_legacy_reactions").delete().eq("post_id", id).eq("user_id", user.id);
      if (error) return NextResponse.json({ error: "Impossible de retirer votre réaction." }, { status: 503 });
    } else {
      const { error } = await supabase.from("wab_legacy_reactions").insert({ post_id: id, user_id: user.id });
      if (error) return NextResponse.json({ error: "Impossible d’enregistrer votre réaction." }, { status: 503 });
      liked = true;
    }
    const { count } = await supabase.from("wab_legacy_reactions").select("post_id", { count: "exact", head: true }).eq("post_id", id);
    const likes = count ?? 0;
    await supabase.from("wab_legacy_post_metrics").upsert({ post_id: id, likes_count: likes, updated_at: new Date().toISOString() });
    if (liked) await notifyWabPostFollowers(id, { type: "post_like", title: "Votre publication a reçu un J’aime", body: "Un abonné a aimé votre publication WAB.", href: "/wab" });
    return NextResponse.json({ liked, likes });
  }

  const supabaseResult = await toggleReactionOnPost(id, user.id);
  if (supabaseResult.configured) {
    if ("error" in supabaseResult && supabaseResult.error) return NextResponse.json({ error: "Impossible d’enregistrer votre réaction." }, { status: 500 });
    if (supabaseResult.reacted) await notifyWabPostFollowers(id, { type: "post_like", title: "Votre publication a reçu un J’aime", body: "Un membre a aimé votre publication WAB.", href: "/wab" });
    return NextResponse.json({ liked: supabaseResult.reacted, likes: supabaseResult.likes ?? 0 });
  }

  const db = readWabDB();
  const post = db.posts.find((item) => item.id === id && item.moderationStatus === "published");
  if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  const index = db.reactions.findIndex((item) => item.postId === id && item.userId === user.id);
  let liked: boolean;
  if (index >= 0) { db.reactions.splice(index, 1); post.likes = Math.max(0, post.likes - 1); liked = false; }
  else { db.reactions.push({ postId: id, userId: user.id, createdAt: new Date().toISOString() }); post.likes += 1; liked = true; }
  try { writeWabDB(db); } catch { return NextResponse.json({ error: "Le stockage des réactions est indisponible." }, { status: 503 }); }
  return NextResponse.json({ liked, likes: post.likes });
}
