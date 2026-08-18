import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isProductionRuntime } from "@/lib/supabase-admin";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: post, error } = await supabase.from("wab_posts").select("id,shares_count").eq("id", id).eq("moderation_status", "published").maybeSingle();
    if (error) return NextResponse.json({ error: "Partage indisponible." }, { status: 503 });
    if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
    const shares = Number(post.shares_count || 0) + 1;
    const { error: updateError } = await supabase.from("wab_posts").update({ shares_count: shares }).eq("id", id);
    if (updateError) return NextResponse.json({ error: "Impossible d’enregistrer le partage." }, { status: 500 });
    return NextResponse.json({ shared: true, shares });
  }
  if (isProductionRuntime()) return NextResponse.json({ error: "WAB non configuré." }, { status: 503 });
  const db = readWabDB();
  const post = db.posts.find((item) => item.id === id && item.moderationStatus === "published");
  if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  post.shares = Number(post.shares || 0) + 1;
  writeWabDB(db);
  return NextResponse.json({ shared: true, shares: post.shares });
}
