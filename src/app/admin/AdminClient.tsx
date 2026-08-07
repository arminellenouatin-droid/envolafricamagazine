"use client";
import { useState } from "react";
import Link from "next/link";

export default function AdminDashboardClient({ user, stats, db }: { user: any, stats: any, db: any }) {
  const [activeTab, setActiveTab] = useState<"overview"|"articles"|"magazines"|"users"|"orders"|"affiliate"|"settings">("overview");
  const [articles, setArticles] = useState(db.articles);
  const [magazines, setMagazines] = useState(db.magazines);
  const [users, setUsers] = useState(db.users);
  const [orders] = useState(db.orders);
  const [earnings] = useState(db.affiliateEarnings);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      <div className="bg-[#0A1931] text-white">
        <div className="max-w-[1440px] mx-auto px-6 xl:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center"><span className="text-[#0A1931] font-black">E</span><span className="text-[#D4AF37] font-black -ml-0.5">A</span></div>
            <div><div className="font-bold text-[15px]">Envol Africa Admin</div><div className="text-[12px] text-zinc-400">Rédaction • Connecté en tant que {user.role} • {user.prenom} {user.nom}</div></div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="h-9 px-4 rounded-full bg-white/10 border border-white/15 text-[12px] font-medium flex items-center gap-2">← Retour site</Link>
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
            { id:"settings", label:"Réglages" },
          ].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id as any)} className={`px-4 py-3 text-[13px] font-medium border-b-2 whitespace-nowrap ${activeTab===t.id ? "border-[#D4AF37] text-white" : "border-transparent text-zinc-400 hover:text-white"}`}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 xl:px-8 pt-8">
        {activeTab==="overview" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[11px] uppercase font-bold text-zinc-500">Revenu total</div><div className="font-black text-[22px] text-[#0A1931] mt-1">{stats.totalRevenue.toLocaleString()} F CFA</div><div className="text-[11px] text-green-600 mt-1">+12% ce mois</div></div>
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[11px] uppercase font-bold text-zinc-500">Commandes payées</div><div className="font-black text-[22px] text-[#0A1931] mt-1">{stats.paidOrders} / {stats.orders}</div><div className="text-[11px] text-zinc-500 mt-1">Taux conv. 67%</div></div>
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[11px] uppercase font-bold text-zinc-500">Abonnés actifs</div><div className="font-black text-[22px] text-[#0A1931] mt-1">{stats.subscribers}</div><div className="text-[11px] text-zinc-500 mt-1">{stats.users} utilisateurs totaux</div></div>
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[11px] uppercase font-bold text-zinc-500">Gains affiliation</div><div className="font-black text-[22px] text-[#0A1931] mt-1">{stats.affiliateEarnings.toLocaleString()} F</div><div className="text-[11px] text-zinc-500 mt-1">À reverser</div></div>
            </div>

            <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
              <div className="bg-white rounded-[18px] border p-6">
                <h3 className="font-bold text-[#0A1931]">Dernières commandes</h3>
                <div className="mt-4 space-y-2">
                  {orders.slice(0,6).map((o:any)=>(
                    <div key={o.id} className="flex justify-between items-center p-3 rounded-[12px] bg-zinc-50 border text-[13px]"><span>{o.id.slice(0,8)} • {o.total.toLocaleString()} {o.currency} • {o.status}</span><span className="text-[11px] text-zinc-500">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[18px] border p-6">
                <h3 className="font-bold text-[#0A1931]">Sécurité & conformité</h3>
                <div className="mt-4 space-y-3 text-[12px]">
                  <div className="flex gap-2"><span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center">✓</span><span><strong>Mur payant serveur</strong> • Le contenu complet n'est jamais envoyé sans abonnement</span></div>
                  <div className="flex gap-2"><span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center">✓</span><span><strong>Moneroo</strong> • Aucune donnée bancaire stockée • Vérification webhook</span></div>
                  <div className="flex gap-2"><span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center">✓</span><span><strong>Liens expirants</strong> • PDF/audio protégés par liens 24h</span></div>
                  <div className="flex gap-2"><span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">!</span><span><strong>2FA</strong> • Requis pour l'équipe (à activer dans paramètres)</span></div>
                </div>
                <div className="mt-6 p-3 rounded-[12px] bg-[#0A1931] text-white text-[11px]"><strong>Clé Moneroo active:</strong> pvk_4lf37v|01KZ7F2SRW… • Paiements Mobile Money & Carte opérationnels</div>
              </div>
            </div>
          </div>
        )}

        {activeTab==="articles" && (
          <div className="bg-white rounded-[18px] border p-6">
            <div className="flex items-center justify-between"><h3 className="font-bold text-[18px] text-[#0A1931]">Gestion des articles</h3><button className="h-9 px-4 rounded-full bg-[#0A1931] text-white text-[12px] font-bold">+ Nouvel article</button></div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="text-[11px] uppercase tracking-wide text-zinc-500 border-b"><tr><th className="text-left py-2">Titre</th><th>Catégorie</th><th>Auteur</th><th>Vues</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody>
                  {articles.map((a:any)=>(
                    <tr key={a.id} className="border-b last:border-0"><td className="py-3 font-medium max-w-[300px] truncate">{a.title}</td><td className="text-center"><span className="px-2 py-1 rounded-full bg-zinc-100 text-[11px]">{a.category}</span></td><td>{a.author}</td><td>{a.views}</td><td><span className={`px-2 py-1 rounded-full text-[11px] ${a.isPublished ? "bg-green-50 text-green-700 border border-green-100" : "bg-amber-50 text-amber-700"}`}>{a.isPublished ? "Publié" : "Brouillon"}</span></td><td className="flex gap-1"><button className="h-7 px-2 rounded-full border text-[11px]">Éditer</button><button className="h-7 px-2 rounded-full border text-[11px]">Publier</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab==="magazines" && (
          <div className="bg-white rounded-[18px] border p-6">
            <div className="flex items-center justify-between"><h3 className="font-bold text-[18px] text-[#0A1931]">Kiosque • Gestion des numéros</h3><button className="h-9 px-4 rounded-full bg-[#0A1931] text-white text-[12px] font-bold">+ Nouveau numéro</button></div>
            <div className="mt-6 grid md:grid-cols-4 gap-4">
              {magazines.map((m:any)=>(
                <div key={m.id} className="rounded-[14px] border p-3"><img src={m.cover} alt={m.title} className="w-full aspect-[3/4] object-cover rounded-[10px]" /><div className="font-bold text-[13px] mt-2 line-clamp-2">{m.title}</div><div className="text-[11px] text-zinc-500 mt-1">N°{m.numero} • {m.year}</div><div className="mt-2 flex gap-1"><button className="h-7 flex-1 rounded-full border text-[11px]">Éditer</button><button className="h-7 flex-1 rounded-full bg-zinc-900 text-white text-[11px]">Feuilleter</button></div></div>
              ))}
            </div>
          </div>
        )}

        {activeTab==="users" && (
          <div className="bg-white rounded-[18px] border p-6">
            <h3 className="font-bold text-[18px] text-[#0A1931]">Utilisateurs & rôles</h3>
            <p className="text-[12px] text-zinc-500 mt-1">4 rôles prévus: Rédacteur (écrit), Rédacteur en Chef (valide), Gérant (modère, promos, ventes), Administrateur (tous droits, tarifs, langues, devises, sécurité).</p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="text-[11px] uppercase tracking-wide text-zinc-500 border-b"><tr><th className="text-left py-2">Nom</th><th>Email</th><th>Rôle</th><th>Abonnement</th><th>Affilié</th><th>Créé</th></tr></thead>
                <tbody>
                  {users.map((u:any)=>(
                    <tr key={u.id} className="border-b"><td className="py-2 font-medium">{u.prenom} {u.nom}</td><td>{u.email}</td><td><span className={`px-2 py-1 rounded-full text-[11px] border ${u.role==="admin" ? "bg-[#0A1931] text-white border-[#0A1931]" : "bg-zinc-100"}`}>{u.role}</span></td><td>{u.subscription?.status==="active" ? `${u.subscription.planId}` : "—"}</td><td className="font-mono text-[11px]">{u.affiliateCode}</td><td className="text-[11px] text-zinc-500">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 rounded-[12px] bg-amber-50 border border-amber-100 text-[12px] text-amber-900"><strong>Compte admin créé:</strong> DAVAKAN Quentin • yekpondafe@gmail.com • Rôle: admin • Mot de passe: 3NAtiposy@22 (hashé bcrypt). 2FA à activer.</div>
          </div>
        )}

        {activeTab==="orders" && (
          <div className="bg-white rounded-[18px] border p-6">
            <h3 className="font-bold text-[18px] text-[#0A1931]">Commandes & revenus</h3>
            <div className="mt-4 space-y-2">
              {orders.map((o:any)=>(
                <div key={o.id} className="p-4 rounded-[12px] bg-zinc-50 border flex items-center justify-between text-[13px]">
                  <div><div className="font-bold">{o.id} • {o.total.toLocaleString()} {o.currency} • {o.status}</div><div className="text-[11px] text-zinc-500 mt-1">User: {o.userId} • Affilié: {o.affiliateCode || "—"} • {new Date(o.createdAt).toLocaleString('fr-FR')}</div><div className="text-[11px] mt-1">{o.items.map((i:any)=>i.type).join(', ')}</div></div>
                  <div className="flex gap-1"><button className="h-8 px-3 rounded-full bg-white border text-[11px]">Facture</button><button className="h-8 px-3 rounded-full bg-[#0A1931] text-white text-[11px]">Marquer expédié</button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab==="affiliate" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[11px] uppercase font-bold text-zinc-500">Total commissions</div><div className="font-black text-[20px] mt-1">{earnings.reduce((s:any,e:any)=>s+e.commission,0).toLocaleString()} F</div></div>
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[11px] uppercase font-bold text-zinc-500">À payer (≥150k)</div><div className="font-black text-[20px] mt-1">{earnings.filter((e:any)=>e.status==="available").reduce((s:any,e:any)=>s+e.commission,0).toLocaleString()} F</div></div>
              <div className="bg-white rounded-[16px] border p-5"><div className="text-[11px] uppercase font-bold text-zinc-500">Taux moyen</div><div className="font-black text-[20px] mt-1">{earnings.length ? Math.round(earnings.reduce((s:any,e:any)=>s+e.rate,0)/earnings.length*100) : 0}%</div></div>
            </div>
            <div className="bg-white rounded-[18px] border p-6">
              <h3 className="font-bold">Commissions</h3>
              <div className="mt-4 space-y-2">
                {earnings.map((e:any)=>(
                  <div key={e.id} className="p-3 rounded-[12px] bg-zinc-50 border flex justify-between text-[13px]"><span>Affilié: {e.affiliateId.slice(0,8)} • Cmd: {e.orderId.slice(0,8)} • {e.rate*100}% • {e.status}</span><span className="font-bold">{e.commission.toLocaleString()} F</span></div>
                ))}
                {earnings.length===0 && <div className="text-center py-10 text-zinc-500 text-sm">Aucune commission encore</div>}
              </div>
              <div className="mt-6 p-4 rounded-[12px] bg-[#0A1931] text-white text-[12px]">Règles: 10% si non abonné au moment de la vente, 25% si abonné. Visible en temps réel. Retrait dès 150 000 F CFA par Mobile Money ou virement. Formulaire de demande de retrait à implémenter.</div>
            </div>
          </div>
        )}

        {activeTab==="settings" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-[18px] border p-6">
              <h3 className="font-bold text-[#0A1931]">Langues & devises</h3>
              <p className="text-[12px] text-zinc-500 mt-1">Papier & numérique: FR/EN/ES • Audio: 12 langues (FR, EN, ES, SW, HA, YO, IG, FON, FF, ZU, EE-Mina, WO). Devises: XOF, EUR, USD, NGN, GHS avec détection auto.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                <div className="rounded-[12px] bg-zinc-50 border p-3"><div className="font-bold">Détection auto</div><div className="text-zinc-600 mt-1">Langue via navigateur + pays via IP → devise locale</div></div>
                <div className="rounded-[12px] bg-zinc-50 border p-3"><div className="font-bold">Tarifs</div><div className="text-zinc-600 mt-1">Prix affichés auto dans monnaie du pays</div></div>
              </div>
            </div>
            <div className="bg-white rounded-[18px] border p-6">
              <h3 className="font-bold text-[#0A1931]">Paiement Moneroo</h3>
              <div className="mt-3 p-3 rounded-[12px] bg-zinc-50 border font-mono text-[11px]">MONEROO_API_KEY=pvk_4lf37v|01KZ7F2SRWWFQ70JCRASB8YHEC</div>
              <p className="text-[12px] text-zinc-600 mt-3">Solution pensée pour l'Afrique, Mobile Money (MTN, Orange, Moov, Wave) + Carte. Aucune donnée bancaire stockée. Vérification via GET /v1/payments/{"{id}"}/verify. Webhook à configurer.</p>
              <div className="mt-4 flex gap-2"><button className="h-9 px-4 rounded-full bg-[#0A1931] text-white text-[12px] font-bold">Tester le paiement</button><button className="h-9 px-4 rounded-full border text-[12px]">Voir docs Moneroo</button></div>
            </div>

            <div className="bg-white rounded-[18px] border p-6 lg:col-span-2">
              <h3 className="font-bold text-[#0A1931]">Homepage • Blocs éditables</h3>
              <p className="text-[12px] text-zinc-500 mt-1">Tous les blocs (Sentinelles, Essor, Ombre Douce, Fil d'info, Carrousel, Formations, Vidéos, Ecosystem) sont modifiables depuis cette interface sans refaire le site — via un formulaire simple (titre, image, lien, auteur).</p>
              <div className="mt-4 grid md:grid-cols-4 gap-3">
                {["Sentinelles","Essor","Ombre Douce","Fil d'info","Manager du mois","Carrousel Kiosque","Top lus","Formations","Tabs Finance","Vidéos","Prochain numéro","Ecosystème"].map(b=>(
                  <div key={b} className="rounded-[12px] bg-zinc-50 border p-3 text-[12px] flex justify-between items-center"><span className="font-medium">{b}</span><button className="h-6 px-2 rounded-full bg-white border text-[10px]">Éditer</button></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
