import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { optimizeImageBuffer } from "@/lib/server-media-optimizer";
import { getR2Client } from "@/lib/storage/client";
import { getR2Config, isR2Configured } from "@/lib/storage/config";
import { publicUrl } from "@/lib/storage/resolve-url";

export const dynamic = "force-dynamic";

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string[]> = {
  cover: ["image/jpeg", "image/png", "image/webp"],
  preview: ["image/jpeg", "image/png", "image/webp"],
  "article-inline": ["image/jpeg", "image/png", "image/webp"],
  pdf: ["application/pdf"],
  audio: ["audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/webm"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  general: ["image/jpeg", "image/png", "image/webp", "application/pdf", "audio/mpeg", "audio/wav", "audio/mp3", "video/mp4", "video/webm"],
};

function safeFileName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.-]/g, "_").slice(-120);
}

export async function POST(req: NextRequest) {
  const auth = await getCurrentUserForAdmin("redacteur_chef");
  if ((auth as any).error) return NextResponse.json({ error: (auth as any).error }, { status: (auth as any).status || 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = String(formData.get("type") || "general");
    const entityId = String(formData.get("magazineId") || "article");
    const lang = String(formData.get("lang") || "");
    if (!file) return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Fichier trop volumineux (max 50MB)" }, { status: 400 });

    const allowed = ALLOWED_TYPES[type] || ALLOWED_TYPES.general;
    if (!allowed.includes(file.type) && !(type === "cover" || type === "preview") || ((type === "cover" || type === "preview") && !file.type.startsWith("image/"))) {
      return NextResponse.json({ error: `Type non autorisé pour ${type}: ${file.type}` }, { status: 400 });
    }

    const isPrivate = type === "pdf" || type === "private-pdf";
    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const optimized = await optimizeImageBuffer(originalBuffer, file.name, file.type);
    const fileName = `${Date.now()}_${safeFileName(file.name).replace(/\.[^.]+$/, "")}.${optimized.extension}`;
    const storagePath = `${type}/${lang ? `${entityId}_${lang}` : entityId}/${fileName}`;

    if (isR2Configured()) {
      const r2 = getR2Client();
      const config = getR2Config();
      const bucket = isPrivate ? config.R2_BUCKET_PRIVATE : config.R2_BUCKET_PUBLIC;
      const r2Key = isPrivate
        ? `${config.R2_KEY_PREFIX}magazines/${storagePath}`
        : `${config.R2_KEY_PREFIX}articles/${storagePath}`;
      const cacheControl = isPrivate ? "private, no-cache, no-store" : "public, max-age=31536000, immutable";

      await r2.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: r2Key,
          Body: optimized.buffer,
          ContentType: optimized.contentType,
          CacheControl: cacheControl,
        })
      );
      return NextResponse.json({
        success: true,
        url: isPrivate ? `private-pdf://${bucket}/${r2Key}` : publicUrl(r2Key),
        key: r2Key,
        bucket,
        isPrivate,
        fileName,
        type,
        lang,
        size: optimized.finalSize,
        originalSize: optimized.originalSize,
        optimized: optimized.optimized,
        mimeType: optimized.contentType,
        storage: "r2",
      });
    }

    const supabase = getSupabaseAdmin();

    if (supabase) {
      const bucket = isPrivate ? "magazine-pdfs-private" : "article-media";
      const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, optimized.buffer, { contentType: optimized.contentType, upsert: false });
      if (uploadError) return NextResponse.json({ error: `Stockage média indisponible : ${uploadError.message}` }, { status: 503 });
      const publicUrlResult = isPrivate ? `private-pdf://${bucket}/${storagePath}` : supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
      return NextResponse.json({
        success: true,
        url: publicUrlResult,
        key: storagePath,
        bucket,
        isPrivate,
        fileName,
        type,
        lang,
        size: optimized.finalSize,
        originalSize: optimized.originalSize,
        optimized: optimized.optimized,
        mimeType: optimized.contentType,
        storage: "supabase",
      });
    }

    // Fallback uniquement hors production, pour le développement local.
    if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Stockage de production non configuré" }, { status: 503 });
    const uploadDir = path.join(process.cwd(), "public", "uploads", "magazines", type, lang ? `${entityId}_${lang}` : entityId);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), optimized.buffer);
    return NextResponse.json({
      success: true,
      url: `/uploads/magazines/${type}/${lang ? `${entityId}_${lang}` : entityId}/${fileName}`,
      fileName,
      type,
      lang,
      size: optimized.finalSize,
      originalSize: optimized.originalSize,
      optimized: optimized.optimized,
      mimeType: optimized.contentType,
      storage: "local-dev",
    });
  } catch (error) {
    console.error("Upload error", error);
    return NextResponse.json({ error: `Erreur upload : ${error instanceof Error ? error.message : "erreur inconnue"}` }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Upload endpoint", maxSize: "50MB", storage: "Supabase Storage / Cloudflare R2 en production" });
}
