import { formatMoney, normalizeCurrency, type CurrencyRates, BASE_CURRENCY } from "@/lib/currency";
import { normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";
import { getCountryInfo } from "@/lib/country-data";

export type VisitorLocale = {
  country: string;
  countryCode: string;
  city: string | null;
  language: string;
  currency: string;
  languageSource: "auto" | "manual";
  currencySource: "auto" | "manual";
  countrySource: "auto" | "manual";
  source?: string;
  isManual?: boolean;
};

export const DEFAULT_VISITOR_LOCALE: VisitorLocale = {
  country: "Bénin",
  countryCode: "BJ",
  city: null,
  language: "fr",
  currency: "XOF",
  languageSource: "auto",
  currencySource: "auto",
  countrySource: "auto",
  source: "fallback",
  isManual: false,
};

/**
 * Normalise l'état de localisation du visiteur selon la règle absolue :
 * CHOIX MANUEL UTILISATEUR > PRÉFÉRENCE PERSISTÉE > DÉTECTION AUTOMATIQUE > VALEUR PAR DÉFAUT
 * 
 * L'indépendance Langue et Devise est strictement préservée :
 * Changer de langue ne modifie pas la devise, et inversement.
 */
export function normalizeVisitorLocale(
  value: Partial<VisitorLocale> | null | undefined,
  existing?: VisitorLocale | null
): VisitorLocale {
  const current = existing ?? (typeof window !== "undefined" ? readPersistedVisitorLocale() : null);

  // 1. GESTION DE LA LANGUE
  let finalLanguage: SupportedLanguage;
  let finalLanguageSource: "auto" | "manual";

  if (value?.languageSource === "manual" || (value?.isManual && value?.language && value.language !== current?.language)) {
    // Choix manuel explicite dans cette opération
    finalLanguage = normalizeLanguage(value.language);
    finalLanguageSource = "manual";
  } else if (current?.languageSource === "manual" || (current?.isManual && current?.language && (!value?.isManual || value?.language === current?.language))) {
    // Préférence manuelle antérieurement persistée : Prioritaire sur l'autodétection
    finalLanguage = normalizeLanguage(current.language);
    finalLanguageSource = "manual";
  } else if (value?.language) {
    // Détection automatique entrante
    finalLanguage = normalizeLanguage(value.language);
    finalLanguageSource = value.languageSource || "auto";
  } else {
    finalLanguage = current?.language ? normalizeLanguage(current.language) : normalizeLanguage(DEFAULT_VISITOR_LOCALE.language);
    finalLanguageSource = current?.languageSource || "auto";
  }

  // 2. GESTION DE LA DEVISE (Indépendante de la langue)
  let finalCurrency: string;
  let finalCurrencySource: "auto" | "manual";

  if (value?.currencySource === "manual" || (value?.isManual && value?.currency && value.currency !== current?.currency)) {
    // Choix manuel explicite de devise dans cette opération
    finalCurrency = normalizeCurrency(value.currency);
    finalCurrencySource = "manual";
  } else if (current?.currencySource === "manual" || (current?.isManual && current?.currency && (!value?.isManual || value?.currency === current?.currency))) {
    // Préférence manuelle de devise antérieurement persistée : Prioritaire sur l'autodétection
    finalCurrency = normalizeCurrency(current.currency);
    finalCurrencySource = "manual";
  } else if (value?.currency) {
    // Détection automatique entrante
    finalCurrency = normalizeCurrency(value.currency);
    finalCurrencySource = value.currencySource || "auto";
  } else {
    finalCurrency = current?.currency ? normalizeCurrency(current.currency) : DEFAULT_VISITOR_LOCALE.currency;
    finalCurrencySource = current?.currencySource || "auto";
  }

  // 3. GESTION DU PAYS
  let finalCountryCode: string;
  let finalCountry: string;
  let finalCountrySource: "auto" | "manual";

  if (value?.countrySource === "manual" || (value?.isManual && value?.countryCode && value.countryCode !== current?.countryCode)) {
    finalCountryCode = (value.countryCode || DEFAULT_VISITOR_LOCALE.countryCode).trim().toUpperCase();
    finalCountry = value.country || getCountryInfo(finalCountryCode).name;
    finalCountrySource = "manual";
  } else if (current?.countrySource === "manual") {
    finalCountryCode = current.countryCode;
    finalCountry = current.country;
    finalCountrySource = "manual";
  } else if (value?.countryCode) {
    finalCountryCode = value.countryCode.trim().toUpperCase();
    finalCountry = value.country || getCountryInfo(finalCountryCode).name;
    finalCountrySource = "auto";
  } else {
    finalCountryCode = current?.countryCode || DEFAULT_VISITOR_LOCALE.countryCode;
    finalCountry = current?.country || DEFAULT_VISITOR_LOCALE.country;
    finalCountrySource = current?.countrySource || "auto";
  }

  const finalCity = typeof value?.city === "string" ? value.city : current?.city ?? null;
  const isManual = finalLanguageSource === "manual" || finalCurrencySource === "manual" || finalCountrySource === "manual";

  return {
    country: finalCountry,
    countryCode: finalCountryCode,
    city: finalCity,
    language: finalLanguage,
    currency: finalCurrency,
    languageSource: finalLanguageSource,
    currencySource: finalCurrencySource,
    countrySource: finalCountrySource,
    source: value?.source || current?.source || DEFAULT_VISITOR_LOCALE.source,
    isManual,
  };
}

/**
 * Persiste la préférence utilisateur dans localStorage et cookies,
 * met à jour l'attribut lang du DOM et diffuse l'événement unique ea-locale-updated.
 */
export function persistVisitorLocale(locale: VisitorLocale) {
  if (typeof window === "undefined") return;
  const normalized = normalizeVisitorLocale(locale);

  try {
    localStorage.setItem("ea_visitor_locale", JSON.stringify(normalized));
  } catch {}

  const cookieMaxAge = 60 * 60 * 24 * 365; // 1 an
  document.cookie = `ea_country=${encodeURIComponent(normalized.countryCode)}; path=/; max-age=${cookieMaxAge}; SameSite=Lax`;
  document.cookie = `ea_language=${encodeURIComponent(normalized.language)}; path=/; max-age=${cookieMaxAge}; SameSite=Lax`;
  document.cookie = `ea_currency=${encodeURIComponent(normalized.currency)}; path=/; max-age=${cookieMaxAge}; SameSite=Lax`;

  try {
    document.documentElement.lang = normalized.language;
  } catch {}

  window.dispatchEvent(new CustomEvent("ea-locale-updated", { detail: normalized }));
}

/**
 * Lit l'état de localisation persisté (localStorage en priorité, puis cookies).
 */
export function readPersistedVisitorLocale(): VisitorLocale {
  if (typeof window === "undefined") return DEFAULT_VISITOR_LOCALE;

  try {
    const saved = localStorage.getItem("ea_visitor_locale");
    if (saved) {
      const parsed = JSON.parse(saved);
      return normalizeVisitorLocale(parsed, null);
    }
  } catch {}

  // Fallback sur cookies si localStorage vide
  try {
    const cookies = document.cookie.split(";").reduce((acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {} as Record<string, string>);

    if (cookies.ea_language || cookies.ea_currency || cookies.ea_country) {
      return normalizeVisitorLocale({
        countryCode: cookies.ea_country,
        language: cookies.ea_language as SupportedLanguage,
        currency: cookies.ea_currency,
        languageSource: cookies.ea_language ? "manual" : "auto",
        currencySource: cookies.ea_currency ? "manual" : "auto",
        countrySource: cookies.ea_country ? "manual" : "auto",
      }, null);
    }
  } catch {}

  return DEFAULT_VISITOR_LOCALE;
}

export function formatVisitorPrice(
  amountInBaseCurrency: number,
  locale: VisitorLocale,
  rates?: CurrencyRates,
  baseCurrency = BASE_CURRENCY
) {
  const currency = locale.currency || baseCurrency;
  return formatMoney(amountInBaseCurrency, currency, locale.language || "fr", rates);
}
