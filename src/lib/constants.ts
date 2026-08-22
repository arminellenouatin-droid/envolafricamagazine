export const SUBSCRIPTION_PLANS = [
  {
    id: "mensuel",
    name: "Mensuel",
    slug: "mensuel",
    price: 5000,
    firstMonthPrice: 2000,
    currency: "XOF",
    interval: "month",
    yearlyEquivalent: 42000,
    annualPrice: 42000,
    annualDiscountPercent: 30,
    description: "Essai à prix réduit le premier mois",
    features: [
      "Articles illimités",
      "Enquêtes exclusives",
      "Écoute audio des articles",
      "Un magazine numérique gratuit chaque mois en avant-première",
      "Accès aux archives",
    ],
    popular: false,
    color: "border-zinc-200",
  },
  {
    id: "annuel",
    name: "Annuel",
    slug: "annuel",
    price: 42000,
    monthlyPrice: 3500,
    annualPrice: 42000,
    annualDiscountPercent: 30,
    currency: "XOF",
    interval: "year",
    description: "12 magazines numériques inclus",
    features: [
      "Tous les avantages Mensuel",
      "12 magazines numériques de l'année inclus",
      "Économie de 30%",
      "Accès prioritaire aux événements",
    ],
    popular: true,
    color: "border-amber-400",
  },
  {
    id: "entreprise",
    name: "Chef d'entreprise",
    slug: "chef-entreprise",
    price: 20000,
    firstMonthPrice: 15000,
    monthlyPrice: 20000,
    annualPrice: 168000,
    annualDiscountPercent: 30,
    currency: "XOF",
    interval: "month",
    description: "Pour les décideurs et leurs équipes",
    features: [
      "Tous les avantages Annuel",
      "Magazine papier + audio en avant-première",
      "Accès IP multi-utilisateurs (jusqu'à 10)",
      "Support client dédié",
      "Invitations salons professionnels",
    ],
    popular: false,
    color: "border-slate-800",
  },
  {
    id: "soutien",
    name: "Soutien",
    slug: "soutien",
    price: 600000,
    monthlyPrice: 50000,
    annualPrice: 420000,
    annualDiscountPercent: 30,
    currency: "XOF",
    interval: "year",
    description: "Devenez mécène d'Envol Africa",
    features: [
      "Tous les avantages Chef d'entreprise",
      "Pack Prestige VIP (accès salons, dîners, mention)",
      "Rencontres avec la rédaction",
      "Impact direct sur le journalisme panafricain",
    ],
    popular: false,
    color: "border-yellow-600",
  },
];

export const KIOSQUE_FORMATS = [
  { id: "cd_audio", label: "CD Audio", price: 5000, type: "audio", description: "Fichier audio à télécharger" },
  { id: "numerique", label: "Numérique", price: 10000, type: "digital", description: "PDF haute résolution" },
  { id: "papier", label: "Papier", price: 16000, type: "print", description: "Livraison postale" },
  { id: "audio_pdf", label: "Audio + PDF", price: 12000, type: "bundle", description: "Le duo numérique complet" },
  { id: "audio_papier", label: "Audio + Papier", price: 18000, type: "bundle", description: "Papier + fichier audio" },
];

export const LANGUAGES = {
  print_digital: ["fr", "en", "es"],
  audio: ["fr", "en", "es", "sw", "ha", "yo", "ig", "fon", "ff", "zu", "ee", "wo"],
};

export const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  sw: "Swahili",
  ha: "Hausa",
  yo: "Yorùbá",
  ig: "Igbo",
  fon: "Fongbé",
  ff: "Fulfulde",
  zu: "Zulu",
  ee: "Ewe (Mina)",
  wo: "Wolof",
};

export const CURRENCIES = [
  { code: "XOF", symbol: "F CFA", name: "Franc CFA", rate: 1 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.00152 },
  { code: "USD", symbol: "$", name: "US Dollar", rate: 0.00165 },
  { code: "NGN", symbol: "₦", name: "Naira", rate: 2.5 },
  { code: "GHS", symbol: "₵", name: "Cedi", rate: 0.025 },
];

export const SHIPPING_RATES: Record<string, number> = {
  BJ: 2000, CI: 2500, SN: 3000, TG: 2000, CM: 3500, NG: 4000, GH: 3500,
  FR: 8000, US: 12000, GB: 10000, default: 5000,
};

export const USER_ROLES = ["visitor", "user", "subscriber", "affiliate", "client", "redacteur", "redacteur_chef", "gerant", "admin"] as const;

export const ECOSYSTEM_LINKS = [
  { name: "Emploi", slug: "emploi", href: "/emploi", icon: "💼", desc: "Offres d'emploi en Afrique" },
  { name: "Marketplace", slug: "marketplace", href: "/marketplace", icon: "🛒", desc: "Produits africains d'exception" },
  { name: "Financement", slug: "financement", href: "/financement", icon: "💰", desc: "Le crowdfunding panafricain" },
  { name: "Africa Awards", slug: "awards", href: "/africa-awards", icon: "🏆", desc: "Célébrer l'excellence africaine" },
  { name: "Salons", slug: "salons", href: "/salons", icon: "🎤", desc: "Événements professionnels" },
  { name: "World Africa Business", slug: "wab", href: "/wab", icon: "🌍", desc: "Business sans frontières" },
];

export const HOME_SECTIONS_CONFIG = {
  sentinelles: { title: "Sentinelles", description: "Les veilleurs de l'économie africaine" },
  essor: { title: "Essor", description: "Les dynamiques qui font bouger l'Afrique" },
  ombre_douce: { title: "Ombre Douce", description: "Les coulisses du pouvoir économique" },
};
