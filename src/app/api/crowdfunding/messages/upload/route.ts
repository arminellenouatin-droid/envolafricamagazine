import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_MIME_TYPES = new Set([
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",
  // Audio
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/aac",
]);

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 Mo

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise pour envoyer un fichier." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const clientType = (formData.get("type") as string) || "document";
    const duration = formData.get("duration") ? Number(formData.get("duration")) : undefined;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Le fichier dépasse la taille maximale autorisée (50 Mo)." }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType) && !mimeType.startsWith("image/") && !mimeType.startsWith("audio/")) {
      return NextResponse.json({ error: "Format de fichier non autorisé pour les échanges investisseurs." }, { status: 400 });
    }

    // Déterminer le type média
    let detectedType: "document" | "image" | "video" | "voice" = "document";
    if (clientType === "voice" || mimeType.startsWith("audio/")) {
      detectedType = "voice";
    } else if (mimeType.startsWith("image/")) {
      detectedType = "image";
    } else if (mimeType.startsWith("video/")) {
      detectedType = "video";
    }

    // Répertoire de destination
    const uploadDir = path.join(process.cwd(), "public", "uploads", "crowdfunding");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Nom de fichier sécurisé avec UUID
    const origName = file.name || "fichier";
    const ext = path.extname(origName) || (detectedType === "voice" ? ".webm" : "");
    const safeName = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadDir, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/crowdfunding/${safeName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: origName,
      size: file.size,
      type: detectedType,
      mimeType,
      duration,
    });
  } catch (error) {
    console.error("Error in crowdfunding upload:", error);
    return NextResponse.json({ error: "Erreur lors du téléversement du fichier." }, { status: 500 });
  }
}
