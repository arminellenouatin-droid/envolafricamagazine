"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import MagazineModal from "./MagazineModal";
import RichTextEditor from "@/components/RichTextEditor";

async function readApiResponse(response: Response) {
  const raw = await response.text();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { error: raw.slice(0, 300) }; }
}

type AdminPlatform = "magazine" | "jobs" | "wab" | "marketplace" | "financement" | "awards";

function categoryDepth(category: any, all: any[]) { let depth = 0; let current = category; while (current?.parent_id && depth < 12) { current = all.find((item) => item.id === current.parent_id); depth += 1; } return depth; }
function categoryPath(category: any, all: any[]) { const names: string[] = []; let current = category; let guard = 0; while (current && guard < 12) { names.unshift(current.label); current = all.find((item) => item.id === current.parent_id); guard += 1; } return names.join(" / "); }

const adminPlatforms: Array<{ id: AdminPlatform; label: string; accent: string; description: string; href: string; modules: string[] }> = [
  { id: "magazine", label: "Magazine", accent: "#9e001f", description: "Articles, éditions, abonnements, commandes et KPI éditoriaux.", href: "/admin", modules: ["Articles", "Magazines", "Abonnements", "Commandes", "Affiliation", "KPI"] },
  { id: "jobs", label: "Jobs", accent: "#087e8b", description: "Offres, candidats, entreprises, abonnements et modération.", href: "/emploi/admin", modules: ["Offres", "Candidats", "Entreprises", "Abonnements", "Modération"] },
  { id: "wab", label: "WAB", accent: "#006874", description: "Publications, signalements, comptes Business, campagnes et récompenses.", href: "/wab/admin", modules: ["Publications", "Signalements", "Profils", "Campagnes", "Récompenses"] },
  { id: "marketplace", label: "Marketplace", accent: "#7c3aed", description: "Vendeurs, produits, commandes, commissions, litiges et versements.", href: "/marketplace/admin", modules: ["Vendeurs", "Produits", "Commandes", "Commissions", "Litiges", "Versements"] },
  { id: "financement", label: "Crowdfunding", accent: "#b45309", description: "Projets, investisseurs, documents, paiements et remboursements.", href: "/admin/crowdfunding", modules: ["Projets soumis", "Validation", "Investisseurs", "Documents", "Paiements", "Remboursements"] },
  { id: "awards", label: "Africa Awards", accent: "#b5832f", description: "Compétitions, candidats, jurys, votes, animateurs et demandes.", href: "/africa-awards/organizer/dashboard", modules: ["Compétitions", "Candidats", "Jurys", "Votes", "Demandes"] },
];

function PlatformAdminLanding({ platform, user }: { platform: AdminPlatform; user: any }) {
  const config = adminPlatforms.find((item) => item.id === platform) ?? adminPlatforms[0];
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[24px] p-7 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${config.accent}, #0A1931)` }}>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Projet administré</p><h1 className="mt-2 text-3xl font-black">Administration {config.label}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">{config.description} Cette vue est préparée pour {user?.prenom || "l’équipe"} et son niveau de permission <strong>{user?.role || "staff"}</strong>.</p></div>
          <Link href={config.href} className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-xs font-black text-[#0A1931] shadow-sm">Ouvrir le module opérationnel →</Link>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {config.modules.map((module, index) => <div key={module} className="rounded-[18px] border border-zinc-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Module {String(index + 1).padStart(2, "0")}</span><span className="grid h-8 w-8 place-items-center rounded-full text-xs font-black text-white" style={{ backgroundColor: config.accent }}>{index + 1}</span></div><h2 className="mt-4 text-base font-black text-[#0A1931]">{module}</h2><p className="mt-2 text-xs leading-5 text-zinc-600">Espace de pilotage prévu dans la verticale {config.label}, avec contrôle des droits et traçabilité des actions.</p><span className="mt-4 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold text-zinc-500">À connecter / vérifier</span></div>)}
      </section>
    </div>
  );
}

