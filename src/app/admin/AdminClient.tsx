"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import MagazineModal from "./MagazineModal";
import RichTextEditor from "@/components/RichTextEditor";
import AffiliateManager from "@/components/admin/AffiliateManager";

async function readApiResponse(response: Response) {
  const raw = await response.text();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { error: raw.slice(0, 300) }; }
}

type AdminPlatform = "magazine" | "jobs" | "wab" | "marketplace" | "financement" | "awards" | "ads";

function categoryDepth(category: any, all: any[]) { let depth = 0; let current = category; while (current?.parent_id && depth < 12) { current = all.find((item) => item.id === current.parent_id); depth += 1; } return depth; }
function categoryPath(category: any, all: any[]) { const names: string[] = []; let current = category; let guard = 0; while (current && guard < 12) { names.unshift(current.label); current = all.find((item) => item.id === current.parent_id); guard += 1; } return names.join(" / "); }

const LANDING_ARTICLE_TAGS = ["Fil d’infos Image", "Fil d’infos Titres", "Manager du mois", "Financement", "Opportunités", "Prochain numéro", "Start’ups"];

type ManagedLandingItem = { id: string; title: string; description?: string; mediaUrl?: string; mediaType?: "image" | "video" | "youtube"; href?: string; date?: string; location?: string };
const youtubeVideoId = (value: string) => { const match = value.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i); return match?.[1] || ""; };

type AdminModule = { label: string; href: string; detail: string };

const adminPlatforms: Array<{ id: AdminPlatform; label: string; accent: string; description: string; href: string; modules: AdminModule[] }> = [
  {
    id: "magazine",
    label: "Magazine",
    accent: "#9e001f",
    description: "Articles, éditions, abonnements, commandes et KPI éditoriaux.",
    href: "/admin",
    modules: [
      { label: "Articles & Rédaction", href: "/admin", detail: "Rédiger, publier et traduire les articles du magazine." },
      { label: "Éditions & Magazines", href: "/admin", detail: "Gérer les parutions, PDF protégés et couvertures." },
      { label: "Abonnements", href: "/admin", detail: "Gérer les formules d'abonnement et lecteurs abonnés." },
      { label: "Commandes Magazines", href: "/admin", detail: "Suivre les achats individuels et abonnements payés." },
      { label: "Affiliation Réseau", href: "/admin", detail: "Arbre de parrainage, commissions et demandes de retrait." },
      { label: "KPIs Éditoriaux", href: "/admin", detail: "Performances de lecture, vues et engagement." },
    ],
  },
  {
    id: "jobs",
    label: "Jobs",
    accent: "#087e8b",
    description: "Offres, candidats, entreprises, abonnements et modération.",
    href: "/emploi/admin",
    modules: [
      { label: "Modération des offres", href: "/emploi/admin", detail: "Valider ou suspendre les offres d'emploi déposées." },
      { label: "Modération des candidats", href: "/emploi/admin", detail: "Contrôler les CV et profils de candidats publics." },
      { label: "Publier une offre officielle", href: "/emploi/publier-offre", detail: "Créer une offre d'emploi ou de stage directement." },
      { label: "Banque de profils candidats", href: "/emploi/candidats", detail: "Consulter l'annuaire des talents africains." },
      { label: "Abonnements & Forfaits", href: "/emploi/abonnements", detail: "Formules recruteurs et options de boost des offres." },
    ],
  },
  {
    id: "wab",
    label: "WAB",
    accent: "#006874",
    description: "Publications, Salons en direct, modération, récompenses et retraits.",
    href: "/wab/admin",
    modules: [
      { label: "Salons & Directs", href: "/wab/admin", detail: "Superviser les lives, régie de battle et diffusions actives." },
      { label: "Publications & Flux", href: "/wab/admin", detail: "Modérer les posts, photos, vidéos et stories." },
      { label: "Signalements & Sanctions", href: "/wab/admin", detail: "Traiter les signalements de contenus et comportements." },
      { label: "Profils & Créateurs", href: "/wab/admin", detail: "Badges de vérification et statut des créateurs." },
      { label: "Récompenses & Retraits", href: "/wab/admin", detail: "Gérer le taux du coin WAB, cadeaux et retraits Mobile Money." },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    accent: "#7c3aed",
    description: "Vendeurs, produits, commandes, commissions, litiges et versements.",
    href: "/marketplace/admin",
    modules: [
      { label: "Vendeurs & Boutiques", href: "/marketplace/admin?tab=suppliers", detail: "Gérer les fournisseurs, les boutiques et les certifications officielles." },
      { label: "Produits & Modération", href: "/marketplace/admin?tab=products", detail: "Examiner les produits, catégories, prix, stocks et offres." },
      { label: "Commandes & Séquestre", href: "/marketplace/admin?tab=orders", detail: "Suivre les paiements encaissés, fonds bloqués et livraisons." },
      { label: "Arbitrage des Litiges", href: "/marketplace/admin?tab=disputes", detail: "Trancher les litiges acheteurs/vendeurs et libérer les fonds." },
      { label: "Boosts & Visibilité", href: "/marketplace/admin?tab=boosts", detail: "Suivre les packs de mise en avant souscrits par les vendeurs." },
      { label: "Commissions & Retraits", href: "/compte?platform=marketplace", detail: "Contrôler le montant brut, la commission Envol Africa et le net vendeur." },
    ],
  },
  {
    id: "financement",
    label: "Crowdfunding",
    accent: "#b45309",
    description: "Projets, investisseurs, documents, paiements et remboursements.",
    href: "/admin/crowdfunding",
    modules: [
      { label: "Projets à valider", href: "/admin/crowdfunding?statut=en_attente_validation", detail: "Examiner et valider les projets de financement soumis." },
      { label: "Campagnes en cours", href: "/admin/crowdfunding?statut=en_cours", detail: "Suivre les levées de fonds et montants collectés." },
      { label: "Dashboard Financement", href: "/financement/dashboard", detail: "Vue analytique des flux d'investissement participatif." },
      { label: "Espace Investisseurs", href: "/financement/dashboard/investisseur", detail: "Suivi des investisseurs et contributions." },
      { label: "Espace Porteurs de projets", href: "/financement/dashboard/porteur", detail: "Accompagnement et pièces justificatives des porteurs." },
    ],
  },
  {
    id: "awards",
    label: "Africa Awards",
    accent: "#b5832f",
    description: "Compétitions, inscriptions, candidatures, nominés, votes, animateurs et lives.",
    href: "/africa-awards/admin/dashboard",
    modules: [
      { label: "Dashboard Général", href: "/africa-awards/admin/dashboard", detail: "Vue d'ensemble des compétitions, votes et candidats réels." },
      { label: "Créer une compétition", href: "/africa-awards/admin/dashboard/competitions/new", detail: "Lancer une nouvelle compétition ou édition Awards." },
      { label: "Gérer les compétitions", href: "/africa-awards/admin/dashboard/competitions", detail: "Cycle de vie, ouverture des votes et clôture." },
      { label: "Validation des demandes", href: "/africa-awards/admin/dashboard/requests", detail: "Examiner les demandes des organisateurs et animateurs." },
      { label: "Valider les candidatures", href: "/africa-awards/admin/dashboard/applications", detail: "Examiner les dossiers et promouvoir en nominés officiels." },
      { label: "Sponsors & Partenaires", href: "/africa-awards/admin/dashboard/sponsors", detail: "Gérer la régie publicitaire et partenaires des Awards." },
    ],
  },
  {
    id: "ads",
    label: "Régie Envol Ads",
    accent: "#f59e0b",
    description: "Régie publicitaire first-party, modération des annonces, 16 slots, enchères et signalements.",
    href: "/admin/publicite",
    modules: [
      { label: "Modération des créatives", href: "/admin/publicite", detail: "Valider ou refuser les visuels et textes d'annonces en attente." },
      { label: "Inventaire des 16 slots", href: "/admin/publicite", detail: "Activer les emplacements et ajuster les planchers CPM/CPC/CPD." },
      { label: "Signalements lecteurs", href: "/admin/publicite", detail: "Traiter les plaintes de lecteurs et suspendre les annonces non conformes." },
      { label: "Espace Annonceur", href: "/publicite/espace", detail: "Accéder au portail libre-service de création de campagne." },
    ],
  },
];

function LandingManagedContent({ blockKey, title, description, items, onChange }: { blockKey: string; title: string; description: string; items: ManagedLandingItem[]; onChange: (items: ManagedLandingItem[]) => void }) {
  const [draft, setDraft] = useState<ManagedLandingItem>({ id: "", title: "", description: "", mediaUrl: "", mediaType: blockKey === "videos" ? "video" : "image", href: "", date: "", location: "" });
  const [editingId, setEditingId] = useState("");
  const [uploading, setUploading] = useState(false);
  const isVideoBlock = blockKey === "videos";
  const isSponsorBlock = blockKey === "contenus_sponsorises";
  const reset = () => { setDraft({ id: "", title: "", description: "", mediaUrl: "", mediaType: isVideoBlock ? "video" : "image", href: "", date: "", location: "" }); setEditingId(""); };
  const save = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!draft.title.trim()) return; const mediaUrl = draft.mediaUrl?.trim() || ""; const item = { ...draft, id: editingId || `${blockKey}-${Date.now()}`, title: draft.title.trim(), description: draft.description?.trim() || "", mediaUrl, mediaType: isVideoBlock && youtubeVideoId(mediaUrl) ? "youtube" as const : draft.mediaType, href: draft.href?.trim() || "", date: draft.date?.trim() || "", location: draft.location?.trim() || "" }; onChange(editingId ? items.map((entry) => entry.id === editingId ? item : entry) : [item, ...items]); reset(); };
  const upload = async (file: File) => { setUploading(true); try { const form = new FormData(); form.append("file", file); form.append("type", isVideoBlock || (isSponsorBlock && file.type.startsWith("video/")) ? "video" : "cover"); form.append("magazineId", `landing-${blockKey}`); const response = await fetch("/api/upload", { method: "POST", body: form }); const data = await readApiResponse(response); if (!response.ok || !data.url) throw new Error(data.error || "Téléversement impossible"); setDraft((value) => ({ ...value, mediaUrl: data.url, mediaType: file.type.startsWith("video/") ? "video" : "image" })); } catch (error) { window.alert(error instanceof Error ? error.message : "Téléversement impossible"); } finally { setUploading(false); } };
  return <section className="rounded-[18px] border bg-white p-5"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div><p className="text-[10px] font-black uppercase tracking-wider text-[#9e001f]">Landing Magazine</p><h2 className="mt-1 text-lg font-black text-[#0A1931]">{title}</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">{description}</p></div><button type="button" onClick={reset} className="h-10 shrink-0 rounded-full bg-[#0A1931] px-4 text-xs font-bold text-white">+ Ajouter nouveau</button></div><form onSubmit={save} className="mt-5 grid gap-3 rounded-[14px] border border-dashed border-[#d8c3c1] bg-[#fffaf8] p-4 md:grid-cols-2"><input required value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} placeholder="Titre du contenu" className="h-10 rounded-full border bg-white px-3 text-xs"/><input value={draft.href || ""} onChange={(event) => setDraft((value) => ({ ...value, href: event.target.value }))} placeholder="Lien interne ou URL (facultatif)" className="h-10 rounded-full border bg-white px-3 text-xs"/><textarea value={draft.description || ""} onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))} placeholder="Description courte" rows={2} className="rounded-xl border bg-white p-3 text-xs md:col-span-2"/>{!isVideoBlock && <div className="flex gap-2"><label className="inline-flex h-10 cursor-pointer items-center rounded-full bg-[#0A1931] px-3 text-[10px] font-bold text-white">{uploading ? "Téléversement…" : "Téléverser une image"}<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="hidden" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }}/></label><input value={draft.mediaUrl || ""} onChange={(event) => setDraft((value) => ({ ...value, mediaUrl: event.target.value, mediaType: "image" }))} placeholder="URL image ou vidéo" className="h-10 min-w-0 flex-1 rounded-full border bg-white px-3 text-xs"/></div>}{isVideoBlock && <div className="flex gap-2"><label className="inline-flex h-10 cursor-pointer items-center rounded-full bg-[#0A1931] px-3 text-[10px] font-bold text-white">{uploading ? "Téléversement…" : "Téléverser une vidéo"}<input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }}/></label><input required value={draft.mediaUrl || ""} onChange={(event) => setDraft((value) => ({ ...value, mediaUrl: event.target.value, mediaType: youtubeVideoId(event.target.value) ? "youtube" : "video" }))} placeholder="URL YouTube ou vidéo" className="h-10 min-w-0 flex-1 rounded-full border bg-white px-3 text-xs"/></div>}{(blockKey === "formations_certifiees" || blockKey === "recrutement") && <div className="grid gap-2 sm:grid-cols-2"><input type="date" value={draft.date || ""} onChange={(event) => setDraft((value) => ({ ...value, date: event.target.value }))} className="h-10 rounded-full border bg-white px-3 text-xs"/><input value={draft.location || ""} onChange={(event) => setDraft((value) => ({ ...value, location: event.target.value }))} placeholder="Lieu ou modèle" className="h-10 rounded-full border bg-white px-3 text-xs"/></div>}<div className="flex gap-2 md:col-span-2"><button type="submit" className="h-10 rounded-full bg-[#9e001f] px-4 text-xs font-bold text-white">{editingId ? "Enregistrer les modifications" : "Ajouter à la liste"}</button>{editingId && <button type="button" onClick={reset} className="h-10 rounded-full border px-4 text-xs font-bold">Annuler</button>}</div></form><div className="mt-5 space-y-2">{items.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-[14px] border bg-[#fffdfc] p-3 md:flex-row md:items-center"><div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100">{item.mediaType === "video" && item.mediaUrl ? <video src={item.mediaUrl} muted className="h-full w-full object-cover" /> : item.mediaType === "youtube" && item.mediaUrl ? <img src={`https://i.ytimg.com/vi/${youtubeVideoId(item.mediaUrl)}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" /> : item.mediaUrl ? <img src={item.mediaUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[10px] text-zinc-400">Sans média</div>}</div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold text-[#0A1931]">{item.title}</h3><p className="line-clamp-2 text-xs text-zinc-500">{item.description || "Aucune description"}</p>{(item.date || item.location) && <p className="mt-1 text-[10px] font-bold text-[#9e001f]">{item.date || ""}{item.date && item.location ? " · " : ""}{item.location || ""}</p>}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => { setDraft(item); setEditingId(item.id); }} className="h-8 rounded-full border px-3 text-[11px] font-bold">Modifier</button><button type="button" onClick={() => onChange(items.filter((entry) => entry.id !== item.id))} className="h-8 rounded-full border border-red-200 bg-red-50 px-3 text-[11px] font-bold text-red-700">Supprimer</button></div></div>)}{items.length === 0 && <p className="rounded-xl bg-zinc-50 px-4 py-8 text-center text-xs text-zinc-500">Aucun contenu enregistré dans ce sous-onglet.</p>}</div></section>;
}

function LandingMegaMenuEditor({ block, onChange }: { block: { config?: Record<string, unknown> }; onChange: (block: { config: Record<string, unknown> }) => void }) {
  const config = block.config || {};
  const items = Array.isArray(config.items) ? config.items as ManagedLandingItem[] : [];
  return <section className="space-y-5 rounded-[18px] border bg-white p-5"><div><p className="text-[10px] font-black uppercase tracking-wider text-[#9e001f]">Landing Magazine · desktop</p><h2 className="mt-1 text-lg font-black text-[#0A1931]">Mega menu « Nouveau numéro »</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">Configurez les textes, les catégories et les articles affichés dans le méga-menu de la deuxième ligne du header sur ordinateur.</p></div><div className="grid gap-3 md:grid-cols-2"><label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Titre<input value={String(config.title || "Nouveau numéro")} onChange={(event) => onChange({ config: { ...config, title: event.target.value } })} className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-xs" /></label><label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Bouton acheter — lien<input value={String(config.buyHref || "/kiosque")} onChange={(event) => onChange({ config: { ...config, buyHref: event.target.value } })} className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-xs" /></label><label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 md:col-span-2">Description<textarea value={String(config.description || "Les idées, les visages et les analyses à ouvrir maintenant.")} onChange={(event) => onChange({ config: { ...config, description: event.target.value } })} rows={2} className="mt-1 w-full rounded-xl border bg-white p-3 text-xs" /></label><label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 md:col-span-2">Catégories affichées, séparées par des virgules<input value={Array.isArray(config.categories) ? config.categories.join(", ") : "Analyses, Économie, Entrepreneuriat, Société"} onChange={(event) => onChange({ config: { ...config, categories: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) } })} placeholder="Analyses, Économie, Entrepreneuriat" className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-xs" /></label></div><LandingManagedContent blockKey="mega_menu" title="Articles du méga-menu" description="Ajoutez jusqu’à six articles : les trois premiers forment le carrousel principal et les trois suivants la colonne de vignettes." items={items} onChange={(nextItems) => onChange({ config: { ...config, items: nextItems.slice(0, 6) } })} /></section>;
}

