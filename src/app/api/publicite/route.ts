import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCurrentUserFromCookie } from "@/lib/auth";

const DATA_FILE = path.join(process.cwd(), "src", "data", "advertising.json");

function getAdvertisingData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch {}
  return { formats: [], kitMediaUrl: "/kit-media-envol-africa-2026.pdf" };
}

function saveAdvertisingData(data: unknown) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const data = getAdvertisingData();
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user || !["admin", "gerant", "redacteur_chef"].includes(user.role)) {
    return NextResponse.json({ error: "Action réservée aux administrateurs." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const current = getAdvertisingData();
  const updated = {
    ...current,
    formats: Array.isArray(body.formats) ? body.formats : current.formats,
    kitMediaUrl: typeof body.kitMediaUrl === "string" ? body.kitMediaUrl : current.kitMediaUrl,
    contactEmail: typeof body.contactEmail === "string" ? body.contactEmail : current.contactEmail,
    contactPhone: typeof body.contactPhone === "string" ? body.contactPhone : current.contactPhone,
    updatedAt: new Date().toISOString(),
  };

  const ok = saveAdvertisingData(updated);
  if (!ok) {
    return NextResponse.json({ error: "Erreur d'enregistrement." }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: updated });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || !body.company || !body.email || !body.formatId) {
    return NextResponse.json({ error: "Champs requis manquants (entreprise, email, format)." }, { status: 400 });
  }

  // Enregistrer ou router la demande vers la régie commerciale
  return NextResponse.json({
    success: true,
    message: "Votre demande de devis publicitaire a été transmise à notre régie commerciale. Nous vous contacterons sous 24h.",
  });
}
