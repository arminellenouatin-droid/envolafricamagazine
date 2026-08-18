import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB, writeWabDB, type WabMediaReaction } from "@/lib/wab-db";

const reactionNames = ["love", "like", "laugh", "sad", "cry", "wow"] as const;
type MediaType = "story" | "reel";
const validMediaType = (value: unknown): value is MediaType => value === "story" || value === "reel";
const validReaction = (value: unknown): value is WabMediaReaction["reaction"] => typeof value === "string" && reactionNames.includes(value as WabMediaReaction["reaction"]);

export async function GET(request: NextRequest) {
  const mediaType = request.nextUrl.searchParams.get("mediaType");
  const mediaId = request.nextUrl.searchParams.get("mediaId");
  if (!validMediaType(mediaType) || !mediaId) return NextResponse.json({ error: "Média invalide." }, { status: 400 });
  const user = await getCurrentUserFromCookie();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const [{ data: reactions, error: reactionsError }, { data: comments, error: commentsError }] = await Promise.all([
      supabase.from("wab_media_reactions").select("user_id,reaction").eq("media_type", mediaType).eq("media_id", mediaId),
      supabase.from("wab_media_comments").select("id,user_id,author,content,created_at").eq("media_type", mediaType).eq("media_id", mediaId).eq("status", "published").order("created_at", { ascending: true }),
    ]);
    if (reactionsError || commentsError) return NextResponse.json({ error: "Interactions indisponibles." }, { status: 503 });
    const counts = reactionNames.reduce<Record<string, number>>((result, reaction) => { result[reaction] = (reactions ?? []).filter((item) => item.reaction === reaction).length; return result; }, {});
    return NextResponse.json({ counts, total: (reactions ?? []).length, myReaction: user ? (reactions ?? []).find((item) => item.user_id === user.id)?.reaction ?? null : null, comments: (comments ?? []).map((item) => ({ id: item.id, userId: item.user_id, author: item.author, content: item.content, createdAt: item.created_at })) });
  }
  const db = readWabDB();
  const reactions = db.mediaReactions.filter((item) => item.mediaType === mediaType && item.mediaId === mediaId);
  const counts = reactionNames.reduce<Record<string, number>>((result, reaction) => { result[reaction] = reactions.filter((item) => item.reaction === reaction).length; return result; }, {});
  return NextResponse.json({ counts, total: reactions.length, myReaction: user ? reactions.find((item) => item.userId === user.id)?.reaction ?? null : null, comments: db.mediaComments.filter((item) => item.mediaType === mediaType && item.mediaId === mediaId && item.status === "published") });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour interagir." }, { status: 401 });
  const body = await request.json().catch(() => null) as { mediaType?: unknown; mediaId?: unknown; reaction?: unknown; content?: unknown } | null;
  if (!validMediaType(body?.mediaType) || typeof body?.mediaId !== "string" || !body.mediaId) return NextResponse.json({ error: "Média invalide." }, { status: 400 });
  const mediaType = body.mediaType; const mediaId = body.mediaId; const supabase = getSupabaseAdmin();
  if (validReaction(body?.reaction)) {
    if (supabase) {
      const { data: existing } = await supabase.from("wab_media_reactions").select("id,reaction").eq("media_type", mediaType).eq("media_id", mediaId).eq("user_id", user.id).maybeSingle();
      if (existing?.reaction === body.reaction) await supabase.from("wab_media_reactions").delete().eq("id", existing.id);
      else if (existing) await supabase.from("wab_media_reactions").update({ reaction: body.reaction, updated_at: new Date().toISOString() }).eq("id", existing.id);
      else await supabase.from("wab_media_reactions").insert({ media_type: mediaType, media_id: mediaId, user_id: user.id, reaction: body.reaction });
      return NextResponse.json({ reaction: existing?.reaction === body.reaction ? null : body.reaction });
    }
    const db = readWabDB(); const existing = db.mediaReactions.find((item) => item.mediaType === mediaType && item.mediaId === mediaId && item.userId === user.id);
    if (existing?.reaction === body.reaction) db.mediaReactions = db.mediaReactions.filter((item) => item !== existing);
    else if (existing) existing.reaction = body.reaction;
    else db.mediaReactions.push({ mediaType, mediaId, userId: user.id, reaction: body.reaction, createdAt: new Date().toISOString() });
    writeWabDB(db); return NextResponse.json({ reaction: existing?.reaction === body.reaction ? null : body.reaction });
  }
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (content.length < 2 || content.length > 2000) return NextResponse.json({ error: "Le commentaire doit contenir entre 2 et 2 000 caractères." }, { status: 400 });
  if (supabase) {
    const { data, error } = await supabase.from("wab_media_comments").insert({ media_type: mediaType, media_id: mediaId, user_id: user.id, author: `${user.prenom} ${user.nom}`, content, status: "published" }).select("id,user_id,author,content,created_at").single();
    if (error || !data) return NextResponse.json({ error: "Impossible d’enregistrer le commentaire." }, { status: 503 });
    return NextResponse.json({ comment: { id: data.id, userId: data.user_id, author: data.author, content: data.content, createdAt: data.created_at } }, { status: 201 });
  }
  const db = readWabDB(); const comment = { id: uuid(), mediaType, mediaId, userId: user.id, author: `${user.prenom} ${user.nom}`, content, status: "published" as const, createdAt: new Date().toISOString() }; db.mediaComments.push(comment); writeWabDB(db); return NextResponse.json({ comment }, { status: 201 });
}
