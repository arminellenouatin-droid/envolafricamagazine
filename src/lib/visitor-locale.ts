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
 * RÈGLE D'OR : Dès qu'un utilisateur a fait un choix manuel de langue ou de devise,
 * ce choix prend le dessus absolu et permanent sur toute autodétection (IP, pays, en-têtes).
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

  // Est-ce qu'une préférence manuelle antérieure existe ?
  const storedManualLang = typeof window !== "undefined" ? localStorage.getItem("ea_manual_language") : null;
  const hasPriorManualLang =
    current?.languageSource === "manual" ||
    Boolean(current?.isManual && current?.language && current?.languageSource !== "auto") ||
    Boolean(storedManualLang);

  if (value?.languageSource === "manual" || (value?.isManual && value?.language && (!current?.language || value.language !== current.language))) {
    // 1.A. L'utilisateur vient d'effectuer un choix manuel explicite de langue
    finalLanguage = normalizeLanguage(value.language);
    finalLanguageSource = "manual";
  } else if (hasPriorManualLang && (!value?.languageSource || value.languageSource !== "manual")) {
    // 1.B. L'utilisateur a déjà une préférence manuelle enregistrée :
    // ELLE PREND LE DESSUS ABSOLU sur toute autodétection entrante (ex: /api/geo)
    const manualLangToKeep = (current?.languageSource === "manual" ? current.language : null) || storedManualLang || current?.language || value?.language;
    finalLanguage = normalizeLanguage(manualLangToKeep);
    finalLanguageSource = "manual";
  } else if (value?.language) {
    // 1.C. Détection automatique entrante (nouveau visiteur sans choix manuel)
    finalLanguage = normalizeLanguage(value.language);
    finalLanguageSource = value.languageSource || "auto";
  } else {
    // 1.D. Fallback par défaut
    finalLanguage = current?.language ? normalizeLanguage(current.language) : normalizeLanguage(DEFAULT_VISITOR_LOCALE.language);
    finalLanguageSource = current?.languageSource || "auto";
  }

  // 2. GESTION DE LA DEVISE (Indépendante de la langue)
  let finalCurrency: string;
  let finalCurrencySource: "auto" | "manual";

  const storedManualCurr = typeof window !== "undefined" ? localStorage.getItem("ea_manual_currency") : null;
  const hasPriorManualCurr =
    current?.currencySource === "manual" ||
    Boolean(current?.isManual && current?.currency && current?.currencySource !== "auto") ||
    Boolean(storedManualCurr);

  if (value?.currencySource === "manual" || (value?.isManual && value?.currency && (!current?.currency || value.currency !== current.currency))) {
    // 2.A. Choix manuel explicite de devise
    finalCurrency = normalizeCurrency(value.currency);
    finalCurrencySource = "manual";
  } else if (hasPriorManualCurr && (!value?.currencySource || value.currencySource !== "manual")) {
    // 2.B. Préférence manuelle de devise antérieurement persistée : Prioritaire sur l'autodétection
    const manualCurrToKeep = (current?.currencySource === "manual" ? current.currency : null) || storedManualCurr || current?.currency || value?.currency;
    finalCurrency = normalizeCurrency(manualCurrToKeep);
    finalCurrencySource = "manual";
  } else if (value?.currency) {
    // 2.C. Détection automatique entrante
    finalCurrency = normalizeCurrency(value.currency);
    finalCurrencySource = value.currencySource || "auto";
  } else {
    // 2.D. Fallback par défaut
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
    if (normalized.languageSource === "manual") {
      localStorage.setItem("ea_manual_language", normalized.language);
    }
    if (normalized.currencySource === "manual") {
      localStorage.setItem("ea_manual_currency", normalized.currency);
    }
  } catch {}

  const cookieMaxAge = 60 * 60 * 24 * 365; // 1 an
  document.cookie = `ea_country=${encodeURIComponent(normalized.countryCode)}; path=/; max-age=${cookieMaxAge}; SameSite=Lax`;
  document.cookie = `ea_language=${encodeURIComponent(normalized.language)}; path=/; max-age=${cookieMaxAge}; SameSite=Lax`;
  document.cookie = `ea_currency=${encodeURIComponent(normalized.currency)}; path=/; max-age=${cookieMaxAge}; SameSite=Lax`;
  if (normalized.languageSource === "manual") {
    document.cookie = `ea_manual_language=${encodeURIComponent(normalized.language)}; path=/; max-age=${cookieMaxAge}; SameSite=Lax`;
  }
  if (normalized.currencySource === "manual") {
    document.cookie = `ea_manual_currency=${encodeURIComponent(normalized.currency)}; path=/; max-age=${cookieMaxAge}; SameSite=Lax`;
  }

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
    const manualLang = localStorage.getItem("ea_manual_language");
    const manualCurr = localStorage.getItem("ea_manual_currency");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (manualLang) {
        parsed.language = manualLang;
        parsed.languageSource = "manual";
        parsed.isManual = true;
      }
      if (manualCurr) {
        parsed.currency = manualCurr;
        parsed.currencySource = "manual";
      }
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

    if (cookies.ea_manual_language || cookies.ea_language || cookies.ea_currency || cookies.ea_country) {
      const manualLang = cookies.ea_manual_language;
      const lang = manualLang || cookies.ea_language;
      const isManualLang = Boolean(manualLang);
      const manualCurr = cookies.ea_manual_currency;
      const curr = manualCurr || cookies.ea_currency;
      const isManualCurr = Boolean(manualCurr);

      return normalizeVisitorLocale({
        countryCode: cookies.ea_country,
        language: (lang || DEFAULT_VISITOR_LOCALE.language) as SupportedLanguage,
        currency: curr || DEFAULT_VISITOR_LOCALE.currency,
        languageSource: isManualLang ? "manual" : "auto",
        currencySource: isManualCurr ? "manual" : "auto",
        countrySource: "auto",
        isManual: isManualLang || isManualCurr,
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
