export type CountryInfo = {
  code: string;
  name: string;
  currency: string;
  languages: string[];
};

/**
 * Génère dynamiquement l'émoji du drapeau pour n'importe quel code pays ISO (2 lettres).
 * Ex: "BJ" -> 🇧🇯, "FR" -> 🇫🇷, "US" -> 🇺🇸, "CI" -> 🇨🇮, "SN" -> 🇸🇳, "ML" -> 🇲🇱
 */
export function getCountryFlag(countryCode?: string | null): string {
  if (!countryCode || typeof countryCode !== "string") return "🌍";
  const clean = countryCode.trim().toUpperCase();
  if (clean.length !== 2) return "🌍";
  const codePoints = clean
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Tous les 54 pays africains + principaux pays internationaux
export const WORLD_COUNTRIES: Record<string, CountryInfo> = {
  // --- AFRIQUE DE L'OUEST ---
  BJ: { code: "BJ", name: "Bénin", currency: "XOF", languages: ["fr"] },
  BF: { code: "BF", name: "Burkina Faso", currency: "XOF", languages: ["fr"] },
  CI: { code: "CI", name: "Côte d’Ivoire", currency: "XOF", languages: ["fr"] },
  SN: { code: "SN", name: "Sénégal", currency: "XOF", languages: ["fr"] },
  TG: { code: "TG", name: "Togo", currency: "XOF", languages: ["fr"] },
  ML: { code: "ML", name: "Mali", currency: "XOF", languages: ["fr"] },
  NE: { code: "NE", name: "Niger", currency: "XOF", languages: ["fr"] },
  GN: { code: "GN", name: "Guinée", currency: "GNF", languages: ["fr"] },
  GH: { code: "GH", name: "Ghana", currency: "GHS", languages: ["en"] },
  NG: { code: "NG", name: "Nigeria", currency: "NGN", languages: ["en"] },
  GM: { code: "GM", name: "Gambie", currency: "GMD", languages: ["en"] },
  LR: { code: "LR", name: "Liberia", currency: "LRD", languages: ["en"] },
  SL: { code: "SL", name: "Sierra Leone", currency: "SLE", languages: ["en"] },
  CV: { code: "CV", name: "Cap-Vert", currency: "CVE", languages: ["pt"] },
  GW: { code: "GW", name: "Guinée-Bissau", currency: "XOF", languages: ["pt"] },
  MR: { code: "MR", name: "Mauritanie", currency: "MRU", languages: ["ar", "fr"] },

  // --- AFRIQUE CENTRALE ---
  CM: { code: "CM", name: "Cameroun", currency: "XAF", languages: ["fr", "en"] },
  GA: { code: "GA", name: "Gabon", currency: "XAF", languages: ["fr"] },
  CG: { code: "CG", name: "Congo", currency: "XAF", languages: ["fr"] },
  CD: { code: "CD", name: "RDC", currency: "CDF", languages: ["fr"] },
  TD: { code: "TD", name: "Tchad", currency: "XAF", languages: ["fr", "ar"] },
  CF: { code: "CF", name: "Centrafrique", currency: "XAF", languages: ["fr"] },
  GQ: { code: "GQ", name: "Guinée équatoriale", currency: "XAF", languages: ["es", "fr"] },
  ST: { code: "ST", name: "Sao Tomé-et-Principe", currency: "STN", languages: ["pt"] },
  AO: { code: "AO", name: "Angola", currency: "AOA", languages: ["pt"] },
  RW: { code: "RW", name: "Rwanda", currency: "RWF", languages: ["rw", "en", "fr"] },
  BI: { code: "BI", name: "Burundi", currency: "BIF", languages: ["fr", "rn"] },

  // --- AFRIQUE DE L'EST ---
  KE: { code: "KE", name: "Kenya", currency: "KES", languages: ["en", "sw"] },
  TZ: { code: "TZ", name: "Tanzanie", currency: "TZS", languages: ["sw", "en"] },
  UG: { code: "UG", name: "Ouganda", currency: "UGX", languages: ["en", "sw"] },
  ET: { code: "ET", name: "Éthiopie", currency: "ETB", languages: ["am", "en"] },
  DJ: { code: "DJ", name: "Djibouti", currency: "DJF", languages: ["fr", "ar"] },
  ER: { code: "ER", name: "Érythrée", currency: "ERN", languages: ["ar", "en"] },
  SO: { code: "SO", name: "Somalie", currency: "SOS", languages: ["so", "ar"] },
  SS: { code: "SS", name: "Soudan du Sud", currency: "SSP", languages: ["en"] },
  SD: { code: "SD", name: "Soudan", currency: "SDG", languages: ["ar", "en"] },
  SC: { code: "SC", name: "Seychelles", currency: "SCR", languages: ["fr", "en"] },
  KM: { code: "KM", name: "Comores", currency: "KMF", languages: ["fr", "ar"] },
  MG: { code: "MG", name: "Madagascar", currency: "MGA", languages: ["fr", "mg"] },
  MU: { code: "MU", name: "Maurice", currency: "MUR", languages: ["en", "fr"] },
  MZ: { code: "MZ", name: "Mozambique", currency: "MZN", languages: ["pt"] },
  MW: { code: "MW", name: "Malawi", currency: "MWK", languages: ["en"] },
  ZM: { code: "ZM", name: "Zambie", currency: "ZMW", languages: ["en"] },
  ZW: { code: "ZW", name: "Zimbabwe", currency: "USD", languages: ["en"] },

  // --- AFRIQUE AUSTRALE ---
  ZA: { code: "ZA", name: "Afrique du Sud", currency: "ZAR", languages: ["en", "af"] },
  NA: { code: "NA", name: "Namibie", currency: "NAD", languages: ["en"] },
  BW: { code: "BW", name: "Botswana", currency: "BWP", languages: ["en"] },
  SZ: { code: "SZ", name: "Eswatini", currency: "SZL", languages: ["en"] },
  LS: { code: "LS", name: "Lesotho", currency: "LSL", languages: ["en"] },

  // --- AFRIQUE DU NORD ---
  MA: { code: "MA", name: "Maroc", currency: "MAD", languages: ["ar", "fr"] },
  DZ: { code: "DZ", name: "Algérie", currency: "DZD", languages: ["ar", "fr"] },
  TN: { code: "TN", name: "Tunisie", currency: "TND", languages: ["ar", "fr"] },
  EG: { code: "EG", name: "Égypte", currency: "EGP", languages: ["ar", "en"] },
  LY: { code: "LY", name: "Libye", currency: "LYD", languages: ["ar"] },

  // --- INTERNATIONAL (DIASPORA & MONDE) ---
  FR: { code: "FR", name: "France", currency: "EUR", languages: ["fr"] },
  BE: { code: "BE", name: "Belgique", currency: "EUR", languages: ["fr", "nl"] },
  CH: { code: "CH", name: "Suisse", currency: "EUR", languages: ["fr", "de"] },
  US: { code: "US", name: "États-Unis", currency: "USD", languages: ["en"] },
  CA: { code: "CA", name: "Canada", currency: "CAD", languages: ["en", "fr"] },
  GB: { code: "GB", name: "Royaume-Uni", currency: "GBP", languages: ["en"] },
  DE: { code: "DE", name: "Allemagne", currency: "EUR", languages: ["de", "en"] },
  ES: { code: "ES", name: "Espagne", currency: "EUR", languages: ["es"] },
  IT: { code: "IT", name: "Italie", currency: "EUR", languages: ["it", "en"] },
  PT: { code: "PT", name: "Portugal", currency: "EUR", languages: ["pt"] },
  AE: { code: "AE", name: "Émirats Arabes Unis", currency: "AED", languages: ["ar", "en"] },
  CN: { code: "CN", name: "Chine", currency: "USD", languages: ["zh", "en"] },
  BR: { code: "BR", name: "Brésil", currency: "USD", languages: ["pt"] },
};

export function getCountryInfo(code?: string | null): CountryInfo {
  if (!code) return WORLD_COUNTRIES.BJ;
  const upper = code.trim().toUpperCase();
  return (
    WORLD_COUNTRIES[upper] || {
      code: upper,
      name: upper,
      currency: "USD",
      languages: ["en"],
    }
  );
}
