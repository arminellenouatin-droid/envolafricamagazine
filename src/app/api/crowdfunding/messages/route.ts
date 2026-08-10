import { NextRequest, NextResponse } from "next/server";
import { readCrowdDB, writeCrowdDB } from "@/lib/crowdfunding-db";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projetId = searchParams.get("projetId");
  const db = readCrowdDB();
  let messages = db.messages;
  if (projetId) messages = messages.filter(m=>m.projetId===projetId);
  messages = messages.sort((a,b)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projetId, fromId, fromNom, toId, toNom, content } = body;
    if (!projetId || !fromId || !toId || !content) {
      return NextResponse.json({ error: "projetId, fromId, toId, content requis" }, { status: 400 });
    }
    const db = readCrowdDB();
    const newMsg = {
      id: uuidv4(),
      projetId,
      fromId,
      fromNom: fromNom||fromId,
      toId,
      toNom: toNom||toId,
      content,
      createdAt: new Date().toISOString(),
      lu: false
    };
    db.messages.push(newMsg);
    writeCrowdDB(db);
    // En prod: envoyer notif temps réel via Supabase Realtime + email via Resend
    return NextResponse.json({ success: true, message: newMsg });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Marquer comme lu
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const db = readCrowdDB();
  const msg = db.messages.find(m=>m.id===id);
  if (!msg) return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  msg.lu = true;
  writeCrowdDB(db);
  return NextResponse.json({ success: true });
}
