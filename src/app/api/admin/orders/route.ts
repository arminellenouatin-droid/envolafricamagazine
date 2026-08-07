import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { writeDB } from "@/lib/db";

export async function GET() {
  const { db, error, status } = await getCurrentUserForAdmin('gerant');
  if (error) return NextResponse.json({ error }, { status });
  return NextResponse.json({ orders: db!.orders.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
}

export async function PUT(req: NextRequest) {
  const { db, error, status } = await getCurrentUserForAdmin('gerant');
  if (error) return NextResponse.json({ error }, { status });
  try {
    const { id, status: newStatus } = await req.json();
    if (!id || !newStatus) return NextResponse.json({ error: "ID et status requis" }, { status: 400 });
    const order = db!.orders.find(o=>o.id===id);
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    const allowed = ['pending','paid','failed','shipped'];
    if (!allowed.includes(newStatus)) return NextResponse.json({ error: "Status invalide" }, { status: 400 });
    order.status = newStatus as any;
    if (newStatus==='paid') order.paidAt = new Date().toISOString();
    writeDB(db!);
    return NextResponse.json({ success: true, order });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
