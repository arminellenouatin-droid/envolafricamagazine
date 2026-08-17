export type PlatformKey = "magazine" | "marketplace" | "jobs" | "wab" | "awards";

export type PlatformRole = {
  id: string;
  label: string;
  dashboardLabel: string;
  description: string;
  links: Array<{ label: string; href: string }>;
};

export const PLATFORM_CONTEXTS: Record<PlatformKey, { label: string; accent: string; roles: PlatformRole[] }> = {
  magazine: { label: "Magazine", accent: "#9e001f", roles: [
    { id: "visitor", label: "Visiteur", dashboardLabel: "Espace visiteur", description: "Découvrir les articles, magazines et contenus publics.", links: [{ label: "Lire les articles", href: "/" }, { label: "Voir les magazines", href: "/kiosque" }] },
    { id: "subscriber", label: "Abonné", dashboardLabel: "Espace abonné", description: "Gérer votre abonnement, vos lectures, téléchargements et commandes éditoriales.", links: [{ label: "Mon abonnement", href: "/compte/abonnement" }, { label: "Mes achats", href: "/compte/achats" }] },
    { id: "admin", label: "Administrateur Magazine", dashboardLabel: "Administration Magazine", description: "Piloter les articles, magazines, commandes et abonnements éditoriaux.", links: [{ label: "Administration Magazine", href: "/admin" }, { label: "Abonnements et tarifs", href: "/admin/abonnements" }, { label: "Articles et landing page", href: "/admin/articles" }, { label: "Magazines et éditions", href: "/admin/magazines" }, { label: "Commandes", href: "/admin/orders" }] },
  ] },
  marketplace: { label: "Marketplace", accent: "#9e001f", roles: [
    { id: "buyer", label: "Acheteur", dashboardLabel: "Dashboard acheteur", description: "Suivre vos commandes, échéances, réceptions et messages avec les vendeurs.", links: [{ label: "Mes commandes", href: "/marketplace/commandes" }, { label: "Marketplace", href: "/marketplace" }] },
    { id: "seller", label: "Vendeur", dashboardLabel: "Dashboard vendeur", description: "Gérer votre boutique, catalogue, transactions, commissions et demandes de versement.", links: [{ label: "Ma boutique", href: "/marketplace/boutique" }, { label: "Publier un produit", href: "/marketplace/boutique#produit" }] },
    { id: "admin", label: "Administrateur Marketplace", dashboardLabel: "Administration Marketplace", description: "Contrôler les vendeurs, produits, commandes, commissions, litiges et versements.", links: [{ label: "Administration Marketplace", href: "/marketplace/admin" }, { label: "Vendeurs et produits", href: "/marketplace/boutique" }] },
  ] },
  jobs: { label: "Jobs", accent: "#087e8b", roles: [
    { id: "candidate", label: "Demandeur / candidat", dashboardLabel: "Dashboard demandeur", description: "Suivre vos candidatures, profil, CV et accès Jobs.", links: [{ label: "Mon dashboard Jobs", href: "/emploi/dashboard" }, { label: "Publier mon profil", href: "/emploi/publier-candidature" }] },
    { id: "employer", label: "Entreprise / offreur", dashboardLabel: "Dashboard entreprise", description: "Gérer vos offres, candidats, recrutements et abonnements Jobs.", links: [{ label: "Mon dashboard Jobs", href: "/emploi/dashboard" }, { label: "Publier une offre", href: "/emploi/publier-offre" }] },
    { id: "admin", label: "Administrateur Jobs", dashboardLabel: "Administration Jobs", description: "Modérer les offres, candidats, abonnements et opérations de recrutement.", links: [{ label: "Administration Jobs", href: "/emploi/admin" }, { label: "Offres", href: "/emploi" }] },
  ] },
  wab: { label: "WAB", accent: "#006874", roles: [
    { id: "member", label: "Membre", dashboardLabel: "Dashboard membre WAB", description: "Gérer vos publications, réseau, commentaires et notifications professionnelles.", links: [{ label: "Ouvrir WAB", href: "/wab" }, { label: "Mon profil WAB", href: "/wab/profil" }] },
    { id: "business", label: "Compte Entreprise WAB", dashboardLabel: "Dashboard entreprise WAB", description: "Gérer votre compte Entreprise WAB, vos vidéos, campagnes et performances.", links: [{ label: "Ouvrir WAB", href: "/wab" }, { label: "Mes campagnes", href: "/wab/campagnes" }] },
    { id: "admin", label: "Administrateur WAB", dashboardLabel: "Administration WAB", description: "Modérer les publications, comptes Business, campagnes, signalements et récompenses.", links: [{ label: "Administration WAB", href: "/wab/admin" }, { label: "Campagnes", href: "/wab/campagnes" }] },
  ] },
  awards: { label: "Africa Awards", accent: "#b5832f", roles: [
    { id: "nominee", label: "Nominé", dashboardLabel: "Dashboard nominé", description: "Suivre votre candidature, dossier, votes et résultats Africa Awards.", links: [{ label: "Ma candidature", href: "/africa-awards/candidates" }, { label: "Mes votes", href: "/africa-awards/my-votes" }] },
    { id: "host", label: "Animateur", dashboardLabel: "Dashboard animateur", description: "Gérer les sessions live, participants et interactions de votre compétition.", links: [{ label: "Mon espace animateur", href: "/africa-awards/host/dashboard" }, { label: "Compétitions", href: "/africa-awards/competitions" }] },
    { id: "admin", label: "Administrateur Africa Awards", dashboardLabel: "Administration Africa Awards", description: "Gérer compétitions, nominés, votes, jurys, animateurs et demandes.", links: [{ label: "Administration Awards", href: "/africa-awards/organizer/dashboard" }, { label: "Demandes", href: "/africa-awards/organizer/dashboard/requests" }] },
  ] },
};

export function getPlatformContext(value: string | null | undefined): PlatformKey {
  return value && value in PLATFORM_CONTEXTS ? value as PlatformKey : "magazine";
}
