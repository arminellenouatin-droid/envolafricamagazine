import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidCandidateTransition,
  ALLOWED_CANDIDATE_TRANSITIONS,
} from '../awards/candidates-workflow';
import {
  calculateJuryWeightedScore,
  calculateCompetitionOfficialRankings,
} from '../awards/scoring-engine';
import {
  getOrCreateWallet,
  creditWallet,
  debitWallet,
} from '../wallet/financial-core';
import type { AwardsCandidateStatus, JuryCriterionScore } from '../awards/types';

describe('Africa Awards - Phase 2 (Compétition, Jury, Live & Scoring Engine)', () => {
  describe('1. Machine d’état du cycle de vie des candidats (State Machine)', () => {
    it('Autorise les transitions du parcours classique du candidat', () => {
      expect(isValidCandidateTransition('draft', 'submitted')).toBe(true);
      expect(isValidCandidateTransition('submitted', 'under_review')).toBe(true);
      expect(isValidCandidateTransition('under_review', 'approved')).toBe(true);
      expect(isValidCandidateTransition('approved', 'qualified')).toBe(true);
      expect(isValidCandidateTransition('qualified', 'live_eligible')).toBe(true);
      expect(isValidCandidateTransition('live_eligible', 'final')).toBe(true);
      expect(isValidCandidateTransition('final', 'winner')).toBe(true);
    });

    it('Autorise l’élimination aux étapes clés de sélection', () => {
      expect(isValidCandidateTransition('approved', 'eliminated')).toBe(true);
      expect(isValidCandidateTransition('qualified', 'eliminated')).toBe(true);
      expect(isValidCandidateTransition('live_eligible', 'eliminated')).toBe(true);
      expect(isValidCandidateTransition('final', 'eliminated')).toBe(true);
    });

    it('Gère les cas de repêchage et de recours', () => {
      // Repêchage officiel autorisé vers qualified
      expect(isValidCandidateTransition('eliminated', 'qualified')).toBe(true);
      // Réexamen après contestation / recours vers under_review
      expect(isValidCandidateTransition('rejected', 'under_review')).toBe(true);
    });

    it('Empêche formellement de quitter le statut terminal "winner"', () => {
      expect(isValidCandidateTransition('winner', 'draft')).toBe(false);
      expect(isValidCandidateTransition('winner', 'eliminated')).toBe(false);
      expect(isValidCandidateTransition('winner', 'rejected')).toBe(false);
      expect(isValidCandidateTransition('winner', 'qualified')).toBe(false);
    });

    it('Bloque les sauts d’étapes illégitimes (bypass)', () => {
      expect(isValidCandidateTransition('draft', 'winner')).toBe(false);
      expect(isValidCandidateTransition('draft', 'live_eligible')).toBe(false);
      expect(isValidCandidateTransition('draft', 'final')).toBe(false);
      expect(isValidCandidateTransition('submitted', 'winner')).toBe(false);
    });

    it('Considère une transition vers le même statut comme valide et idempotente', () => {
      expect(isValidCandidateTransition('approved', 'approved')).toBe(true);
      expect(isValidCandidateTransition('qualified', 'qualified')).toBe(true);
    });
  });

  describe('2. Moteur de notation du Jury & Éradication de mock_jury', () => {
    it('Applique rigoureusement la formule officielle de pondération : 30% Talent, 20% Originalité, 20% Expression, 30% Impact', () => {
      const criteria: JuryCriterionScore = {
        talent: 90, // 90 * 0.3 = 27
        originalite: 80, // 80 * 0.2 = 16
        expression: 85, // 85 * 0.2 = 17
        impact: 95, // 95 * 0.3 = 28.5
      };

      const score = calculateJuryWeightedScore(criteria);
      // Total attendu : 27 + 16 + 17 + 28.5 = 88.5
      expect(score).toBe(88.5);
    });

    it('Plafonne les valeurs de critères entre 0 et 100 en évitant les notes aberrantes', () => {
      const criteriaOverflow: JuryCriterionScore = {
        talent: 150, // clamp à 100 -> 30
        originalite: -20, // clamp à 0 -> 0
        expression: 100, // 100 * 0.2 -> 20
        impact: 50, // 50 * 0.3 -> 15
      };

      const score = calculateJuryWeightedScore(criteriaOverflow);
      // Total attendu : 30 + 0 + 20 + 15 = 65
      expect(score).toBe(65);
    });

    it('Gère avec robustesse les champs manquants ou non numériques', () => {
      const criteriaCorrupted = {
        talent: undefined as any,
        originalite: null as any,
        expression: 'invalid' as any,
        impact: 50,
      };

      const score = calculateJuryWeightedScore(criteriaCorrupted);
      // Impact seul : 50 * 0.3 = 15
      expect(score).toBe(15);
    });
  });

  describe('3. Moteur Officiel de Calcul et Classement (Official Ranking Engine)', () => {
    it('Exécute le calcul de classement complet via le moteur local fallback', async () => {
      // Teste calculateCompetitionOfficialRankings avec un ID existant dans db.json ou fallback
      const ranking = await calculateCompetitionOfficialRankings('comp_defaut_1', {
        status: 'calculated',
      });

      expect(ranking).toBeDefined();
      expect(ranking.status).toBe('calculated');
      expect(ranking.publicWeight).toBeGreaterThan(0);
      expect(ranking.juryWeight).toBeGreaterThan(0);
      expect(Array.isArray(ranking.rankings)).toBe(true);
      expect(Array.isArray(ranking.podium)).toBe(true);

      // Si des candidats existent, vérifier l'ordonnancement des rangs
      if (ranking.rankings.length > 0) {
        expect(ranking.rankings[0].rank).toBe(1);
        if (ranking.rankings.length > 1) {
          expect(ranking.rankings[0].finalScore).toBeGreaterThanOrEqual(
            ranking.rankings[1].finalScore
          );
        }
      }
    });

    it('Vérifie le podium composé des 3 meilleurs candidats', async () => {
      const ranking = await calculateCompetitionOfficialRankings('comp_defaut_1');
      expect(ranking.podium.length).toBeLessThanOrEqual(3);
      if (ranking.podium.length > 0) {
        expect(ranking.podium[0].rank).toBe(1);
      }
    });
  });

  describe('4. Intégration Vote Africa Awards avec le Portefeuille Envol Africa', () => {
    const voterId = 'voter-awards-test-01';

    beforeEach(async () => {
      await getOrCreateWallet(voterId);
    });

    it('Recharge le portefeuille du votant et effectue un débit AWARD_VOTE direct en 1 clic', async () => {
      // Créditer 2 000 XOF
      await creditWallet({
        userId: voterId,
        amount: 2000,
        type: 'DEPOSIT',
        source: 'moneroo',
        sourceId: 'dep_awards_001',
        description: 'Rechargement pour votes Africa Awards',
        reference: 'DEP-AWARD-TEST-1',
      });

      // Débit direct pour un vote (ex: 500 XOF pour un pack de 5 votes)
      const debitRes = await debitWallet({
        userId: voterId,
        amount: 500,
        type: 'AWARD_VOTE',
        source: 'awards_votes',
        sourceId: 'candidate-uuid-123',
        description: 'Vote officiel Africa Awards pour Candidat #123 (5 voix)',
        reference: 'VOTE-TX-001',
      });

      expect(debitRes.success).toBe(true);
      expect(debitRes.wallet.availableBalance).toBe(1500);

      // Tentative de débit supérieur au solde restant (ex: 3 000 XOF)
      await expect(
        debitWallet({
          userId: voterId,
          amount: 3000,
          type: 'AWARD_VOTE',
          source: 'awards_votes',
          sourceId: 'candidate-uuid-123',
          description: 'Vote avec solde insuffisant',
        })
      ).rejects.toThrow(/Solde insuffisant/i);
    });
  });
});
