export type Volet = "MAGAZINE" | "JOBS" | "MARKETPLACE" | "AWARDS_ADS";

// ============================================================================
// PROGRAMME MAGAZINE (MLM matrice 5x5)
// ============================================================================

export const COMMISSION_RATES: Record<Volet, number> = {
  MAGAZINE: 0.15,
  JOBS: 0.2,
  MARKETPLACE: 0.1,
  AWARDS_ADS: 0.1,
};

// Volets actifs au lancement pour le programme Magazine.
export const ACTIVE_VOLETS: Volet[] = ["MAGAZINE"];

// Répartition de l'enveloppe de commission Magazine (doit toujours totaliser 1.0)
export const NETWORK_SHARE = 0.7; // 70% reversé au réseau (5 générations)
export const NETWORK_SIZE_FUND_SHARE = 0.1; // 10% fonds primes taille de réseau (dès N3)
export const CEREMONY_FUND_SHARE = 0.2; // 20% fonds prix cérémonie annuelle

// Répartition des 70% "réseau" entre les 5 générations
export const LEVEL_RATES: Record<number, number> = {
  1: 0.4,  // 40% de la part réseau
  2: 0.25, // 25% de la part réseau
  3: 0.15, // 15% de la part réseau
  4: 0.12, // 12% de la part réseau
  5: 0.08, // 8% de la part réseau
};

export const MAX_LEVELS = 5;
export const MAX_DIRECT_REFERRALS = 5; // matrice forcée 5x5
export const NETWORK_SIZE_PRIZE_MIN_LEVEL = 3; // profondeur mini pour prime réseau

// ============================================================================
// PROGRAMME MARKETPLACE (affiliation produit à produit, 1 seul niveau)
// ============================================================================

export const MARKETPLACE_PLATFORM_FEE = 0.08; // 8% prélevés par la plateforme

// ============================================================================
// COMMUN AUX DEUX PROGRAMMES
// ============================================================================

export const WITHDRAWAL_THRESHOLD = 10_000; // 10 000 XOF — seuil unique combiné
export const CURRENCY = "XOF";
export const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://www.envolafrica.site";

// Garde-fous de cohérence
if (
  Math.abs(
    NETWORK_SHARE + NETWORK_SIZE_FUND_SHARE + CEREMONY_FUND_SHARE - 1
  ) > 1e-9
) {
  throw new Error(
    "affiliation/constants: NETWORK_SHARE + NETWORK_SIZE_FUND_SHARE + CEREMONY_FUND_SHARE doit valoir 1"
  );
}
if (
  Math.abs(
    Object.values(LEVEL_RATES).reduce((a, b) => a + b, 0) - 1
  ) > 1e-9
) {
  throw new Error(
    "affiliation/constants: la somme des LEVEL_RATES doit valoir 1"
  );
}
