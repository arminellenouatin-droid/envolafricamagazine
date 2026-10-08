import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { readCrowdDB, writeCrowdDB } from '@/lib/crowdfunding-db';
import { calculateCommission, getCommissionRate } from '@/lib/crowdfunding-commission';
import { creditWallet, debitWallet, getOrCreateWallet } from '@/lib/wallet/financial-core';
import type {
  AmortizationInstallment,
  CrowdfundingContributionRecord,
  CrowdfundingMode,
  CrowdfundingPayoutRecord,
  CrowdfundingProjectDetails,
  CrowdfundingRepaymentRecord,
} from './types';

/**
 * Générateur officiel de tableau d'amortissement à annuités constantes
 * Formule : M = (K * r) / (1 - (1 + r)^-n)
 */
export function calculateAmortizationSchedule(
  capital: number,
  annualRatePercent: number,
  durationMonths: number = 12
): AmortizationInstallment[] {
  const cap = Math.max(1000, Math.round(Number(capital) || 0));
  const rate = Math.max(0, Number(annualRatePercent) || 0);
  const n = Math.max(1, Math.round(Number(durationMonths) || 12));

  const monthlyRate = rate / 100 / 12;
  const monthlyPayment =
    monthlyRate === 0
      ? cap / n
      : (cap * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));

  const installments: AmortizationInstallment[] = [];
  let remainingCapital = cap;
  const now = new Date();

  for (let i = 1; i <= n; i++) {
    const interest = Math.round(remainingCapital * monthlyRate);
    let principal = Math.round(monthlyPayment - interest);

    // Ajustement de la dernière mensualité pour solder exactement le capital
    if (i === n || principal > remainingCapital) {
      principal = remainingCapital;
    }

    const total = principal + interest;
    remainingCapital = Math.max(0, remainingCapital - principal);

    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() + i);

    installments.push({
      numero: i,
      datePrevue: dueDate.toISOString().split('T')[0],
      capital: principal,
      interet: interest,
      total,
      capitalRestant: remainingCapital,
      statut: 'prevu',
      retardJours: 0,
    });
  }

  return installments;
}

/**
 * Calculateur de valorisation et parts sociales pour l'Equity
 */
export function calculateEquityValuation(
  targetAmount: number,
  totalEquityOfferedPercent: number = 20,
  requestedPercentage: number = 1
) {
  const target = Math.max(1000, Math.round(Number(targetAmount) || 0));
  const totalEquity = Math.max(0.1, Math.min(100, Number(totalEquityOfferedPercent) || 20));
  const requested = Math.max(0.01, Math.min(totalEquity, Number(requestedPercentage) || 1));

  // Valorisation pre-money de l'entreprise = Objectif de levée / % offert
  const valorisation = Math.round((target / (totalEquity / 100)) * 100) / 100;
  const pricePerOnePercent = Math.round((valorisation / 100) * 100) / 100;
  const totalCost = Math.round((valorisation * requested) / 100);

  return {
    targetAmount: target,
    totalEquityOfferedPercent: totalEquity,
    requestedPercentage: requested,
    valorisation,
    pricePerOnePercent,
    totalCost,
  };
}

/**
 * Validation de disponibilité des parts sociales d'un projet
 */
export function validateEquityAvailability(
  project: { pourcentageTotalOffert?: number; pourcentageVendu?: number },
  requestedPercentage: number
): { valid: boolean; availablePercentage: number; error?: string } {
  const totalOffered = Number(project.pourcentageTotalOffert ?? 20);
  const alreadySold = Number(project.pourcentageVendu ?? 0);
  const available = Math.max(0, Math.round((totalOffered - alreadySold) * 100) / 100);

  if (requestedPercentage <= 0) {
    return { valid: false, availablePercentage: available, error: 'Pourcentage invalide' };
  }

  if (requestedPercentage > available) {
    return {
      valid: false,
      availablePercentage: available,
      error: `Parts insuffisantes : ${available}% disponibles (${requestedPercentage}% demandés)`,
    };
  }

  return { valid: true, availablePercentage: available };
}

