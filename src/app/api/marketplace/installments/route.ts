import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { payMarketplaceInstallmentWithWallet } from "@/lib/marketplace/marketplace-escrow-service";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const orderId = request.nextUrl.searchParams.get("orderId");
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  let query = supabase
    .from("marketplace_installments")
    .select("id, order_id, sequence_no, due_at, principal_xof, penalty_xof, paid_at, status, marketplace_orders(id, buyer_id, product_id, marketplace_products(title))")
    .order("sequence_no", { ascending: true });

  if (orderId) {
    query = query.eq("order_id", orderId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Impossible de charger les mensualités." }, { status: 502 });

  // Filtrer pour s'assurer que l'utilisateur est bien l'acheteur
  const userInstallments = (data || []).filter(
    (inst: any) => inst.marketplace_orders?.buyer_id === user.id
  );

  return NextResponse.json({ installments: userInstallments });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    installmentId?: string;
    use_wallet?: boolean;
  } | null;

  if (!body?.installmentId) {
    return NextResponse.json({ error: "Identifiant de mensualité requis." }, { status: 400 });
  }

  try {
    const result = await payMarketplaceInstallmentWithWallet({
      installmentId: body.installmentId,
      buyerUserId: user.id,
    });

    return NextResponse.json({
      message: "Mensualité réglée avec succès via votre Portefeuille Central Envol Africa.",
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Échec du règlement de la mensualité." },
      { status: 400 }
    );
  }
}
