import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateAmortizationSchedule,
  calculateEquityValuation,
  validateEquityAvailability,
  processWalletContribution,
  processWalletLoanRepayment,
  processPayoutApproval,
} from '../crowdfunding/crowdfunding-service';
import {
  getOrCreateWallet,
  creditWallet,
} from '../wallet/financial-core';
import { readCrowdDB, writeCrowdDB } from '../crowdfunding-db';

describe('AfricaCrowdFunding - Phase 3 (Don, Equity, Prêt, Échéanciers & Portefeuille Central)', () => {
  const investorId = 'investor-cf-test-01';
  const porteurId = 'porteur-cf-test-01';
  const adminId = 'admin-cf-test-01';
  let testProjectId: string;

  beforeEach(async () => {
    // 1. Initialiser les portefeuilles
    await getOrCreateWallet(investorId);
    await getOrCreateWallet(porteurId);
    await getOrCreateWallet(adminId);

    // 2. Initialiser un projet dans la base de test
    const db = readCrowdDB();
    testProjectId = 'proj_test_phase3_cf';
    const existing = db.projets.find((p) => p.id === testProjectId);
    if (!existing) {
      db.projets.push({
        id: testProjectId,
        nom: 'BioAgro Sahel - Ferme Connectée',
        secteur: 'Agroalimentaire',
        description: 'Projet pilote d’irrigation solaire au Sahel',
        montantRecherche: 5000000,
        montantCollecte: 0,
        niveauRisque: 'faible',
        dureeJours: 360,
        typesFinancement: ['don', 'prise_part', 'pret'],
        statut: 'en_cours',
        porteurId,
        pays: 'BJ',
        tauxInteret: 10,
        pourcentageVendu: 0,
        createdAt: new Date().toISOString(),
        dateFin: new Date(Date.now() + 30 * 86400000).toISOString(),
        vues: 120,
        investisseurs: 0,
        repartition: { dons: 0, prise_part: 0, pret: 0 },
      });
      writeCrowdDB(db);
    }
  });

  describe('1. Générateur d’Échéanciers de Prêt Participatif (Amortization Schedule)', () => {
    it('Génère un tableau d’amortissement mensuel à annuités constantes avec exactitude mathématique', () => {
      const capital = 1200000; // 1 200 000 XOF
      const tauxAnnuel = 12; // 12% annuel (1% mensuel)
      const dureeMois = 12;

      const schedule = calculateAmortizationSchedule(capital, tauxAnnuel, dureeMois);

      expect(schedule).toHaveLength(12);
      expect(schedule[0].numero).toBe(1);
      expect(schedule[11].numero).toBe(12);

      // La somme des parts de capital remboursées doit égaler exactement le capital emprunté
      const totalCapitalRembourse = schedule.reduce((sum, item) => sum + item.capital, 0);
      expect(totalCapitalRembourse).toBe(capital);

      // Le capital restant dû à la dernière mensualité doit être à zéro
      expect(schedule[11].capitalRestant).toBe(0);

      // Toutes les mensualités doivent avoir le statut 'prevu' initialement
      expect(schedule.every((i) => i.statut === 'prevu')).toBe(true);
    });

    it('Gère correctement le cas d’un prêt à taux zéro (0%)', () => {
      const capital = 600000;
      const schedule = calculateAmortizationSchedule(capital, 0, 6);

      expect(schedule).toHaveLength(6);
      schedule.forEach((inst) => {
        expect(inst.interet).toBe(0);
        expect(inst.total).toBe(100000);
      });
      const totalCap = schedule.reduce((sum, item) => sum + item.capital, 0);
      expect(totalCap).toBe(capital);
    });
  });

  describe('2. Calculs et Plafonnement de l’Equity (Prise de Participation)', () => {
    it('Calcule la valorisation pre-money et le coût exact pour un pourcentage souhaité', () => {
      const targetAmount = 10000000; // 10 millions XOF
      const totalEquityOffered = 20; // 20% du capital offert
      const requestedPercentage = 2; // 2% souhaité

      const valuation = calculateEquityValuation(targetAmount, totalEquityOffered, requestedPercentage);

      // Valorisation globale = 10 000 000 / (20 / 100) = 50 000 000 XOF
      expect(valuation.valorisation).toBe(50000000);
      // Prix pour 1% = 500 000 XOF
      expect(valuation.pricePerOnePercent).toBe(500000);
      // Coût pour 2% = 1 000 000 XOF
      expect(valuation.totalCost).toBe(1000000);
    });

    it('Valide rigoureusement le plafond des parts disponibles', () => {
      const projectData = {
        pourcentageTotalOffert: 15,
        pourcentageVendu: 12,
      };

      // Reste 3% disponible
      const checkValid = validateEquityAvailability(projectData, 2.5);
      expect(checkValid.valid).toBe(true);
      expect(checkValid.availablePercentage).toBe(3);

      // Dépassement des parts disponibles (demande 4%)
      const checkInvalid = validateEquityAvailability(projectData, 4);
      expect(checkInvalid.valid).toBe(false);
      expect(checkInvalid.error).toContain('Parts insuffisantes');
    });
  });

  describe('3. Investissement Crowdfunding via le Portefeuille Central', () => {
    it('Exécute une contribution Don débitée du portefeuille en 1 clic', async () => {
      // Créditer le portefeuille de l'investisseur
      await creditWallet({
        userId: investorId,
        amount: 50000,
        type: 'DEPOSIT',
        source: 'test_topup',
        sourceId: 'topup_01',
        description: 'Rechargement test investisseur',
      });

      const res = await processWalletContribution({
        userId: investorId,
        projectId: testProjectId,
        mode: 'don',
        amount: 25000,
      });

      expect(res.success).toBe(true);
      expect(res.contribution.type).toBe('don');
      expect(res.contribution.montant).toBe(25000);
      expect(res.contribution.paymentMethod).toBe('wallet');
      expect(res.walletRemainingBalance).toBe(25000);
    });

    it('Exécute un investissement Equity avec génération de référence de contrat', async () => {
      const res = await processWalletContribution({
        userId: investorId,
        projectId: testProjectId,
        mode: 'prise_part',
        amount: 10000,
        percentage: 1.5,
      });

      expect(res.success).toBe(true);
      expect(res.contribution.type).toBe('prise_part');
      expect(res.contribution.pourcentage).toBe(1.5);
      expect(res.contractReference).toBeDefined();
      expect(res.contractReference).toMatch(/^CTR-EQUITY-/);
    });

    it('Rejette la contribution si le solde du portefeuille est insuffisant', async () => {
      await expect(
        processWalletContribution({
          userId: investorId,
          projectId: testProjectId,
          mode: 'don',
          amount: 5000000, // Supérieur au solde
        })
      ).rejects.toThrow(/Solde insuffisant/i);
    });
  });

  describe('4. Remboursement d’une Échéance de Prêt via le Portefeuille Central', () => {
    it('Permet au porteur de projet de payer une échéance qui crédite atomiquement l’investisseur', async () => {
      // 1. Créer une échéance de test dans le store
      const db = readCrowdDB();
      const repaymentId = `rep_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      db.repayments.push({
        id: repaymentId,
        contributionId: 'contrib_123',
        projetId: testProjectId,
        investisseurId: investorId,
        porteurId,
        datePrevue: new Date().toISOString().split('T')[0],
        capital: 80000,
        interet: 20000,
        total: 100000,
        statut: 'prevu',
        retardJours: 0,
      });
      writeCrowdDB(db);

      // 2. Approvisionner le portefeuille de l'emprunteur (porteur)
      await creditWallet({
        userId: porteurId,
        amount: 150000,
        type: 'DEPOSIT',
        source: 'repayment_fund',
        sourceId: 'fund_01',
        description: 'Fonds pour rembourser mensualité',
      });

      // Solde initial de l'investisseur
      const investorInitial = (await getOrCreateWallet(investorId)).availableBalance;

      // 3. Règlement de l'échéance par le porteur
      const payResult = await processWalletLoanRepayment({
        porteurUserId: porteurId,
        repaymentId,
      });

      expect(payResult.success).toBe(true);
      expect(payResult.amount).toBe(100000);

      // Vérifier que l'investisseur a bien été crédité de 100 000 XOF
      const investorUpdated = await getOrCreateWallet(investorId);
      expect(investorUpdated.availableBalance).toBe(investorInitial + 100000);

      // Tentative de re-règlement de la même échéance
      await expect(
        processWalletLoanRepayment({
          porteurUserId: porteurId,
          repaymentId,
        })
      ).rejects.toThrow(/déjà réglée/i);
    });
  });

  describe('5. Reversement des Fonds Collectés (Payout) et Prélèvement Commission', () => {
    it('Applique la commission plateforme et crédite le net sur le portefeuille du porteur', async () => {
      // 1. Initialiser la demande de reversement dans le store de test
      const db = readCrowdDB();
      const testPayoutId = `payout_test_${Date.now()}`;
      if (!(db as any).payout_requests) (db as any).payout_requests = [];
      (db as any).payout_requests.push({
        id: testPayoutId,
        project_id: testProjectId,
        porteur_id: porteurId,
        gross_amount: 5000000,
        commission_rate: 4,
        commission_amount: 200000,
        net_amount: 4800000,
        status: 'requested',
      });
      writeCrowdDB(db);

      const porteurInitial = (await getOrCreateWallet(porteurId)).availableBalance;

      const payoutResult = await processPayoutApproval({
        adminUserId: adminId,
        payoutId: testPayoutId,
        approve: true,
        adminNote: 'Campagne achevée avec succès',
      });

      expect(payoutResult.success).toBe(true);
      expect(payoutResult.status).toBe('approved');
      expect(payoutResult.netAmountCredited).toBe(4800000); // 5M - 4% commission (200k) = 4.8M

      // Vérifier le crédit sur le portefeuille du porteur
      const porteurUpdated = await getOrCreateWallet(porteurId);
      expect(porteurUpdated.availableBalance).toBe(porteurInitial + 4800000);
    });
  });
});
