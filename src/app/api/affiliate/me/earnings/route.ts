import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });
  }

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, total_earnings, withdrawn_total")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!affiliate) {
    return NextResponse.json({ error: "Compte affilié non trouvé" }, { status: 404 });
  }

  // 1. Commissions Magazine MLM
  const { data: magazineCommissions } = await supabase
    .from("commissions")
    .select("*")
    .eq("beneficiary_id", affiliate.id)
    .order("created_at", { ascending: false })
    .limit(100);

  // 2. Commissions Marketplace
  const { data: userWallets } = await supabase
    .from("affiliate_product_wallets")
    .select("id")
    .eq("affiliate_id", affiliate.id);

  const walletIds = (userWallets || []).map((w) => w.id);
  let marketplaceCommissions: any[] = [];

  if (walletIds.length > 0) {
    const { data: mktComms } = await supabase
      .from("marketplace_commissions")
      .select("*")
      .in("wallet_id", walletIds)
      .order("created_at", { ascending: false })
      .limit(100);
    marketplaceCommissions = mktComms || [];
  }

  // 3. Historique des retraits
  const { data: withdrawals } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false });

  const totalEarnings = Number(affiliate.total_earnings || 0);
  const withdrawnTotal = Number(affiliate.withdrawn_total || 0);
  const availableBalance = Math.max(0, totalEarnings - withdrawnTotal);

  return NextResponse.json({
    summary: {
      totalEarnings,
      withdrawnTotal,
      availableBalance,
      magazineEarnings: (magazineCommissions || []).reduce(
        (sum, c) => sum + Number(c.amount_paid || 0),
        0
      ),
      marketplaceEarnings: marketplaceCommissions.reduce(
        (sum, c) => sum + Number(c.commission_net || 0),
        0
      ),
    },
    magazineCommissions: (magazineCommissions || []).map((c) => ({
      id: c.id,
      saleAmount: Number(c.sale_amount),
      commissionTotal: Number(c.commission_total),
      levelPaid: c.level_paid,
      amountPaid: Number(c.amount_paid),
      sourceSaleId: c.source_sale_id,
      sourceVolet: c.source_volet,
      createdAt: c.created_at,
    })),
    marketplaceCommissions: marketplaceCommissions.map((c) => ({
      id: c.id,
      saleAmount: Number(c.sale_amount),
      commissionGross: Number(c.commission_gross),
      platformFeeAmount: Number(c.platform_fee_amount),
      commissionNet: Number(c.commission_net),
      sourceSaleId: c.source_sale_id,
      createdAt: c.created_at,
    })),
    withdrawals: (withdrawals || []).map((w) => ({
      id: w.id,
      amount: Number(w.amount),
      provider: w.mobile_money_provider,
      number: w.mobile_money_number,
      status: w.status,
      createdAt: w.created_at,
      processedAt: w.processed_at,
    })),
  });
}