/**
 * Exécution d'une contribution Crowdfunding via le Portefeuille Central Envol Africa
 */
export async function processWalletContribution(params: {
  userId: string;
  projectId: string;
  mode: CrowdfundingMode;
  amount: number;
  percentage?: number;
  idempotencyKey?: string;
}): Promise<{
  success: boolean;
  contribution: CrowdfundingContributionRecord;
  walletRemainingBalance: number;
  contractReference?: string;
}> {
  const { userId, projectId, mode, amount, percentage, idempotencyKey } = params;

  if (!userId) throw new Error('Utilisateur non connecté');
  if (!projectId) throw new Error('Identifiant du projet requis');
  if (!amount || amount <= 0) throw new Error('Montant de contribution invalide');

  const supabase = getSupabaseAdmin();
  const contributionId = crypto.randomUUID();
  const contractRef =
    mode === 'prise_part'
      ? `CTR-EQUITY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
      : undefined;

  let projectNom = 'Projet Crowdfunding';
  let projectInterest = 8;
  let projectDuration = 12;

  // 1. Récupération et validation du projet
  if (supabase) {
    const { data: proj, error: projErr } = await supabase
      .from('crowdfunding_projects')
      .select('id, nom, montant_collecte, montant_recherche, taux_interet, duree_jours, statut')
      .eq('id', projectId)
      .maybeSingle();

    if (projErr) throw projErr;
    if (!proj) throw new Error('Projet introuvable');
    projectNom = proj.nom;
    projectInterest = Number(proj.taux_interet || 8);
    projectDuration = Math.max(1, Math.ceil(Number(proj.duree_jours || 365) / 30));
  } else {
    const db = readCrowdDB();
    const proj = db.projets.find((p) => p.id === projectId);
    if (!proj) throw new Error('Projet introuvable');
    projectNom = proj.nom;
    projectInterest = Number(proj.tauxInteret || 8);
    projectDuration = Math.max(1, Math.ceil(Number(proj.dureeJours || 365) / 30));
  }

  // 2. Débit atomique du Portefeuille Central de l'investisseur
  const txType = mode === 'don' ? 'CROWDFUNDING_DONATION' : 'CROWDFUNDING_INVESTMENT';
  const debitResult = await debitWallet({
    userId,
    amount,
    type: txType,
    source: 'crowdfunding_contribution',
    sourceId: contributionId,
    description: `Contribution ${mode.toUpperCase()} au projet "${projectNom}"`,
    reference: `CF-DEBIT-${Date.now()}-${contributionId.slice(0, 8)}`,
    idempotencyKey,
    metadata: {
      projectId,
      mode,
      percentage: percentage || null,
      contractReference: contractRef || null,
    },
  });

  // 3. Calcul de l'échéancier si prêt
  const schedule =
    mode === 'pret'
      ? calculateAmortizationSchedule(amount, projectInterest, projectDuration)
      : undefined;

  const contributionRecord: CrowdfundingContributionRecord = {
    id: contributionId,
    projetId: projectId,
    projetNom: projectNom,
    investisseurId: userId,
    type: mode,
    montant: amount,
    currency: 'XOF',
    pourcentage: mode === 'prise_part' ? percentage : undefined,
    contratReference: contractRef,
    tauxInteret: mode === 'pret' ? projectInterest : undefined,
    calendrierRemboursement: schedule,
    paymentMethod: 'wallet',
    walletTransactionId: debitResult.transactionId,
    createdAt: new Date().toISOString(),
  };

  // 4. Persistance dans la base de données
  if (supabase) {
    try {
      const { settleCrowdfundingContributionSupabase } = await import(
        '@/lib/financial-settlement-supabase'
      );
      await settleCrowdfundingContributionSupabase(
        {
          project_id: projectId,
          contribution_id: contributionId,
          mode,
          amount_xof: amount,
          percentage,
          user_id: userId,
          contract_reference: contractRef,
        },
        `wallet_${contributionId}`
      );
    } catch (e) {
      console.warn('Persistance Supabase settlement warning:', e);
    }
  } else {
    const db = readCrowdDB();
    const proj = db.projets.find((p) => p.id === projectId);
    if (proj) {
      proj.montantCollecte += amount;
      proj.investisseurs += 1;
      if (mode === 'don') proj.repartition.dons += amount;
      else if (mode === 'prise_part') {
        proj.repartition.prise_part += amount;
        proj.pourcentageVendu = (proj.pourcentageVendu || 0) + (percentage || 0);
      } else if (mode === 'pret') {
        proj.repartition.pret += amount;
      }
      if (proj.montantCollecte >= proj.montantRecherche) {
        proj.statut = 'objectif_atteint';
      }
    }
    db.contributions.push({
      id: contributionId,
      projetId: projectId,
      investisseurId: userId,
      type: mode,
      montant: amount,
      pourcentage: percentage,
      tauxInteret: mode === 'pret' ? projectInterest : undefined,
      contratPdf: contractRef,
      createdAt: new Date().toISOString(),
    });

    if (schedule) {
      const repayments: any[] = schedule.map((inst) => ({
        id: crypto.randomUUID(),
        contributionId,
        projetId: projectId,
        investisseurId: userId,
        porteurId: proj?.porteurId || 'porteur',
        numeroEcheance: inst.numero,
        datePrevue: inst.datePrevue,
        capital: inst.capital,
        interet: inst.interet,
        total: inst.total,
        statut: 'prevu',
        retardJours: 0,
      }));
      db.repayments.push(...repayments);
    }
    writeCrowdDB(db);
  }

  return {
    success: true,
    contribution: contributionRecord,
    walletRemainingBalance: debitResult.wallet.availableBalance,
    contractReference: contractRef,
  };
}

/**
 * Remboursement d'une échéance de prêt par le porteur de projet via le Portefeuille Central
 */
export async function processWalletLoanRepayment(params: {
  porteurUserId: string;
  repaymentId: string;
}): Promise<{
  success: boolean;
  repaymentId: string;
  amount: number;
  paidAt: string;
  investisseurId: string;
}> {
  const { porteurUserId, repaymentId } = params;

  if (!porteurUserId) throw new Error('Porteur de projet non authentifié');
  if (!repaymentId) throw new Error('Identifiant d’échéance manquant');

  const supabase = getSupabaseAdmin();
  let repaymentRow: any = null;

  if (supabase) {
    const { data, error } = await supabase
      .from('crowdfunding_repayments')
      .select('*')
      .eq('id', repaymentId)
      .maybeSingle();

    if (error) throw error;
    repaymentRow = data;
  } else {
    const db = readCrowdDB();
    repaymentRow = db.repayments.find((r) => r.id === repaymentId);
  }

  if (!repaymentRow) throw new Error('Échéance de prêt introuvable');
  if (repaymentRow.statut === 'paye') throw new Error('Cette échéance est déjà réglée');

  const amount = Number(repaymentRow.total || 0);
  const investisseurId = String(repaymentRow.investisseur_id || repaymentRow.investisseurId);
  const now = new Date().toISOString();

  // 1. Débit du portefeuille de l'emprunteur (porteur)
  const debitRes = await debitWallet({
    userId: porteurUserId,
    amount,
    type: 'CROWDFUNDING_REPAYMENT',
    source: 'crowdfunding_repayment',
    sourceId: repaymentId,
    description: `Règlement de l'échéance de prêt #${repaymentId}`,
    reference: `REP-DEBIT-${Date.now()}-${repaymentId.slice(0, 8)}`,
  });

  // 2. Crédit atomique direct sur le portefeuille de l'investisseur
  await creditWallet({
    userId: investisseurId,
    amount,
    type: 'CROWDFUNDING_REPAYMENT',
    source: 'crowdfunding_repayment',
    sourceId: repaymentId,
    description: `Échéance de prêt perçue pour le projet #${repaymentRow.project_id || repaymentRow.projetId}`,
    reference: `REP-CREDIT-${Date.now()}-${repaymentId.slice(0, 8)}`,
  });

  // 3. Mise à jour de l'échéance
  if (supabase) {
    await supabase
      .from('crowdfunding_repayments')
      .update({
        statut: 'paye',
        date_payee: now,
        retard_jours: 0,
      })
      .eq('id', repaymentId);
  } else {
    const db = readCrowdDB();
    const rep = db.repayments.find((r) => r.id === repaymentId);
    if (rep) {
      rep.statut = 'paye';
      rep.datePayee = now;
      rep.retardJours = 0;
      writeCrowdDB(db);
    }
  }

  return {
    success: true,
    repaymentId,
    amount,
    paidAt: now,
    investisseurId,
  };
}

