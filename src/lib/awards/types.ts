export type AwardsCandidateStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'accepted' // alias rétrocompatible approved
  | 'qualified'
  | 'live_eligible'
  | 'next_round'
  | 'final'
  | 'winner'
  | 'eliminated'
  | 'rejected'
  | 'pending'; // alias rétrocompatible submitted

export type LiveParticipantStageState =
  | 'waiting'
  | 'stage_requested'
  | 'on_stage'
  | 'removed'
  | 'left';

export interface JuryCriterionScore {
  talent: number; // 0 - 100 (poids 30%)
  originalite: number; // 0 - 100 (poids 20%)
  expression: number; // 0 - 100 (poids 20%)
  impact: number; // 0 - 100 (poids 30%)
}

export interface AwardsJuryScoreRecord {
  id: string;
  competitionId: string;
  juryId: string;
  juryName?: string;
  candidateId: string;
  roundId?: string;
  score: number; // note pondérée globale 0 - 100
  criteria: JuryCriterionScore;
  comment?: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt?: string;
  lockedAt?: string;
  unlockedReason?: string;
}

export type RankingStatus = 'calculated' | 'verified' | 'frozen' | 'published';

export interface CandidateRankEntry {
  rank: number;
  candidateId: string;
  displayName: string;
  photoUrl?: string;
  country?: string;
  publicVotesCount: number;
  publicPoints: number;
  publicNormalizedScore: number; // 0 - 100
  juryAverageScore: number; // 0 - 100
  juryCount: number;
  finalScore: number; // 0 - 100
  status: AwardsCandidateStatus;
  tieBreakReason?: string;
}

export interface CompetitionOfficialRanking {
  competitionId: string;
  competitionTitle: string;
  status: RankingStatus;
  publicWeight: number;
  juryWeight: number;
  totalVotes: number;
  totalCandidates: number;
  podium: CandidateRankEntry[];
  rankings: CandidateRankEntry[];
  calculatedAt: string;
  publishedAt?: string;
  publishedBy?: string;
}
