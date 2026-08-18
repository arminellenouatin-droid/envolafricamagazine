export type PlatformKey =
  | "magazine"
  | "kiosque"
  | "jobs"
  | "marketplace"
  | "crowdfunding"
  | "awards"
  | "salons"
  | "wab";

export type PlatformConfig = {
  key: PlatformKey;
  name: string;
  homeHref: string;
  logoSrc: string;
  logoAlt: string;
  accent: string;
  accentSoft: string;
  megaLabel: string;
  megaTitle: string;
  megaDescription: string;
  megaItems: Array<{ label: string; href: string; icon: string }>;
};

export const PLATFORM_CONFIGS: Record<PlatformKey, PlatformConfig> = {
  magazine: {
    key: "magazine",
    name: "Envol Africa Magazine",
    homeHref: "/",
    logoSrc: "/logo-couleur-entete.webp",
    logoAlt: "Envol Africa Magazine",
    accent: "#9e001f",
    accentSoft: "#fff0ef",
    megaLabel: "Nouveau numéro",
    megaTitle: "Nouveau numéro — N°25 Spécial Investissements 2026",
    megaDescription: "Les analyses, enquêtes et opportunités qui font avancer l'Afrique.",
    megaItems: [
      { label: "Acheter le dernier numéro", href: "/kiosque", icon: "menu_book" },
      { label: "Voir tout le kiosque", href: "/kiosque", icon: "library_books" },
      { label: "S'abonner", href: "/abonnement", icon: "stars" },
    ],
  },
  kiosque: {
    key: "kiosque",
    name: "Kiosque",
    homeHref: "/kiosque",
    logoSrc: "/logo-couleur-entete.webp",
    logoAlt: "Envol Africa Kiosque",
    accent: "#9e001f",
    accentSoft: "#fff0ef",
    megaLabel: "Le kiosque",
    megaTitle: "Explorez le kiosque Envol Africa",
    megaDescription: "Retrouvez les numéros, abonnements et éditions numériques.",
    megaItems: [
      { label: "Dernier numéro", href: "/kiosque", icon: "newspaper" },
      { label: "Tous les magazines", href: "/kiosque", icon: "library_books" },
      { label: "Mes achats", href: "/compte/commandes", icon: "receipt_long" },
    ],
  },
  jobs: {
    key: "jobs",
    name: "Jobs",
    homeHref: "/emploi",
    logoSrc: "/logo-couleur-entete.webp",
    logoAlt: "Envol Africa Jobs",
    accent: "#087e8b",
    accentSoft: "#e9f7f5",
    megaLabel: "Publier",
    megaTitle: "Développez vos opportunités professionnelles",
    megaDescription: "Publiez une offre, valorisez votre profil et gérez vos campagnes.",
    megaItems: [
      { label: "Choisir un abonnement", href: "/emploi#abonnements", icon: "workspace_premium" },
      { label: "Publier une offre", href: "/emploi#publier", icon: "post_add" },
      { label: "Gérer mon compte", href: "/emploi#compte", icon: "manage_accounts" },
      { label: "Mes campagnes", href: "/emploi#campagnes", icon: "campaign" },
    ],
  },
  marketplace: {
    key: "marketplace",
    name: "Marketplace",
    homeHref: "/marketplace",
    logoSrc: "/logo-couleur-entete.webp",
    logoAlt: "Envol Africa Marketplace",
    accent: "#a36300",
    accentSoft: "#fff3dc",
    megaLabel: "Vendre",
    megaTitle: "Marketplace Envol Africa",
    megaDescription: "Présentez vos produits et trouvez des solutions adaptées à vos besoins.",
    megaItems: [
      { label: "Parcourir la marketplace", href: "/marketplace", icon: "storefront" },
      { label: "Publier un produit", href: "/marketplace/boutique#publier", icon: "add_business" },
      { label: "Gérer ma boutique", href: "/marketplace/boutique", icon: "store" },
      { label: "Mes commandes", href: "/marketplace/commandes", icon: "receipt_long" },
      { label: "Mes messages", href: "/marketplace/messages", icon: "mail" },
    ],
  },
  crowdfunding: {
    key: "crowdfunding",
    name: "Crowdfunding",
    homeHref: "/financement",
    logoSrc: "/logo-couleur-entete.webp",
    logoAlt: "Envol Africa Crowdfunding",
    accent: "#176b4d",
    accentSoft: "#eaf8f1",
    megaLabel: "+",
    megaTitle: "Financez les projets qui comptent",
    megaDescription: "Lancez, publiez, soutenez ou financez un projet africain.",
    megaItems: [
      { label: "Lancer une cagnotte", href: "/financement#lancer", icon: "add_circle" },
      { label: "Publier un projet", href: "/financement#publier", icon: "post_add" },
      { label: "Soutenir une cagnotte", href: "/financement#soutenir", icon: "volunteer_activism" },
      { label: "Financer un projet", href: "/financement#financer", icon: "payments" },
    ],
  },
  awards: {
    key: "awards",
    name: "Africa Awards",
    homeHref: "/africa-awards",
    logoSrc: "/logo-couleur-entete.webp",
    logoAlt: "Envol Africa Africa Awards",
    accent: "#8a5b00",
    accentSoft: "#fff6d9",
    megaLabel: "Africa Awards",
    megaTitle: "Africa Awards",
    megaDescription: "Célébrez les talents, organisations et initiatives qui transforment l'Afrique.",
    megaItems: [
      { label: "Découvrir les Awards", href: "/africa-awards", icon: "emoji_events" },
      { label: "Candidater", href: "/africa-awards#candidater", icon: "how_to_vote" },
      { label: "Le jury et les catégories", href: "/africa-awards#jury", icon: "groups" },
    ],
  },
  salons: {
    key: "salons",
    name: "Salons",
    homeHref: "/salons",
    logoSrc: "/logo-couleur-entete.webp",
    logoAlt: "Envol Africa Salons",
    accent: "#5b3b8a",
    accentSoft: "#f2edff",
    megaLabel: "Salons",
    megaTitle: "Les Salons Envol Africa",
    megaDescription: "Débats, formations et rencontres professionnelles en direct.",
    megaItems: [
      { label: "Voir les Salons", href: "/salons", icon: "event_seat" },
      { label: "Créer un Salon", href: "/salons#creer", icon: "add_comment" },
      { label: "Mes participations", href: "/salons#participations", icon: "calendar_month" },
    ],
  },
  wab: {
    key: "wab",
    name: "World Africa Business",
    homeHref: "/wab",
    logoSrc: "/logo-couleur-entete.webp",
    logoAlt: "World Africa Business",
    accent: "#087e8b",
    accentSoft: "#e9f7f5",
    megaLabel: "Publier",
    megaTitle: "World Africa Business",
    megaDescription: "Le réseau professionnel africain pour partager, apprendre et créer des opportunités.",
    megaItems: [
      { label: "Publier une idée", href: "/wab#publier", icon: "edit_square" },
      { label: "Explorer les opportunités", href: "/wab#opportunites", icon: "lightbulb" },
      { label: "Rejoindre un Salon", href: "/salons", icon: "event_seat" },
      { label: "Mes messages", href: "/wab#messages", icon: "mail" },
    ],
  },
};

export function getPlatformKey(pathname: string): PlatformKey {
  if (pathname.startsWith("/kiosque") || pathname.startsWith("/panier")) return "kiosque";
  if (pathname.startsWith("/emploi")) return "jobs";
  if (pathname.startsWith("/marketplace")) return "marketplace";
  if (pathname.startsWith("/financement")) return "crowdfunding";
  if (pathname.startsWith("/africa-awards")) return "awards";
  if (pathname.startsWith("/salons")) return "salons";
  if (pathname.startsWith("/wab")) return "wab";
  return "magazine";
}

export const platformOptions = Object.values(PLATFORM_CONFIGS).map(({ key, name, homeHref }) => ({ key, name, href: homeHref }));
