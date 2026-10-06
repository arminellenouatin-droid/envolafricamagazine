import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { updateUserAvatar } from "@/lib/core-db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { optimizeImageBuffer } from "@/lib/server-media-optimizer";
import { getR2Client } from "@/lib/storage/client";
import { getR2Config, isR2Configured } from "@/lib/storage/config";
import { publicUrl, resolveFileUrl } from "@/lib/storage/resolve-url";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  try {
    const contentType = request.headers.get("content-type") || "";
    let avatarUrl = "";

    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null);
      const urlCandidate = body?.avatarUrl || body?.url || body?.key;
      if (!urlCandidate || typeof urlCandidate !== "string") {
        return NextResponse.json({ error: "URL ou clé d'avatar manquante" }, { status: 400 });
      }
      avatarUrl = resolveFileUrl(urlCandidate);
    } else {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "Aucune image fournie" }, { status: 400 });
      if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 });
      if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image trop volumineuse (5 Mo maximum)" }, { status: 400 });

      const optimized = await optimizeImageBuffer(Buffer.from(await file.arrayBuffer()), file.name, file.type);

      if (isR2Configured()) {
        const r2 = getR2Client();
        const config = getR2Config();
        const key = `${config.R2_KEY_PREFIX}profile/${user.id}/avatar-${Date.now()}.${optimized.extension}`;
        await r2.send(
          new PutObjectCommand({
            Bucket: config.R2_BUCKET_PUBLIC,
            Key: key,
            Body: optimized.buffer,
            ContentType: optimized.contentType,
            CacheControl: "public, max-age=31536000, immutable",
          })
        );
        avatarUrl = publicUrl(key);
      } else {
        const supabase = getSupabaseAdmin();
        if (!supabase) return NextResponse.json({ error: "Stockage de profil temporairement indisponible" }, { status: 503 });
        const bucket = "avatars";
        await supabase.storage.createBucket(bucket, { public: true }).catch(() => undefined);
        const filePath = `${user.id}/avatar-${Date.now()}.${optimized.extension}`;
        const upload = await supabase.storage.from(bucket).upload(filePath, optimized.buffer, { contentType: optimized.contentType, upsert: true });
        if (upload.error) throw upload.error;
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        avatarUrl = publicData.publicUrl;
      }
    }

    const updatedUser = await updateUserAvatar(user.id, avatarUrl);
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase
          .from("wab_profiles")
          .upsert(
            {
              user_id: user.id,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
      } catch {
        // ignore
      }
    }

    try {
      const { readWabDB, writeWabDB } = await import("@/lib/wab-db");
      const wdb = readWabDB();
      wdb.posts.forEach((post) => {
        if (post.authorUserId === user.id) {
          post.authorAvatarUrl = avatarUrl;
        }
      });
      const p = wdb.profiles.find((x) => x.userId === user.id);
      if (p) {
        (p as unknown as { avatarUrl?: string }).avatarUrl = avatarUrl;
      }
      writeWabDB(wdb);
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, avatar: updatedUser.avatar });
  } catch (error) {
    console.error("Avatar upload error", error);
    return NextResponse.json({ error: "Impossible d’enregistrer la photo" }, { status: 500 });
  }
}
