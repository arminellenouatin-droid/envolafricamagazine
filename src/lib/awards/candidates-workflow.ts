import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { readAwardsDB, writeAwardsDB } from '@/lib/awards-db';
import type { AwardsCandidateStatus } from './types';

// Machine d'état formelle du cycle de compétition Africa Awards
export const ALLOWED_CANDIDATE_TRANSITIONS: Record<AwardsCandidateStatus, AwardsCandidateStatus[]> = {
  draft: ['submitted', 'rejected'],
  submitted: ['under_review', 'rejected'],
  pending: ['under_review', 'accepted', 'approved', 'rejected'],
  under_review: ['approved', 'accepted', 'rejected'],
  approved: ['qualified', 'eliminated', 'rejected'],
  accepted: ['qualified', 'eliminated', 'rejected'],
  qualified: ['live_eligible', 'next_round', 'eliminated'],
  live_eligible: ['next_round', 'final', 'eliminated'],
  next_round: ['live_eligible', 'final', 'eliminated'],
  final: ['winner', 'eliminated'],
  winner: [], // État terminal
  eliminated: ['qualified'], // Repêchage possible sur décision officielle
  rejected: ['under_review'], // Réexamen après recours
};

export function isValidCandidateTransition(
  currentStatus: AwardsCandidateStatus,
  targetStatus: AwardsCandidateStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_CANDIDATE_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(targetStatus));
}

export async function transitionCandidateStatus(params: {
  candidateId: string;
  targetStatus: AwardsCandidateStatus;
  changedByUserId: string;
  changedByUserRole: string;
  reason?: string;
}): Promise<{
  success: boolean;
  candidateId: string;
  previousStatus: AwardsCandidateStatus;
  newStatus: AwardsCandidateStatus;
}> {
  const { candidateId, targetStatus, changedByUserId, changedByUserRole, reason } = params;

  if (!['admin', 'host', 'organizer', 'redacteur_chef', 'gerant'].includes(changedByUserRole)) {
    throw new Error('Permissions insuffisantes : seul un administrateur ou organisateur peut modifier le statut d’un candidat');
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: candidate, error: fetchError } = await supabase
      .from('awards_candidates')
      .select('id, status, competition_id, display_name')
      .eq('id', candidateId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!candidate) throw new Error('Candidat introuvable');

    const currentStatus = (candidate.status || 'submitted') as AwardsCandidateStatus;

    if (!isValidCandidateTransition(currentStatus, targetStatus)) {
      throw new Error(
        `Transition de statut invalide : impossible de passer de "${currentStatus}" à "${targetStatus}"`
      );
    }

    const { error: updateError } = await supabase
      .from('awards_candidates')
      .update({
        status: targetStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', candidateId);

    if (updateError) throw updateError;

    // Journalisation de la transition
    try {
      await supabase.from('awards_live_events').insert({
        competition_id: candidate.competition_id,
        event_type: 'candidate_status_change',
        payload: {
          candidate_id: candidateId,
          display_name: candidate.display_name,
          from_status: currentStatus,
          to_status: targetStatus,
          changed_by: changedByUserId,
          reason: reason || null,
          changed_at: new Date().toISOString(),
        },
      });
    } catch {}

    return {
      success: true,
      candidateId,
      previousStatus: currentStatus,
      newStatus: targetStatus,
    };
  }

  // Fallback local
  const db = readAwardsDB();
  const cand = db.candidates.find((c) => c.id === candidateId);
  if (!cand) throw new Error('Candidat introuvable');

  const currentStatus = (cand.status || 'submitted') as AwardsCandidateStatus;
  if (!isValidCandidateTransition(currentStatus, targetStatus)) {
    throw new Error(
      `Transition de statut invalide : impossible de passer de "${currentStatus}" à "${targetStatus}"`
    );
  }

  cand.status = targetStatus as any;
  writeAwardsDB(db);

  return {
    success: true,
    candidateId,
    previousStatus: currentStatus,
    newStatus: targetStatus,
  };
}
