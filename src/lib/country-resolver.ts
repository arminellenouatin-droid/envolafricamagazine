/**
 * Résolution centralisée et sécurisée du pays pour les flux Moneroo et fiscaux.
 *
 * Ordre de résolution :
 * 1. Pays du profil utilisateur authentifié (si valide).
 * 2. Pays expressément confirmé/validé par l'utilisateur (liste blanche ISO 3166-1 alpha-2).
 * 3. En-têtes réseau du serveur (x-vercel-ip-country, cf-ipcountry).
 * 4. Fallback documenté et contrôlé : 'BJ' (Bénin, siège historique UEMOA).
 */

const SUPPORTED_UEMOA_COUNTRIES = new Set([
  'BJ', // Bénin
  'CI', // Côte d'Ivoire
  'SN', // Sénégal
  'TG', // Togo
  'BF', // Burkina Faso
  'ML', // Mali
  'NE', // Niger
  'GW', // Guinée-Bissau
]);

const ALL_COMMON_AFRICAN_COUNTRIES = new Set([
  ...SUPPORTED_UEMOA_COUNTRIES,
  'CM', // Cameroun
  'GA', // Gabon
  'CG', // République du Congo
  'CD', // RD Congo
  'GN', // Guinée Conakry
  'GH', // Ghana
  'NG', // Nigéria
  'RW', // Rwanda
  'FR', // France (Diaspora)
  'US', // États-Unis (Diaspora)
  'CA', // Canada (Diaspora)
  'BE', // Belgique (Diaspora)
]);

export interface CountryResolutionContext {
  userProfileCountry?: string | null;
  explicitCountry?: string | null;
  headers?: Headers | Record<string, string | string[] | undefined> | null;
  fallback?: string;
}

export function resolveCountry(context: CountryResolutionContext): string {
  const fallback = context.fallback && isValidIsoCountry(context.fallback)
    ? context.fallback.toUpperCase()
    : 'BJ';

  // 1. Profil utilisateur authentifié
  if (context.userProfileCountry && isValidIsoCountry(context.userProfileCountry)) {
    return context.userProfileCountry.toUpperCase();
  }

  // 2. Pays explicite validé (ex: adresse de livraison ou choix de facturation)
  if (context.explicitCountry && isValidIsoCountry(context.explicitCountry)) {
    return context.explicitCountry.toUpperCase();
  }

  // 3. Géolocalisation via en-têtes Edge/CDN serveur
  if (context.headers) {
    const headerCountry = extractCountryFromHeaders(context.headers);
    if (headerCountry && isValidIsoCountry(headerCountry)) {
      return headerCountry.toUpperCase();
    }
  }

  // 4. Fallback documenté
  return fallback;
}

export function isValidIsoCountry(country: unknown): boolean {
  if (typeof country !== 'string') return false;
  const clean = country.trim().toUpperCase();
  return clean.length === 2 && /^[A-Z]{2}$/.test(clean);
}

export function isUemoaCountry(countryCode: string): boolean {
  return SUPPORTED_UEMOA_COUNTRIES.has(countryCode.toUpperCase());
}

function extractCountryFromHeaders(headers: Headers | Record<string, string | string[] | undefined>): string | null {
  if (headers instanceof Headers) {
    return (
      headers.get('x-vercel-ip-country') ||
      headers.get('cf-ipcountry') ||
      headers.get('x-country-code') ||
      null
    );
  }
  const vCountry = headers['x-vercel-ip-country'];
  if (typeof vCountry === 'string') return vCountry;
  if (Array.isArray(vCountry) && vCountry[0]) return vCountry[0];

  const cfCountry = headers['cf-ipcountry'];
  if (typeof cfCountry === 'string') return cfCountry;
  if (Array.isArray(cfCountry) && cfCountry[0]) return cfCountry[0];

  return null;
}
