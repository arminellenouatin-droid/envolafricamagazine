import { formatMoney, type CurrencyRates } from "@/lib/currency";

export type VisitorLocale = {
  country: string;
  countryCode: string;
  city: string | null;
  language: string;
  currency: string;
  source?: string;
  isManual?: boolean;
};

export const DEFAULT_VISITOR_LOCALE: VisitorLocale = {
  country: "Bénin",
  countryCode: "BJ",
  city: null,
  language: "fr",
  currency: "XOF",
  source: "fallback",
  isManual: false,
};

export function normalizeVisitorLocale(
  value: Partial<VisitorLocale> | null | undefined,
  existing?: VisitorLocale | null
): VisitorLocale {
  const current = existing ?? (typeof window !== "undefined" ? readPersistedVisitorLocale() : null);
  const isIncomingAutomated = value?.source === "vercel" || value?.source === "fallback" || value?.source === "simulation";

  // Détecter si le pays détecté a changé (ex: déplacement physique ou activation/changement de serveur VPN)
  const incomingCountryCode = typeof value?.countryCode === "string" && value.countryCode ? value.countryCode.trim().toUpperCase() : null;
  const previousCountryCode = typeof current?.countryCode === "string" && current.countryCode ? current.countryCode.trim().toUpperCase() : null;
  const countryChanged = Boolean(incomingCountryCode && previousCountryCode && incomingCountryCode !== previousCountryCode);

  // Le verrouillage manuel ne s'applique que si l'utilisateur est toujours dans le même pays.
  // S'il change de pays (VPN ou voyage), le site s'adapte automatiquement à son nouveau pays !
  const userLocked = Boolean(current?.isManual) && !countryChanged;

  const finalLanguage =
    userLocked && isIncomingAutomated && current?.language
      ? current.language
      : typeof value?.language === "string" && value.language
      ? value.language.toLowerCase().split("-")[0]
      : current?.language || DEFAULT_VISITOR_LOCALE.language;

  const finalCurrency =
    userLocked && isIncomingAutomated && current?.currency
      ? current.currency
      : typeof value?.currency === "string" && value.currency
      ? value.currency.toUpperCase()
      : current?.currency || DEFAULT_VISITOR_LOCALE.currency;

  const isManual = value?.isManual ?? (userLocked && isIncomingAutomated ? true : false);

  return {
    country: typeof value?.country === "string" && value.country ? value.country : current?.country || DEFAULT_VISITOR_LOCALE.country,
    countryCode: incomingCountryCode || previousCountryCode || DEFAULT_VISITOR_LOCALE.countryCode,
    city: typeof value?.city === "string" && value.city ? value.city : current?.city || null,
    language: finalLanguage,
    currency: finalCurrency,
    source: value?.source || current?.source || DEFAULT_VISITOR_LOCALE.source,
    isManual,
  };
}

export function persistVisitorLocale(locale: VisitorLocale) {
  if (typeof window === "undefined") return;
  const normalized = normalizeVisitorLocale(locale);
  localStorage.setItem("ea_visitor_locale", JSON.stringify(normalized));
  document.cookie = `ea_country=${encodeURIComponent(normalized.countryCode)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  document.cookie = `ea_language=${encodeURIComponent(normalized.language)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  document.cookie = `ea_currency=${encodeURIComponent(normalized.currency)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  document.documentElement.lang = normalized.language;
  window.dispatchEvent(new CustomEvent("ea-locale-updated", { detail: normalized }));
}

export function readPersistedVisitorLocale(): VisitorLocale {
  if (typeof window === "undefined") return DEFAULT_VISITOR_LOCALE;
  try {
    const saved = localStorage.getItem("ea_visitor_locale");
    return saved ? (JSON.parse(saved) as VisitorLocale) : DEFAULT_VISITOR_LOCALE;
  } catch {
    return DEFAULT_VISITOR_LOCALE;
  }
}

export function formatVisitorPrice(amountInBaseCurrency: number, locale: VisitorLocale, rates?: CurrencyRates, baseCurrency = "XOF") {
  const currency = locale.currency || baseCurrency;
  return formatMoney(amountInBaseCurrency, currency, locale.language || "fr", rates);
}
