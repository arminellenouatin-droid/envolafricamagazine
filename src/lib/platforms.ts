export type PlatformKey =
  | "magazine"
  | "kiosque"
  | "jobs"
  | "marketplace"
  | "crowdfunding"
  | "awards"
  | "salons"
  | "wab";

export type MegaSectionItem = {
  label: string;
  href: string;
  icon: string;
  description?: string;
  badge?: string;
};

export type MegaSection = {
  title: string;
  icon: string;
  items: MegaSectionItem[];
};

export type MobileQuickAction = {
  label: string;
  href: string;
};

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
  megaSections?: MegaSection[];
  mobileQuickActions: MobileQuickAction[];
};

export const PLATFORM_CONFIGS: Record<PlatformKey, PlatformConfig> = {
  magazine: {
    key: "magazine",
    name: "Envol Africa Magazine",
    homeHref: "/",
    logoSrc: "/logo-couleur-entete-new.png",
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
    mobileQuickActions: [
      { label: "Kiosque", href: "/kiosque" },
      { label: "S'abonner", href: "/abonnement" },
      { label: "Articles", href: "/recherche" },
    ],
  },
  kiosque: {
    key: "kiosque",
    name: "Kiosque",
    homeHref: "/kiosque",
    logoSrc: "/logo-couleur-entete-new.png",
    logoAlt: "Envol Africa Kiosque",
    accent: "#9e001f",
    accentSoft: "#fff0ef",
    megaLabel: "Le Kiosque",
    megaTitle: "Explorez le kiosque Envol Africa",
    megaDescription: "Retrouvez les numéros, abonnements et éditions numériques.",
    megaItems: [
      { label: "Dernier numéro", href: "/kiosque", icon: "newspaper" },
      { label: "Tous les magazines", href: "/kiosque", icon: "library_books" },
      { label: "Mes achats", href: "/compte/commandes", icon: "receipt_long" },
    ],
    megaSections: [
      {
        title: "Numéros & Éditions",
        icon: "library_books",
        items: [
          { label: "Dernier numéro en kiosque", href: "/kiosque", icon: "menu_book", description: "L'édition du moment à feuilleter" },
          { label: "Tous les magazines", href: "/kiosque", icon: "auto_stories", description: "Catalogue complet des numéros publiés" },
          { label: "Éditions spéciales & archives", href: "/kiosque", icon: "archive", description: "Numéros hors-série et dossiers thématiques" },
        ],
      },
      {
        title: "Abonnements & Lecteur",
        icon: "stars",
        items: [
          { label: "S'abonner au Magazine", href: "/abonnement", icon: "card_membership", description: "Accès illimité aux éditions numériques" },
          { label: "Mes achats & téléchargements", href: "/compte/achats", icon: "receipt_long", description: "Vos numéros achetés et factures" },
          { label: "Lecteur Flipbook interactif", href: "/kiosque", icon: "chrome_reader_mode", description: "Lecture animée 3D sur ordinateur et tablette" },
        ],
      },
    ],
    mobileQuickActions: [
      { label: "Magazines", href: "/kiosque" },
      { label: "Abonnement", href: "/abonnement" },
      { label: "Mes Achats", href: "/compte/achats" },
    ],
  },
  jobs: {
    key: "jobs",
    name: "Jobs",
    homeHref: "/emploi",
    logoSrc: "/logo-couleur-entete-new.png",
    logoAlt: "Envol Africa Jobs",
    accent: "#087e8b",
    accentSoft: "#e9f7f5",
    megaLabel: "Espace Emploi",
    megaTitle: "Portail Emploi & Recrutement Panafricain",
    megaDescription: "Candidats : déposez et boostez votre profil. Entreprises : recrutez les meilleurs talents.",
    megaItems: [
      { label: "Choisir un abonnement", href: "/emploi/abonnements", icon: "workspace_premium" },
      { label: "Publier une offre", href: "/emploi/publier-offre", icon: "post_add" },
      { label: "Gérer mon compte", href: "/emploi/dashboard", icon: "manage_accounts" },
      { label: "Mes campagnes", href: "/emploi/dashboard", icon: "campaign" },
    ],
    megaSections: [
      {
        title: "Candidats & Talents",
        icon: "person_search",
        items: [
          { label: "Créer un compte demandeur", href: "/auth/register?role=candidat&next=/emploi", icon: "how_to_reg", description: "Inscrivez-vous pour postuler aux offres" },
          { label: "Poster / Déposer ma candidature", href: "/emploi/publier-candidature", icon: "post_add", description: "Mettre en avant votre CV et profil complet" },
          { label: "Suivre mes candidatures", href: "/emploi/dashboard", icon: "fact_check", description: "Statut des réponses et retours recruteurs" },
          { label: "Booster ma candidature", href: "/emploi/candidats", icon: "rocket_launch", description: "Passez en tête de liste auprès des employeurs" },
          { label: "Statistiques de mon profil", href: "/emploi/dashboard", icon: "insights", description: "Consultez les vues générées par votre profil" },
        ],
      },
      {
        title: "Entreprises & Recruteurs",
        icon: "domain",
        items: [
          { label: "S'inscrire comme entreprise", href: "/auth/register?role=entreprise&next=/emploi", icon: "domain_add", description: "Créez votre compte recruteur officiel" },
          { label: "Publier une offre d'emploi", href: "/emploi/publier-offre", icon: "add_circle", description: "Diffusez vos recrutements à notre audience" },
          { label: "Gérer mes offres & candidatures", href: "/emploi/dashboard", icon: "dashboard", description: "Consultez les CV et traitez les candidats" },
          { label: "Formules & abonnements", href: "/emploi/abonnements", icon: "workspace_premium", description: "Packs annonces et accès candidathèque" },
        ],
      },
    ],
    mobileQuickActions: [
      { label: "Demandeur", href: "/emploi/candidats" },
      { label: "Recruteur", href: "/emploi/publier-offre" },
      { label: "Publier", href: "/emploi/publier-candidature" },
    ],
  },
  marketplace: {
    key: "marketplace",
    name: "Marketplace",
    homeHref: "/marketplace",
    logoSrc: "/logo-couleur-entete-new.png",
    logoAlt: "Envol Africa Marketplace",
    accent: "#a36300",
    accentSoft: "#fff3dc",
    megaLabel: "Espace Vendeur",
    megaTitle: "Marketplace Panafricaine Envol Africa",
    megaDescription: "Ouvrez votre boutique, publiez vos produits et développez vos ventes.",
    megaItems: [
      { label: "Parcourir la marketplace", href: "/marketplace", icon: "storefront" },
      { label: "Publier un produit", href: "/marketplace/boutique?section=product", icon: "add_business" },
      { label: "Gérer ma boutique", href: "/marketplace/boutique", icon: "store" },
      { label: "Mes commandes", href: "/marketplace/commandes", icon: "receipt_long" },
      { label: "Mes messages", href: "/marketplace/messages", icon: "mail" },
    ],
    megaSections: [
      {
        title: "Boutique & Produits",
        icon: "storefront",
        items: [
          { label: "Créer un compte vendeur", href: "/auth/register?role=vendeur&next=/marketplace/boutique", icon: "person_add", description: "Devenez vendeur certifié Envol Africa" },
          { label: "Créer / Gérer ma boutique", href: "/marketplace/boutique", icon: "store", description: "Paramétrez votre vitrine et coordonnées" },
          { label: "Publier un nouveau produit", href: "/marketplace/boutique?section=product", icon: "add_box", description: "Articles physiques, digitaux ou services" },
          { label: "Gérer mes produits & stocks", href: "/marketplace/admin?section=products", icon: "inventory_2", description: "Catalogue, disponibilités et tarifs" },
        ],
      },
      {
        title: "Ventes & Visibilité",
        icon: "trending_up",
        items: [
          { label: "Booster mes produits", href: "/marketplace/boutique?section=boost", icon: "rocket_launch", description: "Mettez vos produits en avant dans les rayons" },
          { label: "Mettre en affiliation", href: "/marketplace/boutique?section=affiliate", icon: "group_add", description: "Rémunérez les ambassadeurs pour vendre plus" },
          { label: "Statistiques & chiffre d'affaires", href: "/marketplace/admin?section=analytics", icon: "monitoring", description: "Suivez vos ventes, conversions et revenus" },
          { label: "Commandes & paiements échelonnés", href: "/marketplace/commandes", icon: "receipt_long", description: "Gestion des expéditions et paiements" },
        ],
      },
    ],
    mobileQuickActions: [
      { label: "Boutique", href: "/marketplace/boutique" },
      { label: "Vendre", href: "/marketplace/boutique?section=product" },
      { label: "Commandes", href: "/marketplace/commandes" },
    ],
  },
  crowdfunding: {
    key: "crowdfunding",
    name: "Crowdfunding",
    homeHref: "/financement",
    logoSrc: "/logo-couleur-entete-new.png",
    logoAlt: "Envol Africa Crowdfunding",
    accent: "#176b4d",
    accentSoft: "#eaf8f1",
    megaLabel: "Outils Financement",
    megaTitle: "Plateforme de Financement Participatif & Solidaire",
    megaDescription: "Porteurs : financez vos projets. Bailleurs & Mécènes : investissez dans l'avenir africain.",
    megaItems: [
      { label: "Lancer une cagnotte", href: "/financement#cagnotte", icon: "add_circle" },
      { label: "Publier un projet", href: "/financement/dashboard/porteur#wizard", icon: "post_add" },
      { label: "Soutenir une cagnotte", href: "/financement", icon: "volunteer_activism" },
      { label: "Financer un projet", href: "/financement", icon: "payments" },
    ],
    megaSections: [
      {
        title: "Demandeurs de Financement & Cagnottes",
        icon: "volunteer_activism",
        items: [
          { label: "Créer un compte demandeur", href: "/auth/register?role=porteur&next=/financement/dashboard/porteur", icon: "person_add", description: "Ouvrez votre espace porteur de projet" },
          { label: "Poster un projet / Campagne", href: "/financement/dashboard/porteur#wizard", icon: "post_add", description: "Formulaire en 8 étapes avec plan d'affaires" },
          { label: "Suivre ma campagne & statistiques", href: "/financement/dashboard/porteur", icon: "dashboard", description: "Jauge de collecte, investisseurs et vues" },
          { label: "Lancer une cagnotte solidaire", href: "/financement#cagnotte", icon: "favorite", description: "Pour une œuvre sociale, d'entraide ou de soutien" },
          { label: "Rapports mensuels & reversements", href: "/financement/dashboard/porteur", icon: "assessment", description: "Rapports KPIs et demandes de virement" },
        ],
      },
      {
        title: "Investisseurs & Mécènes",
        icon: "savings",
        items: [
          { label: "Créer un compte investisseur", href: "/auth/register?role=investisseur&next=/financement/dashboard/investisseur", icon: "account_balance", description: "Investissez en actions, obligations ou dons" },
          { label: "Explorer les projets ouverts", href: "/financement", icon: "explore", description: "Opportunités sélectionnées et vérifiées" },
          { label: "Suivre mes investissements & parts", href: "/financement/dashboard/investisseur", icon: "pie_chart", description: "Portefeuille d'actions, valorisation et contrats" },
          { label: "Échéanciers de remboursement", href: "/financement/dashboard/investisseur", icon: "event_repeat", description: "Calendrier des mensualités et intérêts perçus" },
          { label: "Accompagnement cabinet Angel", href: "/financement#angel", icon: "verified_user", description: "Formules d'accompagnement certifié" },
        ],
      },
    ],
    mobileQuickActions: [
      { label: "Porteur", href: "/financement/dashboard/porteur" },
      { label: "Cagnotte", href: "/financement#cagnotte" },
      { label: "Investir", href: "/financement/dashboard/investisseur" },
    ],
  },
  awards: {
    key: "awards",
    name: "Africa Awards",
    homeHref: "/africa-awards",
    logoSrc: "/logo-couleur-entete-new.png",
    logoAlt: "Envol Africa Africa Awards",
    accent: "#8a5b00",
    accentSoft: "#fff6d9",
    megaLabel: "Outils Awards",
    megaTitle: "Africa Awards — Célébrons les Talents d'Afrique",
    megaDescription: "Candidatures, votes officiels, régie live et espace jury.",
    megaItems: [
      { label: "Découvrir les Awards", href: "/africa-awards", icon: "emoji_events" },
      { label: "Candidater", href: "/africa-awards#competitions", icon: "how_to_vote" },
      { label: "Le jury et les catégories", href: "/africa-awards#jury", icon: "groups" },
    ],
    megaSections: [
      {
        title: "Candidats & Nominés",
        icon: "emoji_events",
        items: [
          { label: "S'inscrire comme candidat", href: "/africa-awards#competitions", icon: "how_to_reg", description: "Postulez aux compétitions ouvertes" },
          { label: "Mon espace nominé", href: "/africa-awards/candidate/dashboard", icon: "badge", description: "Profil public, biographie et statistiques" },
          { label: "Démarrer / Rejoindre mon Live", href: "/africa-awards/candidate/dashboard", icon: "videocam", description: "Studio direct pour interagir avec le public" },
          { label: "Suivre mes votes & cadeaux reçus", href: "/africa-awards/candidate/dashboard", icon: "analytics", description: "Points d'honneur et classement en temps réel" },
        ],
      },
      {
        title: "Votes, Public & Régie",
        icon: "live_tv",
        items: [
          { label: "Voter pour un nominé", href: "/africa-awards#competitions", icon: "how_to_vote", description: "Soutenez vos talents favoris de manière sécurisée" },
          { label: "Offrir un cadeau / Soutenir la cagnotte", href: "/africa-awards#gifts", icon: "featured_seasonal_and_gifts", description: "Cadeaux virtuels et augmentation de la cagnotte" },
          { label: "Classement général en direct", href: "/africa-awards/rankings", icon: "leaderboard", description: "Podiums et scores combinés jury + public" },
          { label: "Régie Live Animateur & Jury", href: "/africa-awards/host/dashboard/live", icon: "podcasts", description: "Gestion du direct, passage sur scène et modération" },
        ],
      },
    ],
    mobileQuickActions: [
      { label: "Candidater", href: "/africa-awards#competitions" },
      { label: "Voter", href: "/africa-awards/competitions" },
      { label: "Live", href: "/africa-awards/competitions" },
    ],
  },
  salons: {
    key: "salons",
    name: "Salons",
    homeHref: "/salons",
    logoSrc: "/logo-couleur-entete-new.png",
    logoAlt: "Envol Africa Salons",
    accent: "#5b3b8a",
    accentSoft: "#f2edff",
    megaLabel: "Salons en direct",
    megaTitle: "Les Salons Envol Africa",
    megaDescription: "Débats, formations et rencontres professionnelles en direct.",
    megaItems: [
      { label: "Voir les Salons", href: "/salons", icon: "event_seat" },
      { label: "Créer un Salon", href: "/salons#creer", icon: "add_comment" },
      { label: "Mes participations", href: "/salons#participations", icon: "calendar_month" },
    ],
    megaSections: [
      {
        title: "Participer & Écouter",
        icon: "event_seat",
        items: [
          { label: "Voir tous les Salons en direct", href: "/salons", icon: "podcasts", description: "Salons audio et vidéo ouverts actuellement" },
          { label: "Salons à venir & programmation", href: "/salons", icon: "calendar_month", description: "Agenda des webinaires et conférences" },
          { label: "Mes salons favoris", href: "/compte/favoris", icon: "favorite", description: "Retrouvez les salons sauvegardés" },
        ],
      },
      {
        title: "Organiser & Animer",
        icon: "mic",
        items: [
          { label: "Créer un nouveau Salon", href: "/salons#creer", icon: "add_box", description: "Lancez une table ronde ou masterclass" },
          { label: "Inviter des intervenants", href: "/salons", icon: "person_add", description: "Partagez l'accès scène aux panélistes" },
          { label: "Statistiques d'audience", href: "/salons", icon: "insights", description: "Auditeurs en direct et interactions" },
        ],
      },
    ],
    mobileQuickActions: [
      { label: "Directs", href: "/salons" },
      { label: "Créer", href: "/salons#creer" },
      { label: "Rejoindre", href: "/salons" },
    ],
  },
  wab: {
    key: "wab",
    name: "World Africa Business",
    homeHref: "/wab",
    logoSrc: "/logo-couleur-entete-new.png",
    logoAlt: "World Africa Business",
    accent: "#087e8b",
    accentSoft: "#e9f7f5",
    megaLabel: "Créer & Publier",
    megaTitle: "World Africa Business — Réseau Professionnel",
    megaDescription: "Partagez vos idées, développez votre audience et connectez-vous aux décideurs.",
    megaItems: [
      { label: "Publier une idée", href: "/wab#publier", icon: "edit_square" },
      { label: "Explorer les opportunités", href: "/wab#opportunites", icon: "lightbulb" },
      { label: "Rejoindre un Salon", href: "/salons", icon: "event_seat" },
      { label: "Mes messages", href: "/wab#messages", icon: "mail" },
    ],
    megaSections: [
      {
        title: "Création & Médias",
        icon: "edit_square",
        items: [
          { label: "Créer une publication", href: "/wab#publier", icon: "post_add", description: "Partagez une opportunité, analyse ou actualité" },
          { label: "Publier une Story", href: "/wab#story", icon: "history_toggle_off", description: "Format éphémère 24h photo ou vidéo" },
          { label: "Créer un Reel court (9:16)", href: "/wab#reel", icon: "smart_display", description: "Vidéo courte d'impact pour le fil découverte" },
          { label: "Créer un Salon audio/vidéo", href: "/salons#creer", icon: "forum", description: "Lancez un espace d'échange en direct" },
        ],
      },
      {
        title: "Réseau & Entreprises",
        icon: "corporate_fare",
        items: [
          { label: "Créer / Gérer ma Page Entreprise", href: "/wab/pages", icon: "domain", description: "Développez la visibilité de votre société" },
          { label: "Créer ou rejoindre un Groupe", href: "/wab/groupes", icon: "groups", description: "Échangez dans des communautés sectorielles" },
          { label: "Espace Créateur & statistiques", href: "/wab/createur", icon: "insights", description: "Suivez vos impressions, abonnés et portée" },
          { label: "Mon Réseau & connexions", href: "/wab/profil", icon: "hub", description: "Contacts professionnels et suggestions" },
        ],
      },
    ],
    mobileQuickActions: [
      { label: "Publier", href: "/wab#publier" },
      { label: "Story", href: "/wab#story" },
      { label: "Reel", href: "/wab#reel" },
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
