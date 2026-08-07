import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { writeDB } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const { db, error, status } = await getCurrentUserForAdmin('redacteur');
  if (error) return NextResponse.json({ error }, { status });
  return NextResponse.json({ magazines: db!.magazines.sort((a,b)=>b.numero-a.numero) });
}

export async function POST(req: NextRequest) {
  const { db, error, status } = await getCurrentUserForAdmin('redacteur_chef');
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await req.json();
    const { numero, title, cover, year, description, featured, formats, languages } = body;
    if (!numero || !title) return NextResponse.json({ error: "Numéro et titre requis" }, { status: 400 });
    if (db!.magazines.some(m=>m.numero===numero)) return NextResponse.json({ error: "Numéro déjà existant" }, { status: 409 });
    const newMag = {
      id: uuidv4(),
      numero: parseInt(numero),
      title,
      cover: cover || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600",
      date: new Date().toISOString().split('T')[0],
      year: year || new Date().getFullYear(),
      description: description || "",
      previewPages: 5,
      formats: formats || ["numerique","papier","cd_audio","audio_pdf","audio_papier"],
      languages: languages || ["fr","en","es"],
      featured: featured || false,
    };
    db!.magazines.push(newMag as any);
    writeDB(db!);
    return NextResponse.json({ success: true, magazine: newMag });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
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
    Object.assign(mag, updates);
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
