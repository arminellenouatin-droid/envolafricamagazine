import { formatMoney, type CurrencyRates } from "@/lib/currency";

export type VisitorLocale = {
  country: string;
  countryCode: string;
  city: string | null;
  language: string;
  currency: string;
  source?: string;
};

export const DEFAULT_VISITOR_LOCALE: VisitorLocale = {
  country: "Bénin",
  countryCode: "BJ",
  city: null,
  language: "fr",
  currency: "XOF",
  source: "fallback",
};

export function normalizeVisitorLocale(value: Partial<VisitorLocale> | null | undefined): VisitorLocale {
  return {
    country: typeof value?.country === "string" && value.country ? value.country : DEFAULT_VISITOR_LOCALE.country,
    countryCode: typeof value?.countryCode === "string" && value.countryCode ? value.countryCode.toUpperCase() : DEFAULT_VISITOR_LOCALE.countryCode,
    city: typeof value?.city === "string" && value.city ? value.city : null,
    language: typeof value?.language === "string" && value.language ? value.language.toLowerCase().split("-")[0] : DEFAULT_VISITOR_LOCALE.language,
    currency: typeof value?.currency === "string" && value.currency ? value.currency.toUpperCase() : DEFAULT_VISITOR_LOCALE.currency,
    source: value?.source || DEFAULT_VISITOR_LOCALE.source,
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
    return saved ? normalizeVisitorLocale(JSON.parse(saved)) : DEFAULT_VISITOR_LOCALE;
  } catch {
    return DEFAULT_VISITOR_LOCALE;
  }
}

export function formatVisitorPrice(amountInBaseCurrency: number, locale: VisitorLocale, rates?: CurrencyRates, baseCurrency = "XOF") {
  const currency = locale.currency || baseCurrency;
  return formatMoney(amountInBaseCurrency, currency, locale.language || "fr", rates);
}
