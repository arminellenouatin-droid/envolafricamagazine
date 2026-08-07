import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readDB, writeDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  const db = readDB();
  const user = db.users.find(u=>u.id===decoded.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const earnings = db.affiliateEarnings.filter(e=>e.affiliateId===user.id && e.status==="available");
  const total = earnings.reduce((s,e)=>s+e.commission,0);
  if (total < 150000) return NextResponse.json({ error: `Minimum 150 000 F CFA requis, vous avez ${total.toLocaleString()} F` }, { status: 400 });

  const { method, details } = await req.json(); // method: mtn_bj, orange_ci, wave, virement
  if (!method) return NextResponse.json({ error: "Méthode de retrait requise" }, { status: 400 });

  // Marquer comme paid (en attente de traitement manuel par gérant)
  earnings.forEach(e=> e.status = "paid" as any);
  if (!db.settings.withdrawRequests) db.settings.withdrawRequests = [];
  db.settings.withdrawRequests.push({
    id: Date.now().toString(),
    userId: user.id,
    amount: total,
    method,
    details,
    createdAt: new Date().toISOString(),
    status: "pending",
  });
  writeDB(db);
  return NextResponse.json({ success: true, amount: total, message: "Demande de retrait envoyée, traitement 24h" });
}
