import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { prisma, isPrismaConfigured } from "@/lib/prisma";

const RLS_SQL = [
  "ALTER TABLE IF EXISTS public.affiliates ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.commissions ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.withdrawals ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.ceremony_funds ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.network_size_funds ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.unallocated_funds ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.affiliate_product_wallets ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.product_affiliations ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.marketplace_commissions ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.marketplace_download_tokens ENABLE ROW LEVEL SECURITY;",

  "REVOKE ALL ON public.affiliates FROM anon, authenticated;",
  "REVOKE ALL ON public.commissions FROM anon, authenticated;",
  "REVOKE ALL ON public.withdrawals FROM anon, authenticated;",
  "REVOKE ALL ON public.ceremony_funds FROM anon, authenticated;",
  "REVOKE ALL ON public.network_size_funds FROM anon, authenticated;",
  "REVOKE ALL ON public.unallocated_funds FROM anon, authenticated;",
  "REVOKE ALL ON public.affiliate_product_wallets FROM anon, authenticated;",
  "REVOKE ALL ON public.product_affiliations FROM anon, authenticated;",
  "REVOKE ALL ON public.marketplace_commissions FROM anon, authenticated;",
  "REVOKE ALL ON public.marketplace_download_tokens FROM anon, authenticated;"
];

export async function POST(req: NextRequest) {
  const secretHeader = req.headers.get("x-admin-secret");
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const hasValidSecret = Boolean(secretHeader && serverKey && secretHeader === serverKey);

  if (!hasValidSecret) {
    const user = await getCurrentUserFromCookie();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }
  }

  if (!isPrismaConfigured()) {
    return NextResponse.json({ error: "Prisma DATABASE_URL non configuré" }, { status: 503 });
  }

  const results: Array<{ query: string; status: string; error?: string }> = [];

  for (const query of RLS_SQL) {
    try {
      await prisma.$executeRawUnsafe(query);
      results.push({ query, status: "success" });
    } catch (err: any) {
      results.push({ query, status: "error", error: err.message });
    }
  }

  return NextResponse.json({
    success: true,
    executedCount: results.filter((r) => r.status === "success").length,
    results,
  });
}
