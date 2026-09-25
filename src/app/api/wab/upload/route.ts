import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { optimizeImageBuffer } from "@/lib/server-media-optimizer";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const allowed = new Map<string, string>([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/gif", "gif"], ["image/avif", "avif"],
  ["video/mp4", "mp4"], ["video/webm", "webm"], ["video/quicktime", "mov"],
  ["audio/mpeg", "mp3"], ["audio/wav", "wav"], ["audio/ogg", "ogg"], ["audio/mp4", "m4a"], ["audio/webm", "weba"],
  ["application/pdf", "pdf"], ["application/msword", "doc"], ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/vnd.ms-excel", "xls"], ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
  ["application/vnd.ms-powerpoint", "ppt"], ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
  ["text/csv", "csv"],
]);

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const contentType = request.headers.get("content-type") || "";

  // 1. Actions JSON : Upload direct signé vers Supabase Storage (contourne la limite Vercel 4.5 Mo)
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null) as {
      action?: string;
      name?: string;
      type?: string;
      size?: number;
      path?: string;
      mimeType?: string;
    } | null;

    if (!body || !body.action) {
      return NextResponse.json({ error: "Action requise." }, { status: 400 });
    }

    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!key || !url) {
      return NextResponse.json({ error: "Le stockage WAB n’est pas configuré." }, { status: 503 });
    }

    const supabase = createClient(url, key, { auth: { persistSession: false } });

    if (body.action === "prepare") {
      const type = body.type || "application/octet-stream";
      let extension = allowed.get(type);
      if (!extension && body.name) {
        const ext = body.name.split(".").pop()?.toLowerCase();
        if (ext && Array.from(allowed.values()).includes(ext)) {
          extension = ext;
        }
      }
      if (!extension || (typeof body.size === "number" && body.size > MAX_FILE_SIZE)) {
        return NextResponse.json({ error: "Format non autorisé ou fichier supérieur à 50 Mo." }, { status: 400 });
      }

      const path = `${user.id}/pending/${crypto.randomUUID()}.${extension}`;
      const { data, error } = await supabase.storage.from("wab-media").createSignedUploadUrl(path);
      if (error || !data) {
        return NextResponse.json({ error: error?.message || "Impossible de préparer l'envoi direct." }, { status: 502 });
      }

      return NextResponse.json({
        uploadUrl: data.signedUrl,
        token: data.token,
        path: data.path || path,
      });
    }

    if (body.action === "confirm") {
      // Protection Anti-IDOR : l'utilisateur ne peut confirmer que ses propres fichiers
      if (typeof body.path !== "string" || !body.path.startsWith(`${user.id}/`)) {
        return NextResponse.json({ error: "Accès refusé au fichier spécifié." }, { status: 403 });
      }

      const { data: signed } = await supabase.storage.from("wab-media").createSignedUrl(body.path, 86400 * 365);
      return NextResponse.json({
        path: body.path,
        mimeType: body.mimeType || body.type || "application/octet-stream",
        name: body.name || "fichier",
        size: body.size || 0,
        originalSize: body.size || 0,
        optimized: false,
        mediaUrl: signed?.signedUrl,
        requiresReview: true,
      });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  }

  // 2. Téléversement standard FormData (fichiers < 3.5 Mo ou images)
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  const extension = allowed.get(file.type);
  if (!extension || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Format non autorisé ou fichier supérieur à 50 Mo." }, { status: 400 });
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return NextResponse.json({ error: "Le stockage WAB n’est pas encore configuré." }, { status: 503 });

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const optimized = await optimizeImageBuffer(originalBuffer, file.name, file.type);
  const path = `${user.id}/pending/${crypto.randomUUID()}.${optimized.extension}`;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.storage.from("wab-media").upload(path, optimized.buffer, { contentType: optimized.contentType, upsert: false });
  if (error) return NextResponse.json({ error: "Impossible de téléverser ce média." }, { status: 502 });
  const { data: signed } = await supabase.storage.from("wab-media").createSignedUrl(path, 86400 * 365);
  return NextResponse.json({
    path,
    mimeType: optimized.contentType,
    name: file.name,
    size: optimized.finalSize,
    originalSize: optimized.originalSize,
    optimized: optimized.optimized,
    mediaUrl: signed?.signedUrl,
    requiresReview: true
  }, { status: 201 });
}
