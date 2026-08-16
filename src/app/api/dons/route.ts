import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDB } from "@/lib/db";

const PRIVILEGED_ROLES = new Set(["admin", "gerant", "redacteur_chef"]);

export async function GET(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  const requestedUserId = req.nextUrl.searchParams.get("userId");
  const targetUserId = PRIVILEGED_ROLES.has(user.role) && requestedUserId ? requestedUserId : user.id;
  const canListAll = PRIVILEGED_ROLES.has(user.role) && !requestedUserId;

  const client = getSupabaseAdmin();
  if (!client) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Base de données temporairement indisponible" }, { status: 503 });
    }
    const db = readDB();
    const donations = db.donations
      .filter((donation) => canListAll || donation.userId === targetUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100);
    return NextResponse.json({ donations });
  }

  let query = client
    .from("donations")
    .select("id, user_id, amount, currency, email, status, payment_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!canListAll) query = query.eq("user_id", targetUserId);
  else if (requestedUserId) query = query.eq("user_id", targetUserId);

  const { data, error } = await query;
  if (error) {
    console.error("Donations lookup failed", error);
    return NextResponse.json({ error: "Impossible de charger les dons" }, { status: 500 });
  }

  const donations = (data ?? []).map((donation) => ({
    id: String(donation.id),
    userId: donation.user_id ? String(donation.user_id) : undefined,
    amount: Number(donation.amount),
    currency: String(donation.currency ?? "XOF"),
    email: donation.email ? String(donation.email) : undefined,
    status: String(donation.status),
    paymentId: donation.payment_id ? String(donation.payment_id) : undefined,
    createdAt: String(donation.created_at),
  }));

  return NextResponse.json({ donations });
}
