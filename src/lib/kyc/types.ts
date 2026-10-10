export type KYCStatus = "non_soumis" | "en_attente" | "approuve" | "rejete";

export type KYCProfileType = "particulier" | "entreprise";

export type KYCDocumentType =
  | "cni"
  | "passeport"
  | "permis"
  | "selfie"
  | "rccm"
  | "ifu"
  | "statuts"
  | "rib";

export interface KYCDocumentItem {
  type: KYCDocumentType;
  label: string;
  url: string;
  uploadedAt: string;
  fileName?: string;
  fileSize?: number;
}

export interface KYCProfile {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  profileType: KYCProfileType;
  // Données personnelles (obligatoires)
  nom: string;
  prenom: string;
  dateNaissance?: string;
  nationalite?: string;
  paysResidence: string;
  adresse: string;
  telephone: string;
  pieceIdentiteType: "cni" | "passeport" | "permis";
  pieceIdentiteNumero: string;
  pieceIdentiteUrl: string;
  selfieUrl: string;

  // Données entreprise (obligatoires si profileType === 'entreprise' / Marketplace vendeurs sociétés)
  nomEntreprise?: string;
  numeroRccm?: string;
  numeroIfu?: string;
  adresseSiege?: string;
  representantLegal?: string;
  piecesEntrepriseUrls?: string[];

  // Statut & gouvernance KYC
  statut: KYCStatus;
  motifRejet?: string;
  dateSoumission: string;
  dateVerification?: string;
  verifiePar?: string;
  ipSoumission?: string;
  userAgentSoumission?: string;

  // Univers d'application
  scopes: Array<"wallet" | "affiliate" | "awards" | "wab_creator" | "marketplace_vendor">;
}

export type AMLMovementType =
  | "paiement_commande"
  | "remboursement_client"
  | "retrait_wallet"
  | "retrait_affiliation"
  | "gain_awards"
  | "monetisation_wab"
  | "payout_marketplace";

export interface AMLAuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  type: AMLMovementType;
  montant: number;
  devise: string;
  ipAddress: string;
  userAgent?: string;
  kycVerified: boolean;
  statut: "succes" | "echec" | "bloque_kyc" | "en_attente";
  motif?: string;
  referenceExterne?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface SubmitKYCInput {
  profileType: KYCProfileType;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  nationalite?: string;
  paysResidence: string;
  adresse: string;
  telephone: string;
  pieceIdentiteType: "cni" | "passeport" | "permis";
  pieceIdentiteNumero: string;
  pieceIdentiteUrl: string;
  selfieUrl: string;
  nomEntreprise?: string;
  numeroRccm?: string;
  numeroIfu?: string;
  adresseSiege?: string;
  representantLegal?: string;
  piecesEntrepriseUrls?: string[];
  scopes?: Array<"wallet" | "affiliate" | "awards" | "wab_creator" | "marketplace_vendor">;
}
