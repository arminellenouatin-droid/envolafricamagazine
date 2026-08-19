import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { optimizeImageBuffer } from "@/lib/server-media-optimizer";

export const dynamic = "force-dynamic";

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string[]> = {
  cover: ["image/jpeg", "image/png", "image/webp"],
  preview: ["image/jpeg", "image/png", "image/webp"],
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

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const optimized = await optimizeImageBuffer(originalBuffer, file.name, file.type);
    const fileName = `${Date.now()}_${safeFileName(file.name).replace(/\.[^.]+$/, "")}.${optimized.extension}`;
    const storagePath = `${type}/${lang ? `${entityId}_${lang}` : entityId}/${fileName}`;
    const supabase = getSupabaseAdmin();

    if (supabase) {
      const { error: uploadError } = await supabase.storage.from("article-media").upload(storagePath, optimized.buffer, { contentType: optimized.contentType, upsert: false });
      if (uploadError) return NextResponse.json({ error: `Stockage image indisponible : ${uploadError.message}` }, { status: 503 });
      const { data } = supabase.storage.from("article-media").getPublicUrl(storagePath);
      return NextResponse.json({ success: true, url: data.publicUrl, fileName, type, lang, size: optimized.finalSize, originalSize: optimized.originalSize, optimized: optimized.optimized, mimeType: optimized.contentType, storage: "supabase" });
    }

    // Fallback uniquement hors production, pour le développement local.
    if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Stockage de production non configuré" }, { status: 503 });
    const uploadDir = path.join(process.cwd(), "public", "uploads", "magazines", type, lang ? `${entityId}_${lang}` : entityId);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), optimized.buffer);
    return NextResponse.json({ success: true, url: `/uploads/magazines/${type}/${lang ? `${entityId}_${lang}` : entityId}/${fileName}`, fileName, type, lang, size: optimized.finalSize, originalSize: optimized.originalSize, optimized: optimized.optimized, mimeType: optimized.contentType, storage: "local-dev" });
  } catch (error) {
    console.error("Upload error", error);
    return NextResponse.json({ error: `Erreur upload : ${error instanceof Error ? error.message : "erreur inconnue"}` }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Upload endpoint", maxSize: "50MB", storage: "Supabase Storage en production" });
}
