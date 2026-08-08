import { NextRequest, NextResponse } from "next/server";
import { readAwardsDB, writeAwardsDB } from "@/lib/awards-db";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readDB } from "@/lib/db";

async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const decoded = verifyToken(token);
    if (!decoded) return null;
    const db = readDB();
    return db.users.find(u=>u.id===decoded.id) || null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db = readAwardsDB();
  if (user.role==="admin") {
    return NextResponse.json({ requests: db.requests.sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) });
  } else {
    // Organisateur voit ses propres demandes
    const myRequests = db.requests.filter(r=>r.submitted_by===user.id);
    return NextResponse.json({ requests: myRequests });
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const body = await req.json();
  const { category, title, description, proposed_rules, proposed_calendar, proposed_rewards } = body;
  if (!title || !category) return NextResponse.json({ error: "Titre et catégorie requis" }, { status: 400 });
  const db = readAwardsDB();
  const newReq = {
    id: uuidv4(),
    organization_id: undefined,
    submitted_by: user.id,
    category,
    title,
    description: description||"",
    proposed_rules: proposed_rules||"",
    proposed_calendar: proposed_calendar||{},
    proposed_rewards: proposed_rewards||"",
    status: "submitted" as const,
    created_at: new Date().toISOString(),
  };
  db.requests.push(newReq);
  writeAwardsDB(db);
  return NextResponse.json({ success: true, request: newReq });
}

export async function PUT(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role!=="admin") {
    return NextResponse.json({ error: "Seul admin peut valider/refuser une demande" }, { status: 403 });
  }
  const body = await req.json();
  const { id, status, rejection_reason } = body;
  if (!id || !status) return NextResponse.json({ error: "ID et status requis" }, { status: 400 });
  if (!['under_review','validated','rejected'].includes(status)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  const db = readAwardsDB();
  const reqItem = db.requests.find(r=>r.id===id);
  if (!reqItem) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  reqItem.status = status as any;
  if (rejection_reason) reqItem.rejection_reason = rejection_reason;
  reqItem.reviewed_at = new Date().toISOString();
  writeAwardsDB(db);
  return NextResponse.json({ success: true, request: reqItem });
}
