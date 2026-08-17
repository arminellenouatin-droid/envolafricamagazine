"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPlatformContext, PLATFORM_CONTEXTS } from "@/lib/platform-context";
import { useSearchParams } from "next/navigation";

const roleContent: Record<string, Array<{ label: string; value: string; detail: string; href?: string }>> = {
  "magazine:visitor": [{ label: "Articles accessibles", value: "Public", detail: "Découvrez les contenus ouverts du Magazine." }, { label: "Kiosque", value: "Disponible", detail: "Achetez un numéro ou explorez les éditions." }],
  "magazine:subscriber": [{ label: "Abonnement Magazine", value: "À consulter", detail: "Votre statut et vos avantages éditoriaux." }, { label: "Lectures", value: "Votre bibliothèque", detail: "Retrouvez vos magazines et téléchargements." }],
  "magazine:admin": [{ label: "Contenus", value: "À piloter", detail: "Articles, magazines et modération éditoriale.", href: "/admin" }, { label: "Commandes", value: "À traiter", detail: "Paiements et commandes du volet Magazine.", href: "/admin/orders" }],
  "marketplace:buyer": [{ label: "Mes commandes", value: "À suivre", detail: "Paiements, échéances et confirmation de réception.", href: "/marketplace/commandes" }, { label: "Messages vendeurs", value: "Protégés", detail: "Échanges liés à vos produits Marketplace.", href: "/marketplace/messages" }],
  "marketplace:seller": [{ label: "Ma boutique", value: "À gérer", detail: "Profil fournisseur et catalogue produits.", href: "/marketplace/boutique" }, { label: "Fonds vendeur", value: "Sécurisés", detail: "Transactions bloquées jusqu’à réception confirmée." }, { label: "Commissions", value: "Contextuelles", detail: "Montants nets après validation administrateur." }],
  "marketplace:admin": [{ label: "Commandes", value: "À contrôler", detail: "Réceptions, litiges et libération des fonds." }, { label: "Vendeurs", value: "À modérer", detail: "Boutiques, produits et certifications." }, { label: "Commissions", value: "Configurables", detail: "Paramètres propres à Marketplace." }],
  "jobs:candidate": [{ label: "Candidatures", value: "À suivre", detail: "Vos candidatures, accès et profil demandeur.", href: "/emploi/dashboard" }, { label: "Profil candidat", value: "À compléter", detail: "Votre CV et votre visibilité auprès des entreprises.", href: "/emploi/publier-candidature" }],
  "jobs:employer": [{ label: "Offres", value: "À piloter", detail: "Vos offres, candidats et recrutements.", href: "/emploi/dashboard" }, { label: "Abonnement Jobs", value: "Contextuel", detail: "Les plans et accès du volet Emploi.", href: "/emploi/abonnements" }],
  "jobs:admin": [{ label: "Offres et candidats", value: "À modérer", detail: "Pilotage du marché de l’emploi.", href: "/emploi/admin" }, { label: "Abonnements Jobs", value: "À suivre", detail: "Plans et accès propres à Jobs." }],
  "wab:member": [{ label: "Publications", value: "Votre réseau", detail: "Posts, commentaires et relations WAB.", href: "/wab" }, { label: "Notifications", value: "À consulter", detail: "Actualités de votre réseau professionnel." }],
  "wab:business": [{ label: "Compte Entreprise WAB", value: "À gérer", detail: "Statut du compte Business et accès vidéo.", href: "/wab" }, { label: "Campagnes", value: "À piloter", detail: "Boosts et visibilité professionnelle.", href: "/wab/campagnes" }],
  "wab:admin": [{ label: "Publications", value: "À modérer", detail: "Signalements et contenus WAB.", href: "/wab/admin" }, { label: "Comptes Business", value: "À contrôler", detail: "Accès vidéo et campagnes WAB." }],
  "awards:nominee": [{ label: "Candidature", value: "À suivre", detail: "Votre dossier et votre présence dans le concours.", href: "/africa-awards/my-votes" }, { label: "Votes", value: "En direct", detail: "Suivez les votes et les résultats." }],
  "awards:host": [{ label: "Sessions live", value: "À animer", detail: "Compétitions, candidats et interactions.", href: "/africa-awards/host/dashboard" }, { label: "Compétitions", value: "À gérer", detail: "Vos espaces d’animation Africa Awards." }],
  "awards:admin": [{ label: "Compétitions", value: "À piloter", detail: "Nominés, jurys, votes et résultats.", href: "/africa-awards/organizer/dashboard" }, { label: "Demandes", value: "À traiter", detail: "Demandes des acteurs du concours.", href: "/africa-awards/organizer/dashboard/requests" }],
};

