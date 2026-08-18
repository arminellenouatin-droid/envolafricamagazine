import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createGlobalNotification } from "@/lib/ecosystem-inbox";
import { readCrowdDB, writeCrowdDB } from "@/lib/crowdfunding-db";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const projetId = searchParams.get("projetId");
  const db = readCrowdDB();
  let messages = db.messages.filter((message) => message.fromId === user.id || message.toId === user.id);
  if (projetId) messages = messages.filter(m=>m.projetId===projetId);
  messages = messages.sort((a,b)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    const body = await req.json();
    const { projetId, toId, toNom, content } = body;
    if (!projetId || !toId || !content) {
      return NextResponse.json({ error: "projetId, toId, content requis" }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: message, error } = await supabase.from("ecosystem_messages").insert({ platform: "crowdfunding", thread_id: String(projetId), sender_id: user.id, recipient_id: String(toId), body: String(content).trim(), href: `/financement/projets/${projetId}`, metadata: { recipientName: toNom || String(toId) } }).select("id,platform,thread_id,sender_id,recipient_id,body,href,read_at,created_at").single();
      if (error || !message) return NextResponse.json({ error: "Impossible d’envoyer le message." }, { status: 502 });
      await createGlobalNotification({ userId: String(toId), platform: "crowdfunding", type: "message", title: "Nouveau message Crowdfunding", body: String(content).trim(), link: `/financement/projets/${projetId}`, entityType: "crowdfunding_message", entityId: message.id });
      return NextResponse.json({ success: true, message }, { status: 201 });
    }
    const db = readCrowdDB();
    const newMsg = {
      id: uuidv4(),
      projetId,
      fromId: user.id,
      fromNom: user.prenom || user.nom || user.email || user.id,
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
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
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
