import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Vérif auth admin/redacteur_chef+
  const auth = await getCurrentUserForAdmin('redacteur_chef');
  if ((auth as any).error) {
    return NextResponse.json({ error: (auth as any).error }, { status: (auth as any).status || 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string || "general"; // cover, preview, pdf, audio
    const magazineId = formData.get("magazineId") as string || "temp";
    const lang = formData.get("lang") as string || "";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Validation taille et type
    const maxSize = 50 * 1024 * 1024; // 50MB max pour PDF/audio
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 50MB)" }, { status: 400 });
    }

    const allowedTypes: Record<string, string[]> = {
      cover: ["image/jpeg", "image/png", "image/webp"],
      preview: ["image/jpeg", "image/png", "image/webp"],
      pdf: ["application/pdf"],
      audio: ["audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/webm"],
      general: ["image/jpeg", "image/png", "image/webp", "application/pdf", "audio/mpeg", "audio/wav", "audio/mp3"]
    };

    const allowed = allowedTypes[type] || allowedTypes.general;
    if (!allowed.includes(file.type) && !file.type.startsWith("image/") && type !== "general") {
      // On autorise quand même images pour cover/preview même si type mime légèrement différent
      if (type === "cover" || type === "preview") {
        if (!file.type.startsWith("image/")) {
          return NextResponse.json({ error: `Type non autorisé pour ${type}: ${file.type}` }, { status: 400 });
        }
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Génère nom unique
    const ext = path.extname(file.name) || (file.type === "application/pdf" ? ".pdf" : file.type.startsWith("audio/") ? ".mp3" : ".jpg");
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${Date.now()}_${safeName}`;
    
    // Dossiers par type
    const uploadDir = path.join(process.cwd(), "public", "uploads", "magazines", type, lang ? `${magazineId}_${lang}` : magazineId);
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // URL publique
    const publicUrl = `/uploads/magazines/${type}/${lang ? `${magazineId}_${lang}` : magazineId}/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName,
      type,
      lang,
      size: file.size,
      mimeType: file.type
    });

  } catch (e) {
    console.error("Upload error", e);
    return NextResponse.json({ error: "Erreur upload: " + (e as any).message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Upload endpoint - POST multipart/form-data avec fields: file, type (cover|preview|pdf|audio), magazineId, lang",
    maxSize: "50MB",
    allowedTypes: {
      cover: "image/jpeg, png, webp",
      preview: "image - jusqu'à 10 images pour flipbook",
      pdf: "application/pdf - 3 langues FR/EN/ES",
      audio: "audio/mpeg, wav, mp3 - 12 langues"
    }
  });
}
