import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readAwardsDB, writeAwardsDB } from "@/lib/awards-db";
import { calculateJuryWeightedScore } from "@/lib/awards/scoring-engine";
import type { JuryCriterionScore } from "@/lib/awards/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const competitionId = searchParams.get("competition_id");
  const candidateId = searchParams.get("candidate_id");

  const supabase = getSupabaseAdmin();
  if (supabase) {
    let query = supabase.from("awards_jury_scores").select("*");
    if (competitionId) query = query.eq("competition_id", competitionId);
    if (candidateId) query = query.eq("candidate_id", candidateId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ scores: data || [] });
  }

  // Fallback local
  const db = readAwardsDB();
  const scores = (db as any).jury_scores || [];
  let filtered = scores;
  if (competitionId) filtered = filtered.filter((s: any) => s.competition_id === competitionId);
  if (candidateId) filtered = filtered.filter((s: any) => s.candidate_id === candidateId);
  return NextResponse.json({ scores: filtered });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise pour noter un candidat" }, { status: 401 });
  }

  // Seul un juré ou un administrateur est habilité à émettre des notes
  if (!["jury", "admin", "gerant", "redacteur_chef"].includes(user.role)) {
    return NextResponse.json(
      { error: "Accès refusé : rôle juré ou administrateur requis pour évaluer" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { competition_id, candidate_id, criteria, comment, lock = true, admin_unlock_reason } = body;

  if (!competition_id || !candidate_id) {
    return NextResponse.json({ error: "competition_id et candidate_id requis" }, { status: 400 });
  }

  // Valider les critères de notation
  const juryCriteria: JuryCriterionScore = {
    talent: Math.max(0, Math.min(100, Number(criteria?.talent ?? body.score ?? 0))),
    originalite: Math.max(0, Math.min(100, Number(criteria?.originalite ?? body.score ?? 0))),
    expression: Math.max(0, Math.min(100, Number(criteria?.expression ?? body.score ?? 0))),
    impact: Math.max(0, Math.min(100, Number(criteria?.impact ?? body.score ?? 0))),
  };

  // Calcul du score pondéré côté serveur (sécurité anti-falsification)
  const weightedScore = calculateJuryWeightedScore(juryCriteria);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    // Vérifier l'affectation du juré à la compétition (sauf admin)
    if (user.role === "jury") {
      const { data: member } = await supabase
        .from("awards_jury_members")
        .select("jury_id")
        .eq("competition_id", competition_id)
        .eq("jury_id", user.id)
        .maybeSingle();

      if (!member) {
        return NextResponse.json(
          { error: "Vous n'êtes pas assigné comme juré officiel sur cette compétition" },
          { status: 403 }
        );
      }
    }

    // Vérifier si une note existe déjà et si elle est verrouillée
    const { data: existing } = await supabase
      .from("awards_jury_scores")
      .select("id, is_locked, score")
      .eq("competition_id", competition_id)
      .eq("jury_id", user.id)
      .eq("candidate_id", candidate_id)
      .maybeSingle();

    if (existing?.is_locked && user.role !== "admin") {
      return NextResponse.json(
        {
          error: "Cette note a déjà été soumise et verrouillée définitivement. Seul un administrateur peut autoriser une révision motivée.",
          locked: true,
        },
        { status: 409 }
      );
    }

    const payloadToSave = {
      competition_id,
      jury_id: user.id,
      candidate_id,
      score: weightedScore,
      comment: comment || "",
      criteria: JSON.stringify(juryCriteria),
      is_locked: Boolean(lock),
      locked_at: lock ? new Date().toISOString() : null,
      unlocked_reason: admin_unlock_reason || null,
    };

    const { data, error } = await supabase
      .from("awards_jury_scores")
      .upsert(payloadToSave, { onConflict: "competition_id,jury_id,candidate_id" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      score: weightedScore,
      criteria: juryCriteria,
      is_locked: Boolean(lock),
      data,
    });
  }

  // Fallback local
  const db = readAwardsDB();
  if (!(db as any).jury_scores) (db as any).jury_scores = [];

  const existing = (db as any).jury_scores.find(
    (s: any) => s.competition_id === competition_id && s.candidate_id === candidate_id && s.jury_id === user.id
  );

  if (existing?.is_locked && user.role !== "admin") {
    return NextResponse.json(
      { error: "Note verrouillée, modification interdite", locked: true },
      { status: 409 }
    );
  }

  if (existing) {
    existing.score = weightedScore;
    existing.criteria = juryCriteria;
    existing.comment = comment || "";
    existing.is_locked = Boolean(lock);
    existing.updated_at = new Date().toISOString();
  } else {
    (db as any).jury_scores.push({
      id: crypto.randomUUID(),
      competition_id,
      jury_id: user.id,
      candidate_id,
      score: weightedScore,
      criteria: juryCriteria,
      comment: comment || "",
      is_locked: Boolean(lock),
      created_at: new Date().toISOString(),
    });
  }

  writeAwardsDB(db);
  return NextResponse.json({
    success: true,
    score: weightedScore,
    criteria: juryCriteria,
    is_locked: Boolean(lock),
  });
}
