import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDB } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  const client = getSupabaseAdmin();
  if (!client) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Base de données temporairement indisponible" }, { status: 503 });
    }
    const earnings = readDB().affiliateEarnings
      .filter((earning) => earning.affiliateId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ earnings });
  }

  const { data, error } = await client
    .from("affiliate_earnings")
    .select("id, affiliate_id, order_id, amount, commission, rate, status, created_at")
    .eq("affiliate_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Affiliate earnings lookup failed", error);
    return NextResponse.json({ error: "Impossible de charger les gains" }, { status: 500 });
  }

  const earnings = (data ?? []).map((earning) => ({
    id: String(earning.id),
    affiliateId: String(earning.affiliate_id),
    orderId: String(earning.order_id),
    amount: Number(earning.amount),
    commission: Number(earning.commission),
    rate: Number(earning.rate),
    status: String(earning.status),
    createdAt: String(earning.created_at),
  }));

  return NextResponse.json({ earnings });
}

export async function POST(req: NextRequest) {
  // Le suivi d’un clic est public par conception, mais aucune donnée de gain
  // ou d’identité ne doit être renvoyée à partir de cette route.
  try {
    const { code } = await req.json();
    if (typeof code !== "string" || code.trim().length < 3 || code.trim().length > 80) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
