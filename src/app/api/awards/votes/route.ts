import { NextRequest, NextResponse } from "next/server";
import { readAwardsDB, writeAwardsDB } from "@/lib/awards-db";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin, isProductionRuntime } from "@/lib/supabase-admin";
import { MIN_PAYMENT_AMOUNT_XOF } from "@/lib/payment-policy";

export const dynamic = "force-dynamic";

function isWithinWindow(start?: string | null, end?: string | null) {
  const now = Date.now();
  if (start && now < new Date(start).getTime()) return false;
  if (end && now > new Date(end).getTime()) return false;
  return true;
}

export async function GET(req: NextRequest) {
  const candidateId = new URL(req.url).searchParams.get("candidate_id");
  const supabase = getSupabaseAdmin();
  if (supabase) {
    let query = supabase.from("awards_votes").select("id,voter_id,candidate_id,competition_id,points,payment_transaction_id,created_at").order("created_at", { ascending: false }).limit(100);
    if (candidateId) query = query.eq("candidate_id", candidateId);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ votes: data ?? [] });
  }
  const db = readAwardsDB();
  let votes = db.votes;
  if (candidateId) votes = votes.filter((vote) => vote.candidate_id === candidateId);
  return NextResponse.json({ votes: votes.slice(-100).reverse() });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const candidateId = typeof body.candidate_id === "string" ? body.candidate_id : "";
  const competitionId = typeof body.competition_id === "string" ? body.competition_id : "";
  const paymentId = typeof body.payment_id === "string" ? body.payment_id : "";
  const useWallet = Boolean(body.use_wallet);
  const points = Math.max(1, Math.min(1000, Number(body.points) || 1));
  if (!candidateId || !competitionId) return NextResponse.json({ error: "candidate_id et competition_id requis" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const [{ data: competition, error: competitionError }, { data: candidate, error: candidateError }, { data: config, error: configError }] = await Promise.all([
      supabase.from("awards_competitions").select("id,status,vote_price_cents").eq("id", competitionId).limit(1).maybeSingle(),
      supabase.from("awards_candidates").select("id,competition_id,status,display_name").eq("id", candidateId).limit(1).maybeSingle(),
      supabase.from("awards_registration_configs").select("voting_start_at,voting_end_at").eq("competition_id", competitionId).limit(1).maybeSingle(),
    ]);
    if (competitionError || candidateError || configError) return NextResponse.json({ error: competitionError?.message || candidateError?.message || configError?.message }, { status: 500 });
    if (!competition) return NextResponse.json({ error: "Compétition introuvable" }, { status: 404 });
    if (!candidate || candidate.competition_id !== competitionId) return NextResponse.json({ error: "Nominé introuvable dans cette compétition" }, { status: 404 });
    if (!["accepted", "approved", "qualified", "live_eligible"].includes(candidate.status)) return NextResponse.json({ error: "Ce nominé n’est pas encore ouvert au vote" }, { status: 409 });
    if (competition.status !== "voting_open" && competition.status !== "live_running") return NextResponse.json({ error: "Les votes ne sont pas ouverts pour cette compétition" }, { status: 409 });
    if (config && !isWithinWindow(config.voting_start_at, config.voting_end_at)) return NextResponse.json({ error: "La période de vote est fermée" }, { status: 409 });

    const votePrice = Math.max(MIN_PAYMENT_AMOUNT_XOF, Number(competition.vote_price_cents) || MIN_PAYMENT_AMOUNT_XOF);
    const totalAmount = points * votePrice;

    // OPTION 1 : VOTE VIA WALLET ENVOL AFRICA
    if (useWallet) {
      try {
        const { debitWallet } = await import("@/lib/wallet/financial-core");
        const debitRes = await debitWallet({
          userId: user.id,
          amount: totalAmount,
          type: "AWARD_VOTE",
          source: "awards_votes",
          sourceId: candidateId,
          description: `Vote Africa Awards (${points} pts) pour ${candidate.display_name}`,
          metadata: {
            competition_id: competitionId,
            candidate_id: candidateId,
            points,
            voter_id: user.id,
          },
        });

        // Enregistrer le vote officiel
        const voteId = crypto.randomUUID();
        const { error: voteErr } = await supabase.from("awards_votes").insert({
          id: voteId,
          voter_id: user.id,
          candidate_id: candidateId,
          competition_id: competitionId,
          points,
          payment_transaction_id: debitRes.transactionId,
          created_at: new Date().toISOString(),
        });

        if (voteErr) throw voteErr;

        // Événement temps réel pour le live stream
        try {
          await supabase.from("awards_live_events").insert({
            competition_id: competitionId,
            event_type: "vote",
            payload: {
              candidate_id: candidateId,
              points,
              amount_xof: totalAmount,
              voter_id: user.id,
              voter_name: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email,
            },
          });
        } catch {}

        return NextResponse.json({
          success: true,
          wallet_debited: true,
          new_balance: debitRes.wallet.availableBalance,
          points_added: points,
          message: `Vote de ${points} points validé avec succès depuis votre portefeuille Envol Africa.`,
        });
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "Échec du débit portefeuille pour le vote" },
          { status: 400 }
        );
      }
    }

    // OPTION 2 : VOTE VIA MONEROO
    if (!paymentId) return NextResponse.json({ error: "Un paiement confirmé ou un débit portefeuille est requis." }, { status: 402 });
    return NextResponse.json({ success: false, pending: true, message: "Le vote est enregistré par le webhook Moneroo après confirmation du paiement." }, { status: 202 });
  }

  // Fallback local (hors-production uniquement)
  if (isProductionRuntime() && !supabase) {
    return NextResponse.json({ error: "Service de vote temporairement indisponible." }, { status: 503 });
  }

  const db = readAwardsDB();
  const comp = db.competitions.find((competition) => competition.id === competitionId);
  const candidate = db.candidates.find((item) => item.id === candidateId && item.competition_id === competitionId);
  if (!comp || !candidate) return NextResponse.json({ error: "Compétition ou nominé introuvable" }, { status: 404 });
  if (comp.status !== "voting_open" && comp.status !== "live_running") return NextResponse.json({ error: "Les votes ne sont pas ouverts pour cette compétition" }, { status: 409 });

  const votePrice = Math.max(MIN_PAYMENT_AMOUNT_XOF, Number(comp.vote_price_cents) || MIN_PAYMENT_AMOUNT_XOF);
  const totalAmount = points * votePrice;

  if (useWallet) {
    try {
      const { debitWallet } = await import("@/lib/wallet/financial-core");
      const debitRes = await debitWallet({
        userId: user.id,
        amount: totalAmount,
        type: "AWARD_VOTE",
        source: "awards_votes",
        sourceId: candidateId,
        description: `Vote Africa Awards (${points} pts) pour ${candidate.display_name}`,
      });

      const vote = {
        id: uuidv4(),
        voter_id: user.id,
        candidate_id: candidateId,
        competition_id: competitionId,
        points,
        payment_transaction_id: debitRes.transactionId,
        created_at: new Date().toISOString(),
      };
      db.votes.push(vote);
      candidate.votes = (candidate.votes || 0) + points;
      comp.votes_count = (comp.votes_count || 0) + points;
      writeAwardsDB(db);

      return NextResponse.json({
        success: true,
        wallet_debited: true,
        new_balance: debitRes.wallet.availableBalance,
        points_added: points,
        vote,
        message: "Vote comptabilisé via votre portefeuille",
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  if (!paymentId) return NextResponse.json({ error: "Un paiement confirmé ou un débit portefeuille est requis" }, { status: 402 });
  const vote = { id: uuidv4(), voter_id: user.id, candidate_id: candidateId, competition_id: competitionId, points, payment_transaction_id: paymentId, created_at: new Date().toISOString() };
  db.votes.push(vote);
  candidate.votes = (candidate.votes || 0) + points;
  comp.votes_count = (comp.votes_count || 0) + points;
  writeAwardsDB(db);
  return NextResponse.json({ success: true, vote, message: "Vote comptabilisé" });
}
