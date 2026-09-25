import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCurrentUserFromCookie } from "@/lib/auth";

const PUBLIC_KIT_PATH = path.join(process.cwd(), "public", "kit-media-envol-africa.pdf");
const ADVERTISING_FILE = path.join(process.cwd(), "src", "data", "advertising.json");

export async function GET() {
  // Check if file exists in public/
  if (fs.existsSync(PUBLIC_KIT_PATH)) {
    const fileBuffer = fs.readFileSync(PUBLIC_KIT_PATH);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Kit-Media-Envol-Africa-Magazine.pdf"',
      },
    });
  }

  // Fallback to sample or redirect
  return NextResponse.redirect(new URL("/a-propos", process.env.NEXT_PUBLIC_BASE_URL || "https://www.envolafrica.site"));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user || !["admin", "gerant", "redacteur_chef"].includes(user.role)) {
    return NextResponse.json({ error: "Action réservée aux administrateurs." }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier PDF manquant." }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "Le fichier doit être au format PDF." }, { status: 400 });
  }

  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "Le fichier ne doit pas dépasser 25 Mo." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.mkdirSync(path.dirname(PUBLIC_KIT_PATH), { recursive: true });
  fs.writeFileSync(PUBLIC_KIT_PATH, buffer);

  // Update advertising.json timestamp
  try {
    if (fs.existsSync(ADVERTISING_FILE)) {
      const data = JSON.parse(fs.readFileSync(ADVERTISING_FILE, "utf-8"));
      data.kitMediaUrl = "/kit-media-envol-africa.pdf";
      data.kitMediaUpdatedAt = new Date().toISOString();
      fs.writeFileSync(ADVERTISING_FILE, JSON.stringify(data, null, 2), "utf-8");
    }
  } catch {}

  return NextResponse.json({
    success: true,
    url: "/kit-media-envol-africa.pdf",
    message: "Le Kit Média a été téléversé avec succès.",
  });
}
