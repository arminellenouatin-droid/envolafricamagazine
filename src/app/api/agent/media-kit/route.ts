import { NextRequest, NextResponse } from "next/server";
import { authenticateAgentRequest } from "@/lib/agent-auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.cwd(), "src", "data", "advertising.json");

function getAdvertisingData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch {}
  return {
    formats: [
      { id: "cover-4", category: "magazine", name: "4ème de couverture (Dos)", dimension: "210 x 297 mm", description: "Emplacement premium absolu, pleine page au dos du magazine papier et numérique.", priceXof: 850000, priceEur: 1300, featured: true },
      { id: "page-int", category: "magazine", name: "Pleine Page Intérieure", dimension: "210 x 297 mm", description: "Insertion d'une page complète au cœur des grands dossiers économiques.", priceXof: 500000, priceEur: 760 },
      { id: "demi-page", category: "magazine", name: "Demi-page Horizontale", dimension: "180 x 130 mm", description: "Bannière demi-page haute visibilité en bas de page éditoriale.", priceXof: 300000, priceEur: 460 },
      { id: "banner-web", category: "web", name: "Bannière Leaderboard Web", dimension: "728 x 90 px", description: "Affichage permanent en en-tête des articles les plus lus du site.", priceXof: 250000, priceEur: 380, featured: true },
      { id: "sponsor-article", category: "web", name: "Article Sponsorisé / Brand Voice", dimension: "Texte + Photos", description: "Rédaction et diffusion d'un publi-reportage dédié à votre entreprise.", priceXof: 400000, priceEur: 610 },
    ],
    kitMediaUrl: "/kit-media-envol-africa-2026.pdf",
    contactEmail: "regie@envolafrica.site",
    contactPhone: "+229 01 00 00 00",
    audienceSummary: {
      monthlyReaders: 45000,
      countriesSpread: 18,
      printRun: 10000,
      targetAudience: "Dirigeants, Investisseurs, Cadres supérieurs, Entrepreneures",
    },
    updatedAt: new Date().toISOString(),
  };
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

export async function GET(req: NextRequest) {
  const auth = await authenticateAgentRequest(req, "media_kit:read");
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const data = getAdvertisingData();
  return NextResponse.json({ success: true, mediaKit: data });
}

export async function PATCH(req: NextRequest) {
  const auth = await authenticateAgentRequest(req, "media_kit:write");
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await req.json();
    const current = getAdvertisingData();

    const updated = {
      ...current,
      formats: Array.isArray(body.formats) ? body.formats : current.formats,
      kitMediaUrl: typeof body.kitMediaUrl === "string" ? body.kitMediaUrl.trim() : current.kitMediaUrl,
      contactEmail: typeof body.contactEmail === "string" ? body.contactEmail.trim() : current.contactEmail,
      contactPhone: typeof body.contactPhone === "string" ? body.contactPhone.trim() : current.contactPhone,
      audienceSummary: body.audienceSummary && typeof body.audienceSummary === "object"
        ? { ...current.audienceSummary, ...body.audienceSummary }
        : current.audienceSummary,
      updatedAt: new Date().toISOString(),
      lastUpdatedBy: auth.agentName || "Agent IA",
    };

    const saved = saveAdvertisingData(updated);
    if (!saved) {
      return NextResponse.json({ error: "Échec de l'enregistrement du Kit Média" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Kit Média et tarifs publicitaires mis à jour avec succès !",
      mediaKit: updated,
    });
  } catch (err: any) {
    console.error("[agent/media-kit] Erreur mise à jour:", err);
    return NextResponse.json({ error: "Erreur lors de la mise à jour du Kit Média" }, { status: 500 });
  }
}
