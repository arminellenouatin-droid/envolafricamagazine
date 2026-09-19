import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { readWabDB } from "@/lib/wab-db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type Media = { path: string; mimeType: string; name: string; size?: number };

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("postId");
  const index = Number(request.nextUrl.searchParams.get("index") ?? "0");
  if (!postId || !Number.isInteger(index) || index < 0) return NextResponse.json({ error: "Média invalide." }, { status: 400 });

  let media: Media | undefined;
  const localPost = readWabDB().posts.find((item) => item.id === postId && item.moderationStatus === "published");
  media = localPost?.media?.[index];

  if (!media) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data } = await supabase.from("wab_posts").select("media, moderation_status").eq("id", postId).eq("moderation_status", "published").maybeSingle();
      const storedMedia = Array.isArray(data?.media) ? data.media as Media[] : [];
      media = storedMedia[index];
    }
  }

  if (!media) return NextResponse.json({ error: "Média indisponible." }, { status: 404 });

  let mediaPath = media.path || "";
  // Normalisation des couvertures de magazines ou chemins locaux
  if (mediaPath.includes("/covers/")) {
    const match = mediaPath.match(/\/covers\/[^?#\s]+/);
    if (match) mediaPath = match[0];
  }
  if (mediaPath.startsWith("/")) {
    return NextResponse.json({ url: mediaPath, mimeType: media.mimeType || "application/octet-stream", name: media.name });
  }
  if (/^https?:\/\//i.test(mediaPath)) {
    return NextResponse.json({ url: mediaPath, mimeType: media.mimeType || "application/octet-stream", name: media.name });
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return NextResponse.json({ error: "Stockage indisponible." }, { status: 503 });
  const storage = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await storage.storage.from("wab-media").createSignedUrl(mediaPath, 3600);
  if (error || !data?.signedUrl) {
    const publicUrl = storage.storage.from("wab-media").getPublicUrl(mediaPath).data.publicUrl;
    return NextResponse.json({ url: publicUrl, mimeType: media.mimeType, name: media.name });
  }
  return NextResponse.json({ url: data.signedUrl, mimeType: media.mimeType, name: media.name });
}
