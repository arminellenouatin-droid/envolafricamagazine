import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readJobsDB, writeJobsDB } from "@/lib/jobs-db";
import { verifyMonerooPayment } from "@/lib/moneroo";
import { activateJobsUnlockByPayment, getJobsUnlockById } from "@/lib/jobs-payments-supabase";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ unlockId: string }> }) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { unlockId } = await params;
  const persisted = await getJobsUnlockById(user.id, unlockId);
  if (persisted.configured) {
    const unlock = persisted.unlock;
    if (!unlock) return NextResponse.json({ error: "Décryptage introuvable." }, { status: 404 });
    if (unlock.status === "paid") return NextResponse.json({ unlocked: true });
    if (!unlock.provider_payment_id) return NextResponse.json({ error: "Paiement introuvable." }, { status: 400 });
    const result = await verifyMonerooPayment(unlock.provider_payment_id);
    if (["success", "paid", "completed"].includes(String(result.status))) {
      const activated = await activateJobsUnlockByPayment(user.id, unlock.provider_payment_id);
      return NextResponse.json({ unlocked: activated.unlocked });
    }
    return NextResponse.json({ unlocked: false, status: "pending" });
  }

  const database = readJobsDB();
  const unlock = database.unlocks.find((item) => item.id === unlockId && item.userId === user.id);
  if (!unlock) return NextResponse.json({ error: "Décryptage introuvable." }, { status: 404 });
  if (unlock.status === "paid") return NextResponse.json({ unlocked: true });
  if (!unlock.paymentId) return NextResponse.json({ error: "Paiement introuvable." }, { status: 400 });
  const result = await verifyMonerooPayment(unlock.paymentId);
  if (["success", "paid", "completed"].includes(String(result.status))) { unlock.status = "paid"; writeJobsDB(database); return NextResponse.json({ unlocked: true }); }
  return NextResponse.json({ unlocked: false, status: "pending" });
}
