/**
 * Configuration centralisée des passerelles de paiement (Moneroo & Chariow).
 * 
 * RÈGLE D'ARBITRAGE :
 * - Les 6 pays UEMOA avec intégration native Mobile Money (MTN, Moov, Orange, Wave, Celtiis)
 *   sont éligibles à Moneroo.
 * - Tout pays en dehors de cette liste est orienté de manière obligatoire et verrouillée
 *   vers le circuit international Chariow (CB Visa/Mastercard, paiements diaspora et monde).
 */

export const MONEROO_SUPPORTED_COUNTRIES = [
  "BJ", // Bénin
  "CI", // Côte d'Ivoire
  "SN", // Sénégal
  "TG", // Togo
  "BF", // Burkina Faso
  "ML", // Mali
] as const;

export type MonerooSupportedCountry = (typeof MONEROO_SUPPORTED_COUNTRIES)[number];

export type PaymentGateway = "moneroo" | "chariow";

/**
 * Vérifie si un code pays ISO fait partie des 6 pays officiellement pris en charge par Moneroo.
 */
export function isMonerooSupportedCountry(countryCode?: string | null): boolean {
  if (!countryCode || typeof countryCode !== "string") return false;
  const clean = countryCode.trim().toUpperCase();
  return (MONEROO_SUPPORTED_COUNTRIES as readonly string[]).includes(clean);
}

/**
 * Détermine la passerelle recommandée et autorisée pour un pays donné.
 */
export function getRecommendedGateway(countryCode?: string | null): PaymentGateway {
  return isMonerooSupportedCountry(countryCode) ? "moneroo" : "chariow";
}
