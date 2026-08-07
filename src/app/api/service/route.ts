import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, email, service, message } = body;
    if (!nom || !email || !service || !message) return NextResponse.json({ error: "Champs requis" }, { status: 400 });
    const db = readDB();
    if (!db.settings.serviceRequests) db.settings.serviceRequests = [];
    db.settings.serviceRequests.push({
      id: Date.now().toString(),
      nom,
      email,
      service,
      message,
      createdAt: new Date().toISOString(),
      status: "new",
    });
    writeDB(db);
    // En prod, envoyer email via Resend/SendGrid + notif Slack
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  const db = readDB();
  const requests = db.settings.serviceRequests || [];
  return NextResponse.json({ requests: requests.sort((a:any,b:any)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
}