export default function AdminDashboardClient({ user, stats, db }: { user: any, stats: any, db: any }) {
  const [activePlatform, setActivePlatform] = useState<AdminPlatform>("magazine");
  const [activeTab, setActiveTab] = useState<"overview"|"articles"|"magazines"|"users"|"orders"|"affiliate"|"abonnements"|"commentaires"|"service"|"settings"|"redacteurs"|"categories">("overview");
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
  const [showUserModal, setShowUserModal] = useState<any>(null);
  const [message, setMessage] = useState<string>("");
  const [savingArticle, setSavingArticle] = useState(false);
  const [uploadingArticleImage, setUploadingArticleImage] = useState(false);
  const [articleImage, setArticleImage] = useState("");
  const [authors, setAuthors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
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

  const fetchArticles = async () => { const res = await fetch("/api/admin/articles"); if (res.ok) { const d = await res.json(); setArticles(d.articles); } };
  const fetchMagazines = async () => { const res = await fetch("/api/admin/magazines"); if (res.ok) { const d = await res.json(); setMagazines(d.magazines); } };
  const protectExistingPdfs = async () => { setProtectingPdfs(true); try { const res = await fetch("/api/admin/magazines/protect-pdfs", { method: "POST", credentials: "include" }); const data = await readApiResponse(res); if (!res.ok) throw new Error(data.error || "Migration impossible"); setMessage(`Protection PDF terminée : ${data.migrated?.length || 0} fichier(s) migré(s).`); await fetchMagazines(); } catch (error) { setMessage(`Protection PDF : ${error instanceof Error ? error.message : "échec de la migration"}`); } finally { setProtectingPdfs(false); } };
  const fetchUsers = async () => { const res = await fetch("/api/admin/users"); if (res.ok) { const d = await res.json(); setUsers(d.users); } };
  const fetchOrders = async () => { const res = await fetch("/api/admin/orders"); if (res.ok) { const d = await res.json(); setOrders(d.orders); } };
  const fetchComments = async () => { const res = await fetch("/api/comments"); if (res.ok) { const d = await res.json(); setComments(d.comments); } };
  const fetchEditorial = async () => { const res = await fetch("/api/admin/editorial"); if (res.ok) { const d = await res.json(); setAuthors(d.authors || []); setCategories(d.categories || []); } };
  const fetchSubscriptionPlans = async () => { const res = await fetch("/api/admin/subscription-plans", { credentials: "include" }); const data = await readApiResponse(res); if (res.ok && Array.isArray(data.plans)) setSubscriptionPlans(data.plans); else if (!res.ok) setMessage(`Erreur tarifs : ${data.error || `chargement impossible (${res.status})`}`); };
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
  },[activePlatform, activeTab]);

  const handleCreateArticle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingArticle(true);
    try {
      const form = new FormData(e.currentTarget);
      const payload: any = {
        title: form.get("title"), summary: form.get("summary"), content: form.get("content"), category: categories.find((item) => item.id === selectedCategoryIds[0])?.label || "Economie", categoryId: selectedCategoryIds[0] || null, categoryIds: selectedCategoryIds, image: form.get("image") || articleImage,
        author: authors.find((item) => item.id === form.get("authorProfileId"))?.name || "", authorId: form.get("authorId") || "", authorProfileId: form.get("authorProfileId") || null, tags: (form.get("tags") as string)?.split(",").map((t:string)=>t.trim()).filter(Boolean),
        isEncrypted: form.get("isEncrypted") === "on", isPublished: form.get("isPublished")==="on", isFeatured: form.get("isFeatured")==="on", isSentinelle: form.get("isSentinelle")==="on", isEssor: form.get("isEssor")==="on", isOmbreDouce: form.get("isOmbreDouce")==="on",
      };
      if (editingArticle) payload.id = editingArticle.id;
      const res = await fetch("/api/admin/articles", { method: editingArticle ? "PUT" : "POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({ error: "Réponse serveur illisible" }));
      if (!res.ok) throw new Error(data.error || `Enregistrement impossible (${res.status})`);
      setMessage(editingArticle ? "Article modifié et enregistré ✅" : "Article créé et enregistré ✅");
      await fetchArticles();
      setShowArticleModal(false); setEditingArticle(null); setArticleImage("");
    } catch (error) {
      setMessage(`Erreur d’enregistrement : ${error instanceof Error ? error.message : "réessayez"}`);
    } finally { setSavingArticle(false); }
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

  const handleTogglePublish = async (a:any) => {
    const res = await fetch("/api/admin/articles", { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id: a.id, isPublished: !a.isPublished }) });
    if (res.ok) fetchArticles();
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

  const handleChangeOrderStatus = async (id:string, status:string) => {
    const res = await fetch("/api/admin/orders", { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id, status }) });
    if (res.ok) fetchOrders();
  };

  const handleModerateComment = async (id:string, isModerated:boolean) => {
    const res = await fetch("/api/comments", { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id, isModerated }) });
    if (res.ok) fetchComments();
  };

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
            { id:"articles", label:`Articles (${articles.length})` },
            { id:"redacteurs", label:`Rédacteurs (${authors.length})` },
            { id:"categories", label:`Catégories (${categories.length})` },
            { id:"magazines", label:`Magazines (${magazines.length})` },
            { id:"users", label:`Utilisateurs (${users.length})` },
            { id:"orders", label:`Commandes` },
            { id:"abonnements", label:`Abonnements` },
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
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[10px] uppercase font-bold text-zinc-500">Revenu total</div><div className="font-black text-[22px] mt-1">{stats.totalRevenue.toLocaleString()} F</div><div className="text-[11px] text-green-600 mt-1">{stats.paidOrders}/{stats.orders} payées</div></div>
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[10px] uppercase font-bold text-zinc-500">Abonnés actifs</div><div className="font-black text-[22px] mt-1">{stats.subscribers}</div><div className="text-[11px] text-zinc-500">{stats.users} users • {db.articles.length} articles • {db.comments?.length||0} comments</div></div>
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[10px] uppercase font-bold text-zinc-500">Kiosque</div><div className="font-black text-[22px] mt-1">{stats.magazines} numéros</div><div className="text-[11px] text-zinc-500">{magazines.filter((m:any)=>m.featured).length} à la une</div></div>
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[10px] uppercase font-bold text-zinc-500">Affiliation + Service</div><div className="font-black text-[16px] mt-1">{stats.affiliateEarnings.toLocaleString()} F + {db.settings?.serviceRequests?.length||0} demandes</div></div>
            </div>
            <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
              <div className="bg-white rounded-[18px] border p-6">
                <h3 className="font-bold">Dernières commandes</h3>
                <div className="mt-4 space-y-2">
                  {orders.slice(0,6).map((o:any)=>(
                    <div key={o.id} className="flex justify-between items-center p-3 rounded-[12px] bg-zinc-50 border text-[12px]"><span className="font-bold">{o.id.slice(0,8)} • {o.total.toLocaleString()} {o.currency} • {o.status}</span><button onClick={()=>handleChangeOrderStatus(o.id, o.status==="paid"?"shipped":"paid")} className="h-6 px-2 rounded-full bg-[#0A1931] text-white text-[10px]">{o.status==="paid"?"Expédier":"Payer"}</button></div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[18px] border p-6">
                <h3 className="font-bold text-[14px]">Accès rapide</h3>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={()=>setActiveTab("articles")} className="h-10 rounded-full bg-[#0A1931] text-white text-[11px] font-bold">Gérer Articles</button>
                  <button onClick={()=>setActiveTab("magazines")} className="h-10 rounded-full bg-[#9e001f] text-white text-[11px] font-bold">Gérer Magazines</button>
                  <button onClick={()=>setActiveTab("abonnements")} className="h-10 rounded-full border text-[11px] font-bold">Gérer Abonnements</button>
                  <button onClick={()=>setActiveTab("commentaires")} className="h-10 rounded-full border text-[11px] font-bold">Modérer Comments</button>
                  <button onClick={()=>setActiveTab("users")} className="h-10 rounded-full border text-[11px] font-bold">Gérer Users</button>
                  <button onClick={()=>setActiveTab("settings")} className="h-10 rounded-full border text-[11px] font-bold">Réglages Sécu</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab==="articles" && (
          <div className="bg-white rounded-[18px] border p-6">
            <div className="flex items-center justify-between"><h3 className="font-bold text-[18px]">Articles - CRUD complet + KPIs vues/likes - Fil d'info, Sentinelles, Essor, Ombre douce</h3><button onClick={()=>{setEditingArticle(null); setArticleImage(""); setSelectedAuthorId(""); setSelectedCategoryId(""); setSelectedCategoryIds([]); setShowArticleModal(true);}} className="h-9 px-4 rounded-full bg-[#0A1931] text-white text-[12px] font-bold">+ Nouvel article</button></div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-[12px]"><thead className="text-[10px] uppercase text-zinc-500 border-b"><tr><th className="text-left py-2">Titre</th><th>Cat</th><th>Auteur</th><th>Vues</th><th>Flags</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody>{articles.map((a:any)=>(<tr key={a.id} className="border-b"><td className="py-2 max-w-[280px] truncate font-medium">{a.title}</td><td><span className="px-2 py-0.5 bg-zinc-100 rounded-full text-[10px]">{a.category}</span></td><td className="text-[11px]">{a.author}</td><td>{a.views}</td><td className="text-[9px] space-x-1">{a.isFeatured&&"★"}{a.isSentinelle&&"S"}{a.isEssor&&"E"}{a.isOmbreDouce&&"O"}</td><td><span className={`px-2 py-0.5 rounded-full text-[10px] ${a.isPublished?"bg-green-50 text-green-700":"bg-amber-50"}`}>{a.isPublished?"Publié":"Brouillon"}</span></td><td className="flex gap-1 py-1"><button onClick={()=>{setEditingArticle(a); setArticleImage(a.image || ""); setSelectedAuthorId(a.authorProfileId || a.author_profile_id || ""); setSelectedCategoryId(a.categoryId || a.category_id || ""); setSelectedCategoryIds(a.categoryIds || (a.categoryId || a.category_id ? [a.categoryId || a.category_id] : [])); setShowArticleModal(true);}} className="h-6 px-2 rounded-full border text-[10px]">Éditer</button><button onClick={()=>handleTogglePublish(a)} className="h-6 px-2 border rounded-full text-[10px]">{a.isPublished?"Dépub":"Pub"}</button><button onClick={()=>handleDeleteArticle(a.id)} className="h-6 px-2 bg-red-50 text-red-600 border text-[10px]">Suppr</button></td></tr>))}</tbody>
              </table>
            </div>
            {showArticleModal && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <form onSubmit={handleCreateArticle} className="bg-white rounded-[20px] p-6 w-full max-w-[760px] max-h-[90vh] overflow-y-auto">
                  <h3 className="font-bold">{editingArticle?"Modifier":"Nouveau"} article</h3><p className="mt-1 text-[11px] text-zinc-500">Les champs marqués sont enregistrés dans le Magazine et contrôlent l’accès public au contenu.</p>
                  <div className="mt-4 grid gap-3">
                    <input name="title" defaultValue={editingArticle?.title} placeholder="Titre" required className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <input name="summary" defaultValue={editingArticle?.summary} placeholder="Résumé" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <RichTextEditor name="content" defaultValue={editingArticle?.content || ""} placeholder="Contenu complet - 12 lignes visibles non-abonnés" minHeight={220} className="bg-zinc-50" />
                    <div className="grid gap-3 md:grid-cols-2">
                      <div><label className="mb-1 block text-[11px] font-bold text-zinc-600">Catégorie</label><div className="flex gap-2"><select name="categoryId" multiple size={Math.min(Math.max(categories.length, 3), 6)} value={selectedCategoryIds.length ? selectedCategoryIds : (selectedCategoryId || editingArticle?.categoryId || editingArticle?.category_id || categories.find((item) => item.label.toLowerCase() === String(editingArticle?.category || "").toLowerCase())?.id || "")} onChange={(event) => { const values = Array.from(event.target.selectedOptions).map((option) => option.value); setSelectedCategoryIds(values); setSelectedCategoryId(values[0] || ""); }} className="h-auto min-h-11 min-w-0 flex-1 rounded-[14px] border bg-zinc-50 px-4 py-2 text-[13px]" required><option value="">Sélectionner une catégorie</option>{categories.filter((item) => item.is_active !== false).map((item) => <option key={item.id} value={item.id}>{categoryPath(item, categories)}</option>)}</select><button type="button" onClick={() => setShowCategoryModal(true)} className="h-11 shrink-0 rounded-full border border-[#9e001f] px-3 text-[11px] font-bold text-[#9e001f]">Créer</button></div></div>
                      <div><label className="mb-1 block text-[11px] font-bold text-zinc-600">Rédacteur</label><div className="flex gap-2"><select name="authorProfileId" value={selectedAuthorId || editingArticle?.authorProfileId || editingArticle?.author_profile_id || authors.find((item) => item.name.toLowerCase() === String(editingArticle?.author || "").toLowerCase())?.id || ""} onChange={(event) => setSelectedAuthorId(event.target.value)} className="h-11 min-w-0 flex-1 rounded-full border bg-zinc-50 px-4 text-[13px]" required><option value="">Sélectionner un rédacteur</option>{authors.filter((item) => item.is_active !== false).map((item) => <option key={item.id} value={item.id}>{item.name}{item.role_label ? ` · ${item.role_label}` : ""}</option>)}</select><input type="hidden" name="authorId" value={editingArticle?.authorId || ""} /><button type="button" onClick={() => setShowAuthorModal(true)} className="h-11 shrink-0 rounded-full border border-[#9e001f] px-3 text-[11px] font-bold text-[#9e001f]">Créer</button></div></div>
                    </div>
                    <div className="rounded-[16px] border border-dashed border-zinc-300 bg-zinc-50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-black text-[#0A1931]">Image principale</div><div className="mt-1 text-[11px] text-zinc-500">Uploadez une image ou utilisez une URL externe.</div></div><label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full bg-[#0A1931] px-4 text-[11px] font-bold text-white">{uploadingArticleImage ? "Upload en cours…" : "Choisir une image"}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingArticleImage} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleArticleImageUpload(file); }} /></label></div><input name="image" value={articleImage} onChange={(event) => setArticleImage(event.target.value)} placeholder="URL de l’image" className="mt-3 h-10 w-full rounded-full border bg-white px-4 text-[12px]" />{articleImage && <img src={articleImage} alt="Aperçu de l’article" className="mt-3 h-32 w-full rounded-xl object-cover" />}</div>
                    <input name="tags" defaultValue={editingArticle?.tags?.join(", ")} placeholder="Tags séparés par des virgules" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <div className="rounded-[16px] border border-zinc-200 bg-white p-4"><div className="mb-3 text-xs font-black text-[#0A1931]">Accès au contenu</div><div className="flex flex-wrap gap-4 text-[12px]"><label className="flex items-center gap-2"><input type="checkbox" name="isEncrypted" defaultChecked={editingArticle?.isEncrypted ?? true}/> <span><strong>Article chiffré</strong><span className="ml-1 text-zinc-500">(aperçu + abonnement)</span></span></label><label className="flex items-center gap-2"><input type="checkbox" name="isPublished" defaultChecked={editingArticle?.isPublished}/> Publié</label></div></div>
                    <div className="flex flex-wrap gap-3 text-[12px]"><label><input type="checkbox" name="isFeatured" defaultChecked={editingArticle?.isFeatured}/> Vedette</label><label><input type="checkbox" name="isSentinelle" defaultChecked={editingArticle?.isSentinelle}/> Sentinelles</label><label><input type="checkbox" name="isEssor" defaultChecked={editingArticle?.isEssor}/> Essor</label><label><input type="checkbox" name="isOmbreDouce" defaultChecked={editingArticle?.isOmbreDouce}/> Ombre Douce</label></div>
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
          <div className="space-y-5"><div className="rounded-[18px] border bg-white p-6"><div className="flex items-center justify-between"><div><h3 className="text-lg font-bold text-[#0A1931]">Catégories d’articles</h3><p className="mt-1 text-xs text-zinc-500">Référentiel réservé aux articles éditoriaux.</p></div><button onClick={() => { setActiveTab("articles"); setShowCategoryModal(true); }} className="h-10 rounded-full bg-[#9e001f] px-4 text-xs font-bold text-white">+ Nouvelle catégorie article</button></div><div className="mt-6 grid gap-2">{categories.filter((item) => item.is_active !== false).sort((a, b) => categoryPath(a, categories).localeCompare(categoryPath(b, categories))).map((category) => <div key={category.id} className="flex items-center justify-between rounded-xl border px-4 py-2 text-xs font-bold" style={{ marginLeft: `${categoryDepth(category, categories) * 18}px`, borderColor: category.color_hex || "#9e001f", color: category.color_hex || "#9e001f" }}><span>{categoryDepth(category, categories) > 0 ? "└ " : ""}{category.label}</span><span className="text-[10px] font-normal text-zinc-400">{categoryPath(category, categories)}</span></div>)}</div></div><div className="rounded-[18px] border bg-white p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-bold text-[#0A1931]">Catégories Magazine</h3><p className="mt-1 text-xs text-zinc-500">Référentiel séparé pour les numéros du Magazine.</p></div><div className="flex gap-2"><input value={newMagazineCategory} onChange={(event) => setNewMagazineCategory(event.target.value)} placeholder="Nouvelle catégorie Magazine" className="h-10 rounded-full border bg-zinc-50 px-4 text-xs"/><button type="button" onClick={() => void createMagazineCategory()} className="h-10 rounded-full bg-[#0A1931] px-4 text-xs font-bold text-white">+ Ajouter</button></div></div><div className="mt-6 flex flex-wrap gap-3">{magazineCategories.map((category) => <div key={category.id} className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold" style={{ borderColor: category.color_hex || "#9e001f", color: category.color_hex || "#9e001f" }}><span>{category.label}</span><button type="button" onClick={() => void deleteMagazineCategory(category)} aria-label={`Désactiver ${category.label}`} className="text-zinc-400 hover:text-red-700">×</button></div>)}</div></div></div>
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
                  <div className="mt-2 flex gap-1">
                    <button onClick={()=>{setEditingMag(m); setShowMagModal(true);}} className="h-7 flex-1 rounded-full border text-[10px] hover:bg-zinc-50">Éditer complet</button>
                    <button onClick={()=>handleDeleteMag(m.id)} className="h-7 flex-1 rounded-full bg-red-50 text-red-600 border border-red-100 text-[10px]">Suppr</button>
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

        {activeTab==="users" && (
          <div className="bg-white rounded-[18px] border p-6">
            <h3 className="font-bold text-[18px]">Utilisateurs - Rôles + KPIs</h3>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-[12px]"><thead className="text-[10px] uppercase text-zinc-500 border-b"><tr><th className="text-left py-2">Nom</th><th>Email</th><th>Rôle</th><th>Abo</th><th>2FA</th><th>Actions</th></tr></thead>
                <tbody>{users.map((u:any)=>(<tr key={u.id} className="border-b hover:bg-zinc-50"><td className="py-2 font-medium">{u.prenom} {u.nom}</td><td className="text-[11px]">{u.email}</td><td><span className={`px-2 py-0.5 rounded-full text-[10px] ${u.role==="admin"?"bg-[#0A1931] text-white":"bg-zinc-100"}`}>{u.role}</span></td><td className="text-[10px]">{u.subscription?.planId||"—"}</td><td>{u.twoFactorEnabled?"✓":"⚠"}</td><td><button onClick={()=>setShowUserModal(u)} className="h-6 px-2 rounded-full border text-[10px]">Rôle</button></td></tr>))}</tbody>
              </table>
            </div>
            {showUserModal && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                <div className="bg-white rounded-[20px] p-6 w-full max-w-[420px]">
                  <h3 className="font-bold">Changer rôle - {showUserModal.prenom}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-2">{["user","subscriber","redacteur","redacteur_chef","gerant","admin"].map(r=>(<button key={r} onClick={()=>handleChangeRole(showUserModal.id, r)} className={`h-10 rounded-full border text-[12px] ${showUserModal.role===r?"bg-[#0A1931] text-white":"bg-zinc-50"}`}>{r}</button>))}</div>
                  <button onClick={()=>setShowUserModal(null)} className="mt-4 w-full h-10 rounded-full border text-[13px]">Fermer</button>
                </div>
              </div>
            )}
          </div>
        )}

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
                    <div className="mt-3 font-black text-[20px]">{p.price.toLocaleString()} F</div>
                    {p.firstMonthPrice && <div className="text-[11px] text-green-700">1er mois {p.firstMonthPrice.toLocaleString()} F</div>}
                    <div className="mt-3 space-y-1 text-[11px]">{p.features.slice(0,3).map((f:string)=><div key={f} className="flex gap-1"><span>✓</span>{f}</div>)}</div>
                    <button type="button" onClick={() => setEditingPlan({ ...p, features: [...(p.features || [])] })} className="mt-4 w-full h-8 rounded-full border text-[11px] font-bold hover:bg-zinc-50">Éditer tarifs</button>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-[12px] bg-amber-50 border border-amber-100 text-[11px] text-amber-900">Règle: tarif 1er mois réduit = règle facturation récurrente J0 promo → J+30 plein, pas coupon. Les modifications sont sauvegardées dans Supabase.</div>
              {editingPlan && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-[520px] rounded-[22px] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="font-bold">Modifier le tarif — {editingPlan.name}</h3><button type="button" onClick={() => setEditingPlan(null)} className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100">×</button></div><div className="mt-5 grid gap-3"><label className="text-[11px] font-bold">Tarif principal (F CFA)<input type="number" min="0" value={editingPlan.price} onChange={(event) => setEditingPlan({ ...editingPlan, price: Number(event.target.value) })} className="mt-1 h-11 w-full rounded-full border bg-zinc-50 px-4" /></label><label className="text-[11px] font-bold">Premier mois — facultatif<input type="number" min="0" value={editingPlan.firstMonthPrice ?? ""} onChange={(event) => setEditingPlan({ ...editingPlan, firstMonthPrice: event.target.value === "" ? null : Number(event.target.value) })} className="mt-1 h-11 w-full rounded-full border bg-zinc-50 px-4" /></label><label className="text-[11px] font-bold">Tarif mensuel affiché — facultatif<input type="number" min="0" value={editingPlan.monthlyPrice ?? ""} onChange={(event) => setEditingPlan({ ...editingPlan, monthlyPrice: event.target.value === "" ? null : Number(event.target.value) })} className="mt-1 h-11 w-full rounded-full border bg-zinc-50 px-4" /></label><label className="text-[11px] font-bold">Description<textarea value={editingPlan.description || ""} onChange={(event) => setEditingPlan({ ...editingPlan, description: event.target.value })} rows={3} className="mt-1 w-full rounded-[14px] border bg-zinc-50 p-3" /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setEditingPlan(null)} className="h-10 rounded-full border px-4 text-xs font-bold">Annuler</button><button type="button" onClick={() => saveSubscriptionPlan(editingPlan).catch((error) => setMessage(`Erreur tarif : ${error instanceof Error ? error.message : "réessayez"}`))} className="h-10 rounded-full bg-[#0A1931] px-5 text-xs font-bold text-white">Enregistrer</button></div></div></div>}
            </div>
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
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[10px] uppercase font-bold text-zinc-500">Total commissions</div><div className="font-black text-[20px] mt-1">{earnings.reduce((s:any,e:any)=>s+e.commission,0).toLocaleString()} F</div></div>
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[10px] uppercase font-bold text-zinc-500">À payer (≥150k)</div><div className="font-black text-[20px] mt-1">{earnings.filter((e:any)=>e.status==="available").reduce((s:any,e:any)=>s+e.commission,0).toLocaleString()} F</div></div>
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[10px] uppercase font-bold text-zinc-500">Taux moyen</div><div className="font-black text-[20px] mt-1">{earnings.length ? Math.round(earnings.reduce((s:any,e:any)=>s+e.rate,0)/earnings.length*100) : 0}%</div></div>
            </div>
            <div className="bg-white rounded-[18px] border p-6">
              <h3 className="font-bold">Commissions - KPIs + Gestion retraits (Gérant/Admin valide)</h3>
              <div className="mt-4 space-y-2">
                {earnings.map((e:any)=>(<div key={e.id} className="p-3 rounded-[12px] bg-zinc-50 border flex justify-between text-[12px]"><span>Affilié: {e.affiliateId.slice(0,8)} • Cmd: {e.orderId.slice(0,8)} • {e.rate*100}% • {e.status}</span><span className="font-bold">{e.commission.toLocaleString()} F</span></div>))}
              </div>
            </div>
          </div>
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
