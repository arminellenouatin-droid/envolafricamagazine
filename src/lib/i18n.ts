/**
 * Dictionnaire central Envol Africa.
 * Les interfaces migrées utilisent des clés stables ; les contenus éditoriaux
 * restent gérés par leurs versions linguistiques dédiées.
 */

export const SUPPORTED_LANGUAGES = ["fr", "en", "es", "pt", "ar", "sw"] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

type Messages = Record<string, string>;

const MESSAGES: Record<SupportedLanguage, Messages> = {
  fr: {
    "common.search": "Rechercher",
    "common.close": "Fermer",
    "common.open": "Ouvrir",
    "common.language": "Langue",
    "common.currency": "Devise",
    "common.country": "Pays",
    "common.darkMode": "Mode sombre",
    "common.lightMode": "Mode clair",
    "common.tools": "Outils",
    "common.profile": "Profil",
    "common.notifications": "Notifications",
    "common.messages": "Messages",
    "common.cart": "Panier",
    "common.subscribe": "S’abonner",
    "common.vote": "Voter",
    "common.live": "Live",
  },
  en: {
    "common.search": "Search",
    "common.close": "Close",
    "common.open": "Open",
    "common.language": "Language",
    "common.currency": "Currency",
    "common.country": "Country",
    "common.darkMode": "Dark mode",
    "common.lightMode": "Light mode",
    "common.tools": "Tools",
    "common.profile": "Profile",
    "common.notifications": "Notifications",
    "common.messages": "Messages",
    "common.cart": "Cart",
    "common.subscribe": "Subscribe",
    "common.vote": "Vote",
    "common.live": "Live",
  },
  es: {
    "common.search": "Buscar",
    "common.close": "Cerrar",
    "common.open": "Abrir",
    "common.language": "Idioma",
    "common.currency": "Moneda",
    "common.country": "País",
    "common.darkMode": "Modo oscuro",
    "common.lightMode": "Modo claro",
    "common.tools": "Herramientas",
    "common.profile": "Perfil",
    "common.notifications": "Notificaciones",
    "common.messages": "Mensajes",
    "common.cart": "Carrito",
    "common.subscribe": "Suscribirse",
    "common.vote": "Votar",
    "common.live": "En directo",
  },
  pt: {},
  ar: {},
  sw: {},
};

export function normalizeLanguage(value: unknown, fallback: SupportedLanguage = "fr"): SupportedLanguage {
  const language = typeof value === "string" ? value.toLowerCase().split("-")[0] : "";
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(language) ? language as SupportedLanguage : fallback;
}

export function translate(key: string, language: string, fallback?: string): string {
  const normalized = normalizeLanguage(language);
  return MESSAGES[normalized][key] || MESSAGES.fr[key] || fallback || key;
}
