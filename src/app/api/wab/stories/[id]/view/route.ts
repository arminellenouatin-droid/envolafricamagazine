import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUserFromCookie();
  const visitorId = request.headers.get("x-visitor-id") || request.headers.get("x-forwarded-for") || "anonymous";

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: story } = await supabase
      .from("wab_stories")
      .select("id,views")
      .eq("id", id)
      .maybeSingle();

    if (story) {
      const nextViews = (story.views || 0) + 1;
      await supabase.from("wab_stories").update({ views: nextViews }).eq("id", id);
      return NextResponse.json({ views: nextViews, counted: true });
    }
  }

  const db = readWabDB();
  const story = db.stories.find((item) => item.id === id);
  if (!story && !supabase) {
    return NextResponse.json({ error: "Story introuvable." }, { status: 404 });
  }

  if (story) {
    story.views = (story.views || 0) + 1;
    db.views.push({
      postId: `story:${id}`,
      userId: user?.id,
      visitorId,
      watchSeconds: 0,
      createdAt: new Date().toISOString(),
    });
    writeWabDB(db);
    return NextResponse.json({ views: story.views, counted: true });
  }

  return NextResponse.json({ views: 1, counted: true });
}
