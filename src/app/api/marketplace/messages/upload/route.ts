import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getR2Client } from "@/lib/storage/client";
import { getR2Config, isR2Configured } from "@/lib/storage/config";
import { publicUrl } from "@/lib/storage/resolve-url";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  // Vidéos
  "video/mp4",
  "video/webm",
  "video/quicktime",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/csv",
];

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .slice(-100);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (maximum 25 Mo)." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format de fichier non autorisé. Formats acceptés : Images, Vidéos, PDF, Word, Excel, ZIP." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = uuidv4();
    const ext = path.extname(file.name) || "";
    const cleanBaseName = sanitizeFileName(path.basename(file.name, ext));
    const fileName = `${Date.now()}_${cleanBaseName}${ext}`;
    const storagePath = `messages/${user.id}/${fileName}`;

    let fileUrl = "";

    if (isR2Configured()) {
      const r2 = getR2Client();
      const config = getR2Config();
      const r2Key = `${config.R2_KEY_PREFIX}marketplace/${storagePath}`;
      await r2.send(
        new PutObjectCommand({
          Bucket: config.R2_BUCKET_PUBLIC,
          Key: r2Key,
          Body: buffer,
          ContentType: file.type,
          CacheControl: "public, max-age=31536000, immutable",
        })
      );
      fileUrl = publicUrl(r2Key);
    }

    if (!fileUrl) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        let uploadRes = await supabase.storage.from("marketplace").upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

        if (uploadRes.error) {
          uploadRes = await supabase.storage.from("article-media").upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false,
          });
        }

        if (!uploadRes.error) {
          const { data } = supabase.storage.from("marketplace").getPublicUrl(storagePath);
          fileUrl = data.publicUrl;
        }
      }
    }

    // Fallback local pour développement ou si storage indisponible
    if (!fileUrl) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Service de stockage indisponible." }, { status: 503 });
      }
      const uploadDir = path.join(process.cwd(), "public", "uploads", "marketplace", "messages");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), buffer);
      fileUrl = `/uploads/marketplace/messages/${fileName}`;
    }

    return NextResponse.json({
      success: true,
      attachment: {
        id: fileId,
        url: fileUrl,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        moderationStatus: "approved",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de l'upload." },
      { status: 500 }
    );
  }
}
