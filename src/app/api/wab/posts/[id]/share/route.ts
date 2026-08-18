import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isProductionRuntime } from "@/lib/supabase-admin";
import { readWabDB, writeWabDB } from "@/lib/wab-db";
import { notifyWabPostFollowers } from "@/lib/wab-supabase";

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (supabase && !isUuid(id)) {
    const { data: metrics } = await supabase.from("wab_legacy_post_metrics").select("shares_count").eq("post_id", id).maybeSingle();
    const shares = Number(metrics?.shares_count || 0) + 1;
    const { error } = await supabase.from("wab_legacy_post_metrics").upsert({ post_id: id, shares_count: shares, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: "Impossible d’enregistrer le partage." }, { status: 503 });
    return NextResponse.json({ shared: true, shares });
  }
  if (supabase) {
    const { data: post, error } = await supabase.from("wab_posts").select("id,shares_count").eq("id", id).eq("moderation_status", "published").maybeSingle();
    if (error) return NextResponse.json({ error: "Partage indisponible." }, { status: 503 });
    if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
    const shares = Number(post.shares_count || 0) + 1;
    const { error: updateError } = await supabase.from("wab_posts").update({ shares_count: shares }).eq("id", id);
    if (updateError) return NextResponse.json({ error: "Impossible d’enregistrer le partage." }, { status: 500 });
    await notifyWabPostFollowers(id, { type: "post_share", title: "Votre publication a été partagée", body: "Un membre a partagé votre publication WAB.", href: "/wab" });
    return NextResponse.json({ shared: true, shares });
  }
  if (isProductionRuntime()) return NextResponse.json({ error: "WAB non configuré." }, { status: 503 });
  const db = readWabDB(); const post = db.posts.find((item) => item.id === id && item.moderationStatus === "published");
  if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  post.shares = Number(post.shares || 0) + 1;
  try { writeWabDB(db); } catch { return NextResponse.json({ error: "Le stockage des partages est indisponible." }, { status: 503 }); }
  return NextResponse.json({ shared: true, shares: post.shares });
}
