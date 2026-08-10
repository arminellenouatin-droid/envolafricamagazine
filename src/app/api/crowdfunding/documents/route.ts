import { NextRequest, NextResponse } from "next/server";
import { readCrowdDB, writeCrowdDB } from "@/lib/crowdfunding-db";
import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projetId = searchParams.get("projetId");
  const db = readCrowdDB();
  let docs = db.documents;
  if (projetId) docs = docs.filter(d=>d.projetId===projetId);
  return NextResponse.json({ documents: docs });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projetId = formData.get("projetId") as string;
    const type = formData.get("type") as string || "autre";
    const userId = formData.get("userId") as string || "anon";

    if (!file || !projetId) {
      return NextResponse.json({ error: "Fichier et projetId requis" }, { status: 400 });
    }

    // Validation type MIME - documents: carte identité, enregistrement entreprise, photo, plan affaires, comptes financiers
    const allowedTypes = ["image/jpeg","image/png","image/webp","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    // On autorise tout pour MVP, mais on log

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || ".pdf";
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${Date.now()}_${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "crowdfunding", projetId, type);
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    const publicUrl = `/uploads/crowdfunding/${projetId}/${type}/${fileName}`;

    const db = readCrowdDB();
    const newDoc = {
      id: uuidv4(),
      projetId,
      userId,
      type: type as any,
      nom: file.name,
      url: publicUrl,
      taille: file.size,
      mimeType: file.type,
      createdAt: new Date().toISOString(),
      statut: "en_attente_verification" as const
    };
    db.documents.push(newDoc);
    writeCrowdDB(db);

    return NextResponse.json({ success: true, document: newDoc });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur upload document" }, { status: 500 });
  }
}
