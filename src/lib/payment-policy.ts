/**
 * Politique financière commune : aucun paiement XOF inférieur à 100 F CFA
 * ne doit être initialisé, quel que soit le module de l’écosystème.
 */
export const MIN_PAYMENT_AMOUNT_XOF = 100;

export function validateMinimumPaymentAmount(amount: number, minimum = MIN_PAYMENT_AMOUNT_XOF) {
  if (!Number.isInteger(amount) || amount < minimum) {
    return `Le montant minimum accepté est de ${minimum.toLocaleString("fr-FR")} F CFA.`;
  }
  return null;
}
