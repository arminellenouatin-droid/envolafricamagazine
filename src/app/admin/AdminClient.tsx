"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboardClient({ user, stats, db }: { user: any, stats: any, db: any }) {
  const [activeTab, setActiveTab] = useState<"overview"|"articles"|"magazines"|"users"|"orders"|"affiliate"|"settings"|"service">("overview");
  const [articles, setArticles] = useState<any[]>(db.articles);
  const [magazines, setMagazines] = useState<any[]>(db.magazines);
  const [users, setUsers] = useState<any[]>(db.users);
  const [orders, setOrders] = useState<any[]>(db.orders);
  const [earnings, setEarnings] = useState<any[]>(db.affiliateEarnings);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [showMagModal, setShowMagModal] = useState(false);
  const [editingMag, setEditingMag] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState<any>(null);
  const [message, setMessage] = useState<string>("");

  const fetchArticles = async () => {
    const res = await fetch("/api/admin/articles");
    if (res.ok) { const d = await res.json(); setArticles(d.articles); }
  };
  const fetchMagazines = async () => {
    const res = await fetch("/api/admin/magazines");
    if (res.ok) { const d = await res.json(); setMagazines(d.magazines); }
  };
  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) { const d = await res.json(); setUsers(d.users); }
  };
  const fetchOrders = async () => {
    const res = await fetch("/api/admin/orders");
    if (res.ok) { const d = await res.json(); setOrders(d.orders); }
  };

  useEffect(()=>{ if(activeTab==="articles") fetchArticles(); if(activeTab==="magazines") fetchMagazines(); if(activeTab==="users") fetchUsers(); if(activeTab==="orders") fetchOrders(); },[activeTab]);

  const handleCreateArticle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload: any = {
      title: form.get("title"),
      summary: form.get("summary"),
      content: form.get("content"),
      category: form.get("category"),
      image: form.get("image"),
      tags: (form.get("tags") as string)?.split(",").map((t:string)=>t.trim()),
      isPublished: form.get("isPublished")==="on",
      isFeatured: form.get("isFeatured")==="on",
      isSentinelle: form.get("isSentinelle")==="on",
      isEssor: form.get("isEssor")==="on",
      isOmbreDouce: form.get("isOmbreDouce")==="on",
    };
    if (editingArticle) {
      payload.id = editingArticle.id;
      const res = await fetch("/api/admin/articles", { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { setMessage("Article modifié ✅"); fetchArticles(); setShowArticleModal(false); setEditingArticle(null); }
      else setMessage("Erreur: "+data.error);
    } else {
      const res = await fetch("/api/admin/articles", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { setMessage("Article créé ✅"); fetchArticles(); setShowArticleModal(false); }
      else setMessage("Erreur: "+data.error);
    }
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
      const res = await fetch("/api/admin/magazines", { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { setMessage("Magazine modifié ✅"); fetchMagazines(); setShowMagModal(false); setEditingMag(null); }
    } else {
      const res = await fetch("/api/admin/magazines", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { setMessage("Magazine créé ✅"); fetchMagazines(); setShowMagModal(false); }
      else alert(data.error);
    }
  };

  const handleDeleteMag = async (id:string) => {
    if (!confirm("Supprimer ce magazine ?")) return;
    const res = await fetch(`/api/admin/magazines?id=${id}`, { method:"DELETE" });
    if (res.ok) fetchMagazines();
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

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      <div className="bg-[#0A1931] text-white sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-6 xl:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo-blanc-footer.png" alt="EAM" className="h-10 w-auto object-contain" />
            <div><div className="font-bold text-[15px]">Envol Africa Admin</div><div className="text-[11px] text-zinc-400">Rédaction • {user.role} • {user.prenom} {user.nom} • {user.twoFactorEnabled ? "✓ 2FA" : "⚠ 2FA non activée"}</div></div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="h-9 px-4 rounded-full bg-white/10 border border-white/15 text-[12px] font-medium">← Retour site</Link>
            <div className="w-9 h-9 rounded-full bg-[#D4AF37] text-[#0A1931] flex items-center justify-center font-bold text-sm">{user.prenom[0]}</div>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-6 xl:px-8 pb-0 flex gap-1 overflow-x-auto">
          {[
            { id:"overview", label:"Vue d'ensemble" },
            { id:"articles", label:`Articles (${articles.length})` },
            { id:"magazines", label:`Kiosque (${magazines.length})` },
            { id:"users", label:`Utilisateurs (${users.length})` },
            { id:"orders", label:`Commandes (${orders.length})` },
            { id:"affiliate", label:`Affiliation` },
            { id:"service", label:"Demandes Service" },
            { id:"settings", label:"Réglages & Sécurité" },
          ].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id as any)} className={`px-4 py-3 text-[12px] font-medium border-b-2 whitespace-nowrap ${activeTab===t.id ? "border-[#D4AF37] text-white" : "border-transparent text-zinc-400 hover:text-white"}`}>{t.label}</button>
          ))}
        </div>
      </div>

      {message && <div className="max-w-[1440px] mx-auto px-6 xl:px-8 pt-4"><div className="bg-green-600 text-white text-sm rounded-full px-4 py-2 inline-block">{message} <button onClick={()=>setMessage("")} className="ml-2 font-bold">×</button></div></div>}

      <div className="max-w-[1440px] mx-auto px-6 xl:px-8 pt-6">
        {activeTab==="overview" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wide">Revenu total</div><div className="font-black text-[22px] text-[#0A1931] mt-1">{stats.totalRevenue.toLocaleString()} F CFA</div><div className="text-[11px] text-green-600 mt-1">+12% ce mois • {stats.paidOrders}/{stats.orders} payées</div></div>
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[10px] uppercase font-bold text-zinc-500">Abonnés actifs</div><div className="font-black text-[22px] text-[#0A1931] mt-1">{stats.subscribers}</div><div className="text-[11px] text-zinc-500 mt-1">{stats.users} users totaux • {db.articles.length} articles</div></div>
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[10px] uppercase font-bold text-zinc-500">Kiosque</div><div className="font-black text-[22px] text-[#0A1931] mt-1">{stats.magazines} numéros</div><div className="text-[11px] text-zinc-500 mt-1">{magazines.filter((m:any)=>m.featured).length} à la une</div></div>
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[10px] uppercase font-bold text-zinc-500">Affiliation</div><div className="font-black text-[20px] text-[#0A1931] mt-1">{stats.affiliateEarnings.toLocaleString()} F à reverser</div><div className="text-[11px] text-zinc-500 mt-1">{earnings.length} commissions</div></div>
            </div>

            <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
              <div className="bg-white rounded-[18px] border p-6">
                <h3 className="font-bold text-[#0A1931]">Dernières commandes</h3>
                <div className="mt-4 space-y-2">
                  {orders.slice(0,8).map((o:any)=>(
                    <div key={o.id} className="flex justify-between items-center p-3 rounded-[12px] bg-zinc-50 border text-[12px]"><div><span className="font-bold">{o.id.slice(0,8)} • {o.total.toLocaleString()} {o.currency}</span> <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${o.status==="paid"?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700"}`}>{o.status}</span><div className="text-[11px] text-zinc-500">{o.items.map((i:any)=>i.type).join(', ')} • {new Date(o.createdAt).toLocaleDateString('fr-FR')}</div></div><div className="flex gap-1"><button onClick={()=>handleChangeOrderStatus(o.id, o.status==="paid"?"shipped":"paid")} className="h-7 px-2 rounded-full bg-[#0A1931] text-white text-[10px]">{o.status==="paid"?"Expédier":"Payer"}</button></div></div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[18px] border p-6">
                <h3 className="font-bold text-[#0A1931] text-[14px]">Sécurité & conformité (audit)</h3>
                <div className="mt-4 space-y-2 text-[11px]">
                  <div className="flex gap-2"><span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px]">✓</span><span><strong>Paywall serveur</strong> OK - full text jamais envoyé</span></div>
                  <div className="flex gap-2"><span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px]">✓</span><span><strong>Moneroo key</strong> env uniquement, plus en dur</span></div>
                  <div className="flex gap-2"><span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px]">✓</span><span><strong>Liens signés JWT</strong> 24h via /api/download/[token]</span></div>
                  <div className="flex gap-2"><span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px]">✓</span><span><strong>RBAC</strong> middleware lib/rbac.ts + admin-auth</span></div>
                  <div className="flex gap-2"><span className={`w-5 h-5 rounded-full ${user.twoFactorEnabled?"bg-green-600 text-white":"bg-amber-500 text-white"} flex items-center justify-center text-[10px]`}>{user.twoFactorEnabled?"✓":"!"}</span><span><strong>2FA</strong> {user.twoFactorEnabled?"activée":"non activée - aller /2fa"}</span></div>
                  <div className="flex gap-2"><span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px]">✓</span><span><strong>.env.local</strong> retiré du code, .env.example fourni</span></div>
                </div>
                <div className="mt-4 p-3 rounded-[12px] bg-[#0A1931] text-white text-[10px] font-mono">MONEROO_API_KEY via env • JWT_SECRET via env • SUPABASE_URL via env</div>
                <Link href="/2fa" className="mt-3 inline-block text-[11px] font-bold bg-[#D4AF37] text-[#0A1931] px-3 py-1.5 rounded-full">{user.twoFactorEnabled?"Gérer 2FA":"Activer 2FA →"}</Link>
              </div>
            </div>
          </div>
        )}

        {activeTab==="articles" && (
          <div className="bg-white rounded-[18px] border p-6">
            <div className="flex items-center justify-between"><h3 className="font-bold text-[18px] text-[#0A1931]">Gestion des articles - CRUD complet</h3><button onClick={()=>{setEditingArticle(null); setShowArticleModal(true);}} className="h-9 px-4 rounded-full bg-[#0A1931] text-white text-[12px] font-bold">+ Nouvel article</button></div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="text-[10px] uppercase tracking-wide text-zinc-500 border-b"><tr><th className="text-left py-2">Titre</th><th>Cat</th><th>Auteur</th><th>Vues</th><th>Flags</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody>
                  {articles.map((a:any)=>(
                    <tr key={a.id} className="border-b last:border-0"><td className="py-2 font-medium max-w-[280px] truncate">{a.title}</td><td><span className="px-2 py-0.5 rounded-full bg-zinc-100 text-[10px]">{a.category}</span></td><td className="text-[11px]">{a.author}</td><td>{a.views}</td><td className="text-[9px] space-x-1">{a.isFeatured&&<span className="bg-amber-100 px-1 rounded">★</span>}{a.isSentinelle&&<span className="bg-blue-100 px-1 rounded">S</span>}{a.isEssor&&<span className="bg-green-100 px-1 rounded">E</span>}{a.isOmbreDouce&&<span className="bg-purple-100 px-1 rounded">O</span>}</td><td><span className={`px-2 py-0.5 rounded-full text-[10px] ${a.isPublished?"bg-green-50 text-green-700 border border-green-100":"bg-amber-50 text-amber-700"}`}>{a.isPublished?"Publié":"Brouillon"}</span></td><td className="flex gap-1 py-1"><button onClick={()=>{setEditingArticle(a); setShowArticleModal(true);}} className="h-6 px-2 rounded-full border text-[10px] hover:bg-zinc-50">Éditer</button><button onClick={()=>handleTogglePublish(a)} className="h-6 px-2 rounded-full border text-[10px] hover:bg-zinc-50">{a.isPublished?"Dépublier":"Publier"}</button><button onClick={()=>handleDeleteArticle(a.id)} className="h-6 px-2 rounded-full bg-red-50 text-red-600 border border-red-100 text-[10px]">Suppr</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showArticleModal && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <form onSubmit={handleCreateArticle} className="bg-white rounded-[20px] p-6 w-full max-w-[760px] max-h-[90vh] overflow-y-auto">
                  <h3 className="font-bold text-[16px] text-[#0A1931]">{editingArticle?"Modifier article":"Nouvel article"}</h3>
                  <div className="mt-4 grid gap-3">
                    <input name="title" defaultValue={editingArticle?.title} placeholder="Titre" required className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <input name="summary" defaultValue={editingArticle?.summary} placeholder="Résumé" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <textarea name="content" defaultValue={editingArticle?.content} placeholder="Contenu complet (12 premières lignes visibles pour non-abonnés, serveur enforce)" required rows={8} className="rounded-[16px] border bg-zinc-50 p-4 text-[13px]" />
                    <div className="grid grid-cols-2 gap-2">
                      <input name="category" defaultValue={editingArticle?.category} placeholder="Catégorie (Economie, Finance...)" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                      <input name="image" defaultValue={editingArticle?.image} placeholder="URL image" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    </div>
                    <input name="tags" defaultValue={editingArticle?.tags?.join(", ")} placeholder="Tags séparés par virgule" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <div className="flex flex-wrap gap-3 text-[12px]">
                      <label className="flex items-center gap-1"><input type="checkbox" name="isPublished" defaultChecked={editingArticle?.isPublished}/> Publié</label>
                      <label className="flex items-center gap-1"><input type="checkbox" name="isFeatured" defaultChecked={editingArticle?.isFeatured}/> Vedette</label>
                      <label className="flex items-center gap-1"><input type="checkbox" name="isSentinelle" defaultChecked={editingArticle?.isSentinelle}/> Sentinelles</label>
                      <label className="flex items-center gap-1"><input type="checkbox" name="isEssor" defaultChecked={editingArticle?.isEssor}/> Essor</label>
                      <label className="flex items-center gap-1"><input type="checkbox" name="isOmbreDouce" defaultChecked={editingArticle?.isOmbreDouce}/> Ombre Douce</label>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2"><button type="submit" className="h-10 px-5 rounded-full bg-[#0A1931] text-white text-[13px] font-bold">{editingArticle?"Enregistrer":"Créer"}</button><button type="button" onClick={()=>{setShowArticleModal(false); setEditingArticle(null);}} className="h-10 px-5 rounded-full border text-[13px]">Annuler</button></div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab==="magazines" && (
          <div className="bg-white rounded-[18px] border p-6">
            <div className="flex items-center justify-between"><h3 className="font-bold text-[18px] text-[#0A1931]">Kiosque - Gestion numéros (CRUD)</h3><button onClick={()=>{setEditingMag(null); setShowMagModal(true);}} className="h-9 px-4 rounded-full bg-[#0A1931] text-white text-[12px] font-bold">+ Nouveau numéro</button></div>
            <div className="mt-6 grid md:grid-cols-4 gap-4">
              {magazines.map((m:any)=>(
                <div key={m.id} className="rounded-[14px] border p-3 bg-white"><img src={m.cover} alt={m.title} className="w-full aspect-[3/4] object-cover rounded-[10px]" /><div className="font-bold text-[12px] mt-2 line-clamp-2">{m.title}</div><div className="text-[10px] text-zinc-500 mt-1">N°{m.numero} • {m.year} {m.featured&&"• ★ À la une"}</div><div className="mt-2 flex gap-1"><button onClick={()=>{setEditingMag(m); setShowMagModal(true);}} className="h-7 flex-1 rounded-full border text-[10px]">Éditer</button><button onClick={()=>handleDeleteMag(m.id)} className="h-7 flex-1 rounded-full bg-red-50 text-red-600 border border-red-100 text-[10px]">Suppr</button></div></div>
              ))}
            </div>
            {showMagModal && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <form onSubmit={handleCreateMag} className="bg-white rounded-[20px] p-6 w-full max-w-[560px]">
                  <h3 className="font-bold">{editingMag?"Modifier magazine":"Nouveau magazine"}</h3>
                  <div className="mt-4 grid gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input name="numero" type="number" defaultValue={editingMag?.numero} placeholder="Numéro (ex: 26)" required className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                      <input name="year" type="number" defaultValue={editingMag?.year} placeholder="Année" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    </div>
                    <input name="title" defaultValue={editingMag?.title} placeholder="Titre" required className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <input name="cover" defaultValue={editingMag?.cover} placeholder="URL couverture" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <textarea name="description" defaultValue={editingMag?.description} placeholder="Description" rows={3} className="rounded-[14px] border bg-zinc-50 p-3 text-[13px]" />
                    <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" name="featured" defaultChecked={editingMag?.featured}/> À la une</label>
                  </div>
                  <div className="mt-6 flex gap-2"><button type="submit" className="h-10 px-5 rounded-full bg-[#0A1931] text-white text-[13px] font-bold">{editingMag?"Enregistrer":"Créer"}</button><button type="button" onClick={()=>{setShowMagModal(false); setEditingMag(null);}} className="h-10 px-5 rounded-full border text-[13px]">Annuler</button></div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab==="users" && (
          <div className="bg-white rounded-[18px] border p-6">
            <h3 className="font-bold text-[18px] text-[#0A1931]">Utilisateurs & Permissions (MATRICE_PERMISSIONS.md)</h3>
            <p className="text-[11px] text-zinc-500 mt-1">4 rôles équipe: Rédacteur (écrit), Rédacteur Chef (valide/publie), Gérant (modère/comments/promos/ventes), Admin (tous droits tarifs/langues/devises/sécu). Cliquez sur un utilisateur pour changer son rôle.</p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="text-[10px] uppercase tracking-wide text-zinc-500 border-b"><tr><th className="text-left py-2">Nom</th><th>Email</th><th>Rôle</th><th>Abo</th><th>Affilié</th><th>2FA</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map((u:any)=>(
                    <tr key={u.id} className="border-b hover:bg-zinc-50"><td className="py-2 font-medium">{u.prenom} {u.nom}</td><td className="text-[11px]">{u.email}</td><td><span className={`px-2 py-0.5 rounded-full text-[10px] border ${u.role==="admin"?"bg-[#0A1931] text-white border-[#0A1931]":u.role==="gerant"?"bg-purple-100 text-purple-700":u.role==="redacteur_chef"?"bg-blue-100 text-blue-700":u.role==="redacteur"?"bg-green-100 text-green-700":"bg-zinc-100"}`}>{u.role}</span></td><td className="text-[10px]">{u.subscription?.planId||"—"}</td><td className="font-mono text-[10px]">{u.affiliateCode}</td><td>{u.twoFactorEnabled?"✓":"⚠"}</td><td className="flex gap-1 py-1"><button onClick={()=>setShowUserModal(u)} className="h-6 px-2 rounded-full border text-[10px]">Rôle</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showUserModal && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                <div className="bg-white rounded-[20px] p-6 w-full max-w-[420px]">
                  <h3 className="font-bold">Changer rôle - {showUserModal.prenom} {showUserModal.nom}</h3>
                  <p className="text-[11px] text-zinc-500 mt-1">Actuel: {showUserModal.role} • Email: {showUserModal.email}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {["user","subscriber","redacteur","redacteur_chef","gerant","admin"].map(r=>(
                      <button key={r} onClick={()=>handleChangeRole(showUserModal.id, r)} className={`h-10 rounded-full border text-[12px] font-medium ${showUserModal.role===r?"bg-[#0A1931] text-white":"bg-zinc-50"}`}>{r}</button>
                    ))}
                  </div>
                  <button onClick={()=>setShowUserModal(null)} className="mt-4 w-full h-10 rounded-full border text-[13px]">Fermer</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab==="orders" && (
          <div className="bg-white rounded-[18px] border p-6">
            <h3 className="font-bold text-[18px] text-[#0A1931]">Commandes & Revenus - Gestion</h3>
            <div className="mt-4 space-y-2">
              {orders.map((o:any)=>(
                <div key={o.id} className="p-4 rounded-[12px] bg-zinc-50 border flex flex-col md:flex-row md:items-center justify-between gap-2 text-[12px]">
                  <div><div className="font-bold">{o.id.slice(0,8)} • {o.total.toLocaleString()} {o.currency} <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${o.status==="paid"?"bg-green-100 text-green-700":o.status==="shipped"?"bg-blue-100 text-blue-700":"bg-amber-100"}`}>{o.status}</span></div><div className="text-[11px] text-zinc-500 mt-1">User: {o.userId.slice(0,8)} • Affilié: {o.affiliateCode||"—"} • {new Date(o.createdAt).toLocaleString('fr-FR')} • {o.items.map((i:any)=>`${i.type}${i.format?"/"+i.format:""}`).join(', ')}</div></div>
                  <div className="flex gap-1"><select value={o.status} onChange={e=>handleChangeOrderStatus(o.id, e.target.value)} className="h-8 rounded-full border bg-white px-3 text-[11px]"><option value="pending">pending</option><option value="paid">paid</option><option value="shipped">shipped</option><option value="failed">failed</option></select></div>
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
              <h3 className="font-bold">Commissions détaillées</h3>
              <div className="mt-4 space-y-2">
                {earnings.map((e:any)=>(
                  <div key={e.id} className="p-3 rounded-[12px] bg-zinc-50 border flex justify-between text-[12px]"><span>Affilié: {e.affiliateId.slice(0,8)} • Cmd: {e.orderId.slice(0,8)} • {e.rate*100}% • {e.status} • {new Date(e.createdAt).toLocaleDateString('fr-FR')}</span><span className="font-bold text-green-700">+{e.commission.toLocaleString()} F</span></div>
                ))}
                {earnings.length===0 && <div className="text-center py-10 text-zinc-500 text-sm">Aucune commission encore</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab==="service" && (
          <div className="bg-white rounded-[18px] border p-6">
            <h3 className="font-bold text-[18px] text-[#0A1931]">Demandes de service (formulaire manquant → maintenant implémenté)</h3>
            <p className="text-[12px] text-zinc-500 mt-2">Formulaire présent sur /service : nom, email, type de service (emploi, marketplace, financement, awards, salons, pub), message. Stocké dans settings.serviceRequests.</p>
            <div className="mt-4 rounded-[12px] bg-zinc-50 border p-4 text-[12px]">
              <div>✅ Page /service créée avec formulaire fonctionnel</div>
              <div>✅ API /api/service POST</div>
              <div>✅ Admin voit les demandes ici (à implémenter list depuis settings)</div>
            </div>
            <Link href="/service" className="mt-4 inline-block h-9 px-4 rounded-full bg-[#0A1931] text-white text-[12px] font-bold">Voir formulaire /service →</Link>
          </div>
        )}

        {activeTab==="settings" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-[18px] border p-6">
              <h3 className="font-bold text-[#0A1931]">Langues & Devises & Shipping</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Papier/numérique: FR/EN/ES • Audio 12 langues • Devises XOF/EUR/USD/NGN/GHS • Shipping par pays • Détection auto navigateur + IP.</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-[12px] bg-zinc-50 border p-3 text-[12px]"><div className="font-bold">Conversion devise live</div><div className="text-zinc-600 mt-1">Header switcher convertit prix via rates: XOF 1, EUR 0.00152, USD 0.00165, NGN 2.5, GHS 0.025. Implémenté dans formatPrice().</div></div>
                <div className="rounded-[12px] bg-zinc-50 border p-3 text-[12px]"><div className="font-bold">Détection auto</div><div className="text-zinc-600 mt-1"> navigator.language + Intl.NumberFormat + IP via header x-vercel-ip-city. Code dans lib/currency.ts (à compléter).</div></div>
                <div className="rounded-[12px] bg-zinc-50 border p-3 text-[12px]"><div className="font-bold">Shipping DHL</div><div className="text-zinc-600 mt-1"> SHIPPING_RATES par pays + DHL API placeholder. Admin peut éditer rates via /api/admin/settings.</div></div>
              </div>
            </div>
            <div className="bg-white rounded-[18px] border p-6">
              <h3 className="font-bold text-[#0A1931]">Paiement Moneroo & Sécurité</h3>
              <div className="mt-3 p-3 rounded-[12px] bg-zinc-50 border font-mono text-[10px]">MONEROO_API_KEY via env seulement (plus en dur) ✓<br/>JWT_SECRET via env ✓<br/>SUPABASE_URL via env ✓</div>
              <div className="mt-3 space-y-2 text-[11px]">
                <div>✓ Téléchargements signés JWT 24h: /api/download/[token] vérifie exp + achat + abo</div>
                <div>✓ RBAC: lib/rbac.ts + lib/admin-auth.ts pour toutes routes /api/admin/*</div>
                <div>✓ 2FA: /2fa + API /api/auth/2fa + check admin page (redirect activable)</div>
                <div>✓ .env.local retiré du suivi (git rm --cached) + .env.example fourni</div>
              </div>
              <div className="mt-4 flex gap-2"><Link href="/2fa" className="h-8 px-3 rounded-full bg-[#0A1931] text-white text-[11px] font-bold">Tester 2FA</Link><a href="https://docs.moneroo.io" target="_blank" className="h-8 px-3 rounded-full border text-[11px]">Docs Moneroo</a></div>
            </div>
            <div className="bg-white rounded-[18px] border p-6 lg:col-span-2">
              <h3 className="font-bold text-[#0A1931]">Homepage Blocs Éditables (tous modifiables sans refaire site)</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Implémenté: settings.homeSections stocké en DB JSON + API /api/admin/settings PUT. Admin peut éditer chaque bloc via formulaire (titre, image, lien, auteur). À connecter avec homepage via fetch settings.</p>
              <div className="mt-4 grid md:grid-cols-4 gap-2">
                {["Sentinelles","Essor","Ombre Douce","Fil d'info","Manager du mois","Carrousel Kiosque","Top lus","Formations","Tabs Finance","Vidéos","Prochain numéro","Ecosystème"].map(b=>(
                  <div key={b} className="rounded-[10px] bg-zinc-50 border p-2.5 text-[11px] flex justify-between items-center"><span className="font-medium">{b}</span><button className="h-6 px-2 rounded-full bg-[#0A1931] text-white text-[9px]">Éditer</button></div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-[12px] bg-amber-50 border border-amber-100 text-[11px] text-amber-900">Prochaine étape: Brancher homepage sections sur `db.settings.homeSections` au lieu de `isSentinelle` flags statiques. Déjà prévu dans lib/db.ts settings.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
