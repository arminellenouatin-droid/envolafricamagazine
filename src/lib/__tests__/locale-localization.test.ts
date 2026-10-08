import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeVisitorLocale,
  DEFAULT_VISITOR_LOCALE,
  type VisitorLocale,
} from "../visitor-locale";
import {
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  translate,
} from "../i18n";
import {
  SUPPORTED_CURRENCIES,
  normalizeCurrency,
  convertFromBase,
  formatMoney,
} from "../currency";
import {
  WORLD_COUNTRIES,
  getCountryInfo,
  getSupportedLanguageForCountry,
} from "../country-data";

describe("SYSTÈME DE LOCALISATION ENVOL AFRICA — TESTS DÉTERMINISTES", () => {
  beforeEach(() => {
    // Reset global storage simulation
  });

  describe("1. Langues et Réversibilité (FR ↔ EN ↔ ES ↔ PT ↔ AR ↔ SW)", () => {
    it("supporte exactement les 6 langues officielles", () => {
      expect(SUPPORTED_LANGUAGES).toEqual(["fr", "en", "es", "pt", "ar", "sw"]);
    });

    it("normalise correctement les codes de langue", () => {
      expect(normalizeLanguage("FR")).toBe("fr");
      expect(normalizeLanguage("en-US")).toBe("en");
      expect(normalizeLanguage("es-ES")).toBe("es");
      expect(normalizeLanguage("pt-BR")).toBe("pt");
      expect(normalizeLanguage("ar-MA")).toBe("ar");
      expect(normalizeLanguage("sw-TZ")).toBe("sw");
      expect(normalizeLanguage("unknown")).toBe("fr");
      expect(normalizeLanguage(null)).toBe("fr");
    });

    it("possède des dictionnaires complets pour toutes les 6 langues sans clés manquantes", () => {
      const testKeys = [
        "common.search",
        "common.close",
        "common.language",
        "common.currency",
        "common.country",
        "common.profile",
        "common.notifications",
        "common.messages",
      ];

      for (const lang of SUPPORTED_LANGUAGES) {
        for (const key of testKeys) {
          const res = translate(key, lang);
          expect(res).toBeDefined();
          expect(res.length).toBeGreaterThan(0);
          expect(res).not.toBe(key); // Doit être traduit et non retourné en fallback brut
        }
      }
    });

    it("valide la réversibilité FR → EN → FR", () => {
      let state: VisitorLocale = { ...DEFAULT_VISITOR_LOCALE };
      expect(state.language).toBe("fr");

      // Passage à EN
      state = normalizeVisitorLocale({ language: "en", isManual: true }, state);
      expect(state.language).toBe("en");
      expect(state.languageSource).toBe("manual");

      // Retour à FR
      state = normalizeVisitorLocale({ language: "fr", isManual: true }, state);
      expect(state.language).toBe("fr");
      expect(state.languageSource).toBe("manual");
    });

    it("valide la réversibilité multi-langues FR → ES → PT → AR → SW → FR", () => {
      let state: VisitorLocale = { ...DEFAULT_VISITOR_LOCALE };

      for (const targetLang of ["es", "pt", "ar", "sw", "fr"] as const) {
        state = normalizeVisitorLocale({ language: targetLang, isManual: true }, state);
        expect(state.language).toBe(targetLang);
        expect(state.languageSource).toBe("manual");
      }
      expect(state.language).toBe("fr");
    });

    it("valide les transitions complexes EN → ES → FR", () => {
      let state = normalizeVisitorLocale({ language: "en", isManual: true }, DEFAULT_VISITOR_LOCALE);
      expect(state.language).toBe("en");

      state = normalizeVisitorLocale({ language: "es", isManual: true }, state);
      expect(state.language).toBe("es");

      state = normalizeVisitorLocale({ language: "fr", isManual: true }, state);
      expect(state.language).toBe("fr");
    });
  });

  describe("2. Indépendance stricte entre Langue et Devise", () => {
    it("changer la langue ne modifie JAMAIS la devise", () => {
      let state: VisitorLocale = {
        ...DEFAULT_VISITOR_LOCALE,
        country: "Bénin",
        countryCode: "BJ",
        language: "fr",
        currency: "XOF",
        languageSource: "auto",
        currencySource: "auto",
      };

      // Utilisateur passe en EN
      state = normalizeVisitorLocale({ language: "en", isManual: true }, state);
      expect(state.language).toBe("en");
      expect(state.languageSource).toBe("manual");
      expect(state.currency).toBe("XOF"); // Reste XOF !
      expect(state.currencySource).toBe("auto");
    });

    it("changer la devise ne modifie JAMAIS la langue", () => {
      let state: VisitorLocale = {
        ...DEFAULT_VISITOR_LOCALE,
        country: "Bénin",
        countryCode: "BJ",
        language: "fr",
        currency: "XOF",
        languageSource: "auto",
        currencySource: "auto",
      };

      // Utilisateur passe en USD
      state = normalizeVisitorLocale({ currency: "USD", isManual: true }, state);
      expect(state.currency).toBe("USD");
      expect(state.currencySource).toBe("manual");
      expect(state.language).toBe("fr"); // Reste FR !
      expect(state.languageSource).toBe("auto");
    });

    it("conserve les deux choix manuels indépendamment : EN + USD puis FR + USD", () => {
      let state = normalizeVisitorLocale({ language: "en", isManual: true }, DEFAULT_VISITOR_LOCALE);
      state = normalizeVisitorLocale({ currency: "USD", isManual: true }, state);
      expect(state.language).toBe("en");
      expect(state.currency).toBe("USD");

      // L'utilisateur repasse en FR, USD doit être préservé !
      state = normalizeVisitorLocale({ language: "fr", isManual: true }, state);
      expect(state.language).toBe("fr");
      expect(state.currency).toBe("USD");
      expect(state.languageSource).toBe("manual");
      expect(state.currencySource).toBe("manual");
    });
  });

  describe("3. Priorité absolue : Choix Manuel > Détection Automatique", () => {
    it("une détection automatique ultérieure n'écrase JAMAIS une langue choisie manuellement", () => {
      // Utilisateur au Bénin choisit manuellement l'anglais
      const persistedState: VisitorLocale = {
        country: "Bénin",
        countryCode: "BJ",
        city: "Cotonou",
        language: "en",
        currency: "XOF",
        languageSource: "manual",
        currencySource: "auto",
        countrySource: "auto",
        isManual: true,
      };

      // /api/geo renvoie la détection pour le Bénin (FR, XOF)
      const incomingGeo = {
        country: "Bénin",
        countryCode: "BJ",
        language: "fr",
        currency: "XOF",
        source: "vercel",
      };

      const resolved = normalizeVisitorLocale(incomingGeo, persistedState);
      expect(resolved.language).toBe("en"); // L'anglais manuel GAGNE !
      expect(resolved.languageSource).toBe("manual");
      expect(resolved.currency).toBe("XOF");
    });

    it("une détection automatique ultérieure n'écrase JAMAIS une devise choisie manuellement", () => {
      // Utilisateur a choisi manuellement USD
      const persistedState: VisitorLocale = {
        country: "Bénin",
        countryCode: "BJ",
        city: "Cotonou",
        language: "fr",
        currency: "USD",
        languageSource: "auto",
        currencySource: "manual",
        countrySource: "auto",
        isManual: true,
      };

      const incomingGeo = {
        country: "Bénin",
        countryCode: "BJ",
        language: "fr",
        currency: "XOF",
        source: "vercel",
      };

      const resolved = normalizeVisitorLocale(incomingGeo, persistedState);
      expect(resolved.currency).toBe("USD"); // USD manuel GAGNE !
      expect(resolved.currencySource).toBe("manual");
    });

    it("l'autodétection fonctionne parfaitement quand aucun choix manuel n'a été fait", () => {
      // Nouvel utilisateur sans choix préalable
      const initial = DEFAULT_VISITOR_LOCALE;

      // Détection au Nigeria
      const incomingGeoNG = {
        country: "Nigeria",
        countryCode: "NG",
        language: "en",
        currency: "NGN",
        source: "vercel",
      };

      const resolved = normalizeVisitorLocale(incomingGeoNG, initial);
      expect(resolved.countryCode).toBe("NG");
      expect(resolved.language).toBe("en");
      expect(resolved.currency).toBe("NGN");
      expect(resolved.languageSource).toBe("auto");
      expect(resolved.currencySource).toBe("auto");
    });
  });

  describe("4. Cohérence Country-Data et Détection /api/geo", () => {
    it("détermine une langue supportée même pour les pays avec langues non-standard", () => {
      // Rwanda (rw, en, fr) -> Doit choisir en ou fr, jamais rw
      const rwanda = getCountryInfo("RW");
      const langRw = getSupportedLanguageForCountry(rwanda, null);
      expect(SUPPORTED_LANGUAGES).toContain(langRw);
      expect(langRw).toBe("en");

      // Éthiopie (am, en) -> Doit choisir en
      const ethiopia = getCountryInfo("ET");
      const langEt = getSupportedLanguageForCountry(ethiopia, null);
      expect(langEt).toBe("en");

      // Guinée Équatoriale (es, fr) -> Doit choisir es
      const eqGuinea = getCountryInfo("GQ");
      const langGq = getSupportedLanguageForCountry(eqGuinea, null);
      expect(langGq).toBe("es");

      // Angola (pt) -> Doit choisir pt
      const angola = getCountryInfo("AO");
      const langAo = getSupportedLanguageForCountry(angola, null);
      expect(langAo).toBe("pt");

      // Égypte (ar, en) -> Doit choisir ar
      const egypt = getCountryInfo("EG");
      const langEg = getSupportedLanguageForCountry(egypt, null);
      expect(langEg).toBe("ar");

      // Tanzanie (sw, en) -> Doit choisir sw
      const tanzania = getCountryInfo("TZ");
      const langTz = getSupportedLanguageForCountry(tanzania, null);
      expect(langTz).toBe("sw");
    });

    it("prend en compte Accept-Language du navigateur si le pays a plusieurs langues", () => {
      const cameroun = getCountryInfo("CM"); // languages: ["fr", "en"]
      
      const langFrench = getSupportedLanguageForCountry(cameroun, "fr-FR,fr;q=0.9");
      expect(langFrench).toBe("fr");

      const langEnglish = getSupportedLanguageForCountry(cameroun, "en-US,en;q=0.9");
      expect(langEnglish).toBe("en");
    });
  });

  describe("5. Sécurité Financière et Conversion de Devises", () => {
    const mockRates = {
      XOF: 1,
      EUR: 0.001524,
      USD: 0.00165,
      GBP: 0.0013,
      XAF: 1,
    };

    it("supporte toutes les devises officielles", () => {
      expect(SUPPORTED_CURRENCIES).toContain("XOF");
      expect(SUPPORTED_CURRENCIES).toContain("EUR");
      expect(SUPPORTED_CURRENCIES).toContain("USD");
      expect(SUPPORTED_CURRENCIES).toContain("CAD");
      expect(SUPPORTED_CURRENCIES).toContain("GBP");
      expect(SUPPORTED_CURRENCIES).toContain("NGN");
    });

    it("convertFromBase ne produit JAMAIS NaN ou Infinity", () => {
      expect(convertFromBase(10000, "EUR", mockRates)).toBeCloseTo(15.24, 2);
      expect(convertFromBase(0, "EUR", mockRates)).toBe(0);
      expect(convertFromBase(NaN, "EUR", mockRates)).toBe(0);
      expect(convertFromBase(Infinity, "EUR", mockRates)).toBe(0);
      expect(convertFromBase(10000, "UNKNOWN_CURRENCY", mockRates)).toBe(10000);
    });

    it("formatMoney produit un affichage formaté sans crash ni undefined", () => {
      const formattedXOF = formatMoney(50000, "XOF", "fr", mockRates);
      expect(formattedXOF).toBeDefined();
      expect(formattedXOF).not.toContain("NaN");
      expect(formattedXOF).not.toContain("undefined");

      const formattedUSD = formatMoney(50000, "USD", "en", mockRates);
      expect(formattedUSD).toBeDefined();
      expect(formattedUSD).not.toContain("NaN");
      expect(formattedUSD).toContain("$");
    });
  });
});
