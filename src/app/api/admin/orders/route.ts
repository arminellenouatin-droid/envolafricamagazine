import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { writeDB } from "@/lib/db";
import { listOrders } from "@/lib/core-db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { db, error, status } = await getCurrentUserForAdmin('gerant');
  if (error) return NextResponse.json({ error }, { status });
  try {
    const orders = await listOrders();
    return NextResponse.json({ orders });
  } catch (e) {
    if (db?.orders) {
      return NextResponse.json({ orders: db.orders.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
    }
    console.error("Admin orders GET failed:", e);
    return NextResponse.json({ error: "Impossible de récupérer les commandes" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { db, error, status } = await getCurrentUserForAdmin('gerant');
  if (error) return NextResponse.json({ error }, { status });
  try {
    const { id, status: newStatus } = await req.json();
    if (!id || !newStatus) return NextResponse.json({ error: "ID et status requis" }, { status: 400 });
    const allowed = ['pending', 'paid', 'failed', 'shipped'];
    if (!allowed.includes(newStatus)) return NextResponse.json({ error: "Status invalide" }, { status: 400 });

    const client = getSupabaseAdmin();
    const paidAt = newStatus === 'paid' ? new Date().toISOString() : undefined;

    if (client) {
      const updatePayload: Record<string, unknown> = { status: newStatus };
      if (paidAt) updatePayload.paid_at = paidAt;
      const { data, error: updateError } = await client
        .from("orders")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (updateError) {
        console.error("Supabase order update failed:", updateError);
        return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
      }
      if (!data) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      return NextResponse.json({ success: true, order: data });
    }

    if (db?.orders) {
      const order = db.orders.find(o => o.id === id);
      if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      order.status = newStatus as any;
      if (paidAt) order.paidAt = paidAt;
      writeDB(db);
      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
