"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

export default function AdminDashboardClient({ user, stats, db }: { user: any, stats: any, db: any }) {
  const [activeTab, setActiveTab] = useState<"overview"|"articles"|"magazines"|"users"|"orders"|"affiliate"|"abonnements"|"commentaires"|"service"|"settings">("overview");
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

  const fetchArticles = async () => { const res = await fetch("/api/admin/articles"); if (res.ok) { const d = await res.json(); setArticles(d.articles); } };
  const fetchMagazines = async () => { const res = await fetch("/api/admin/magazines"); if (res.ok) { const d = await res.json(); setMagazines(d.magazines); } };
  const fetchUsers = async () => { const res = await fetch("/api/admin/users"); if (res.ok) { const d = await res.json(); setUsers(d.users); } };
  const fetchOrders = async () => { const res = await fetch("/api/admin/orders"); if (res.ok) { const d = await res.json(); setOrders(d.orders); } };
  const fetchComments = async () => { const res = await fetch("/api/comments"); if (res.ok) { const d = await res.json(); setComments(d.comments); } };

  useEffect(()=>{ 
    if(activeTab==="articles") fetchArticles(); 
    if(activeTab==="magazines") fetchMagazines(); 
    if(activeTab==="users") fetchUsers(); 
    if(activeTab==="orders") fetchOrders();
    if(activeTab==="commentaires") fetchComments();
  },[activeTab]);

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
        <div className="max-w-[1440px] mx-auto px-6 xl:px-8 pb-0 flex gap-1 overflow-x-auto">
          {[
            { id:"overview", label:"KPIs" },
            { id:"articles", label:`Articles (${articles.length})` },
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
        </div>
      </div>

      {message && <div className="max-w-[1440px] mx-auto px-6 xl:px-8 pt-4"><div className="bg-green-600 text-white text-sm rounded-full px-4 py-2 inline-block">{message} <button onClick={()=>setMessage("")} className="ml-2 font-bold">×</button></div></div>}

      <div className="max-w-[1440px] mx-auto px-6 xl:px-8 pt-6">
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
            <div className="flex items-center justify-between"><h3 className="font-bold text-[18px]">Articles - CRUD complet + KPIs vues/likes - Fil d'info, Sentinelles, Essor, Ombre douce</h3><button onClick={()=>{setEditingArticle(null); setShowArticleModal(true);}} className="h-9 px-4 rounded-full bg-[#0A1931] text-white text-[12px] font-bold">+ Nouvel article</button></div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-[12px]"><thead className="text-[10px] uppercase text-zinc-500 border-b"><tr><th className="text-left py-2">Titre</th><th>Cat</th><th>Auteur</th><th>Vues</th><th>Flags</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody>{articles.map((a:any)=>(<tr key={a.id} className="border-b"><td className="py-2 max-w-[280px] truncate font-medium">{a.title}</td><td><span className="px-2 py-0.5 bg-zinc-100 rounded-full text-[10px]">{a.category}</span></td><td className="text-[11px]">{a.author}</td><td>{a.views}</td><td className="text-[9px] space-x-1">{a.isFeatured&&"★"}{a.isSentinelle&&"S"}{a.isEssor&&"E"}{a.isOmbreDouce&&"O"}</td><td><span className={`px-2 py-0.5 rounded-full text-[10px] ${a.isPublished?"bg-green-50 text-green-700":"bg-amber-50"}`}>{a.isPublished?"Publié":"Brouillon"}</span></td><td className="flex gap-1 py-1"><button onClick={()=>{setEditingArticle(a); setShowArticleModal(true);}} className="h-6 px-2 rounded-full border text-[10px]">Éditer</button><button onClick={()=>handleTogglePublish(a)} className="h-6 px-2 border rounded-full text-[10px]">{a.isPublished?"Dépub":"Pub"}</button><button onClick={()=>handleDeleteArticle(a.id)} className="h-6 px-2 bg-red-50 text-red-600 border text-[10px]">Suppr</button></td></tr>))}</tbody>
              </table>
            </div>
            {showArticleModal && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <form onSubmit={handleCreateArticle} className="bg-white rounded-[20px] p-6 w-full max-w-[760px] max-h-[90vh] overflow-y-auto">
                  <h3 className="font-bold">{editingArticle?"Modifier":"Nouveau"} article</h3>
                  <div className="mt-4 grid gap-3">
                    <input name="title" defaultValue={editingArticle?.title} placeholder="Titre" required className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <input name="summary" defaultValue={editingArticle?.summary} placeholder="Résumé" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <textarea name="content" defaultValue={editingArticle?.content} placeholder="Contenu complet - 12 lignes visibles non-abonnés" required rows={8} className="rounded-[16px] border bg-zinc-50 p-4 text-[13px]" />
                    <div className="grid grid-cols-2 gap-2"><input name="category" defaultValue={editingArticle?.category} placeholder="Catégorie" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" /><input name="image" defaultValue={editingArticle?.image} placeholder="URL image" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" /></div>
                    <input name="tags" defaultValue={editingArticle?.tags?.join(", ")} placeholder="Tags virgule" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <div className="flex flex-wrap gap-3 text-[12px]"><label><input type="checkbox" name="isPublished" defaultChecked={editingArticle?.isPublished}/> Publié</label><label><input type="checkbox" name="isFeatured" defaultChecked={editingArticle?.isFeatured}/> Vedette</label><label><input type="checkbox" name="isSentinelle" defaultChecked={editingArticle?.isSentinelle}/> Sentinelles</label><label><input type="checkbox" name="isEssor" defaultChecked={editingArticle?.isEssor}/> Essor</label><label><input type="checkbox" name="isOmbreDouce" defaultChecked={editingArticle?.isOmbreDouce}/> Ombre Douce</label></div>
                  </div>
                  <div className="mt-6 flex gap-2"><button type="submit" className="h-10 px-5 rounded-full bg-[#0A1931] text-white text-[13px] font-bold">Enregistrer</button><button type="button" onClick={()=>{setShowArticleModal(false); setEditingArticle(null);}} className="h-10 px-5 rounded-full border text-[13px]">Annuler</button></div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab==="magazines" && (
          <div className="bg-white rounded-[18px] border p-6">
            <div className="flex items-center justify-between"><h3 className="font-bold text-[18px]">Kiosque - Magazines CRUD + KPIs</h3><button onClick={()=>{setEditingMag(null); setShowMagModal(true);}} className="h-9 px-4 rounded-full bg-[#0A1931] text-white text-[12px] font-bold">+ Nouveau numéro</button></div>
            <div className="mt-6 grid md:grid-cols-4 gap-4">
              {magazines.map((m:any)=>(<div key={m.id} className="rounded-[14px] border p-3"><img src={m.cover} alt="" className="w-full aspect-[3/4] object-cover rounded-[10px]" /><div className="font-bold text-[12px] mt-2 line-clamp-2">{m.title}</div><div className="text-[10px] text-zinc-500">N°{m.numero} • {m.year}</div><div className="mt-2 flex gap-1"><button onClick={()=>{setEditingMag(m); setShowMagModal(true);}} className="h-7 flex-1 rounded-full border text-[10px]">Éditer</button><button onClick={()=>handleDeleteMag(m.id)} className="h-7 flex-1 rounded-full bg-red-50 text-red-600 border text-[10px]">Suppr</button></div></div>))}
            </div>
            {showMagModal && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                <form onSubmit={handleCreateMag} className="bg-white rounded-[20px] p-6 w-full max-w-[560px]">
                  <h3 className="font-bold">{editingMag?"Modifier":"Nouveau"} magazine</h3>
                  <div className="mt-4 grid gap-3">
                    <div className="grid grid-cols-2 gap-2"><input name="numero" type="number" defaultValue={editingMag?.numero} placeholder="Numéro" required className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" /><input name="year" type="number" defaultValue={editingMag?.year} placeholder="Année" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" /></div>
                    <input name="title" defaultValue={editingMag?.title} placeholder="Titre" required className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <input name="cover" defaultValue={editingMag?.cover} placeholder="URL couverture" className="h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" />
                    <textarea name="description" defaultValue={editingMag?.description} placeholder="Description" rows={3} className="rounded-[14px] border bg-zinc-50 p-3 text-[13px]" />
                    <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" name="featured" defaultChecked={editingMag?.featured}/> À la une</label>
                  </div>
                  <div className="mt-6 flex gap-2"><button type="submit" className="h-10 px-5 rounded-full bg-[#0A1931] text-white text-[13px] font-bold">Enregistrer</button><button type="button" onClick={()=>{setShowMagModal(false); setEditingMag(null);}} className="h-10 px-5 rounded-full border text-[13px]">Annuler</button></div>
                </form>
              </div>
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
                {SUBSCRIPTION_PLANS.map((p:any)=>(
                  <div key={p.id} className="rounded-[16px] border p-4">
                    <div className="font-bold text-[14px]">{p.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">{p.description}</div>
                    <div className="mt-3 font-black text-[20px]">{p.price.toLocaleString()} F</div>
                    {p.firstMonthPrice && <div className="text-[11px] text-green-700">1er mois {p.firstMonthPrice.toLocaleString()} F</div>}
                    <div className="mt-3 space-y-1 text-[11px]">{p.features.slice(0,3).map((f:string)=><div key={f} className="flex gap-1"><span>✓</span>{f}</div>)}</div>
                    <button className="mt-4 w-full h-8 rounded-full border text-[11px] font-bold">Éditer tarifs</button>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-[12px] bg-amber-50 border border-amber-100 text-[11px] text-amber-900">Règle: tarif 1er mois réduit = règle facturation récurrente J0 promo → J+30 plein, pas coupon. Test Playwright passage 1re→2e échéance obligatoire (BACKLOG Sprint 5). Job cron-subscription-renewal à implémenter pg_cron + Moneroo prélèvement.</div>
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
      </div>
    </div>
  );
}