function PlatformAdminLanding({ platform, user }: { platform: AdminPlatform; user: any }) {
  const config = adminPlatforms.find((item) => item.id === platform) ?? adminPlatforms[0];
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[24px] p-7 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${config.accent}, #0A1931)` }}>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Plateforme administrée</p>
            <h1 className="mt-2 text-3xl font-black">Administration {config.label}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
              {config.description} Cette vue est configurée pour {user?.prenom || "l’équipe"} ({user?.role || "administrateur"}).
            </p>
          </div>
          <Link href={config.href} className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-xs font-black text-[#0A1931] shadow-sm hover:bg-zinc-100 transition">
            Ouvrir le module opérationnel →
          </Link>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {config.modules.map((module, index) => (
          <div key={module.label} className="flex flex-col justify-between rounded-[20px] border border-zinc-200 bg-white p-5 shadow-sm hover:border-[#9e001f] transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Module {String(index + 1).padStart(2, "0")}
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-black text-white" style={{ backgroundColor: config.accent }}>
                  {index + 1}
                </span>
              </div>
              <h2 className="mt-3 text-base font-black text-[#0A1931]">{module.label}</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-600">{module.detail}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                ✓ Connecté
              </span>
              <Link
                href={module.href}
                className="inline-flex items-center gap-1 rounded-full bg-[#0A1931] text-white px-3.5 py-1.5 text-xs font-bold hover:bg-[#9e001f] transition"
              >
                Gérer →
              </Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function AdminDashboardClient({ user, stats, db }: { user: any, stats: any, db: any }) {
  const [activePlatform, setActivePlatform] = useState<AdminPlatform>("magazine");
  const [activeTab, setActiveTab] = useState<"overview"|"landing"|"articles"|"magazines"|"users"|"orders"|"affiliate"|"abonnements"|"commentaires"|"service"|"settings"|"redacteurs"|"categories"|"tarifs"|"kyc">("overview");
  const [articles, setArticles] = useState<any[]>(db.articles);
  const [magazines, setMagazines] = useState<any[]>(db.magazines);
  const [users, setUsers] = useState<any[]>(db.users);
  const [orders, setOrders] = useState<any[]>(db.orders);
  const [earnings, setEarnings] = useState<any[]>(db.affiliateEarnings);
  const [comments, setComments] = useState<any[]>([]);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [showMagModal, setShowMagModal] = useState(false);
  const [editingMag, setEditingMag] = useState<any>(null);
  const [copiedMagId, setCopiedMagId] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState<any>(null);
  const [userFilter, setUserFilter] = useState<"all" | "pending" | "verified">("all");
  const [message, setMessage] = useState<string>("");
  const [savingArticle, setSavingArticle] = useState(false);
  const [uploadingArticleImage, setUploadingArticleImage] = useState(false);
  const [articleImage, setArticleImage] = useState("");
  const articleLanguages = [{ code: "fr", label: "Français" }, { code: "en", label: "English" }, { code: "es", label: "Español" }, { code: "sw", label: "Swahili" }, { code: "fon", label: "Fongbé" }, { code: "wo", label: "Wolof" }];
  const [articleTranslations, setArticleTranslations] = useState<Record<string, { title: string; summary: string; content: string }>>({});
  const [articleAudios, setArticleAudios] = useState<Record<string, string>>({});
  const [authors, setAuthors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCategoryLabel, setEditCategoryLabel] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState("#9e001f");
  const [editCategoryParentId, setEditCategoryParentId] = useState("");
  const [editCategoryIsActive, setEditCategoryIsActive] = useState(true);
  const [showEditMagCategoryModal, setShowEditMagCategoryModal] = useState(false);
  const [editingMagCategory, setEditingMagCategory] = useState<any>(null);
  const [editMagCategoryLabel, setEditMagCategoryLabel] = useState("");
  const [editMagCategoryColor, setEditMagCategoryColor] = useState("#9e001f");
  const [authorPhoto, setAuthorPhoto] = useState("");
  const [uploadingAuthorPhoto, setUploadingAuthorPhoto] = useState(false);
  const [selectedAuthorId, setSelectedAuthorId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>(SUBSCRIPTION_PLANS);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [magazineCategories, setMagazineCategories] = useState<any[]>([]);
  const [newMagazineCategory, setNewMagazineCategory] = useState("");
  const [protectingPdfs, setProtectingPdfs] = useState(false);
  const [liveKpis, setLiveKpis] = useState<any>(null);
  const [landingBlocks, setLandingBlocks] = useState<any[]>([]);
  const [savingLanding, setSavingLanding] = useState(false);
  const [landingSubTab, setLandingSubTab] = useState<"videos" | "contenus_sponsorises" | "formations_certifiees" | "recrutement" | "mega_menu">("videos");
  const [copiedArticleId, setCopiedArticleId] = useState<string | null>(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleSummary, setArticleSummary] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleTags, setArticleTags] = useState("");
  const [articleIsEncrypted, setArticleIsEncrypted] = useState(true);
  const [articleIsPublished, setArticleIsPublished] = useState(false);
  const [articleLandingTag, setArticleLandingTag] = useState("");
  const [articleIsFeatured, setArticleIsFeatured] = useState(false);
  const [articleIsSentinelle, setArticleIsSentinelle] = useState(false);
  const [articleIsEssor, setArticleIsEssor] = useState(false);
  const [articleIsOmbreDouce, setArticleIsOmbreDouce] = useState(false);

  // KYC & AML States
  const [kycProfiles, setKycProfiles] = useState<any[]>([]);
  const [kycFilter, setKycFilter] = useState("all");
  const [amlLogs, setAmlLogs] = useState<any[]>([]);
  const [kycActiveTab, setKycActiveTab] = useState<"dossiers" | "aml">("dossiers");
  const [inspectKycProfile, setInspectKycProfile] = useState<any | null>(null);
  const [rejectModalProfile, setRejectModalProfile] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loadingKyc, setLoadingKyc] = useState(false);

  // Tarifs & Pricing Centralisé States
  const [pricingSettings, setPricingSettings] = useState<any>({
    ads: {
      cpmPlancher: 2500,
      cpcPlancher: 250,
      cpdFixe: 15000,
      adsenseCommissionPercent: 15,
      sponsoredArticlePrice: 150000,
    },
    wab: {
      creditPack100: 5000,
      creditPack500: 20000,
      boostPublication24h: 3000,
      boostPublication7j: 12000,
      salonPayantTicket: 2000,
    },
    marketplace: {
      commissionStandardPercent: 8,
      boostProduit7j: 7500,
      badgeVerifieMensuel: 10000,
    },
    crowdfunding: {
      fraisDossier: 25000,
      commissionSuccesPercent: 5,
    },
    awards: {
      fraisCandidature: 35000,
      votePayantUnitaire: 500,
    },
    jobs: {
      offreStandard: 25000,
      offrePremiumBoost: 60000,
      deblocageCvUnitaire: 5000,
    },
    shippingRates: {
      BJ: 2000, CI: 2500, SN: 3000, TG: 2000, CM: 3500, NG: 4000, GH: 3500, FR: 8000, US: 12000, GB: 10000, default: 5000
    }
  });
  const [savingPricing, setSavingPricing] = useState(false);

  const openCreateArticleModal = () => {
    setEditingArticle(null);
    setArticleTitle("");
    setArticleSummary("");
    setArticleContent("");
    setArticleImage("");
    setArticleTags("");
    setArticleIsEncrypted(true);
    setArticleIsPublished(false);
    setArticleLandingTag("");
    setArticleIsFeatured(false);
    setArticleIsSentinelle(false);
    setArticleIsEssor(false);
    setArticleIsOmbreDouce(false);
    setArticleTranslations({});
    setArticleAudios({});
    setSelectedAuthorId("");
    setSelectedCategoryId("");
    setSelectedCategoryIds([]);
    setShowArticleModal(true);
  };

  const openEditArticleModal = (a: any) => {
    setEditingArticle(a);
    setArticleTitle(a.title || "");
    setArticleSummary(a.summary || "");
    setArticleContent(a.content || "");
    setArticleImage(a.image || "");
    setArticleTags(Array.isArray(a.tags) ? a.tags.join(", ") : (a.tags || ""));
    setArticleIsEncrypted(a.isEncrypted !== false && a.is_encrypted !== false);
    setArticleIsPublished(Boolean(a.isPublished ?? a.is_published));
    setArticleIsFeatured(Boolean(a.isFeatured ?? a.is_featured));
    setArticleIsSentinelle(Boolean(a.isSentinelle ?? a.is_sentinelle));
    setArticleIsEssor(Boolean(a.isEssor ?? a.is_essor));
    setArticleIsOmbreDouce(Boolean(a.isOmbreDouce ?? a.is_ombre_douce));
    setArticleTranslations(a.translations || {});
    setArticleAudios(a.audioByLanguage || a.audio_by_language || {});
    setSelectedAuthorId(a.authorProfileId || a.author_profile_id || "");
    setSelectedCategoryId(a.categoryId || a.category_id || "");
    setSelectedCategoryIds(a.categoryIds || (a.categoryId || a.category_id ? [a.categoryId || a.category_id] : []));
    const landingTag = LANDING_ARTICLE_TAGS.find((tag) => a.tags?.some((item: string) => item.toLowerCase() === tag.toLowerCase())) || "";
    setArticleLandingTag(landingTag);
    setShowArticleModal(true);
  };


  const fetchArticles = async () => { const res = await fetch("/api/admin/articles"); if (res.ok) { const d = await res.json(); setArticles(d.articles); } };
  const fetchMagazines = async () => { const res = await fetch("/api/admin/magazines"); if (res.ok) { const d = await res.json(); setMagazines(d.magazines); } };
  const protectExistingPdfs = async () => { setProtectingPdfs(true); try { const res = await fetch("/api/admin/magazines/protect-pdfs", { method: "POST", credentials: "include" }); const data = await readApiResponse(res); if (!res.ok) throw new Error(data.error || "Migration impossible"); setMessage(`Protection PDF terminée : ${data.migrated?.length || 0} fichier(s) migré(s).`); await fetchMagazines(); } catch (error) { setMessage(`Protection PDF : ${error instanceof Error ? error.message : "échec de la migration"}`); } finally { setProtectingPdfs(false); } };
  const fetchUsers = async () => { const res = await fetch("/api/admin/users"); if (res.ok) { const d = await res.json(); setUsers(d.users); } };
  const fetchOrders = async () => { const res = await fetch("/api/admin/orders"); if (res.ok) { const d = await res.json(); setOrders(d.orders); } };
  const fetchComments = async () => { const res = await fetch("/api/comments"); if (res.ok) { const d = await res.json(); setComments(d.comments); } };
  const fetchEditorial = async () => { const res = await fetch("/api/admin/editorial"); if (res.ok) { const d = await res.json(); setAuthors(d.authors || []); setCategories(d.categories || []); } };
  const fetchSubscriptionPlans = async () => { const res = await fetch("/api/admin/subscription-plans", { credentials: "include" }); const data = await readApiResponse(res); if (res.ok && Array.isArray(data.plans)) setSubscriptionPlans(data.plans); else if (!res.ok) setMessage(`Erreur tarifs : ${data.error || `chargement impossible (${res.status})`}`); };
  const fetchLiveKpis = async () => { const res = await fetch("/api/admin/kpis", { credentials: "include" }); if (res.ok) setLiveKpis(await res.json()); };
  const fetchMagazineLanding = async () => { const res = await fetch("/api/admin/magazine-landing", { credentials: "include" }); const data = await readApiResponse(res); if (res.ok && Array.isArray(data.blocks)) { const blocks = data.blocks as any[]; setLandingBlocks(blocks.some((item) => item.blockKey === "mega_menu") ? blocks : [...blocks, { blockKey: "mega_menu", title: "Mega menu", blockType: "manual", sourceType: "manual", itemLimit: 6, isActive: true, config: { title: "Nouveau numéro", buyHref: "/kiosque", categories: ["Analyses", "Économie", "Entrepreneuriat", "Société"], items: [] } }]); } else if (!res.ok) setMessage(`Erreur Landing Magazine : ${data.error || `chargement impossible (${res.status})`}`); };
  const updateManagedLandingItems = (blockKey: string, items: ManagedLandingItem[]) => setLandingBlocks((blocks) => blocks.map((block) => block.blockKey === blockKey ? { ...block, config: { ...(block.config || {}), items } } : block));
  const landingItems = (blockKey: string) => { const block = landingBlocks.find((item) => item.blockKey === blockKey); return Array.isArray(block?.config?.items) ? block.config.items as ManagedLandingItem[] : []; };
  const saveMagazineLanding = async () => { setSavingLanding(true); try { const res = await fetch("/api/admin/magazine-landing", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ blocks: landingBlocks }) }); const data = await readApiResponse(res); if (!res.ok) throw new Error(data.error || "Enregistrement impossible"); setLandingBlocks(data.blocks || landingBlocks); setMessage("Configuration du Landing Magazine enregistrée ✅"); } catch (cause) { setMessage(`Erreur Landing Magazine : ${cause instanceof Error ? cause.message : "réessayez"}`); } finally { setSavingLanding(false); } };
  const fetchMagazineCategories = async () => { const res = await fetch("/api/admin/magazine-categories", { credentials: "include" }); const data = await readApiResponse(res); if (res.ok && Array.isArray(data.categories)) setMagazineCategories(data.categories); else if (!res.ok) setMessage(`Erreur catégories Magazine : ${data.error || `chargement impossible (${res.status})`}`); };
  const createMagazineCategory = async () => { const label = newMagazineCategory.trim(); if (!label) return; const res = await fetch("/api/admin/magazine-categories", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ label, colorHex: "#9e001f" }) }); const data = await readApiResponse(res); if (!res.ok) { setMessage(`Erreur catégorie Magazine : ${data.error || "création impossible"}`); return; } setMagazineCategories((items) => [...items, data.category].sort((a, b) => a.label.localeCompare(b.label))); setNewMagazineCategory(""); setMessage("Catégorie Magazine créée"); };
  const deleteMagazineCategory = async (category: any) => { if (!window.confirm(`Désactiver la catégorie Magazine « ${category.label} » ?`)) return; const res = await fetch(`/api/admin/magazine-categories?id=${category.id}`, { method: "DELETE", credentials: "include" }); const data = await readApiResponse(res); if (!res.ok) { setMessage(`Erreur catégorie Magazine : ${data.error || "suppression impossible"}`); return; } setMagazineCategories((items) => items.filter((item) => item.id !== category.id)); setMessage("Catégorie Magazine désactivée"); };
  const saveSubscriptionPlan = async (plan: any) => { setMessage("Enregistrement du tarif en cours…"); const res = await fetch("/api/admin/subscription-plans", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(plan) }); const data = await readApiResponse(res); if (!res.ok) throw new Error(data.error || `Enregistrement impossible (${res.status})`); setSubscriptionPlans((items) => items.map((item) => item.id === data.plan.id ? data.plan : item)); setEditingPlan(null); setMessage("Tarif enregistré ✅"); };
  const createEditorialAuthor = async (payload: any) => { const res = await fetch("/api/admin/editorial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "author", ...payload }) }); const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.error || "Création du rédacteur impossible"); setAuthors((items) => [...items, d.author].sort((a, b) => a.name.localeCompare(b.name))); return d.author; };
  const createEditorialCategory = async (payload: any) => { const res = await fetch("/api/admin/editorial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "category", ...payload }) }); const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.error || "Création de la catégorie impossible"); setCategories((items) => [...items, d.category].sort((a, b) => a.label.localeCompare(b.label))); return d.category; };
  const updateEditorialAuthor = async (id: string, payload: any) => { const res = await fetch("/api/admin/editorial", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "author", id, ...payload }) }); const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.error || "Modification impossible"); setAuthors((items) => items.map((item) => item.id === id ? d.author : item).sort((a, b) => a.name.localeCompare(b.name))); return d.author; };
  const toggleEditorialAuthor = async (author: any) => { try { await updateEditorialAuthor(author.id, { name: author.name, bio: author.bio, roleLabel: author.role_label, photoUrl: author.photo_url, isActive: !author.is_active }); setMessage(author.is_active ? "Rédacteur désactivé" : "Rédacteur réactivé"); } catch (error) { setMessage(`Erreur : ${error instanceof Error ? error.message : "réessayez"}`); } };
  const deleteEditorialAuthor = async (author: any) => { if (!window.confirm(`Supprimer le rédacteur « ${author.name} » ?`)) return; const res = await fetch(`/api/admin/editorial?type=author&id=${author.id}`, { method: "DELETE" }); const d = await res.json().catch(() => ({})); if (!res.ok) { setMessage(d.error || "Suppression impossible"); return; } setAuthors((items) => items.filter((item) => item.id !== author.id)); setMessage("Rédacteur supprimé"); };
  const handleAuthorPhotoUpload = async (file: File) => { setUploadingAuthorPhoto(true); try { const form = new FormData(); form.append("file", file); form.append("type", "cover"); form.append("magazineId", "authors"); const res = await fetch("/api/upload", { method: "POST", body: form }); const d = await res.json().catch(() => ({})); if (!res.ok || !d.url) throw new Error(d.error || "Upload impossible"); setAuthorPhoto(d.url); } catch (error) { setMessage(`Erreur portrait : ${error instanceof Error ? error.message : "réessayez"}`); } finally { setUploadingAuthorPhoto(false); } };

  const handleCopyMagLink = async (mag: any) => {
    const link = `${window.location.origin}/kiosque/${encodeURIComponent(mag.id)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedMagId(mag.id);
      setMessage(`Lien du magazine N°${mag.numero} copié dans le presse-papier ✅`);
      setTimeout(() => setCopiedMagId(null), 2500);
    } catch {
      setMessage(`Lien du magazine : ${link}`);
    }
  };

  const handleShareMagLink = async (mag: any) => {
    const link = `${window.location.origin}/kiosque/${encodeURIComponent(mag.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Envol Africa Magazine N°${mag.numero} - ${mag.title}`,
          text: mag.description || mag.title,
          url: link,
        });
        return;
      } catch {
        // Annulation utilisateur
      }
    }
    await handleCopyMagLink(mag);
  };

  const updateEditorialCategory = async (id: string, payload: any) => {
    const res = await fetch("/api/admin/editorial", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", id, ...payload }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || "Modification de la catégorie impossible");
    setCategories((items) => items.map((c) => (c.id === id ? d.category : c)).sort((a, b) => a.label.localeCompare(b.label)));
    return d.category;
  };

  const deleteEditorialCategory = async (id: string) => {
    if (!window.confirm("Supprimer cette catégorie d'articles ?")) return;
    const res = await fetch(`/api/admin/editorial?type=category&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(`Erreur suppression catégorie : ${d.error || "impossible"}`);
      return;
    }
    setCategories((items) => items.filter((c) => c.id !== id));
    setMessage("Catégorie supprimée ✅");
  };

  const updateMagazineCategory = async (id: string, payload: any) => {
    const res = await fetch("/api/admin/magazine-categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, ...payload }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || "Modification de la catégorie Magazine impossible");
    setMagazineCategories((items) => items.map((c) => (c.id === id ? d.category : c)));
    return d.category;
  };

  const fetchKycData = async () => {
    setLoadingKyc(true);
    try {
      const [resProfiles, resLogs] = await Promise.all([
        fetch(`/api/admin/kyc?statut=${kycFilter}`),
        fetch("/api/admin/kyc?tab=aml")
      ]);
      const dataProfiles = await resProfiles.json();
      const dataLogs = await resLogs.json();
      if (dataProfiles?.profiles) setKycProfiles(dataProfiles.profiles);
      if (dataLogs?.logs) setAmlLogs(dataLogs.logs);
    } catch {
      // ignore
    } finally {
      setLoadingKyc(false);
    }
  };

  const handleApproveKyc = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, statut: "approuve" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message || "Dossier KYC approuvé avec succès ✅");
      await fetchKycData();
    } catch (err: any) {
      setMessage(`Erreur KYC : ${err.message}`);
    }
  };

  const handleRejectKyc = async (userId: string, motif: string) => {
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, statut: "rejete", motifRejet: motif }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message || "Dossier KYC rejeté ❌");
      setRejectModalProfile(null);
      setRejectionReason("");
      await fetchKycData();
    } catch (err: any) {
      setMessage(`Erreur KYC : ${err.message}`);
    }
  };

  const fetchPricingSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data?.settings) {
        setPricingSettings((prev: any) => ({
          ...prev,
          ...data.settings,
        }));
      }
    } catch {
      // ignore
    }
  };

  const savePricingSettings = async () => {
    setSavingPricing(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricingSettings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sauvegarde impossible");
      setMessage("Grille tarifaire et paramètres de monétisation enregistrés avec succès ✅");
    } catch (err: any) {
      setMessage(`Erreur sauvegarde tarifs : ${err.message}`);
    } finally {
      setSavingPricing(false);
    }
  };

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("platform") as AdminPlatform | null;
    if (requested && adminPlatforms.some((item) => item.id === requested)) setActivePlatform(requested);
  }, []);

  useEffect(()=>{
    if (activePlatform !== "magazine") return;
    if(activeTab==="articles") fetchArticles();
    if(activeTab==="magazines") fetchMagazines();
    if(activeTab==="users") fetchUsers();
    if(activeTab==="orders") fetchOrders();
    if(activeTab==="commentaires") fetchComments();
    if(activeTab==="articles" || activeTab==="redacteurs" || activeTab==="categories") fetchEditorial();
    if(activeTab==="abonnements") fetchSubscriptionPlans();
    if(activeTab==="categories" || activeTab==="magazines") fetchMagazineCategories();
    if(activeTab==="overview") fetchLiveKpis();
    if(activeTab==="landing") fetchMagazineLanding();
    if(activeTab==="kyc") fetchKycData();
    if(activeTab==="tarifs") fetchPricingSettings();
  },[activePlatform, activeTab, kycFilter]);


  const handleCreateArticle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingArticle(true);
    try {
      const form = new FormData(e.currentTarget);
      const title = (articleTitle || (form.get("title") as string) || "").trim();
      const summary = (articleSummary || (form.get("summary") as string) || "").trim();
      const content = (articleContent || (form.get("content") as string) || "").trim();

      if (!title || !content) {
        throw new Error("Le titre et le contenu de l’article sont obligatoires.");
      }

      const currentTranslations = {
        ...articleTranslations,
        fr: {
          title,
          summary,
          content,
        },
      };

      const selectedTags = Array.from(new Set([
        ...articleTags.split(",").map((t: string) => t.trim()).filter(Boolean),
        String(articleLandingTag || "").trim()
      ].filter(Boolean)));

      const primaryCatId = selectedCategoryIds[0] || selectedCategoryId;
      const categoryLabel = categories.find((item) => item.id === primaryCatId)?.label || editingArticle?.category || "Economie";

      const authorObj = authors.find((item) => item.id === selectedAuthorId);
      const authorName = authorObj?.name || editingArticle?.author || "";

      const payload: any = {
        title,
        summary,
        content,
        category: categoryLabel,
        categoryId: primaryCatId || null,
        categoryIds: selectedCategoryIds,
        image: articleImage || (form.get("image") as string) || "",
        translations: currentTranslations,
        audioByLanguage: articleAudios,
        author: authorName,
        authorId: form.get("authorId") || editingArticle?.authorId || "",
        authorProfileId: selectedAuthorId || null,
        tags: selectedTags,
        isEncrypted: articleIsEncrypted,
        isPublished: articleIsPublished,
        isFeatured: articleIsFeatured,
        isSentinelle: articleIsSentinelle,
        isEssor: articleIsEssor,
        isOmbreDouce: articleIsOmbreDouce,
      };
      if (editingArticle) payload.id = editingArticle.id;

      const res = await fetch("/api/admin/articles", {
        method: editingArticle ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({ error: "Réponse serveur illisible" }));
      if (!res.ok) throw new Error(data.error || `Enregistrement impossible (${res.status})`);
      setMessage(editingArticle ? "Article modifié et enregistré ✅" : "Article créé et enregistré ✅");
      await fetchArticles();
      setShowArticleModal(false);
      setEditingArticle(null);
      setArticleTitle("");
      setArticleSummary("");
      setArticleContent("");
      setArticleImage("");
      setArticleTags("");
      setArticleLandingTag("");
      setArticleTranslations({});
      setArticleAudios({});
    } catch (error) {
      setMessage(`Erreur d’enregistrement : ${error instanceof Error ? error.message : "réessayez"}`);
    } finally {
      setSavingArticle(false);
    }
  };

  const handleArticleAudioUpload = async (file: File, language: string) => {
    try {
      const formData = new FormData(); formData.append("file", file); formData.append("type", "audio"); formData.append("magazineId", editingArticle?.id || "article"); formData.append("lang", language);
      const res = await fetch("/api/upload", { method: "POST", body: formData }); const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Upload audio impossible");
      setArticleAudios((items) => ({ ...items, [language]: data.url })); setMessage(`Audio ${language.toUpperCase()} uploadé. Enregistrez l’article pour confirmer.`);
    } catch (error) { setMessage(`Erreur audio ${language.toUpperCase()} : ${error instanceof Error ? error.message : "réessayez"}`); }
  };

  const handleArticleImageUpload = async (file: File) => {
    setUploadingArticleImage(true);
    try {
      const formData = new FormData(); formData.append("file", file); formData.append("type", "cover"); formData.append("magazineId", editingArticle?.id || "article");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Upload impossible");
      setArticleImage(data.url); setMessage("Image uploadée. Enregistrez l’article pour confirmer ✅");
    } catch (error) { setMessage(`Erreur upload image : ${error instanceof Error ? error.message : "réessayez"}`); }
    finally { setUploadingArticleImage(false); }
  };

  const handleDeleteArticle = async (id:string) => {
    if (!confirm("Supprimer cet article ?")) return;
    const res = await fetch(`/api/admin/articles?id=${id}`, { method:"DELETE" });
    if (res.ok) { setMessage("Article supprimé"); fetchArticles(); }
  };

  const handleCopyArticleLink = async (a: any) => {
    const slug = a.slug || a.id;
    const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://www.envolafrica.site";
    const articleUrl = `${origin}/article/${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopiedArticleId(a.id);
      setMessage(`Lien copié : ${articleUrl} ✅`);
      setTimeout(() => setCopiedArticleId((curr) => (curr === a.id ? null : curr)), 2500);
    } catch {
      window.prompt("Copiez le lien de l'article :", articleUrl);
    }
  };

  const handleTogglePublish = async (a: any) => {
    const nextPublished = !a.isPublished;
    const res = await fetch("/api/admin/articles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, isPublished: nextPublished }),
    });
    if (res.ok) {
      setMessage(nextPublished ? `Article « ${a.title} » publié en ligne ✅` : `Article « ${a.title} » dépublié (brouillon) ⏸️`);
      fetchArticles();
    } else {
      setMessage("Erreur lors de la modification du statut de l'article.");
    }
  };

  const handleCreateMag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload: any = {
      numero: form.get("numero"),
      title: form.get("title"),
      cover: form.get("cover"),
      year: parseInt(form.get("year") as string),
      description: form.get("description"),
      featured: form.get("featured")==="on",
    };
    if (editingMag) {
      payload.id = editingMag.id;
      const res = await fetch("/api/admin/magazines", { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload), credentials: "include" });
      const data = await readApiResponse(res);
      if (res.ok) { setMessage("Magazine modifié ✅"); fetchMagazines(); setShowMagModal(false); setEditingMag(null); } else setMessage(`Erreur magazine : ${data.error || `enregistrement impossible (${res.status})`}`);
    } else {
      const res = await fetch("/api/admin/magazines", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload), credentials: "include" });
      const data = await readApiResponse(res);
      if (res.ok) { setMessage("Magazine créé ✅"); fetchMagazines(); setShowMagModal(false); }
      else alert(data.error);
    }
  };

  const handleDeleteMag = async (id:string) => {
    if (!confirm("Supprimer ce magazine ? Cette action est irréversible.")) return;
    setMessage("Suppression du magazine en cours…");
    try {
      const res = await fetch(`/api/admin/magazines?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Suppression impossible (${res.status})`);
      setMagazines((items) => items.filter((item) => item.id !== id));
      setMessage("Magazine supprimé ✅");
      await fetchMagazines();
    } catch (error) {
      setMessage(`Erreur de suppression : ${error instanceof Error ? error.message : "réessayez"}`);
    }
  };

  const handleChangeRole = async (id:string, role:string) => {
    const res = await fetch("/api/admin/users", { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id, role }) });
    const data = await res.json();
    if (res.ok) { setMessage(`Rôle changé en ${role} ✅`); fetchUsers(); setShowUserModal(null); }
    else alert(data.error);
  };

  const handleVerifyUser = async (user: any) => {
    const res = await fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: user.id, isVerified: true }) });
    const data = await readApiResponse(res);
    if (!res.ok) { setMessage(`Validation impossible : ${data.error || "réessayez"}`); return; }
    setUsers((items) => items.map((item) => item.id === user.id ? { ...item, isVerified: true } : item));
    setMessage(`Compte de ${user.prenom || user.email} validé manuellement ✅`);
  };

  const handleChangeOrderStatus = async (id:string, status:string) => {
    const res = await fetch("/api/admin/orders", { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id, status }) });
    if (res.ok) fetchOrders();
  };

  const handleModerateComment = async (id:string, isModerated:boolean) => {
    const res = await fetch("/api/comments", { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id, isModerated }) });
    if (res.ok) fetchComments();
  };

  const magazineModules = [
    { id: "articles", eyebrow: "01 · ÉDITORIAL", title: "Articles & publication", description: "Rédiger, enrichir, chiffrer, publier et piloter les performances des articles.", icon: "edit_note", tone: "#9e001f", action: "Gérer les articles" },
    { id: "magazines", eyebrow: "02 · KIOSQUE", title: "Magazines & flipbooks", description: "Créer les éditions, gérer les couvertures, les PDF, les aperçus et la protection progressive.", icon: "menu_book", tone: "#b45309", action: "Gérer les magazines" },
    { id: "abonnements", eyebrow: "03 · REVENUS", title: "Abonnements & tarifs", description: "Administrer les formules, les prix, les promotions et le revenu récurrent.", icon: "sell", tone: "#176b4d", action: "Gérer les abonnements" },
    { id: "orders", eyebrow: "04 · COMMERCE", title: "Commandes & paiements", description: "Suivre les commandes, contrôler les statuts et vérifier les revenus encaissés.", icon: "receipt_long", tone: "#0A1931", action: "Voir les commandes" },
    { id: "redacteurs", eyebrow: "05 · ÉQUIPE", title: "Rédacteurs & catégories", description: "Organiser les profils éditoriaux, les catégories et la qualité de publication.", icon: "groups", tone: "#5b3b8a", action: "Gérer l’équipe" },
    { id: "settings", eyebrow: "06 · CONTRÔLE", title: "Réglages & sécurité", description: "Vérifier les paramètres, la protection des contenus et les règles de gouvernance.", icon: "security", tone: "#334155", action: "Ouvrir les réglages" },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      <div className="bg-[#0A1931] text-white sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-6 xl:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo-blanc-footer.png" alt="EAM" className="h-10 w-auto object-contain" />
            <div><div className="font-bold text-[15px]">Envol Africa Admin</div><div className="text-[11px] text-zinc-400">Rédaction • {user.role} • {user.prenom} {user.nom} • {user.twoFactorEnabled ? "✓ 2FA" : "⚠ 2FA"}</div></div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/compte" className="h-9 px-4 rounded-full bg-white/10 border border-white/15 text-[12px]">← Dashboard compte</Link>
            <Link href="/" className="h-9 px-4 rounded-full bg-white/10 border border-white/15 text-[12px]">← Retour site</Link>
            <div className="w-9 h-9 rounded-full bg-[#D4AF37] text-[#0A1931] flex items-center justify-center font-bold text-sm">{user.prenom[0]}</div>
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/10">
          <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-6 py-2 xl:px-8">
            <span className="mr-2 flex shrink-0 items-center text-[10px] font-black uppercase tracking-wider text-zinc-400">Projet :</span>
            {adminPlatforms.map((item) => <button key={item.id} type="button" onClick={() => { setActivePlatform(item.id); setActiveTab("overview"); }} className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-black transition ${activePlatform === item.id ? "text-white shadow-sm" : "text-zinc-400 hover:bg-white/10 hover:text-white"}`} style={activePlatform === item.id ? { backgroundColor: item.accent } : undefined}>{item.label}</button>)}
          </div>
        </div>
        {activePlatform === "magazine" && <div className="max-w-[1440px] mx-auto px-6 xl:px-8 pb-0 flex gap-1 overflow-x-auto">
          {[
            { id:"overview", label:"KPIs" },
            { id:"landing", label:"Landing Magazine" },
            { id:"articles", label:`Articles (${articles.length})` },
            { id:"redacteurs", label:`Rédacteurs (${authors.length})` },
            { id:"categories", label:`Catégories (${categories.length})` },
            { id:"magazines", label:`Magazines (${magazines.length})` },
            { id:"users", label:`Utilisateurs (${users.length})` },
            { id:"orders", label:`Commandes` },
            { id:"abonnements", label:`Abonnements` },
            { id:"tarifs", label:`Tarifs & Monétisation` },
            { id:"kyc", label:`Conformité KYC & AML` },
            { id:"commentaires", label:`Commentaires` },
            { id:"affiliate", label:`Affiliation` },
            { id:"service", label:"Services" },
            { id:"settings", label:"Réglages" },
          ].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id as any)} className={`px-3 py-3 text-[11px] font-bold uppercase tracking-wider border-b-2 whitespace-nowrap ${activeTab===t.id ? "border-[#D4AF37] text-white" : "border-transparent text-zinc-400 hover:text-white"}`}>{t.label}</button>
          ))}
        </div>}
      </div>

      {message && <div className="max-w-[1440px] mx-auto px-6 xl:px-8 pt-4"><div className="bg-green-600 text-white text-sm rounded-full px-4 py-2 inline-block">{message} <button onClick={()=>setMessage("")} className="ml-2 font-bold">×</button></div></div>}

      <div className="max-w-[1440px] mx-auto px-6 xl:px-8 pt-6">
        {activePlatform !== "magazine" ? <PlatformAdminLanding platform={activePlatform} user={user} /> : <>
        {activeTab==="overview" && (
          <div className="space-y-7">
            <section className="relative overflow-hidden rounded-[28px] bg-[#0A1931] p-7 text-white shadow-xl lg:p-10">
              <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[#D4AF37]/25" /><div className="absolute -bottom-36 right-24 h-72 w-72 rounded-full border border-[#D4AF37]/15" />
              <div className="relative grid gap-8 lg:grid-cols-[1.35fr_.65fr] lg:items-end"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-[#f2b84b]">Magazine · centre de pilotage</p><h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight lg:text-5xl">Tout le contrôle éditorial, dans le bon ordre.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">Commencez par le contenu, structurez les éditions, puis contrôlez les revenus et la qualité de l’expérience lecteur. Chaque étape ouvre directement l’outil opérationnel existant.</p><button type="button" onClick={()=>setActiveTab("articles")} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#f2b84b] px-5 text-xs font-black text-[#0A1931]">Commencer par les articles <span aria-hidden="true">→</span></button></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/10 p-4"><span className="text-[10px] uppercase tracking-wider text-white/55">Revenu encaissé</span><strong className="mt-2 block text-2xl font-black">{stats.totalRevenue.toLocaleString()} F</strong><span className="mt-1 block text-[10px] text-green-300">{stats.paidOrders}/{stats.orders} commandes payées</span></div><div className="rounded-2xl border border-white/10 bg-white/10 p-4"><span className="text-[10px] uppercase tracking-wider text-white/55">Éditions</span><strong className="mt-2 block text-2xl font-black">{stats.magazines}</strong><span className="mt-1 block text-[10px] text-white/55">{magazines.filter((m:any)=>m.featured).length} à la une</span></div><div className="rounded-2xl border border-white/10 bg-white/10 p-4"><span className="text-[10px] uppercase tracking-wider text-white/55">Abonnés</span><strong className="mt-2 block text-2xl font-black">{stats.subscribers}</strong><span className="mt-1 block text-[10px] text-white/55">actifs</span></div><div className="rounded-2xl border border-white/10 bg-white/10 p-4"><span className="text-[10px] uppercase tracking-wider text-white/55">À traiter</span><strong className="mt-2 block text-2xl font-black">{db.settings?.serviceRequests?.length||0}</strong><span className="mt-1 block text-[10px] text-white/55">demandes de service</span></div></div></div>
            </section>
            <section><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#9e001f]">Parcours recommandé</p><h2 className="mt-1 text-2xl font-black text-[#0A1931]">Les modules Magazine</h2></div><span className="hidden rounded-full bg-white px-3 py-2 text-[10px] font-bold text-zinc-500 shadow-sm md:inline-flex">6 espaces opérationnels</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{magazineModules.map((module,index)=><button type="button" key={module.id} onClick={()=>setActiveTab(module.id as any)} className="group relative overflow-hidden rounded-[22px] border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-sm" style={{backgroundColor:module.tone}}><span className="material-symbols-outlined">{module.icon}</span></div><span className="text-[10px] font-black tracking-wider text-zinc-400">{module.eyebrow}</span></div><h3 className="mt-5 text-lg font-black text-[#0A1931]">{module.title}</h3><p className="mt-2 min-h-[48px] text-xs leading-5 text-zinc-600">{module.description}</p><span className="mt-5 inline-flex items-center gap-2 text-[11px] font-black" style={{color:module.tone}}>{module.action} <span className="transition group-hover:translate-x-1">→</span></span></button>)}</div></section>
            {liveKpis && <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-[18px] border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Connectés maintenant</p><strong className="mt-2 block text-2xl font-black text-[#0A1931]">{liveKpis.users.activeNow}</strong><span className="text-[11px] text-zinc-500">{liveKpis.users.offline} hors ligne</span></div><div className="rounded-[18px] border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Achats confirmés</p><strong className="mt-2 block text-2xl font-black text-[#0A1931]">{liveKpis.commerce.ordersToday}</strong><span className="text-[11px] text-zinc-500">dernières 24 heures</span></div><div className="rounded-[18px] border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Paniers abandonnés</p><strong className="mt-2 block text-2xl font-black text-[#0A1931]">{liveKpis.commerce.abandonedCartsLast24h}</strong><span className="text-[11px] text-zinc-500">événements suivis</span></div><div className="rounded-[18px] border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Dons confirmés</p><strong className="mt-2 block text-2xl font-black text-[#0A1931]">{Number(liveKpis.donations.totalToday || 0).toLocaleString()} XOF</strong><span className="text-[11px] text-zinc-500">{liveKpis.donations.countToday} opération(s)</span></div></section>}
            <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-[22px] border border-zinc-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Derniers mouvements</p><h3 className="mt-1 text-lg font-black text-[#0A1931]">Commandes récentes</h3></div><button type="button" onClick={()=>setActiveTab("orders")} className="text-[11px] font-black text-[#9e001f]">Tout voir →</button></div><div className="mt-4 space-y-2">{orders.slice(0,5).map((o:any)=><div key={o.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3 text-[12px]"><div><span className="font-bold text-[#0A1931]">{o.id.slice(0,8)}</span><span className="ml-2 text-zinc-500">{o.total.toLocaleString()} {o.currency}</span></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-zinc-500">{o.status}</span></div>)}{orders.length===0&&<p className="py-6 text-center text-sm text-zinc-500">Aucune commande récente.</p>}</div></div><div className="rounded-[22px] border border-[#e1c98b] bg-[#fffaf0] p-6"><p className="text-[10px] font-black uppercase tracking-wider text-[#b45309]">Contrôle rapide</p><h3 className="mt-1 text-lg font-black text-[#0A1931]">Besoin d’une action ?</h3><p className="mt-2 text-xs leading-5 text-zinc-600">Choisissez directement l’espace à ouvrir. Vos outils et vos droits restent identiques.</p><button type="button" onClick={()=>setActiveTab("commentaires")} className="mt-5 inline-flex h-10 items-center rounded-full bg-[#0A1931] px-4 text-[11px] font-black text-white">Modérer les commentaires →</button></div></section>
          </div>
        )}

        {activeTab==="landing" && <div className="space-y-6">
          <section className="overflow-hidden rounded-[24px] bg-[#0A1931] p-7 text-white shadow-lg"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f2b84b]">Magazine · gestion simplifiée</p><h1 className="mt-2 text-3xl font-black">Gérer les contenus du Landing</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Les articles se positionnent par étiquette dans l’éditeur. Ici, gérez uniquement les contenus publiés directement par ENVOL AFRICA.</p></div><button type="button" onClick={() => void saveMagazineLanding()} disabled={savingLanding} className="h-11 shrink-0 rounded-full bg-[#f2b84b] px-5 text-xs font-black text-[#0A1931] disabled:opacity-50">{savingLanding ? "Enregistrement…" : "Enregistrer"}</button></div></section>
          <nav className="flex gap-2 overflow-x-auto rounded-[18px] border bg-white p-2" aria-label="Sous-onglets du Landing Magazine">{[{ key: "videos", label: "Vidéos" }, { key: "contenus_sponsorises", label: "Contenus sponsorisés" }, { key: "formations_certifiees", label: "Formations" }, { key: "recrutement", label: "Emploi" }, { key: "mega_menu", label: "Mega menu" }].map((tab) => <button key={tab.key} type="button" onClick={() => setLandingSubTab(tab.key as typeof landingSubTab)} className={`shrink-0 rounded-full px-4 py-3 text-xs font-black transition ${landingSubTab === tab.key ? "bg-[#9e001f] text-white" : "text-zinc-500 hover:bg-[#fff4f1] hover:text-[#9e001f]"}`}>{tab.label}</button>)}</nav>
          {landingSubTab === "videos" && <LandingManagedContent blockKey="videos" title="Vidéos" description="Ajoutez une vidéo par URL ou téléversez un fichier vidéo. Elle apparaîtra dans le bloc Vidéos du Landing." items={landingItems("videos")} onChange={(items) => updateManagedLandingItems("videos", items)} />}
          {landingSubTab === "contenus_sponsorises" && <LandingManagedContent blockKey="contenus_sponsorises" title="Contenus sponsorisés" description="Un contenu sponsorisé peut être une image ou une vidéo. Ajoutez son lien interne ou son URL média." items={landingItems("contenus_sponsorises")} onChange={(items) => updateManagedLandingItems("contenus_sponsorises", items)} />}
          {landingSubTab === "formations_certifiees" && <LandingManagedContent blockKey="formations_certifiees" title="Formations" description="Gérez les formations publiées directement par ENVOL AFRICA avec leur date, leur lieu ou leur modèle de diffusion." items={landingItems("formations_certifiees")} onChange={(items) => updateManagedLandingItems("formations_certifiees", items)} />}
          {landingSubTab === "recrutement" && <LandingManagedContent blockKey="recrutement" title="Emploi" description="Gérez les offres d’emploi sélectionnées et publiées directement par ENVOL AFRICA sur le Landing Magazine." items={landingItems("recrutement")} onChange={(items) => updateManagedLandingItems("recrutement", items)} />}
          {landingSubTab === "mega_menu" && (() => { const block = landingBlocks.find((item) => item.blockKey === "mega_menu") || { config: {} }; return <LandingMegaMenuEditor block={block} onChange={(next) => setLandingBlocks((blocks) => blocks.map((item) => item.blockKey === "mega_menu" ? { ...item, config: next.config } : item))} />; })()}
        </div>}

        {activeTab==="landing" && false && (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[24px] bg-[#0A1931] p-7 text-white shadow-lg">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f2b84b]">Magazine · architecture éditoriale</p><h1 className="mt-2 text-3xl font-black">Piloter le Landing, bloc par bloc.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Choisissez la source métier, l’ordre, le volume et la visibilité. Les données restent issues des articles, formations, Jobs et WAB ; cette page contrôle uniquement leur mise en avant.</p></div>
                <button type="button" onClick={() => void saveMagazineLanding()} disabled={savingLanding || landingBlocks.length === 0} className="h-11 rounded-full bg-[#f2b84b] px-5 text-xs font-black text-[#0A1931] disabled:cursor-not-allowed disabled:opacity-50">{savingLanding ? "Enregistrement…" : "Enregistrer la structure"}</button>
              </div>
            </section>
            <div className="rounded-[18px] border border-[#eadedb] bg-white p-5"><div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-black text-[#0A1931]">Blocs actifs et sourcing</h2><p className="mt-1 text-xs text-zinc-500">L’ordre ci-dessous correspond à l’ordre de lecture public. Les blocs automatiques ne demandent pas de saisie de contenu manuel.</p></div><span className="rounded-full bg-[#f0e8e6] px-3 py-1 text-[10px] font-black text-[#9e001f]">{landingBlocks.filter((block) => block.isActive).length} actifs</span></div>
              <div className="mt-5 space-y-3">{landingBlocks.map((block, index) => <article key={block.blockKey} className={`rounded-[16px] border p-4 transition ${block.isActive ? "border-[#eadedb] bg-[#fffdfc]" : "border-zinc-200 bg-zinc-50 opacity-70"}`}><div className="flex flex-col gap-4 xl:flex-row xl:items-start"><div className="flex min-w-0 items-start gap-3 xl:w-[280px]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#9e001f] text-xs font-black text-white">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><h3 className="truncate text-sm font-black text-[#0A1931]">{block.title || block.blockKey}</h3><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#9e001f]">{block.blockKey}</p><p className="mt-1 text-[11px] leading-4 text-zinc-500">{block.sourceType === "manual" ? "Sélection manuelle" : `Source : ${block.sourceType}`}</p></div></div><div className="grid flex-1 gap-3 md:grid-cols-[1.5fr_1fr_90px_100px]"><label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Titre<input value={block.title || ""} onChange={(event) => setLandingBlocks((items) => items.map((item) => item.blockKey === block.blockKey ? { ...item, title: event.target.value } : item))} className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-xs font-semibold" /></label><label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Source<select value={block.sourceType} onChange={(event) => setLandingBlocks((items) => items.map((item) => item.blockKey === block.blockKey ? { ...item, sourceType: event.target.value } : item))} className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-xs font-semibold"><option value="manual">Manuelle</option><option value="articles">Articles</option><option value="article_tag">Étiquette article</option><option value="article_category">Catégorie article</option><option value="formations">Formations</option><option value="jobs_boosted">Jobs boostés</option><option value="wab_boosted">WAB boosté</option><option value="video_library">Bibliothèque vidéo</option><option value="ecosystem_links">Écosystème</option><option value="sponsored_library">Sponsorisé</option></select></label><label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Limite<input type="number" min={1} max={24} value={block.itemLimit} onChange={(event) => setLandingBlocks((items) => items.map((item) => item.blockKey === block.blockKey ? { ...item, itemLimit: Math.max(1, Math.min(24, Number(event.target.value) || 1)) } : item))} className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-center text-xs font-semibold" /></label><label className="flex items-end gap-2 pb-2 text-[11px] font-bold text-zinc-600"><input type="checkbox" checked={block.isActive !== false} onChange={(event) => setLandingBlocks((items) => items.map((item) => item.blockKey === block.blockKey ? { ...item, isActive: event.target.checked } : item))} className="h-4 w-4 accent-[#9e001f]" /> Afficher</label></div></div>{(block.sourceType === "article_tag" || block.sourceType === "article_category" || block.sourceType === "jobs_boosted") && <div className="mt-3 rounded-xl bg-[#f8f1ef] px-3 py-2 text-[11px] text-zinc-600">Règle active : <strong>{block.sourceType === "article_tag" ? `étiquette « ${String(block.config?.tag || "à définir")} »` : block.sourceType === "article_category" ? `catégorie « ${String(block.config?.category || "à définir")} »` : "offres Jobs boostées et publiées"}</strong>. La valeur détaillée sera éditable dans le sous-lot de sourcing.</div>}</article>)}</div>
            </div>
          </div>
        )}

        {activeTab==="articles" && (
          <div className="bg-white rounded-[18px] border p-6">
            <div className="flex items-center justify-between"><h3 className="font-bold text-[18px]">Articles - CRUD complet + KPIs vues/likes - Fil d'info, Sentinelles, Essor, Ombre douce</h3><button onClick={openCreateArticleModal} className="h-9 px-4 rounded-full bg-[#0A1931] text-white text-[12px] font-bold">+ Nouvel article</button></div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-[12px]"><thead className="text-[10px] uppercase text-zinc-500 border-b"><tr><th className="text-left py-2">Titre</th><th>Cat</th><th>Auteur</th><th>Vues</th><th>Flags</th><th>Statut</th><th className="text-right py-2 pr-2">Actions</th></tr></thead>
                <tbody>{articles.map((a:any)=>(<tr key={a.id} className="border-b"><td className="py-2 max-w-[260px] truncate font-medium">{a.title}</td><td><span className="px-2 py-0.5 bg-zinc-100 rounded-full text-[10px]">{a.category}</span></td><td className="text-[11px]">{a.author}</td><td>{a.views}</td><td className="text-[9px] space-x-1">{a.isFeatured&&"★"}{a.isSentinelle&&"S"}{a.isEssor&&"E"}{a.isOmbreDouce&&"O"}</td><td><span className={`px-2 py-0.5 rounded-full text-[10px] ${a.isPublished?"bg-green-50 text-green-700":"bg-amber-50 text-amber-700"}`}>{a.isPublished?"Publié":"Brouillon"}</span></td><td className="py-1.5"><div className="flex flex-wrap items-center justify-end gap-1.5"><a href={`/article/${encodeURIComponent(a.slug || a.id)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition" title="Voir l’article dans un nouvel onglet"><span>Voir</span><span className="text-[10px]">↗</span></a><button type="button" onClick={()=>void handleCopyArticleLink(a)} className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full border text-[11px] font-semibold transition ${copiedArticleId===a.id?"border-green-300 bg-green-100 text-green-800":"border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"}`} title="Copier l’adresse web complète de l’article"><span>{copiedArticleId===a.id?"✓ Copié !":"Copier le lien"}</span></button><button type="button" onClick={()=>openEditArticleModal(a)} className="h-7 px-2.5 rounded-full border border-zinc-200 bg-white text-[11px] font-semibold text-[#0A1931] hover:bg-zinc-50">Éditer</button><button type="button" onClick={()=>void handleTogglePublish(a)} className={`h-7 px-2.5 border rounded-full text-[11px] font-semibold transition ${a.isPublished?"border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100":"border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`} title={a.isPublished?"Dépublier cet article (passer en brouillon)":"Publier cet article en ligne"}>{a.isPublished?"Dépublier":"Publier"}</button><button type="button" onClick={()=>void handleDeleteArticle(a.id)} className="h-7 px-2.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-[11px] font-semibold hover:bg-red-100" title="Supprimer définitivement cet article">Supprimer</button></div></td></tr>))}</tbody>
              </table>
            </div>
            {showArticleModal && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <form key={editingArticle ? editingArticle.id : "new-article"} onSubmit={handleCreateArticle} className="bg-white rounded-[20px] p-6 w-full max-w-[760px] max-h-[90vh] overflow-y-auto">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <h3 className="font-bold text-lg text-[#0A1931]">{editingArticle?"Modifier":"Nouveau"} article</h3>
                      <p className="mt-0.5 text-[11px] text-zinc-500">Les champs marqués sont enregistrés dans le Magazine et contrôlent l’accès public au contenu.</p>
                    </div>
                    {editingArticle && (
                      <div className="flex items-center gap-2">
                        <a href={`/article/${encodeURIComponent(editingArticle.slug || editingArticle.id)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100">
                          <span>Voir en direct</span>
                          <span>↗</span>
                        </a>
                        <button type="button" onClick={() => void handleCopyArticleLink(editingArticle)} className="text-[11px] font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-full hover:bg-zinc-200">
                          {copiedArticleId === editingArticle.id ? "✓ Lien copié !" : "Copier le lien"}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 grid gap-3">
                    <input name="title" value={articleTitle} onChange={(e)=>setArticleTitle(e.target.value)} placeholder="Titre" required className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <RichTextEditor name="summary" value={articleSummary} onChange={setArticleSummary} placeholder="Résumé de l’article" minHeight={100} className="bg-zinc-50" />
                    <RichTextEditor name="content" value={articleContent} onChange={setArticleContent} placeholder="Contenu complet - 12 lignes visibles non-abonnés" minHeight={220} className="bg-zinc-50" />
                    <section className="rounded-[16px] border border-[#e5bdbb] bg-[#fffaf8] p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="text-xs font-black text-[#0A1931]">Versions linguistiques et audio</h4><p className="mt-1 text-[11px] leading-5 text-zinc-500">Le français reprend le contenu principal. Ajoutez les autres langues et l’URL sécurisée de leur fichier audio, puis l’abonné retrouvera automatiquement sa préférence.</p></div><span className="material-symbols-outlined text-[#9e001f]">translate</span></div><div className="mt-4 grid gap-3">{articleLanguages.filter((language) => language.code !== "fr").map((language) => { const value = articleTranslations[language.code] || { title: "", summary: "", content: "" }; return <div key={language.code} className="rounded-[14px] border border-white bg-white p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-black text-[#9e001f]">{language.label}</span><span className="text-[10px] text-zinc-400">facultatif</span></div><div className="grid gap-2 md:grid-cols-2"><input value={value.title} onChange={(event) => setArticleTranslations((items) => ({ ...items, [language.code]: { ...value, title: event.target.value } }))} placeholder={`Titre en ${language.label}`} className="h-9 rounded-full border bg-zinc-50 px-3 text-[11px]" /><input value={value.summary} onChange={(event) => setArticleTranslations((items) => ({ ...items, [language.code]: { ...value, summary: event.target.value } }))} placeholder={`Résumé en ${language.label}`} className="h-9 rounded-full border bg-zinc-50 px-3 text-[11px]" /><RichTextEditor value={value.content} onChange={(content) => setArticleTranslations((items) => ({ ...items, [language.code]: { ...value, content } }))} placeholder={`Contenu en ${language.label}`} minHeight={120} className="bg-zinc-50 md:col-span-2" /><div className="flex flex-wrap items-center gap-2 md:col-span-2"><label className="inline-flex h-9 cursor-pointer items-center rounded-full bg-[#0A1931] px-3 text-[10px] font-bold text-white">Uploader l’audio<input type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/webm" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleArticleAudioUpload(file, language.code); }} /></label><input type="url" value={articleAudios[language.code] || ""} onChange={(event) => setArticleAudios((items) => ({ ...items, [language.code]: event.target.value }))} placeholder={`URL audio ${language.label} (https://...)`} className="h-9 min-w-[220px] flex-1 rounded-full border bg-zinc-50 px-3 text-[11px]" /></div></div></div>; })}<div className="rounded-[14px] border border-dashed border-[#e5bdbb] bg-white p-3"><label className="text-[11px] font-bold text-[#0A1931]">Audio français, facultatif<div className="mt-2 flex flex-wrap gap-2"><label className="inline-flex h-9 cursor-pointer items-center rounded-full bg-[#0A1931] px-3 text-[10px] font-bold text-white">Uploader<input type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/webm" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleArticleAudioUpload(file, "fr"); }} /></label><input type="url" value={articleAudios.fr || ""} onChange={(event) => setArticleAudios((items) => ({ ...items, fr: event.target.value }))} placeholder="https://..." className="h-9 min-w-[220px] flex-1 rounded-full border bg-zinc-50 px-3 text-[11px]" /></div></label></div></div></section>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div><label className="mb-1 block text-[11px] font-bold text-zinc-600">Catégorie</label><div className="flex gap-2"><select name="categoryId" multiple size={Math.min(Math.max(categories.length, 3), 6)} value={selectedCategoryIds.length ? selectedCategoryIds : (selectedCategoryId || editingArticle?.categoryId || editingArticle?.category_id || categories.find((item) => item.label.toLowerCase() === String(editingArticle?.category || "").toLowerCase())?.id || "")} onChange={(event) => { const values = Array.from(event.target.selectedOptions).map((option) => option.value); setSelectedCategoryIds(values); setSelectedCategoryId(values[0] || ""); }} className="h-auto min-h-11 min-w-0 flex-1 rounded-[14px] border bg-zinc-50 px-4 py-2 text-[13px]" required><option value="">Sélectionner une catégorie</option>{categories.filter((item) => item.is_active !== false).map((item) => <option key={item.id} value={item.id}>{categoryPath(item, categories)}</option>)}</select><button type="button" onClick={() => setShowCategoryModal(true)} className="h-11 shrink-0 rounded-full border border-[#9e001f] px-3 text-[11px] font-bold text-[#9e001f]">Créer</button></div></div>
                      <div><label className="mb-1 block text-[11px] font-bold text-zinc-600">Rédacteur</label><div className="flex gap-2"><select name="authorProfileId" value={selectedAuthorId || editingArticle?.authorProfileId || editingArticle?.author_profile_id || authors.find((item) => item.name.toLowerCase() === String(editingArticle?.author || "").toLowerCase())?.id || ""} onChange={(event) => setSelectedAuthorId(event.target.value)} className="h-11 min-w-0 flex-1 rounded-full border bg-zinc-50 px-4 text-[13px]" required><option value="">Sélectionner un rédacteur</option>{authors.filter((item) => item.is_active !== false).map((item) => <option key={item.id} value={item.id}>{item.name}{item.role_label ? ` · ${item.role_label}` : ""}</option>)}</select><input type="hidden" name="authorId" value={editingArticle?.authorId || ""} /><button type="button" onClick={() => setShowAuthorModal(true)} className="h-11 shrink-0 rounded-full border border-[#9e001f] px-3 text-[11px] font-bold text-[#9e001f]">Créer</button></div></div>
                    </div>
                    <div className="rounded-[16px] border border-dashed border-zinc-300 bg-zinc-50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-black text-[#0A1931]">Image principale</div><div className="mt-1 text-[11px] text-zinc-500">Uploadez une image ou utilisez une URL externe.</div></div><label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full bg-[#0A1931] px-4 text-[11px] font-bold text-white">{uploadingArticleImage ? "Upload en cours…" : "Choisir une image"}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingArticleImage} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleArticleImageUpload(file); }} /></label></div><input name="image" value={articleImage} onChange={(event) => setArticleImage(event.target.value)} placeholder="URL de l’image" className="mt-3 h-10 w-full rounded-full border bg-white px-4 text-[12px]" />{articleImage && <img src={articleImage} alt="Aperçu de l’article" className="mt-3 h-32 w-full rounded-xl object-cover" />}</div>
                    <input name="tags" value={articleTags} onChange={(e)=>setArticleTags(e.target.value)} placeholder="Tags séparés par des virgules" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <div className="rounded-[16px] border border-zinc-200 bg-white p-4">
                      <div className="mb-3 text-xs font-black text-[#0A1931]">Accès au contenu & Mise en avant éditoriale</div>
                      <div className="flex flex-wrap gap-4 text-[12px]">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="isEncrypted" checked={articleIsEncrypted} onChange={(e)=>setArticleIsEncrypted(e.target.checked)} aria-describedby="article-access-help"/>
                          <span><strong>Article réservé aux abonnés</strong><span className="ml-1 text-zinc-500">(aperçu pour les visiteurs)</span></span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="isPublished" checked={articleIsPublished} onChange={(e)=>setArticleIsPublished(e.target.checked)}/>
                          <span>Publié en ligne</span>
                        </label>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-100">
                        <div className="text-[11px] font-bold text-zinc-700 mb-2">Attribution aux blocs éditoriaux du Landing Magazine :</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[12px]">
                          <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 transition">
                            <input type="checkbox" name="isFeatured" checked={articleIsFeatured} onChange={(e)=>setArticleIsFeatured(e.target.checked)} className="accent-[#9e001f]"/>
                            <span className="font-medium text-[#0A1931]">⭐ À la une (Hero)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 transition">
                            <input type="checkbox" name="isSentinelle" checked={articleIsSentinelle} onChange={(e)=>setArticleIsSentinelle(e.target.checked)} className="accent-[#9e001f]"/>
                            <span className="font-medium text-[#0A1931]">🛡️ Sentinelles</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 transition">
                            <input type="checkbox" name="isEssor" checked={articleIsEssor} onChange={(e)=>setArticleIsEssor(e.target.checked)} className="accent-[#9e001f]"/>
                            <span className="font-medium text-[#0A1931]">🚀 L’Essor</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 transition">
                            <input type="checkbox" name="isOmbreDouce" checked={articleIsOmbreDouce} onChange={(e)=>setArticleIsOmbreDouce(e.target.checked)} className="accent-[#9e001f]"/>
                            <span className="font-medium text-[#0A1931]">🌿 Ombre & Douceur</span>
                          </label>
                        </div>
                      </div>
                      <p id="article-access-help" className="mt-3 text-[11px] leading-5 text-zinc-500"><strong>Ouvert à tout le monde :</strong> décochez « Article réservé aux abonnés ». L’article sera lisible sans abonnement après publication.</p>
                    </div>

                    <div className="rounded-[16px] border border-[#e5bdbb] bg-[#fffaf8] p-4">
                      <div className="mb-2 text-xs font-black text-[#0A1931]">Positionner sur le Landing Magazine</div>
                      <p className="mb-3 text-[11px] leading-5 text-zinc-500">Choisissez l’emplacement exact sur le Landing. Après publication, l’article sera automatiquement injecté dans le bloc correspondant.</p>
                      <select name="landingTag" value={articleLandingTag} onChange={(e)=>setArticleLandingTag(e.target.value)} className="h-11 w-full rounded-full border bg-white px-4 text-[12px] font-semibold">
                        <option value="">Aucun placement exclusif</option>
                        {LANDING_ARTICLE_TAGS.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                      </select>
                      <p className="mt-2 text-[10px] text-zinc-500">Blocs gérés : Fil d’infos Image, Fil d’infos Titres, Manager du mois, Financement, Opportunités, Prochain numéro, Start’ups.</p>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2"><button type="submit" disabled={savingArticle || uploadingArticleImage} className="h-10 px-5 rounded-full bg-[#0A1931] text-white text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-60">{savingArticle ? "Enregistrement…" : "Enregistrer"}</button><button type="button" onClick={()=>{setShowArticleModal(false); setEditingArticle(null);}} className="h-10 px-5 rounded-full border text-[13px]">Annuler</button></div>
                </form>
              </div>
            )}
            {showAuthorModal && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4"><form onSubmit={async (event) => { event.preventDefault(); try { const form = new FormData(event.currentTarget); const payload = { name: form.get("name"), bio: form.get("bio"), roleLabel: form.get("roleLabel"), photoUrl: authorPhoto }; const savedAuthor = editingAuthor ? await updateEditorialAuthor(editingAuthor.id, payload) : await createEditorialAuthor(payload); setSelectedAuthorId(savedAuthor.id); setMessage(editingAuthor ? "Rédacteur modifié" : "Rédacteur créé"); setShowAuthorModal(false); setEditingAuthor(null); setAuthorPhoto(""); } catch (error) { setMessage(`Erreur : ${error instanceof Error ? error.message : "réessayez"}`); } }} className="w-full max-w-[520px] rounded-[20px] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h3 className="font-bold text-[#0A1931]">{editingAuthor ? "Modifier le rédacteur" : "Créer un rédacteur"}</h3><p className="mt-1 text-[11px] text-zinc-500">Le portrait sera affiché sur la page publique de ses articles.</p></div><button type="button" onClick={() => { setShowAuthorModal(false); setEditingAuthor(null); setAuthorPhoto(""); }} className="text-xl text-zinc-400">×</button></div><div className="mt-5 grid gap-3"><input name="name" required defaultValue={editingAuthor?.name || ""} placeholder="Nom complet" className="h-11 rounded-full border bg-zinc-50 px-4 text-sm"/><input name="roleLabel" defaultValue={editingAuthor?.role_label || ""} placeholder="Fonction, ex. Analyste économique" className="h-11 rounded-full border bg-zinc-50 px-4 text-sm"/><textarea name="bio" required defaultValue={editingAuthor?.bio || ""} rows={4} placeholder="Description du rédacteur" className="rounded-[14px] border bg-zinc-50 p-4 text-sm"/><div className="flex gap-2"><label className="inline-flex h-10 cursor-pointer items-center rounded-full bg-[#0A1931] px-4 text-xs font-bold text-white">{uploadingAuthorPhoto ? "Upload…" : "Choisir le portrait"}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingAuthorPhoto} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleAuthorPhotoUpload(file); }}/></label><input name="photoUrl" value={authorPhoto} onChange={(event) => setAuthorPhoto(event.target.value)} placeholder="URL du portrait" className="h-10 min-w-0 flex-1 rounded-full border px-3 text-xs"/></div>{authorPhoto && <img src={authorPhoto} alt="Aperçu portrait" className="h-28 w-24 rounded-xl object-cover"/>}</div><button type="submit" disabled={uploadingAuthorPhoto} className="mt-5 h-10 w-full rounded-full bg-[#9e001f] text-sm font-bold text-white">{editingAuthor ? "Enregistrer les modifications" : "Créer le rédacteur"}</button></form></div>}
            {showCategoryModal && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4"><form onSubmit={async (event) => { event.preventDefault(); try { const form = new FormData(event.currentTarget); const createdCategory = await createEditorialCategory({ label: form.get("label"), parentId: form.get("parentId") || null, colorHex: form.get("colorHex") }); setSelectedCategoryId(createdCategory.id); setSelectedCategoryIds((items) => Array.from(new Set([...items, createdCategory.id]))); setMessage("Catégorie créée"); setShowCategoryModal(false); } catch (error) { setMessage(`Erreur : ${error instanceof Error ? error.message : "réessayez"}`); } }} className="w-full max-w-[420px] rounded-[20px] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="font-bold text-[#0A1931]">Créer une catégorie</h3><button type="button" onClick={() => setShowCategoryModal(false)} className="text-xl text-zinc-400">×</button></div><div className="mt-5 grid gap-3"><input name="label" required placeholder="Nom de la catégorie" className="h-11 rounded-full border bg-zinc-50 px-4 text-sm"/><select name="parentId" defaultValue="" className="h-11 rounded-full border bg-zinc-50 px-4 text-sm"><option value="">Catégorie racine — aucune catégorie parente</option>{categories.filter((item) => item.is_active !== false).map((item) => <option key={item.id} value={item.id}>{categoryPath(item, categories)}</option>)}</select><input name="colorHex" defaultValue="#9e001f" placeholder="Couleur hexadécimale" className="h-11 rounded-full border bg-zinc-50 px-4 text-sm"/></div><button type="submit" className="mt-5 h-10 w-full rounded-full bg-[#9e001f] text-sm font-bold text-white">Créer la catégorie</button></form></div>}
          </div>
        )}

        {activeTab==="redacteurs" && (
          <div className="rounded-[18px] border bg-white p-6"><div className="flex items-center justify-between"><div><h3 className="text-lg font-bold text-[#0A1931]">Rédacteurs</h3><p className="mt-1 text-xs text-zinc-500">Portraits, biographies et fonctions utilisés par les pages articles.</p></div><button onClick={() => { setActiveTab("articles"); setShowAuthorModal(true); }} className="h-10 rounded-full bg-[#0A1931] px-4 text-xs font-bold text-white">+ Nouveau rédacteur</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{authors.map((author) => <div key={author.id} className={`rounded-[14px] border p-4 ${author.is_active === false ? "opacity-60" : ""}`}><div className="flex gap-3"><img src={author.photo_url || "/logo-blanc-footer.png"} alt="" className="h-16 w-14 rounded-xl bg-[#0A1931] object-cover"/><div className="min-w-0"><div className="font-bold text-[#0A1931]">{author.name}</div><div className="text-[11px] text-[#9e001f]">{author.role_label || "Rédacteur"} · {author.is_active === false ? "Inactif" : "Actif"}</div><p className="mt-2 line-clamp-3 text-xs text-zinc-600">{author.bio || "Aucune description"}</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => { setEditingAuthor(author); setAuthorPhoto(author.photo_url || ""); setActiveTab("articles"); setShowAuthorModal(true); }} className="h-8 rounded-full border px-3 text-[11px] font-bold">Modifier</button><button onClick={() => void toggleEditorialAuthor(author)} className="h-8 rounded-full border px-3 text-[11px] font-bold">{author.is_active === false ? "Réactiver" : "Désactiver"}</button><button onClick={() => void deleteEditorialAuthor(author)} className="h-8 rounded-full border border-red-200 bg-red-50 px-3 text-[11px] font-bold text-red-700">Supprimer</button></div></div>)}</div></div>
        )}

        {activeTab==="categories" && (
          <div className="space-y-5">
            <div className="rounded-[18px] border bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#0A1931]">Catégories d’articles</h3>
                  <p className="mt-1 text-xs text-zinc-500">Référentiel réservé aux articles éditoriaux. Modifiez, organisez ou désactivez chaque catégorie.</p>
                </div>
                <button onClick={() => { setActiveTab("articles"); setShowCategoryModal(true); }} className="h-10 rounded-full bg-[#9e001f] px-4 text-xs font-bold text-white">+ Nouvelle catégorie article</button>
              </div>
              <div className="mt-6 grid gap-2">
                {categories.filter((item) => item.is_active !== false).sort((a, b) => categoryPath(a, categories).localeCompare(categoryPath(b, categories))).map((category) => (
                  <div key={category.id} className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-bold bg-white hover:bg-zinc-50 transition" style={{ marginLeft: `${categoryDepth(category, categories) * 18}px`, borderColor: category.color_hex || "#9e001f" }}>
                    <div className="flex items-center gap-2" style={{ color: category.color_hex || "#9e001f" }}>
                      <span>{categoryDepth(category, categories) > 0 ? "└ " : ""}{category.label}</span>
                      <span className="text-[10px] font-normal text-zinc-400">({categoryPath(category, categories)})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => { setEditingCategory(category); setShowEditCategoryModal(true); }} className="h-7 px-3 rounded-full border border-zinc-200 bg-white text-[11px] font-semibold text-[#0A1931] hover:bg-zinc-100">
                        Modifier
                      </button>
                      <button type="button" onClick={() => void deleteEditorialCategory(category.id)} className="h-7 px-2.5 rounded-full border border-red-200 bg-red-50 text-[11px] font-semibold text-red-700 hover:bg-red-100" title="Désactiver cette catégorie">
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border bg-white p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#0A1931]">Catégories Magazine</h3>
                  <p className="mt-1 text-xs text-zinc-500">Référentiel pour les numéros du Kiosque et Flipbooks.</p>
                </div>
                <div className="flex gap-2">
                  <input value={newMagazineCategory} onChange={(event) => setNewMagazineCategory(event.target.value)} placeholder="Nouvelle catégorie Magazine" className="h-10 rounded-full border bg-zinc-50 px-4 text-xs"/>
                  <button type="button" onClick={() => void createMagazineCategory()} className="h-10 rounded-full bg-[#0A1931] px-4 text-xs font-bold text-white">+ Ajouter</button>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {magazineCategories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold bg-white" style={{ borderColor: category.color_hex || "#9e001f", color: category.color_hex || "#9e001f" }}>
                    <span>{category.label}</span>
                    <button type="button" onClick={() => { setEditingMagCategory(category); setShowEditMagCategoryModal(true); }} className="text-zinc-500 hover:text-[#0A1931] text-[11px] px-1 font-bold" title="Modifier cette catégorie">✎</button>
                    <button type="button" onClick={() => void deleteMagazineCategory(category)} aria-label={`Désactiver ${category.label}`} className="text-zinc-400 hover:text-red-700 text-sm font-bold">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modale d'édition Catégorie Article */}
            {showEditCategoryModal && editingCategory && (
              <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  await updateEditorialCategory(editingCategory.id, {
                    label: form.get("label") as string,
                    parentId: (form.get("parentId") as string) || null,
                    colorHex: form.get("colorHex") as string
                  });
                }} className="w-full max-w-[440px] rounded-[20px] bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-[#0A1931]">Modifier la catégorie d’article</h3>
                    <button type="button" onClick={() => { setShowEditCategoryModal(false); setEditingCategory(null); }} className="text-xl text-zinc-400">×</button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <label className="text-[11px] font-bold text-zinc-600">Nom de la catégorie
                      <input name="label" required defaultValue={editingCategory.label} className="mt-1 h-11 w-full rounded-full border bg-zinc-50 px-4 text-sm font-semibold"/>
                    </label>
                    <label className="text-[11px] font-bold text-zinc-600">Catégorie parente
                      <select name="parentId" defaultValue={editingCategory.parent_id || ""} className="mt-1 h-11 w-full rounded-full border bg-zinc-50 px-4 text-sm">
                        <option value="">Catégorie racine — aucune catégorie parente</option>
                        {categories.filter((item) => item.id !== editingCategory.id && item.is_active !== false).map((item) => (
                          <option key={item.id} value={item.id}>{categoryPath(item, categories)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-[11px] font-bold text-zinc-600">Couleur d’accentuation
                      <div className="flex items-center gap-2 mt-1">
                        <input name="colorHex" defaultValue={editingCategory.color_hex || "#9e001f"} className="h-11 flex-1 rounded-full border bg-zinc-50 px-4 text-sm font-mono"/>
                        <input type="color" defaultValue={editingCategory.color_hex || "#9e001f"} onChange={(e) => {
                          const input = (e.currentTarget.parentElement?.querySelector('input[name="colorHex"]') as HTMLInputElement);
                          if (input) input.value = e.currentTarget.value;
                        }} className="w-10 h-10 rounded-full border cursor-pointer p-0.5"/>
                      </div>
                    </label>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={() => { setShowEditCategoryModal(false); setEditingCategory(null); }} className="h-10 px-4 rounded-full border text-xs font-bold">Annuler</button>
                    <button type="submit" className="h-10 px-5 rounded-full bg-[#9e001f] text-xs font-bold text-white">Enregistrer</button>
                  </div>
                </form>
              </div>
            )}

            {/* Modale d'édition Catégorie Magazine */}
            {showEditMagCategoryModal && editingMagCategory && (
              <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  await updateMagazineCategory(editingMagCategory.id, {
                    label: form.get("label") as string,
                    colorHex: form.get("colorHex") as string
                  });
                }} className="w-full max-w-[440px] rounded-[20px] bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-[#0A1931]">Modifier la catégorie Magazine</h3>
                    <button type="button" onClick={() => { setShowEditMagCategoryModal(false); setEditingMagCategory(null); }} className="text-xl text-zinc-400">×</button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <label className="text-[11px] font-bold text-zinc-600">Nom de la catégorie
                      <input name="label" required defaultValue={editingMagCategory.label} className="mt-1 h-11 w-full rounded-full border bg-zinc-50 px-4 text-sm font-semibold"/>
                    </label>
                    <label className="text-[11px] font-bold text-zinc-600">Couleur d’accentuation
                      <div className="flex items-center gap-2 mt-1">
                        <input name="colorHex" defaultValue={editingMagCategory.color_hex || "#9e001f"} className="h-11 flex-1 rounded-full border bg-zinc-50 px-4 text-sm font-mono"/>
                        <input type="color" defaultValue={editingMagCategory.color_hex || "#9e001f"} onChange={(e) => {
                          const input = (e.currentTarget.parentElement?.querySelector('input[name="colorHex"]') as HTMLInputElement);
                          if (input) input.value = e.currentTarget.value;
                        }} className="w-10 h-10 rounded-full border cursor-pointer p-0.5"/>
                      </div>
                    </label>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={() => { setShowEditMagCategoryModal(false); setEditingMagCategory(null); }} className="h-10 px-4 rounded-full border text-xs font-bold">Annuler</button>
                    <button type="submit" className="h-10 px-5 rounded-full bg-[#0A1931] text-xs font-bold text-white">Enregistrer</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab==="magazines" && (
          <div className="bg-white rounded-[18px] border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[18px]">Kiosque - Magazines CRUD Complet (Version Corrigée)</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Numéro, période, titre, description, catégorie, couverture upload direct (pas URL), 10 premières pages flipbook, PDF 3 langues, audio 12 langues, prix par version</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => void protectExistingPdfs()} disabled={protectingPdfs} className="h-9 rounded-full border border-[#9e001f] px-4 text-[11px] font-bold text-[#9e001f] disabled:opacity-50">{protectingPdfs ? "Protection en cours…" : "Protéger les anciens PDF"}</button><button onClick={()=>{setEditingMag(null); setShowMagModal(true);}} className="h-9 px-4 rounded-full bg-[#9e001f] text-white text-[12px] font-bold">+ Nouveau numéro</button></div>
            </div>
            <div className="mt-6 grid md:grid-cols-4 gap-4">
              {magazines.map((m:any)=>(
                <div key={m.id} className="rounded-[14px] border p-3 group hover:shadow-lg transition-shadow">
                  <div className="relative"><img src={m.cover} alt="" className="w-full aspect-[3/4] object-cover rounded-[10px]" /><div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-full">N°{m.numero}</div>{m.featured&&<div className="absolute top-2 right-2 bg-[#9e001f] text-white text-[9px] px-2 py-1 rounded-full">À la une</div>}</div>
                  <div className="font-bold text-[12px] mt-2 line-clamp-2">{m.title}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">{m.periode||m.year} • {m.category||"Economie"} • {m.previewImages?.length||0}/10 pages • {Object.keys(m.pdfs||{}).length||0} PDF • {Object.keys(m.audios||{}).length||0} audios</div>
                  <div className="text-[10px] text-zinc-500">Prix: {m.prices ? `${m.prices.numerique?.toLocaleString()||10}k F CFA num` : "10k F num"}</div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <a href={`/kiosque/${encodeURIComponent(m.id)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-blue-200 bg-blue-50 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 transition" title="Consulter dans le kiosque">
                      <span>Voir</span><span className="text-[9px]">↗</span>
                    </a>
                    <button type="button" onClick={() => void handleCopyMagLink(m)} className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full border text-[10px] font-semibold transition ${copiedMagId === m.id ? "border-green-300 bg-green-100 text-green-800" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"}`} title="Copier le lien direct du magazine">
                      <span>{copiedMagId === m.id ? "✓ Copié !" : "Copier"}</span>
                    </button>
                    <button type="button" onClick={() => void handleShareMagLink(m)} className="h-7 px-2.5 rounded-full border border-purple-200 bg-purple-50 text-[10px] font-semibold text-purple-700 hover:bg-purple-100 transition" title="Partager ce magazine">
                      Partager
                    </button>
                    <button type="button" onClick={()=>{setEditingMag(m); setShowMagModal(true);}} className="h-7 px-2.5 rounded-full border border-zinc-200 bg-white text-[10px] font-semibold text-[#0A1931] hover:bg-zinc-50">
                      Éditer
                    </button>
                    <button type="button" onClick={()=>handleDeleteMag(m.id)} className="h-7 px-2.5 bg-red-50 text-red-600 border border-red-100 rounded-full text-[10px] font-semibold hover:bg-red-100">
                      Suppr
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {showMagModal && (
              <MagazineModal 
                editingMag={editingMag}
                onClose={()=>{setShowMagModal(false); setEditingMag(null);}}
                onSaved={()=>{fetchMagazines(); setMessage(editingMag?"Magazine modifié ✅":"Magazine créé ✅ avec couverture upload + 10 pages flipbook + PDF 3 langues + audio 12 langues");}}
              />
            )}
          </div>
        )}

        {activeTab==="users" && (() => {
          const pendingUsers = users.filter((user: any) => !user.isVerified);
          const verifiedUsers = users.filter((user: any) => user.isVerified);
          const visibleUsers = userFilter === "pending" ? pendingUsers : userFilter === "verified" ? verifiedUsers : users;
          return <div className="rounded-[18px] border bg-white p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-[10px] font-black uppercase tracking-wider text-[#9e001f]">Administration des comptes</p><h3 className="mt-1 text-[18px] font-black text-[#0A1931]">Utilisateurs et validation manuelle</h3><p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-500">En attendant le service d’e-mails, l’administrateur peut contrôler les comptes non vérifiés et les activer manuellement. Aucun mot de passe n’est affiché ici.</p></div><div className="flex shrink-0 gap-2 text-[11px] font-bold"><span className="rounded-full bg-amber-50 px-3 py-2 text-amber-700">{pendingUsers.length} en attente</span><span className="rounded-full bg-green-50 px-3 py-2 text-green-700">{verifiedUsers.length} vérifiés</span></div></div>
            <div className="mt-6 flex gap-2 overflow-x-auto border-b pb-3"><button type="button" onClick={() => setUserFilter("all")} className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-bold ${userFilter === "all" ? "bg-[#0A1931] text-white" : "bg-zinc-100 text-zinc-600"}`}>Tous ({users.length})</button><button type="button" onClick={() => setUserFilter("pending")} className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-bold ${userFilter === "pending" ? "bg-amber-500 text-black" : "bg-zinc-100 text-zinc-600"}`}>En attente ({pendingUsers.length})</button><button type="button" onClick={() => setUserFilter("verified")} className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-bold ${userFilter === "verified" ? "bg-green-600 text-white" : "bg-zinc-100 text-zinc-600"}`}>Vérifiés ({verifiedUsers.length})</button></div>
            <div className="mt-6 overflow-x-auto"><table className="w-full text-[12px]"><thead className="border-b text-[10px] uppercase text-zinc-500"><tr><th className="py-2 text-left">Nom</th><th>Email</th><th>Statut</th><th>Rôle</th><th>Abo</th><th>2FA</th><th>Actions</th></tr></thead><tbody>{visibleUsers.map((u:any)=>(<tr key={u.id} className="border-b hover:bg-zinc-50"><td className="py-3 font-medium">{u.prenom} {u.nom}</td><td className="text-[11px]">{u.email}</td><td>{u.isVerified ? <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">Vérifié</span> : <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">En attente</span>}</td><td><span className={`rounded-full px-2 py-1 text-[10px] ${u.role === "admin" ? "bg-[#0A1931] text-white" : "bg-zinc-100"}`}>{u.role}</span></td><td className="text-[10px]">{u.subscription?.planId || "—"}</td><td>{u.twoFactorEnabled ? "✓" : "⚠"}</td><td><div className="flex flex-wrap justify-end gap-2">{!u.isVerified && <button type="button" onClick={() => void handleVerifyUser(u)} className="rounded-full bg-green-600 px-3 py-1.5 text-[10px] font-bold text-white">Valider le compte</button>}<button type="button" onClick={() => setShowUserModal(u)} className="rounded-full border px-3 py-1.5 text-[10px]">Rôle</button></div></td></tr>))}</tbody></table>{visibleUsers.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">Aucun utilisateur dans ce filtre.</p>}</div>
            {showUserModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-[420px] rounded-[20px] bg-white p-6"><h3 className="font-bold">Changer rôle - {showUserModal.prenom}</h3><div className="mt-4 grid grid-cols-2 gap-2">{["user","subscriber","redacteur","redacteur_chef","gerant","admin"].map(r=><button key={r} type="button" onClick={() => void handleChangeRole(showUserModal.id, r)} className={`h-10 rounded-full border text-[12px] ${showUserModal.role === r ? "bg-[#0A1931] text-white" : "bg-zinc-50"}`}>{r}</button>)}</div><button type="button" onClick={() => setShowUserModal(null)} className="mt-4 h-10 w-full rounded-full border text-[13px]">Fermer</button></div></div>}
          </div>;
        })()}

        {activeTab==="orders" && (
          <div className="bg-white rounded-[18px] border p-6">
            <h3 className="font-bold text-[18px]">Commandes & Revenus - KPIs + Gestion</h3>
            <div className="mt-4 space-y-2">
              {orders.map((o:any)=>(<div key={o.id} className="p-4 rounded-[12px] bg-zinc-50 border flex justify-between text-[12px]"><div><div className="font-bold">{o.id.slice(0,8)} • {o.total.toLocaleString()} {o.currency} • {o.status}</div><div className="text-[11px] text-zinc-500">{o.items.map((i:any)=>i.type).join(', ')} • {new Date(o.createdAt).toLocaleDateString('fr-FR')}</div></div><select value={o.status} onChange={e=>handleChangeOrderStatus(o.id, e.target.value)} className="h-8 rounded-full border bg-white px-3 text-[11px]"><option value="pending">pending</option><option value="paid">paid</option><option value="shipped">shipped</option><option value="failed">failed</option></select></div>))}
            </div>
          </div>
        )}

        {activeTab==="abonnements" && (
          <div className="space-y-6">
            <div className="bg-white rounded-[18px] border p-6">
              <h3 className="font-bold text-[18px]">Abonnements - 4 formules + KPIs + Gestion tarifs (Admin only)</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Mensuel 5000 (2000 1er mois), Annuel 42000 (3500/mois), Chef d'entreprise 20000 (15000 1er), Soutien 600k/an + pack prestige</p>
              <div className="mt-6 grid md:grid-cols-4 gap-4">
                {subscriptionPlans.map((p:any)=>(
                  <div key={p.id} className="rounded-[16px] border p-4">
                    <div className="font-bold text-[14px]">{p.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">{p.description}</div>
                    <div className="mt-3 font-black text-[20px]">{Number(p.monthlyPrice ?? p.price).toLocaleString()} F / mois</div>
                    <div className="text-[11px] text-[#0A1931]">Annuel {Number(p.annualPrice ?? 0).toLocaleString()} F</div>
                    <div className="text-[11px] text-[#166534]">Réduction annuelle {Number(p.annualDiscountPercent ?? 30)}%</div>
                    {p.firstMonthPrice && <div className="text-[11px] text-green-700">1er mois {p.firstMonthPrice.toLocaleString()} F</div>}
                    <div className="mt-3 space-y-1 text-[11px]">{p.features.slice(0,3).map((f:string)=><div key={f} className="flex gap-1"><span>✓</span>{f}</div>)}</div>
                    <button type="button" onClick={() => setEditingPlan({ ...p, features: [...(p.features || [])] })} className="mt-4 w-full h-8 rounded-full border text-[11px] font-bold hover:bg-zinc-50">Éditer tarifs</button>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-[12px] bg-amber-50 border border-amber-100 text-[11px] text-amber-900">Règle : le tarif mensuel et le tarif annuel sont administrables séparément. Si le tarif annuel est vide, le serveur le calcule à partir du mensuel × 12 × (1 − réduction). Le tarif du premier mois reste une promotion distincte, sans modifier le prix récurrent. Les modifications sont sauvegardées dans Supabase.</div>
              {editingPlan && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-[520px] rounded-[22px] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="font-bold">Modifier le tarif — {editingPlan.name}</h3><button type="button" onClick={() => setEditingPlan(null)} className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100">×</button></div><div className="mt-5 grid gap-3"><label className="text-[11px] font-bold">Tarif principal (F CFA)<input type="number" min="0" value={editingPlan.price} onChange={(event) => setEditingPlan({ ...editingPlan, price: Number(event.target.value) })} className="mt-1 h-11 w-full rounded-full border bg-zinc-50 px-4" /></label><label className="text-[11px] font-bold">Premier mois — facultatif<input type="number" min="0" value={editingPlan.firstMonthPrice ?? ""} onChange={(event) => setEditingPlan({ ...editingPlan, firstMonthPrice: event.target.value === "" ? null : Number(event.target.value) })} className="mt-1 h-11 w-full rounded-full border bg-zinc-50 px-4" /></label><label className="text-[11px] font-bold">Tarif mensuel affiché — facultatif<input type="number" min="0" value={editingPlan.monthlyPrice ?? ""} onChange={(event) => setEditingPlan({ ...editingPlan, monthlyPrice: event.target.value === "" ? null : Number(event.target.value) })} className="mt-1 h-11 w-full rounded-full border bg-zinc-50 px-4" /></label><label className="text-[11px] font-bold">Tarif annuel<input type="number" min="0" value={editingPlan.annualPrice ?? ""} onChange={(event) => setEditingPlan({ ...editingPlan, annualPrice: event.target.value === "" ? null : Number(event.target.value) })} className="mt-1 h-11 w-full rounded-full border bg-zinc-50 px-4" /></label><label className="text-[11px] font-bold">Réduction annuelle (%)<input type="number" min="0" max="100" step="1" value={editingPlan.annualDiscountPercent ?? 30} onChange={(event) => setEditingPlan({ ...editingPlan, annualDiscountPercent: Math.min(100, Math.max(0, Number(event.target.value) || 0)) })} className="mt-1 h-11 w-full rounded-full border bg-zinc-50 px-4" /></label><label className="text-[11px] font-bold">Description<textarea value={editingPlan.description || ""} onChange={(event) => setEditingPlan({ ...editingPlan, description: event.target.value })} rows={3} className="mt-1 w-full rounded-[14px] border bg-zinc-50 p-3" /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setEditingPlan(null)} className="h-10 rounded-full border px-4 text-xs font-bold">Annuler</button><button type="button" onClick={() => saveSubscriptionPlan(editingPlan).catch((error) => setMessage(`Erreur tarif : ${error instanceof Error ? error.message : "réessayez"}`))} className="h-10 rounded-full bg-[#0A1931] px-5 text-xs font-bold text-white">Enregistrer</button></div></div></div>}
            </div>
          </div>
        )}

        {activeTab==="tarifs" && (
          <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[24px] bg-[#0A1931] p-7 text-white shadow-xl">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f2b84b]">Monétisation & Régie · Administration Centrale</p>
                  <h1 className="mt-2 text-3xl font-black">Gestion de tous les tarifs de la plateforme</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
                    Définissez et ajustez en temps réel l’ensemble des prix et commissions de l’écosystème ENVOL AFRICA : Régie publicitaire, Envol Ads, AdSense, packs WAB, commissions Marketplace, frais Crowdfunding, Africa Awards et offres Emploi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void savePricingSettings()}
                  disabled={savingPricing}
                  className="h-11 shrink-0 rounded-full bg-[#f2b84b] px-6 text-xs font-black text-[#0A1931] shadow-md hover:bg-[#e0a83b] transition disabled:opacity-50"
                >
                  {savingPricing ? "Sauvegarde en cours…" : "Enregistrer tous les tarifs ✅"}
                </button>
              </div>
            </section>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {/* Régie Publicitaire & Envol Ads */}
              <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 font-bold">
                    📢
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0A1931] text-[15px]">Envol Ads & Régie Publicitaire</h3>
                    <p className="text-[10px] text-zinc-500">Bannières, formats fixes et sponsoring</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4 text-xs">
                  <label className="block font-semibold text-zinc-700">
                    CPM Plancher (coût / 1 000 affichages)
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.ads?.cpmPlancher ?? 2500}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, ads: { ...(pricingSettings.ads || {}), cpmPlancher: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    CPC Plancher (coût par clic ciblé)
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.ads?.cpcPlancher ?? 250}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, ads: { ...(pricingSettings.ads || {}), cpcPlancher: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    Bannière Fixe Header Leaderboard (par jour)
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.ads?.cpdFixe ?? 15000}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, ads: { ...(pricingSettings.ads || {}), cpdFixe: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF/j</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    Publi-reportage Sponsorisé (parution unique)
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.ads?.sponsoredArticlePrice ?? 150000}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, ads: { ...(pricingSettings.ads || {}), sponsoredArticlePrice: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    Commission plateforme régie AdSense
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pricingSettings?.ads?.adsenseCommissionPercent ?? 15}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, ads: { ...(pricingSettings.ads || {}), adsenseCommissionPercent: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">%</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* WAB Réseau Social & Créateurs */}
              <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-700 font-bold">
                    ✨
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0A1931] text-[15px]">WAB & Monétisation Créateurs</h3>
                    <p className="text-[10px] text-zinc-500">Crédits, boosts et salons virtuels payants</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4 text-xs">
                  <label className="block font-semibold text-zinc-700">
                    Pack 100 Pièces WAB Stars
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.wab?.creditPack100 ?? 5000}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, wab: { ...(pricingSettings.wab || {}), creditPack100: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    Pack 500 Pièces WAB Stars
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.wab?.creditPack500 ?? 20000}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, wab: { ...(pricingSettings.wab || {}), creditPack500: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    Boost de publication WAB 24h
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.wab?.boostPublication24h ?? 3000}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, wab: { ...(pricingSettings.wab || {}), boostPublication24h: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    Boost de publication WAB 7 jours
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.wab?.boostPublication7j ?? 12000}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, wab: { ...(pricingSettings.wab || {}), boostPublication7j: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    Ticket d'accès Salon Live Premium
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.wab?.salonPayantTicket ?? 2000}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, wab: { ...(pricingSettings.wab || {}), salonPayantTicket: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Marketplace & E-Commerce */}
              <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 font-bold">
                    🛍️
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0A1931] text-[15px]">Marketplace & Vendeurs</h3>
                    <p className="text-[10px] text-zinc-500">Commissions sur transactions et badges pro</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4 text-xs">
                  <label className="block font-semibold text-zinc-700">
                    Commission sur vente standard
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pricingSettings?.marketplace?.commissionStandardPercent ?? 8}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, marketplace: { ...(pricingSettings.marketplace || {}), commissionStandardPercent: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">%</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    Boost mise en avant Produit (7 jours)
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.marketplace?.boostProduit7j ?? 7500}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, marketplace: { ...(pricingSettings.marketplace || {}), boostProduit7j: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    Abonnement Boutique Vendeur Certifié
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.marketplace?.badgeVerifieMensuel ?? 10000}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, marketplace: { ...(pricingSettings.marketplace || {}), badgeVerifieMensuel: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF/mois</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Africa Crowdfunding */}
              <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 font-bold">
                    🌱
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0A1931] text-[15px]">Africa Crowdfunding</h3>
                    <p className="text-[10px] text-zinc-500">Financement participatif & PME</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4 text-xs">
                  <label className="block font-semibold text-zinc-700">
                    Frais d'étude et validation de campagne
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.crowdfunding?.fraisDossier ?? 25000}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, crowdfunding: { ...(pricingSettings.crowdfunding || {}), fraisDossier: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    Commission de succès sur fonds collectés
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pricingSettings?.crowdfunding?.commissionSuccesPercent ?? 5}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, crowdfunding: { ...(pricingSettings.crowdfunding || {}), commissionSuccesPercent: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">%</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Africa Awards */}
              <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-50 text-yellow-700 font-bold">
                    🏆
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0A1931] text-[15px]">Africa Awards</h3>
                    <p className="text-[10px] text-zinc-500">Candidatures et votes payants</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4 text-xs">
                  <label className="block font-semibold text-zinc-700">
                    Frais de candidature par catégorie
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.awards?.fraisCandidature ?? 35000}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, awards: { ...(pricingSettings.awards || {}), fraisCandidature: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    Prix d'un vote public unitaire (Moneroo)
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.awards?.votePayantUnitaire ?? 500}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, awards: { ...(pricingSettings.awards || {}), votePayantUnitaire: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF/vote</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Emploi & Recrutement */}
              <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700 font-bold">
                    💼
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0A1931] text-[15px]">Emploi & Recrutement</h3>
                    <p className="text-[10px] text-zinc-500">Publications d'offres et accès talents</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4 text-xs">
                  <label className="block font-semibold text-zinc-700">
                    Dépôt d'offre d'emploi standard (30 jours)
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.jobs?.offreStandard ?? 25000}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, jobs: { ...(pricingSettings.jobs || {}), offreStandard: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    Offre d'emploi Premium (Boostée & Alerte)
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.jobs?.offrePremiumBoost ?? 60000}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, jobs: { ...(pricingSettings.jobs || {}), offrePremiumBoost: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                  <label className="block font-semibold text-zinc-700">
                    Déblocage fiche candidat / CV qualifié
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings?.jobs?.deblocageCvUnitaire ?? 5000}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, jobs: { ...(pricingSettings.jobs || {}), deblocageCvUnitaire: Number(e.target.value) } })}
                        className="h-10 w-full rounded-xl border bg-zinc-50 px-3 font-bold text-[#0A1931]"
                      />
                      <span className="text-zinc-500 font-bold text-[11px]">XOF</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-5 text-xs text-amber-900 flex items-center justify-between">
              <div>
                <strong className="block font-bold">Règle de gouvernance financière :</strong>
                <span>Tous les prix enregistrés ici sont immédiatement appliqués côté serveur. Aucun montant n’est jamais accepté ou calculé depuis le navigateur client.</span>
              </div>
              <button
                type="button"
                onClick={() => void savePricingSettings()}
                disabled={savingPricing}
                className="h-10 rounded-full bg-[#0A1931] px-5 font-bold text-white shadow hover:bg-black transition disabled:opacity-50"
              >
                {savingPricing ? "Enregistrement…" : "Enregistrer la grille"}
              </button>
            </div>
          </div>
        )}

        {activeTab==="kyc" && (
          <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[24px] bg-[#0A1931] p-7 text-white shadow-xl">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f2b84b]">Conformité Réglementaire · KYC & AML</p>
                  <h1 className="mt-2 text-3xl font-black">Vérification d’Identité & Lutte Anti-Blanchiment</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
                    Contrôle obligatoire des pièces d’identité (CNI, selfie tenant la pièce, RCCM, IFU pour entreprises) avant toute activation de retrait ou remboursement pour affiliés, gagnants Africa Awards, vendeurs Marketplace et créateurs WAB. Traçabilité légale des adresses IP sur chaque mouvement de fonds.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchKycData()}
                  disabled={loadingKyc}
                  className="h-11 shrink-0 rounded-full bg-white/10 border border-white/20 px-5 text-xs font-bold text-white hover:bg-white/20 transition"
                >
                  {loadingKyc ? "Actualisation…" : "Actualiser les dossiers ↻"}
                </button>
              </div>
            </section>

            {/* KPIs KYC */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[18px] border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Total dossiers</p>
                <strong className="mt-2 block text-2xl font-black text-[#0A1931]">{kycProfiles.length}</strong>
                <span className="text-[11px] text-zinc-500">soumis sur la plateforme</span>
              </div>
              <div className="rounded-[18px] border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">En attente de validation</p>
                <strong className="mt-2 block text-2xl font-black text-amber-700">{kycProfiles.filter((p: any) => p.statut === "en_attente").length}</strong>
                <span className="text-[11px] text-amber-800">dossiers à examiner</span>
              </div>
              <div className="rounded-[18px] border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Approuvés (Retraits actifs)</p>
                <strong className="mt-2 block text-2xl font-black text-emerald-700">{kycProfiles.filter((p: any) => p.statut === "approuve").length}</strong>
                <span className="text-[11px] text-emerald-800">comptes conformes</span>
              </div>
              <div className="rounded-[18px] border border-red-200 bg-red-50/50 p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-red-800">Rejetés</p>
                <strong className="mt-2 block text-2xl font-black text-red-700">{kycProfiles.filter((p: any) => p.statut === "rejete").length}</strong>
                <span className="text-[11px] text-red-800">avec motif notifié</span>
              </div>
            </div>

            {/* Navigation sous-onglets KYC / AML */}
            <div className="flex gap-2 border-b pb-3">
              <button
                type="button"
                onClick={() => setKycActiveTab("dossiers")}
                className={`h-10 px-5 rounded-full text-xs font-bold transition ${kycActiveTab === "dossiers" ? "bg-[#0A1931] text-white shadow-sm" : "bg-white border text-zinc-600 hover:bg-zinc-50"}`}
              >
                Dossiers d’Identité KYC ({kycProfiles.length})
              </button>
              <button
                type="button"
                onClick={() => setKycActiveTab("aml")}
                className={`h-10 px-5 rounded-full text-xs font-bold transition ${kycActiveTab === "aml" ? "bg-[#0A1931] text-white shadow-sm" : "bg-white border text-zinc-600 hover:bg-zinc-50"}`}
              >
                Registre d’Audit AML & IPs ({amlLogs.length})
              </button>
            </div>

            {kycActiveTab === "dossiers" && (
              <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {[
                      { id: "all", label: `Tous (${kycProfiles.length})` },
                      { id: "en_attente", label: `En attente (${kycProfiles.filter((p: any) => p.statut === "en_attente").length})` },
                      { id: "approuve", label: `Approuvés (${kycProfiles.filter((p: any) => p.statut === "approuve").length})` },
                      { id: "rejete", label: `Rejetés (${kycProfiles.filter((p: any) => p.statut === "rejete").length})` },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setKycFilter(f.id)}
                        className={`h-8 px-3.5 rounded-full text-[11px] font-bold transition ${kycFilter === f.id ? "bg-[#9e001f] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead className="border-b text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      <tr>
                        <th className="py-3">Utilisateur / Entreprise</th>
                        <th>Type profil</th>
                        <th>Pièces jointes</th>
                        <th>Statut</th>
                        <th>Date soumission</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {kycProfiles
                        .filter((p: any) => kycFilter === "all" ? true : p.statut === kycFilter)
                        .map((profile: any) => (
                          <tr key={profile.id || profile.userId} className="hover:bg-zinc-50 transition">
                            <td className="py-3 font-semibold text-[#0A1931]">
                              <div>{profile.prenom} {profile.nom}</div>
                              {profile.typeProfil === "entreprise" && profile.nomEntreprise && (
                                <div className="text-[10px] text-zinc-500 font-normal">🏢 {profile.nomEntreprise} (RCCM: {profile.numeroRccm || "—"})</div>
                              )}
                              <div className="text-[10px] text-zinc-400 font-mono">{profile.telephone || profile.userId.slice(0, 10)}</div>
                            </td>
                            <td>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${profile.typeProfil === "entreprise" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                                {profile.typeProfil === "entreprise" ? "Entreprise" : "Particulier"}
                              </span>
                            </td>
                            <td className="text-[11px] text-zinc-600">
                              <div className="flex flex-wrap gap-1">
                                {profile.cniRectoUrl && <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">Recto</span>}
                                {profile.cniVersoUrl && <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">Verso</span>}
                                {profile.selfieUrl && <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">Selfie</span>}
                                {profile.documentRccmUrl && <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px]">RCCM</span>}
                                {profile.documentIfuUrl && <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px]">IFU</span>}
                              </div>
                            </td>
                            <td>
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                profile.statut === "approuve"
                                  ? "bg-green-100 text-green-800"
                                  : profile.statut === "rejete"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {profile.statut === "approuve" ? "✓ Approuvé" : profile.statut === "rejete" ? "✕ Rejeté" : "⏳ En attente"}
                              </span>
                            </td>
                            <td className="text-[11px] text-zinc-500">
                              {profile.soumisLe ? new Date(profile.soumisLe).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                            </td>
                            <td className="py-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setInspectKycProfile(profile)}
                                  className="h-7 px-2.5 rounded-full border border-zinc-200 bg-white text-[11px] font-semibold text-[#0A1931] hover:bg-zinc-100"
                                >
                                  Inspecter 🔍
                                </button>
                                {profile.statut !== "approuve" && (
                                  <button
                                    type="button"
                                    onClick={() => void handleApproveKyc(profile.userId)}
                                    className="h-7 px-2.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700"
                                  >
                                    Approuver ✓
                                  </button>
                                )}
                                {profile.statut !== "rejete" && (
                                  <button
                                    type="button"
                                    onClick={() => { setRejectModalProfile(profile); setRejectionReason(""); }}
                                    className="h-7 px-2.5 rounded-full border border-red-200 bg-red-50 text-[11px] font-bold text-red-700 hover:bg-red-100"
                                  >
                                    Rejeter ✕
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {kycProfiles.length === 0 && (
                    <div className="py-12 text-center text-zinc-400 text-sm">
                      Aucun dossier de vérification KYC soumis pour le moment.
                    </div>
                  )}
                </div>
              </div>
            )}

            {kycActiveTab === "aml" && (
              <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-bold text-[#0A1931] text-[15px]">Registre Légal AML & Traçabilité des Transactions</h3>
                    <p className="text-[11px] text-zinc-500">Journalisation immuable de chaque opération financière avec capture de l’adresse IP et de l’empreinte de session.</p>
                  </div>
                  <span className="text-[11px] font-bold text-zinc-400">{amlLogs.length} opérations enregistrées</span>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead className="border-b text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      <tr>
                        <th className="py-3">Date & Heure</th>
                        <th>Utilisateur</th>
                        <th>Mouvement</th>
                        <th>Montant</th>
                        <th>Adresse IP</th>
                        <th>Statut AML</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono">
                      {amlLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-zinc-50 transition text-[11px]">
                          <td className="py-3 text-zinc-500">{new Date(log.creeLe || log.date).toLocaleString("fr-FR")}</td>
                          <td className="font-sans font-semibold text-[#0A1931]">{log.userNom || log.userId?.slice(0, 8)}</td>
                          <td>
                            <span className="bg-zinc-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-zinc-700">
                              {log.typeMouvement}
                            </span>
                          </td>
                          <td className="font-bold text-[#0A1931]">
                            {Number(log.montant || 0).toLocaleString()} {log.devise || "XOF"}
                          </td>
                          <td className="text-blue-700 font-bold">{log.ipAddress || "127.0.0.1"}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.statutAml === "conforme" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                              {log.statutAml || "conforme"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {amlLogs.length === 0 && (
                    <div className="py-12 text-center text-zinc-400 text-sm font-sans">
                      Aucune transaction financière n'a encore été journalisée dans le registre AML.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modale d'inspection de dossier KYC */}
            {inspectKycProfile && (
              <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
                <div className="w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-bold text-[#0A1931] text-lg">Dossier KYC — {inspectKycProfile.prenom} {inspectKycProfile.nom}</h3>
                      <p className="text-[11px] text-zinc-500">Profil {inspectKycProfile.typeProfil === "entreprise" ? "Entreprise / Société" : "Particulier"}</p>
                    </div>
                    <button type="button" onClick={() => setInspectKycProfile(null)} className="text-2xl text-zinc-400 hover:text-black">×</button>
                  </div>

                  <div className="mt-5 space-y-6 text-xs">
                    {/* Infos personnelles */}
                    <div className="rounded-[16px] bg-zinc-50 p-4 border border-zinc-200">
                      <h4 className="font-bold text-[#0A1931] mb-2 uppercase text-[10px] tracking-wider text-[#9e001f]">Données d’identification</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div><span className="text-zinc-500 block">Nom complet :</span> <strong>{inspectKycProfile.prenom} {inspectKycProfile.nom}</strong></div>
                        <div><span className="text-zinc-500 block">Date de naissance :</span> <strong>{inspectKycProfile.dateNaissance || "—"}</strong></div>
                        <div><span className="text-zinc-500 block">Nationalité :</span> <strong>{inspectKycProfile.nationalite || "—"}</strong></div>
                        <div><span className="text-zinc-500 block">Téléphone :</span> <strong>{inspectKycProfile.telephone || "—"}</strong></div>
                        <div><span className="text-zinc-500 block">Adresse :</span> <strong>{inspectKycProfile.adresse || "—"}</strong></div>
                        <div><span className="text-zinc-500 block">Type de pièce :</span> <strong>{inspectKycProfile.typePiece || "CNI"} (N° {inspectKycProfile.numeroPiece || "—"})</strong></div>
                      </div>
                    </div>

                    {/* Données entreprise si applicable */}
                    {inspectKycProfile.typeProfil === "entreprise" && (
                      <div className="rounded-[16px] bg-purple-50/50 p-4 border border-purple-200">
                        <h4 className="font-bold text-purple-900 mb-2 uppercase text-[10px] tracking-wider">Informations Société (Marketplace / Partenaire)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div><span className="text-zinc-500 block">Raison sociale :</span> <strong>{inspectKycProfile.nomEntreprise || "—"}</strong></div>
                          <div><span className="text-zinc-500 block">Numéro RCCM :</span> <strong>{inspectKycProfile.numeroRccm || "—"}</strong></div>
                          <div><span className="text-zinc-500 block">Numéro IFU :</span> <strong>{inspectKycProfile.numeroIfu || "—"}</strong></div>
                          <div><span className="text-zinc-500 block">Forme juridique :</span> <strong>{inspectKycProfile.formeJuridique || "SARL"}</strong></div>
                          <div><span className="text-zinc-500 block">Siège social :</span> <strong>{inspectKycProfile.siegeSocial || "—"}</strong></div>
                        </div>
                      </div>
                    )}

                    {/* Visualisation des pièces */}
                    <div>
                      <h4 className="font-bold text-[#0A1931] mb-3 text-[13px]">Pièces justificatives téléchargées</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {inspectKycProfile.cniRectoUrl && (
                          <div className="rounded-xl border p-2 bg-zinc-50">
                            <span className="font-bold block mb-1 text-[11px]">Pièce d’identité (Recto)</span>
                            <a href={inspectKycProfile.cniRectoUrl} target="_blank" rel="noopener noreferrer">
                              <img src={inspectKycProfile.cniRectoUrl} alt="CNI Recto" className="h-32 w-full object-cover rounded-lg hover:opacity-90" />
                            </a>
                          </div>
                        )}
                        {inspectKycProfile.cniVersoUrl && (
                          <div className="rounded-xl border p-2 bg-zinc-50">
                            <span className="font-bold block mb-1 text-[11px]">Pièce d’identité (Verso)</span>
                            <a href={inspectKycProfile.cniVersoUrl} target="_blank" rel="noopener noreferrer">
                              <img src={inspectKycProfile.cniVersoUrl} alt="CNI Verso" className="h-32 w-full object-cover rounded-lg hover:opacity-90" />
                            </a>
                          </div>
                        )}
                        {inspectKycProfile.selfieUrl && (
                          <div className="rounded-xl border p-2 bg-zinc-50 border-amber-300 bg-amber-50/30">
                            <span className="font-bold block mb-1 text-[11px] text-amber-900">Selfie tenant la pièce</span>
                            <a href={inspectKycProfile.selfieUrl} target="_blank" rel="noopener noreferrer">
                              <img src={inspectKycProfile.selfieUrl} alt="Selfie avec pièce" className="h-32 w-full object-cover rounded-lg hover:opacity-90" />
                            </a>
                          </div>
                        )}
                        {inspectKycProfile.documentRccmUrl && (
                          <div className="rounded-xl border p-2 bg-zinc-50">
                            <span className="font-bold block mb-1 text-[11px]">Extrait RCCM Société</span>
                            <a href={inspectKycProfile.documentRccmUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-32 w-full items-center justify-center bg-purple-50 rounded-lg text-purple-700 font-bold">
                              Voir le RCCM ↗
                            </a>
                          </div>
                        )}
                        {inspectKycProfile.documentIfuUrl && (
                          <div className="rounded-xl border p-2 bg-zinc-50">
                            <span className="font-bold block mb-1 text-[11px]">Attestation IFU</span>
                            <a href={inspectKycProfile.documentIfuUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-32 w-full items-center justify-center bg-purple-50 rounded-lg text-purple-700 font-bold">
                              Voir l'IFU ↗
                            </a>
                          </div>
                        )}
                        {inspectKycProfile.documentStatutsUrl && (
                          <div className="rounded-xl border p-2 bg-zinc-50">
                            <span className="font-bold block mb-1 text-[11px]">Statuts Société</span>
                            <a href={inspectKycProfile.documentStatutsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-32 w-full items-center justify-center bg-purple-50 rounded-lg text-purple-700 font-bold">
                              Voir les Statuts ↗
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                    <button
                      type="button"
                      onClick={() => setInspectKycProfile(null)}
                      className="h-10 px-5 rounded-full border text-xs font-bold"
                    >
                      Fermer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = inspectKycProfile;
                        setInspectKycProfile(null);
                        setRejectModalProfile(target);
                        setRejectionReason("");
                      }}
                      className="h-10 px-5 rounded-full border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      Rejeter le dossier
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = inspectKycProfile.userId;
                        setInspectKycProfile(null);
                        void handleApproveKyc(targetId);
                      }}
                      className="h-10 px-6 rounded-full bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      Valider et activer les retraits ✓
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modale de motif de rejet KYC */}
            {rejectModalProfile && (
              <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="w-full max-w-[460px] rounded-[22px] bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-[#0A1931]">Rejeter le dossier KYC</h3>
                    <button type="button" onClick={() => setRejectModalProfile(null)} className="text-xl text-zinc-400">×</button>
                  </div>
                  <p className="mt-3 text-xs text-zinc-600 leading-5">
                    Indiquez le motif exact du rejet (pièce illisible, selfie manquant, document expiré, nom non conforme). L'utilisateur sera notifié et pourra corriger son dossier.
                  </p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    placeholder="Ex: La photo de la CNI est floue et les coins sont coupés. Veuillez fournir un scan net ou une photo lisible avec le selfie tenant la pièce."
                    className="mt-3 w-full rounded-xl border bg-zinc-50 p-3 text-xs"
                    required
                  />
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectModalProfile(null)}
                      className="h-10 px-4 rounded-full border text-xs font-bold"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={!rejectionReason.trim()}
                      onClick={() => void handleRejectKyc(rejectModalProfile.userId, rejectionReason)}
                      className="h-10 px-5 rounded-full bg-red-600 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirmer le rejet
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab==="commentaires" && (
          <div className="bg-white rounded-[18px] border p-6">
            <h3 className="font-bold text-[18px]">Commentaires - Modération (Gérant/Admin only - RC ne modère pas per MATRICE)</h3>
            <div className="mt-4 space-y-3">
              {comments.length===0 ? <div className="text-center py-12 text-zinc-500 text-sm">Aucun commentaire - les commentaires apparaissent ici pour modération</div> : comments.map((c:any)=>(
                <div key={c.id} className="p-4 rounded-[12px] bg-zinc-50 border flex justify-between gap-4">
                  <div><div className="font-bold text-[12px]">{c.userId.slice(0,8)} • {new Date(c.createdAt).toLocaleDateString('fr-FR')} • Article {c.articleId.slice(0,8)}</div><div className="text-[13px] mt-1">{c.content}</div><div className="text-[10px] mt-1 text-zinc-500">Status: {c.isModerated?"masqué":"visible"} • Likes: {c.likes}</div></div>
                  <div className="flex flex-col gap-1"><button onClick={()=>handleModerateComment(c.id, !c.isModerated)} className="h-8 px-3 rounded-full bg-[#0A1931] text-white text-[11px]">{c.isModerated?"Afficher":"Masquer"}</button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab==="affiliate" && (
          <AffiliateManager initialEarnings={earnings} />
        )}

        {activeTab==="service" && (
          <div className="bg-white rounded-[18px] border p-6">
            <h3 className="font-bold text-[18px]">Demandes de service + Autres services (10 services enum exacte cahier)</h3>
            <p className="text-[11px] text-zinc-500 mt-2">Montage plan affaires, conseils et externalisation, recrutement, formation et recyclage, levée fonds, services digitaux, marketing et stratégie vente, audit gestion, gestion projet, courtage</p>
            <div className="mt-4 p-4 rounded-[12px] bg-zinc-50 border text-[12px]">✅ Page /service + /api/service POST + admin voit demandes + budget indicatif + company_name + contact_name + contact_phone</div>
            <Link href="/service" className="mt-4 inline-block h-9 px-4 rounded-full bg-[#0A1931] text-white text-[12px] font-bold">Voir /service →</Link>
          </div>
        )}

        {activeTab==="settings" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-[18px] border p-6">
              <h3 className="font-bold">Langues & Devises & Shipping + KPIs</h3>
              <div className="mt-4 space-y-3 text-[11px]">
                <div className="rounded-[12px] bg-zinc-50 border p-3"><div className="font-bold">Conversion devise live</div><div className="text-zinc-600 mt-1">Header switcher convertit prix via exchange_rates table + rates constants + auto-detect Vercel Geolocation</div></div>
                <div className="rounded-[12px] bg-zinc-50 border p-3"><div className="font-bold">Footer liens + Mega menu + Landing blocks</div><div className="text-zinc-600 mt-1">footer_links, mega_menu_items, landing_blocks tables créées (002_missing_tables.sql) + API /api/admin/settings + UI admin</div></div>
              </div>
            </div>
            <div className="bg-white rounded-[18px] border p-6">
              <h3 className="font-bold">Sécurité & Audit - Definition of Done (RULES.md §7)</h3>
              <div className="mt-3 space-y-1 text-[11px]">
                <div>✓ Paywall serveur, Moneroo env only, liens JWT 24h</div>
                <div>✓ RBAC lib/rbac.ts + admin-auth + DECISIONS.md 6 tickets attente</div>
                <div>✓ Zod schemas + rate-limit + rewrites /functions/v1/* /rest/v1/*</div>
                <div>✓ 2FA + llms.txt + robots.txt IA arbitrage + GitHub Actions CI</div>
                <div>✓ Build 37 routes vert</div>
              </div>
            </div>
          </div>
        )}
        </>}
      </div>
    </div>
  );
}