export default function ComptePage() {
  const searchParams = useSearchParams();
  const platform = getPlatformContext(searchParams.get("platform"));
  const context = PLATFORM_CONTEXTS[platform];
  const role = searchParams.get("role") || context.roles[0].id;
  const currentRole = context.roles.find((item) => item.id === role) ?? context.roles[0];
  const cards = roleContent[`${platform}:${currentRole.id}`] ?? [];
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);

  useEffect(() => { fetch("/api/auth/me").then((response) => response.json()).then((data) => { if (!data.user) return; setUser(data.user); fetch(`/api/orders?userId=${encodeURIComponent(data.user.id)}`).then((response) => response.ok ? response.json() : { orders: [] }).then((data) => setOrders(data.orders || [])).catch(() => undefined); fetch("/api/affiliate").then((response) => response.ok ? response.json() : { earnings: [] }).then((data) => setEarnings(data.earnings || [])).catch(() => undefined); }).catch(() => undefined); }, []);
  const isStaff = Boolean(user && ["redacteur", "redacteur_chef", "gerant", "admin"].includes(user.role));
  const totalGains = earnings.reduce((sum, item) => sum + Number(item.commission || 0), 0);

  return <div className="space-y-6">
    <div className="rounded-[24px] p-6 text-white" style={{ background: `linear-gradient(135deg, ${context.accent}, #0A1931)` }}><p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Dashboard contextuel</p><h1 className="mt-2 text-3xl font-black">{currentRole.dashboardLabel}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">{currentRole.description} Votre compte reste unique sur Envol Africa, mais cet espace affiche uniquement les données de {context.label}.</p>{isStaff && currentRole.id === "admin" && <div className="mt-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-bold">Accès administrateur limité au volet {context.label}</div>}</div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map((card) => <div key={card.label} className="rounded-[20px] border border-zinc-200 bg-white p-5 shadow-sm"><div className="text-[11px] font-black uppercase tracking-wide text-zinc-500">{card.label}</div><div className="mt-2 text-xl font-black text-[#0A1931]">{card.value}</div><p className="mt-2 text-sm leading-5 text-zinc-600">{card.detail}</p>{card.href && <Link href={card.href} className="mt-4 inline-flex rounded-full px-4 py-2 text-xs font-bold text-white" style={{ backgroundColor: context.accent }}>Ouvrir →</Link>}</div>)}</div>
    <div className="grid gap-4 md:grid-cols-2"><div className="rounded-[20px] border border-zinc-200 bg-white p-6"><div className="text-[11px] font-black uppercase tracking-wide text-zinc-500">Affiliation globale</div><p className="mt-2 text-2xl font-black text-[#0A1931]">{totalGains.toLocaleString("fr-FR")} XOF</p><p className="mt-1 text-sm text-zinc-600">Le lien fonctionne sur les différentes plateformes, avec une attribution propre au volet concerné.</p><Link href={`/compte/parrainage?platform=${platform}`} className="mt-4 inline-flex rounded-full bg-[#0A1931] px-4 py-2 text-xs font-bold text-white">Voir les gains →</Link></div><div className="rounded-[20px] border border-zinc-200 bg-white p-6"><div className="text-[11px] font-black uppercase tracking-wide text-zinc-500">Identité commune</div><p className="mt-2 text-sm leading-6 text-zinc-700">{user ? `${user.prenom} ${user.nom} · ${user.email}` : "Chargement du compte…"}</p><p className="mt-2 text-xs text-zinc-500">Une seule connexion pour tous les volets. Les rôles, données et outils affichés restent propres à {context.label}.</p></div></div>
    {platform === "magazine" && <div className="rounded-[20px] border border-zinc-200 bg-white p-6"><h2 className="font-bold text-[#0A1931]">Activité Magazine</h2><p className="mt-2 text-sm text-zinc-600">{orders.length} commande(s) éditoriale(s) rattachée(s) à votre compte global.</p></div>}
  </div>;
}
