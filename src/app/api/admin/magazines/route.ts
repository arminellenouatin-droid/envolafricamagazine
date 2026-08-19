import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { writeDB } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { publishMagazineToWab } from "@/lib/magazine-republication";
import { notifyPushSubscribers } from "@/lib/ecosystem-inbox";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function mapMagazine(row: any) {
  return { ...row, previewPages: Number(row.preview_pages ?? 5), previewImages: row.preview_images || [], pdfs: row.pdfs || {}, audios: row.audios || {}, prices: row.prices || {}, sommaire: row.sommaire || [], priceOverrides: row.price_overrides || {}, isPublished: row.is_published ?? true };
}

export async function GET() {
  const { db, error, status } = await getCurrentUserForAdmin('redacteur');
  if (error) return NextResponse.json({ error }, { status });
  const client = getSupabaseAdmin();
  if (client) {
    const result = await client.from("magazines").select("*").order("numero", { ascending: false });
    if (result.error) return NextResponse.json({ error: `Impossible de charger les magazines : ${result.error.message}` }, { status: 503 });
    return NextResponse.json({ magazines: (result.data || []).map(mapMagazine) });
  }
  return NextResponse.json({ magazines: db!.magazines.sort((a,b)=>b.numero-a.numero) });
}

export async function POST(req: NextRequest) {
  const { db, user, error, status } = await getCurrentUserForAdmin('redacteur_chef');
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await req.json();
    const { 
      numero, title, cover, year, periode, category, description, featured, 
      formats, languages, previewImages, pdfs, audios, prices, sommaire 
    } = body;
    
    if (!numero || !title) return NextResponse.json({ error: "Numéro et titre requis" }, { status: 400 });
    const client = getSupabaseAdmin();
    if (!client && db!.magazines.some(m=>m.numero===parseInt(numero))) return NextResponse.json({ error: "Numéro déjà existant" }, { status: 409 });
    
    const newMag = {
      id: uuidv4(),
      numero: parseInt(numero),
      title,
      cover: cover || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600",
      date: new Date().toISOString().split('T')[0],
      year: year || new Date().getFullYear(),
      periode: periode || `${new Date().toLocaleDateString('fr-FR',{month:'long', year:'numeric'})}`,
      category: category || "Economie",
      description: description || "",
      previewPages: previewImages?.length || 5,
      previewImages: previewImages || [],
      formats: formats || ["numerique","papier","cd_audio","audio_pdf","audio_papier"],
      languages: languages || ["fr","en","es"],
      featured: featured || false,
      pdfs: pdfs || {}, // { fr: "/uploads/...", en: "...", es: "..." }
      audios: audios || {}, // 12 langues
      prices: prices || {
        numerique: 10000,
        papier: 16000,
        cd_audio: 5000,
        audio_pdf: 12000,
        audio_papier: 18000
      },
      sommaire: sommaire || ["Dossier Spécial Fintech", "Interview : Patrice Motsepe", "Bourse : Le rallye de la BRVM", "Énergie : L'hydrogène vert"],
    };
    let persistedMagazine: any = newMag;
    if (client) {
      const result = await client.from("magazines").insert({ id: newMag.id, numero: newMag.numero, title: newMag.title, cover: newMag.cover, date: newMag.date, year: newMag.year, periode: newMag.periode, category: newMag.category, description: newMag.description, preview_pages: newMag.previewPages, preview_images: newMag.previewImages, formats: newMag.formats, languages: newMag.languages, featured: newMag.featured, pdfs: newMag.pdfs, audios: newMag.audios, prices: newMag.prices, sommaire: newMag.sommaire }).select("*").single();
      if (result.error) return NextResponse.json({ error: `Impossible d’enregistrer le magazine : ${result.error.message}` }, { status: 503 });
      persistedMagazine = mapMagazine(result.data);
    } else {
      db!.magazines.push(newMag as any);
      writeDB(db!);
    }
    const republication = await publishMagazineToWab(persistedMagazine as any, user?.id || "");
    const notifications = await notifyPushSubscribers({ platform: "magazine", type: "new_magazine", title: "Nouveau magazine Envol Africa", body: newMag.title, link: `/kiosque`, entityType: "magazine", entityId: newMag.id, dedupePrefix: `magazine:${newMag.id}` });
    return NextResponse.json({ success: true, magazine: persistedMagazine, republication, notifications });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur: " + (e as any).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { db, error, status } = await getCurrentUserForAdmin('redacteur_chef');
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const client = getSupabaseAdmin();
    if (client) {
      const patch: Record<string, unknown> = {};
      const fieldMap: Record<string, string> = { numero: "numero", title: "title", cover: "cover", date: "date", year: "year", periode: "periode", category: "category", description: "description", previewImages: "preview_images", pdfs: "pdfs", audios: "audios", prices: "prices", sommaire: "sommaire", formats: "formats", languages: "languages", featured: "featured" };
      for (const [key, column] of Object.entries(fieldMap)) if (Object.prototype.hasOwnProperty.call(updates, key)) patch[column] = updates[key];
      if (updates.previewImages) patch.preview_pages = Array.isArray(updates.previewImages) ? updates.previewImages.length : 0;
      const result = await client.from("magazines").update(patch).eq("id", id).select("*").single();
      if (result.error) return NextResponse.json({ error: `Impossible d’enregistrer le magazine : ${result.error.message}` }, { status: 503 });
      return NextResponse.json({ success: true, magazine: mapMagazine(result.data) });
    }
    const mag = db!.magazines.find(m=>m.id===id);
    if (!mag) return NextResponse.json({ error: "Magazine introuvable" }, { status: 404 });
    Object.assign(mag, updates);
    if (updates.previewImages) (mag as any).previewPages = updates.previewImages.length;
    writeDB(db!);
    return NextResponse.json({ success: true, magazine: mag });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { db, error, status } = await getCurrentUserForAdmin('gerant');
  if (error) return NextResponse.json({ error }, { status });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const client = getSupabaseAdmin();
    if (client) {
      const result = await client.from("magazines").delete().eq("id", id);
      if (result.error) return NextResponse.json({ error: `Impossible de supprimer le magazine : ${result.error.message}` }, { status: 503 });
      return NextResponse.json({ success: true });
    }
    const idx = db!.magazines.findIndex(m=>m.id===id);
    if (idx===-1) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    db!.magazines.splice(idx,1);
    writeDB(db!);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
