import { NextRequest, NextResponse } from "next/server";
import { authenticateAgentRequest } from "@/lib/agent-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDB, writeDB, type Magazine } from "@/lib/db";
import { publishMagazineToWab } from "@/lib/magazine-republication";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticateAgentRequest(req, "magazines:read");
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const client = getSupabaseAdmin();
  if (client) {
    const { data, error } = await client
      .from("magazines")
      .select("*")
      .order("numero", { ascending: false });

    if (error) {
      console.error("[agent/magazines] Erreur lecture Supabase:", error);
      return NextResponse.json({ error: "Impossible de charger les magazines" }, { status: 500 });
    }
    return NextResponse.json({ success: true, count: data?.length || 0, magazines: data || [] });
  }

  const db = readDB();
  const sorted = [...(db.magazines || [])].sort((a, b) => b.numero - a.numero);
  return NextResponse.json({ success: true, count: sorted.length, magazines: sorted });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateAgentRequest(req, "magazines:write");
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await req.json();
    const {
      numero,
      title,
      description = "",
      cover = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600",
      year = new Date().getFullYear(),
      periode,
      category = "Economie",
      sommaire = [],
      prices = { numerique: 10000, papier: 16000, cd_audio: 5000 },
      formats = ["numerique", "papier"],
      languages = ["fr"],
      previewImages = [],
      pdfs = {},
      audios = {},
      featured = false,
      publishToWab = true,
    } = body;

    const num = parseInt(String(numero), 10);
    if (isNaN(num) || num <= 0) {
      return NextResponse.json({ error: "Le numéro de magazine (numero) doit être un entier positif." }, { status: 400 });
    }
    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json({ error: "Le titre de l'édition (title) est requis." }, { status: 400 });
    }

    const currentYear = Number(year) || new Date().getFullYear();
    const formattedPeriode = periode || new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const now = new Date().toISOString();
    const id = uuidv4();

    const newMag: Magazine = {
      id,
      numero: num,
      title: title.trim(),
      description: description.trim(),
      cover,
      date: now.split("T")[0],
      year: currentYear,
      periode: formattedPeriode,
      category,
      sommaire: Array.isArray(sommaire) ? sommaire.map(String) : [],
      prices,
      formats,
      languages,
      previewPages: previewImages.length > 0 ? previewImages.length : 7,
      previewImages,
      pdfs,
      audios,
      featured: Boolean(featured),
    };

    const client = getSupabaseAdmin();
    if (client) {
      // Vérification doublon de numéro
      const { data: existing } = await client
        .from("magazines")
        .select("id,numero")
        .eq("numero", num)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: `Le numéro ${num} existe déjà dans le catalogue du Kiosque.` }, { status: 409 });
      }

      const { data, error } = await client
        .from("magazines")
        .insert({
          id: newMag.id,
          numero: newMag.numero,
          title: newMag.title,
          description: newMag.description,
          cover: newMag.cover,
          date: newMag.date,
          year: newMag.year,
          periode: newMag.periode,
          category: newMag.category,
          sommaire: newMag.sommaire,
          prices: newMag.prices,
          formats: newMag.formats,
          languages: newMag.languages,
          preview_pages: newMag.previewPages,
          preview_images: newMag.previewImages,
          pdfs: newMag.pdfs,
          audios: newMag.audios,
          featured: newMag.featured,
        })
        .select("*")
        .single();

      if (error) {
        console.error("[agent/magazines] Erreur insertion Supabase:", error);
        return NextResponse.json({ error: "Échec de l'enregistrement du magazine en base" }, { status: 500 });
      }

      let wabResult = null;
      if (publishToWab) {
        try {
          wabResult = await publishMagazineToWab(newMag, auth.agentId || "admin");
        } catch (e) {
          console.warn("[agent/magazines] Notification WAB non effectuée:", e);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Magazine N°${num} monté et publié avec succès dans le Kiosque !`,
        magazine: data,
        wabPublished: Boolean(wabResult?.published),
      }, { status: 201 });
    }

    // Fallback DB locale
    const db = readDB();
    if (db.magazines.some((m) => m.numero === num)) {
      return NextResponse.json({ error: `Le numéro ${num} existe déjà dans le catalogue.` }, { status: 409 });
    }
    db.magazines.unshift(newMag);
    writeDB(db);

    return NextResponse.json({
      success: true,
      message: `Magazine N°${num} monté et publié avec succès dans le Kiosque !`,
      magazine: newMag,
    }, { status: 201 });
  } catch (err: any) {
    console.error("[agent/magazines] Erreur interne:", err);
    return NextResponse.json({ error: "Erreur interne lors de la création du magazine" }, { status: 500 });
  }
}
