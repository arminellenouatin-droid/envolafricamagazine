import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { writeDB } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { publishMagazineToWab } from "@/lib/magazine-republication";
import { notifyPushSubscribers } from "@/lib/ecosystem-inbox";

export async function GET() {
  const { db, error, status } = await getCurrentUserForAdmin('redacteur');
  if (error) return NextResponse.json({ error }, { status });
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
    if (db!.magazines.some(m=>m.numero===parseInt(numero))) return NextResponse.json({ error: "Numéro déjà existant" }, { status: 409 });
    
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
    db!.magazines.push(newMag as any);
    writeDB(db!);
    const republication = await publishMagazineToWab(newMag as any, user?.id || "");
    const notifications = await notifyPushSubscribers({ platform: "magazine", type: "new_magazine", title: "Nouveau magazine Envol Africa", body: newMag.title, link: `/kiosque`, entityType: "magazine", entityId: newMag.id, dedupePrefix: `magazine:${newMag.id}` });
    return NextResponse.json({ success: true, magazine: newMag, republication, notifications });
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
    const mag = db!.magazines.find(m=>m.id===id);
    if (!mag) return NextResponse.json({ error: "Magazine introuvable" }, { status: 404 });
    // Mise à jour tous les champs y compris nouveaux
    Object.assign(mag, updates);
    if (updates.previewImages) {
      (mag as any).previewPages = updates.previewImages.length;
    }
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
