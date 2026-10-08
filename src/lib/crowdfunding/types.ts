export type CrowdfundingMode = 'don' | 'prise_part' | 'pret';

export type CrowdfundingProjectStatus =
  | 'draft'
  | 'en_attente_validation'
  | 'en_cours'
  | 'objectif_atteint'
  | 'objectif_depasse'
  | 'finance'
  | 'en_remboursement'
  | 'termine'
  | 'cloture'
  | 'annule';

export interface AmortizationInstallment {
  numero: number;
  datePrevue: string;
  datePayee?: string;
  capital: number;
  interet: number;
  total: number;
  capitalRestant: number;
  statut: 'prevu' | 'paye' | 'retard';
  retardJours: number;
}

export interface CrowdfundingProjectDetails {
  id: string;
  nom: string;
  secteur: string;
  description: string;
  porteurId: string;
  pays: string;
  montantRecherche: number;
  montantCollecte: number;
  niveauRisque: 'faible' | 'moyen' | 'élevé';
  dureeJours: number;
  dureeMois?: number;
  typesFinancement: CrowdfundingMode[];
  statut: CrowdfundingProjectStatus;
  tauxInteret?: number; // Pour les prêts (% annuel)
  pourcentageTotalOffert?: number; // Total des parts offertes (% du capital, ex 15%)
  pourcentageVendu?: number; // Parts déjà acquises (% du capital, ex 6%)
  pourcentageDisponible?: number; // Parts encore disponibles (% du capital)
  valorisation?: number;
  dateFin: string;
  investisseurs: number;
  repartition: {
    dons: number;
    prise_part: number;
    pret: number;
  };
  escrowEnabled?: boolean;
}

export interface CrowdfundingContributionRecord {
  id: string;
  projetId: string;
  projetNom?: string;
  investisseurId: string;
  investisseurNom?: string;
  type: CrowdfundingMode;
  montant: number;
  currency: string;
  pourcentage?: number;
  contratReference?: string;
  tauxInteret?: number;
  calendrierRemboursement?: AmortizationInstallment[];
  paymentMethod: 'wallet' | 'moneroo';
  walletTransactionId?: string;
  providerPaymentId?: string;
  createdAt: string;
}

export interface CrowdfundingRepaymentRecord {
  id: string;
  contributionId: string;
  projetId: string;
  investisseurId: string;
  porteurId: string;
  numeroEcheance: number;
  datePrevue: string;
  datePayee?: string;
  capital: number;
  interet: number;
  total: number;
  statut: 'prevu' | 'paye' | 'retard';
  retardJours: number;
  transactionReference?: string;
}

export interface CrowdfundingPayoutRecord {
  id: string;
  projetId: string;
  porteurId: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  status: 'requested' | 'approved' | 'paid' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  paidAt?: string;
  note?: string;
}
