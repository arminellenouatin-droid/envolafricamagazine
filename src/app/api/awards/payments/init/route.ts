import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { initMonerooPayment } from "@/lib/moneroo";
import { getMonerooMethodCodes } from "@/lib/payment-methods";

const MIN_XOF = 100;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const product = typeof body.product === "string" ? body.product : "";
  const allowed = ["award_registration_fee", "award_gift", "award_donation", "award_pot_increase"];
  if (!allowed.includes(product)) return NextResponse.json({ error: "Produit Awards invalide" }, { status: 400 });
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour sécuriser et suivre ce paiement" }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Base Awards temporairement indisponible" }, { status: 503 });

  let amountXof = Math.round(Number(body.amount_xof) || 0);
  const competitionId = typeof body.competition_id === "string" ? body.competition_id : "";
  const candidateId = typeof body.candidate_id === "string" ? body.candidate_id : "";
  if (!competitionId) return NextResponse.json({ error: "competition_id requis" }, { status: 400 });
  const { data: competition, error: competitionError } = await supabase.from("awards_competitions").select("id,title,status").eq("id", competitionId).limit(1).maybeSingle();
  if (competitionError) return NextResponse.json({ error: competitionError.message }, { status: 500 });
  if (!competition) return NextResponse.json({ error: "Compétition introuvable" }, { status: 404 });
  if (!["voting_open", "live_running", "registrations_open"].includes(competition.status) && product !== "award_registration_fee") return NextResponse.json({ error: "Cette opération est fermée pour la compétition" }, { status: 409 });

  if (product === "award_registration_fee") {
    const applicationId = typeof body.application_id === "string" ? body.application_id : "";
    if (!applicationId) return NextResponse.json({ error: "application_id requis" }, { status: 400 });
    const { data: config } = await supabase.from("awards_registration_configs").select("registration_fee_xof").eq("competition_id", competitionId).limit(1).maybeSingle();
    const { data: application } = await supabase.from("awards_applications").select("id,applicant_id,competition_id,status").eq("id", applicationId).limit(1).maybeSingle();
    if (!application || application.applicant_id !== user?.id || application.competition_id !== competitionId) return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });
    if (!config || Number(config.registration_fee_xof) < MIN_XOF) return NextResponse.json({ error: "Aucun frais d’inscription payable ou montant inférieur à 100 XOF" }, { status: 409 });
    amountXof = Number(config.registration_fee_xof);
  }
  if (product === "award_gift") {
    if (!candidateId) return NextResponse.json({ error: "candidate_id requis" }, { status: 400 });
    const { data: gift } = await supabase.from("awards_gifts_catalog").select("id,name,price_cents,points,is_active").eq("id", String(body.gift_id || "")).limit(1).maybeSingle();
    if (!gift || !gift.is_active) return NextResponse.json({ error: "Cadeau indisponible" }, { status: 404 });
    amountXof = Number(gift.price_cents);
    if (amountXof < MIN_XOF) return NextResponse.json({ error: "Le prix du cadeau doit être au minimum de 100 XOF" }, { status: 400 });
  }
  if (!["award_registration_fee", "award_gift"].includes(product) && amountXof < MIN_XOF) return NextResponse.json({ error: "Le montant minimum est de 100 XOF" }, { status: 400 });
  if (!Number.isInteger(amountXof) || amountXof < MIN_XOF) return NextResponse.json({ error: "Montant invalide" }, { status: 400 });

  const country = String(body.country || "BJ").toUpperCase();
  const payment = await initMonerooPayment({ amount: amountXof, currency: "XOF", description: product === "award_registration_fee" ? `Frais d’inscription — ${competition.title}` : product === "award_gift" ? `Cadeau Africa Awards — ${String(body.gift_name || "Cadeau")}` : product === "award_pot_increase" ? "Augmentation de la cagnotte Africa Awards" : "Don Africa Awards", customer: { email: user?.email || String(body.email || "client@envolafrica.com"), first_name: user?.prenom || "Client", last_name: user?.nom || "Envol", phone: user?.phone || String(body.phone || ""), country }, return_url: `${req.nextUrl.origin}/africa-awards?payment_id=pending`, methods: getMonerooMethodCodes(country, "XOF"), metadata: { product, user_id: user?.id || "guest", competition_id: competitionId, candidate_id: candidateId || null, application_id: typeof body.application_id === "string" ? body.application_id : null, gift_id: typeof body.gift_id === "string" ? body.gift_id : null, amount_xof: amountXof, currency: "XOF", is_anonymous: Boolean(body.is_anonymous) } });
  return NextResponse.json({ paymentId: payment.id, checkout_url: payment.checkout_url, amount_xof: amountXof, mock: payment.mock === true });
}
