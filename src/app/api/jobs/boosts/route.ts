import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readJobsDB, writeJobsDB } from "@/lib/jobs-db";
import { initMonerooPayment } from "@/lib/moneroo";

function amountForBoost(type: "offer" | "candidate", days: number, offerPosition: number) {
  if (type === "candidate") return days * (days > 10 ? 200 : 300);
  const dailyRate = offerPosition > 2 ? 150 : 500;
  const subtotal = dailyRate * days;
  return days > 10 ? Math.round(subtotal * 0.7) : subtotal;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { targetId, targetType, days, offerPosition = 1 } = await request.json();
  if ((targetType !== "offer" && targetType !== "candidate") || !Number.isInteger(days) || days < 1 || days > 90) return NextResponse.json({ error: "Paramètres de boost invalides." }, { status: 400 });
  const database = readJobsDB();
  const target = targetType === "offer" ? database.offers.find((item) => item.id === targetId && item.createdBy === user.id) : database.candidates.find((item) => item.id === targetId && item.createdBy === user.id);
  if (!target) return NextResponse.json({ error: "Publication introuvable ou non autorisée." }, { status: 404 });
  const amount = amountForBoost(targetType, days, offerPosition);
  const boostId = uuid(); const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  try { const payment = await initMonerooPayment({ amount, currency: "XOF", description: `Boost Envol Africa Jobs — ${days} jour(s)`, customer: { email: user.email, first_name: user.prenom, last_name: user.nom, phone: user.phone }, return_url: `${origin}/emploi/dashboard?boost=${boostId}`, methods: ["card", "mtn_bj", "moov_bj", "mtn_ci", "orange_ci", "wave", "orange_sn"], metadata: { product: "jobs_boost", boost_id: boostId, target_id: targetId, target_type: targetType, user_id: user.id } }); database.boosts.push({ id: boostId, userId: user.id, targetType, targetId, days, amount, paymentId: payment.id, status: "pending", createdAt: new Date().toISOString() }); writeJobsDB(database); return NextResponse.json({ checkoutUrl: payment.checkout_url, amount }); } catch { return NextResponse.json({ error: "Le paiement ne peut pas être initialisé." }, { status: 502 }); }
}
