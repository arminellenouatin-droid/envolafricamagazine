import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { initMonerooPayment } from "@/lib/moneroo";

const MODES = new Set(["don", "prise_part", "pret"]);

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  const body = await request.json().catch(() => null) as { projectId?: string; mode?: string; amount?: number; percentage?: number } | null;
  if (!body?.projectId || !MODES.has(body.mode || "")) return NextResponse.json({ error: "Contribution invalide." }, { status: 400 });
  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
  const percentage = body.mode === "prise_part" ? Number(body.percentage || 1) : undefined;
  if (body.mode === "prise_part" && (percentage === undefined || !Number.isFinite(percentage) || percentage <= 0 || percentage > 10)) return NextResponse.json({ error: "Pourcentage invalide." }, { status: 400 });
  const contributionId = crypto.randomUUID();
  const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  try {
    const payment = await initMonerooPayment({
      amount,
      currency: "XOF",
      description: `Crowdfunding Envol Africa — ${body.mode}`,
      customer: { email: user?.email || "client@envolafrica.com", first_name: user?.prenom || "Client", last_name: user?.nom || "Envol", phone: user?.phone },
      return_url: `${origin}/financement/projets/${body.projectId}?payment=${contributionId}`,
      metadata: { product: "crowdfunding_contribution", contribution_id: contributionId, project_id: body.projectId, mode: body.mode, amount_xof: amount, percentage, user_id: user?.id || "guest" },
    });
    return NextResponse.json({ checkoutUrl: payment.checkout_url, paymentId: payment.id, contributionId });
  } catch {
    return NextResponse.json({ error: "Impossible d’initialiser le paiement Moneroo." }, { status: 502 });
  }
}