/**
 * Validation et déblocage des fonds collectés (Payout) vers le Portefeuille Central du Porteur
 */
export async function processPayoutApproval(params: {
  adminUserId: string;
  payoutId: string;
  approve: boolean;
  adminNote?: string;
}): Promise<{
  success: boolean;
  payoutId: string;
  status: 'approved' | 'rejected';
  netAmountCredited?: number;
}> {
  const { adminUserId, payoutId, approve, adminNote } = params;
  if (!adminUserId) throw new Error('Administrateur non authentifié');

  const supabase = getSupabaseAdmin();
  let payout: any = null;

  if (supabase) {
    const { data, error } = await supabase
      .from('crowdfunding_payout_requests')
      .select('*')
      .eq('id', payoutId)
      .maybeSingle();

    if (error) throw error;
    payout = data;
  } else {
    const db = readCrowdDB();
    payout =
      (db as any).payout_requests?.find((r: any) => r.id === payoutId) ||
      (db as any).retraits?.find((r: any) => r.id === payoutId);
  }

  if (!payout) throw new Error('Demande de reversement introuvable');
  if (payout.status !== 'requested') throw new Error(`Statut actuel incompatible : ${payout.status}`);

  const now = new Date().toISOString();

  if (!approve) {
    if (supabase) {
      await supabase
        .from('crowdfunding_payout_requests')
        .update({ status: 'rejected', reviewed_at: now, note: adminNote })
        .eq('id', payoutId);
    }
    return { success: true, payoutId, status: 'rejected' };
  }

  const netAmount = Number(payout.net_amount || payout.netAmount || 0);
  const porteurId = String(payout.porteur_id || payout.porteurId);

  // Crédit atomique sur le portefeuille central du porteur de projet
  await creditWallet({
    userId: porteurId,
    amount: netAmount,
    type: 'CROWDFUNDING_PAYOUT',
    source: 'crowdfunding_payout',
    sourceId: payoutId,
    description: `Reversement net des fonds levés pour le projet #${payout.project_id || payout.projectId}`,
    reference: `PAYOUT-CRED-${Date.now()}-${payoutId.slice(0, 8)}`,
    metadata: {
      grossAmount: payout.gross_amount,
      commissionAmount: payout.commission_amount,
      adminUserId,
    },
  });

  if (supabase) {
    await supabase
      .from('crowdfunding_payout_requests')
      .update({
        status: 'approved',
        paid_at: now,
        reviewed_at: now,
        note: adminNote || 'Approuvé par administrateur',
      })
      .eq('id', payoutId);

    await supabase
      .from('crowdfunding_projects')
      .update({ statut: 'finance' })
      .eq('id', payout.project_id);
  }

  return {
    success: true,
    payoutId,
    status: 'approved',
    netAmountCredited: netAmount,
  };
}
