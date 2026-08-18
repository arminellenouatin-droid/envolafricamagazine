import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB } from "@/lib/wab-db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: page } = await supabase.from("wab_pages").select("id,owner_user_id,name,slug,logo_url,avatar_url,cover_url,description,status,created_at").eq("id", id).eq("status", "active").maybeSingle();
    if (!page) return NextResponse.json({ error: "Page introuvable." }, { status: 404 });
    const { count } = await supabase.from("wab_posts").select("id", { count: "exact", head: true }).eq("page_id", id).eq("moderation_status", "published");
    return NextResponse.json({ page: { id: page.id, ownerUserId: page.owner_user_id, name: page.name, slug: page.slug, logoUrl: page.logo_url, avatarUrl: page.avatar_url ?? page.logo_url, coverUrl: page.cover_url, description: page.description, postCount: count ?? 0 } });
  }
  const db = readWabDB();
  const page = db.pages.find((item) => item.id === id && item.status === "active");
  if (!page) return NextResponse.json({ error: "Page introuvable." }, { status: 404 });
  return NextResponse.json({ page: { ...page, postCount: db.posts.filter((post) => post.pageId === id && post.moderationStatus === "published").length } });
}
