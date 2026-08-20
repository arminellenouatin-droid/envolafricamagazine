/**
 * Socle monétaire Envol Africa.
 * Tous les montants métiers sont conservés dans leur devise source ; l’interface
 * peut ensuite les convertir pour l’affichage à partir d’un taux vérifié.
 */

export type CurrencyCode = string;

export type CurrencyRates = Record<CurrencyCode, number>;

export const BASE_CURRENCY: CurrencyCode = "XOF";

export const SUPPORTED_CURRENCIES = [
  "XOF", "XAF", "GHS", "NGN", "GMD", "KES", "RWF", "TZS", "UGX", "ZAR",
  "MAD", "DZD", "EGP", "ETB", "EUR", "GBP", "USD", "CAD", "AED", "INR",
] as const;

export function normalizeCurrency(value: unknown, fallback = BASE_CURRENCY): CurrencyCode {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  return code && SUPPORTED_CURRENCIES.includes(code as typeof SUPPORTED_CURRENCIES[number]) ? code : fallback;
}

/** Convertit uniquement avec un taux fourni par une source vérifiée. */
export function convertFromBase(amount: number, targetCurrency: CurrencyCode, rates: CurrencyRates): number {
  if (!Number.isFinite(amount)) return 0;
  const target = normalizeCurrency(targetCurrency);
  if (target === BASE_CURRENCY) return amount;
  const rate = Number(rates[target]);
  if (!Number.isFinite(rate) || rate <= 0) return amount;
  return amount * rate;
}

export function formatMoney(amount: number, currency: CurrencyCode, language = "fr", rates?: CurrencyRates): string {
  const target = normalizeCurrency(currency);
  const converted = rates ? convertFromBase(amount, target, rates) : amount;
  try {
    return new Intl.NumberFormat(language || "fr", {
      style: "currency",
      currency: target,
      maximumFractionDigits: target === "XOF" || target === "XAF" ? 0 : 2,
    }).format(converted);
  } catch {
    return `${Math.round(converted).toLocaleString(language || "fr")} ${target}`;
  }
}
