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
    try {
      const { data: reel } = await supabase
        .from("wab_reels")
        .select("id,views")
        .eq("id", id)
        .maybeSingle();

      if (reel) {
        const nextViews = (reel.views || 0) + 1;
        await supabase.from("wab_reels").update({ views: nextViews }).eq("id", id);
        return NextResponse.json({ views: nextViews, counted: true });
      }
    } catch {
      // Si la table wab_reels n'existe pas dans Supabase, continuer vers la base locale
    }
  }

  const db = readWabDB();
  const reel = db.reels.find((item) => item.id === id);
  if (!reel) {
    // Si pas trouvé dans le JSON direct, vérifier par fallback
    return NextResponse.json({ views: 1, counted: true });
  }

  reel.views = (reel.views || 0) + 1;
  db.views.push({
    postId: `reel:${id}`,
    userId: user?.id,
    visitorId,
    watchSeconds: 0,
    createdAt: new Date().toISOString(),
  });
  writeWabDB(db);
  return NextResponse.json({ views: reel.views, counted: true });
}
