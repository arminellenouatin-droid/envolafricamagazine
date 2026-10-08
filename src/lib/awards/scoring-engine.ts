import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { readAwardsDB, writeAwardsDB } from '@/lib/awards-db';
import type {
  CandidateRankEntry,
  CompetitionOfficialRanking,
  JuryCriterionScore,
  RankingStatus,
} from './types';

// Calcul du score d'un juré basé sur les critères officiels
export function calculateJuryWeightedScore(criteria: JuryCriterionScore): number {
  const talent = Math.max(0, Math.min(100, Number(criteria.talent) || 0));
  const originalite = Math.max(0, Math.min(100, Number(criteria.originalite) || 0));
  const expression = Math.max(0, Math.min(100, Number(criteria.expression) || 0));
  const impact = Math.max(0, Math.min(100, Number(criteria.impact) || 0));

  // Pondérations officielles Document 1 :
  // Talent 30% + Originalité 20% + Expression 20% + Impact 30% = 100%
  const total = talent * 0.3 + originalite * 0.2 + expression * 0.2 + impact * 0.3;
  return Math.round(total * 100) / 100;
}

/**
 * Moteur officiel de calcul des scores et classements Africa Awards
 */
export async function calculateCompetitionOfficialRankings(
  competitionId: string,
  options: { status?: RankingStatus; publishedBy?: string } = {}
): Promise<CompetitionOfficialRanking> {
  const rankingStatus = options.status || 'calculated';
  const supabase = getSupabaseAdmin();

  if (supabase) {
    // 1. Récupérer la compétition
    const { data: comp, error: compErr } = await supabase
      .from('awards_competitions')
      .select('id, title, public_vote_weight, jury_weight, status')
      .eq('id', competitionId)
      .maybeSingle();

    if (compErr) throw compErr;
    if (!comp) throw new Error('Compétition introuvable');

    const publicWeight = Number(comp.public_vote_weight ?? 50);
    const juryWeight = Number(comp.jury_weight ?? 50);

    // 2. Récupérer les candidats
    const { data: candidates, error: candErr } = await supabase
      .from('awards_candidates')
      .select('id, display_name, photo_url, country, status, legacy_votes_count, created_at')
      .eq('competition_id', competitionId);

    if (candErr) throw candErr;
    const candList = candidates || [];

    // 3. Récupérer les votes réels
    const { data: votes, error: votesErr } = await supabase
      .from('awards_votes')
      .select('candidate_id, points')
      .eq('competition_id', competitionId);

    if (votesErr) throw votesErr;

    // Agréger les points par candidat
    const pointsMap = new Map<string, { count: number; totalPoints: number }>();
    (votes || []).forEach((v) => {
      const current = pointsMap.get(v.candidate_id) || { count: 0, totalPoints: 0 };
      current.count += 1;
      current.totalPoints += Number(v.points || 1);
      pointsMap.set(v.candidate_id, current);
    });

    // 4. Récupérer les notes du jury
    const { data: juryScores, error: juryErr } = await supabase
      .from('awards_jury_scores')
      .select('candidate_id, score, is_locked')
      .eq('competition_id', competitionId);

    if (juryErr) throw juryErr;

    // Agréger les notes moyennes du jury par candidat
    const juryMap = new Map<string, { totalScore: number; count: number }>();
    (juryScores || []).forEach((s) => {
      const current = juryMap.get(s.candidate_id) || { totalScore: 0, count: 0 };
      current.totalScore += Number(s.score || 0);
      current.count += 1;
      juryMap.set(s.candidate_id, current);
    });

    // Trouver le maximum de points publics pour normaliser sur 100
    let maxPublicPoints = 1;
    candList.forEach((c) => {
      const pts = (pointsMap.get(c.id)?.totalPoints ?? 0) || Number(c.legacy_votes_count || 0);
      if (pts > maxPublicPoints) maxPublicPoints = pts;
    });

    let totalCompVotes = 0;

    // 5. Calculer le score final pour chaque candidat
    const computedEntries: CandidateRankEntry[] = candList.map((c) => {
      const voteData = pointsMap.get(c.id);
      const publicPoints = (voteData?.totalPoints ?? 0) || Number(c.legacy_votes_count || 0);
      const votesCount = voteData?.count ?? (publicPoints > 0 ? 1 : 0);
      totalCompVotes += publicPoints;

      // Score public normalisé de 0 à 100
      const publicNormalized = Math.min(100, Math.round((publicPoints / maxPublicPoints) * 100 * 100) / 100);

      // Score jury moyen de 0 à 100
      const juryData = juryMap.get(c.id);
      const juryAverage = juryData && juryData.count > 0 ? Math.round((juryData.totalScore / juryData.count) * 100) / 100 : 0;
      const juryCount = juryData?.count || 0;

      // Formule Officielle : PUBLIC * public_weight% + JURY * jury_weight%
      const finalScore = Math.round(
        ((publicNormalized * publicWeight) / 100 + (juryAverage * juryWeight) / 100) * 100
      ) / 100;

      return {
        rank: 0, // sera attribué après tri
        candidateId: c.id,
        displayName: c.display_name,
        photoUrl: c.photo_url,
        country: c.country,
        publicVotesCount: votesCount,
        publicPoints,
        publicNormalizedScore: publicNormalized,
        juryAverageScore: juryAverage,
        juryCount,
        finalScore,
        status: (c.status || 'submitted') as any,
        createdAt: c.created_at,
      } as CandidateRankEntry & { createdAt?: string };
    });

    // 6. Tri avec RÈGLE OFFICIELLE DE DÉPARTAGE (TIE-BREAK)
    computedEntries.sort((a: any, b: any) => {
      // 1. Score final
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      // 2. Départage par points publics
      if (b.publicPoints !== a.publicPoints) {
        a.tieBreakReason = 'Départage par nombre de points publics';
        b.tieBreakReason = 'Départage par nombre de points publics';
        return b.publicPoints - a.publicPoints;
      }
      // 3. Départage par note du jury
      if (b.juryAverageScore !== a.juryAverageScore) {
        a.tieBreakReason = 'Départage par note moyenne du jury';
        b.tieBreakReason = 'Départage par note moyenne du jury';
        return b.juryAverageScore - a.juryAverageScore;
      }
      // 4. Date d’inscription antérieure
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateA - dateB;
    });

    // Assigner les rangs 1, 2, 3...
    computedEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    const podium = computedEntries.slice(0, 3);

    const ranking: CompetitionOfficialRanking = {
      competitionId,
      competitionTitle: comp.title,
      status: rankingStatus,
      publicWeight,
      juryWeight,
      totalVotes: totalCompVotes,
      totalCandidates: computedEntries.length,
      podium,
      rankings: computedEntries,
      calculatedAt: new Date().toISOString(),
      publishedAt: rankingStatus === 'published' ? new Date().toISOString() : undefined,
      publishedBy: options.publishedBy,
    };

    // 7. Enregistrer dans awards_results si persistance demandée
    if (rankingStatus === 'published' || rankingStatus === 'frozen') {
      try {
        await supabase.from('awards_results').upsert(
          {
            competition_id: competitionId,
            podium: JSON.stringify(podium),
            final_ranking: JSON.stringify(computedEntries),
            published: rankingStatus === 'published',
            published_at: rankingStatus === 'published' ? new Date().toISOString() : null,
            published_by: options.publishedBy || null,
          },
          { onConflict: 'competition_id' }
        );
      } catch {}
    }

    return ranking;
  }

  // Fallback local
  const db = readAwardsDB();
  const comp = db.competitions.find((c) => c.id === competitionId);
  const candList = db.candidates.filter((c) => c.competition_id === competitionId);
  const publicWeight = comp?.public_vote_weight ?? 50;
  const juryWeight = comp?.jury_weight ?? 50;

  let maxPublic = 1;
  candList.forEach((c) => {
    if (c.votes > maxPublic) maxPublic = c.votes;
  });

  // @ts-ignore
  const juryScores = (db as any).jury_scores || [];

  const computedEntries: CandidateRankEntry[] = candList.map((c) => {
    const publicNormalized = Math.min(100, Math.round((c.votes / maxPublic) * 100 * 100) / 100);
    const candidateJury = juryScores.filter((s: any) => s.competition_id === competitionId && s.candidate_id === c.id);
    const juryAvg =
      candidateJury.length > 0
        ? Math.round((candidateJury.reduce((sum: number, s: any) => sum + Number(s.score || 0), 0) / candidateJury.length) * 100) / 100
        : 0;

    const finalScore = Math.round(((publicNormalized * publicWeight) / 100 + (juryAvg * juryWeight) / 100) * 100) / 100;

    return {
      rank: 0,
      candidateId: c.id,
      displayName: c.display_name,
      photoUrl: c.photo_url,
      country: c.country,
      publicVotesCount: c.votes > 0 ? 1 : 0,
      publicPoints: c.votes,
      publicNormalizedScore: publicNormalized,
      juryAverageScore: juryAvg,
      juryCount: candidateJury.length,
      finalScore,
      status: (c.status || 'submitted') as any,
    };
  });

  computedEntries.sort((a, b) => b.finalScore - a.finalScore);
  computedEntries.forEach((e, idx) => {
    e.rank = idx + 1;
  });

  return {
    competitionId,
    competitionTitle: comp?.title || 'Compétition Africa Awards',
    status: rankingStatus,
    publicWeight,
    juryWeight,
    totalVotes: candList.reduce((sum, c) => sum + c.votes, 0),
    totalCandidates: candList.length,
    podium: computedEntries.slice(0, 3),
    rankings: computedEntries,
    calculatedAt: new Date().toISOString(),
  };
}
