import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin, isProductionRuntime } from "@/lib/supabase-admin";
import { incrementPostViews } from "@/lib/wab-supabase";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { visitorId, watchSeconds = 0 } = await request.json();
  const user = await getCurrentUserFromCookie();
  const seconds = Math.max(0, Math.min(14400, Number(watchSeconds) || 0));
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data: post, error: postError } = await supabase.from("wab_posts").select("id").eq("id", id).eq("moderation_status", "published").maybeSingle();
    if (postError) return NextResponse.json({ error: "Publication indisponible." }, { status: 503 });
    if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
    const result = await incrementPostViews(id, user?.id, typeof visitorId === "string" ? visitorId.slice(0, 100) : undefined, seconds);
    if (!result.configured) return NextResponse.json({ error: "WAB non configuré." }, { status: 503 });
    return NextResponse.json({ ok: true });
  }

  if (isProductionRuntime()) return NextResponse.json({ error: "WAB non configuré." }, { status: 503 });

  const db = readWabDB();
  const post = db.posts.find((item) => item.id === id && item.moderationStatus === "published");
  if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  const recent = db.views.some((view) => view.postId === id && (user ? view.userId === user.id : view.visitorId === visitorId) && Date.now() - Date.parse(view.createdAt) < 1800000);
  if (!recent) {
    db.views.push({ postId: id, userId: user?.id, visitorId: typeof visitorId === "string" ? visitorId.slice(0, 100) : undefined, watchSeconds: seconds, createdAt: new Date().toISOString() });
    post.views += 1;
    post.watchSeconds += seconds;
    if (post.authorUserId) {
      const viewUnits = Math.floor(post.views / 1000);
      const minuteUnits = post.type === "video" ? Math.floor(post.watchSeconds / 180000) : 0;
      for (let threshold = 1; threshold <= viewUnits; threshold++) if (!db.rewards.some((reward) => reward.postId === id && reward.type === "views_1000" && reward.threshold === threshold)) db.rewards.push({ id: uuid(), userId: post.authorUserId, postId: id, type: "views_1000", threshold, amount: 1000, status: "pending_review", createdAt: new Date().toISOString() });
      for (let threshold = 1; threshold <= minuteUnits; threshold++) if (!db.rewards.some((reward) => reward.postId === id && reward.type === "watch_minutes_3000" && reward.threshold === threshold)) db.rewards.push({ id: uuid(), userId: post.authorUserId, postId: id, type: "watch_minutes_3000", threshold, amount: 5000, status: "pending_review", createdAt: new Date().toISOString() });
    }
    writeWabDB(db);
  }
  return NextResponse.json({ ok: true });
}
