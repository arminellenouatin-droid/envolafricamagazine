"use client";
import { useState } from "react";
import Link from "next/link";

export default function ServicePage() {
  const [form, setForm] = useState({ nom:"", email:"", service:"emploi", message:"" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/service", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setSent(true); setForm({ nom:"", email:"", service:"emploi", message:"" }); }
    setLoading(false);
  };

  return (
    <div className="bg-[#FFFCF5] min-h-screen pb-20">
      <div className="max-w-[800px] mx-auto px-6 pt-10">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-zinc-500"><Link href="/" className="hover:text-[#0A1931]">Accueil</Link><span>›</span><span className="text-[#0A1931]">Demande de service</span></div>
        <h1 className="font-serif font-black text-[32px] text-[#0A1931] mt-4">Demande de service - Écosystème Envol Africa</h1>
        <p className="text-[15px] text-zinc-600 mt-2 leading-6">Un seul compte pour tous les services du groupe : Emploi, Marketplace, Financement participatif, Africa Awards, Salons, World Africa Business, Régie pub. Remplissez ce formulaire, notre équipe vous recontacte en 24h.</p>

        {sent ? (
          <div className="mt-8 bg-green-600 text-white rounded-[20px] p-6">
            <div className="font-bold text-[18px]">✓ Demande envoyée !</div>
            <p className="text-[14px] mt-2 text-white/90">Merci, nous avons bien reçu votre demande. Vérifiez vos emails, un membre de l'équipe Envol Africa vous contacte sous 24h.</p>
            <button onClick={()=>setSent(false)} className="mt-4 h-10 px-5 rounded-full bg-white text-green-700 font-bold text-[13px]">Envoyer une autre demande</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 bg-white rounded-[24px] border border-zinc-100 p-6 md:p-8 space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div><label className="text-[11px] font-bold uppercase tracking-wide text-zinc-600">Nom complet</label><input required value={form.nom} onChange={e=>setForm({...form, nom:e.target.value})} placeholder="Quentin DAVAKAN" className="mt-1.5 w-full h-11 rounded-full border bg-zinc-50 px-5 text-[13px]" /></div>
              <div><label className="text-[11px] font-bold uppercase tracking-wide text-zinc-600">Email pro</label><input required type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="quentin@envolafrica.com" className="mt-1.5 w-full h-11 rounded-full border bg-zinc-50 px-5 text-[13px]" /></div>
            </div>
            <div><label className="text-[11px] font-bold uppercase tracking-wide text-zinc-600">Service demandé</label><select value={form.service} onChange={e=>setForm({...form, service:e.target.value})} className="mt-1.5 w-full h-11 rounded-full border bg-zinc-50 px-5 text-[13px]"><option value="emploi">Envol Emploi - Recrutement / Offre d'emploi</option><option value="marketplace">Marketplace - Vendre / Acheter produits africains</option><option value="financement">Financement Participatif - Lever des fonds</option><option value="awards">Africa Awards - Candidature / Sponsor</option><option value="salons">Salons Pro - Exposer / Participer</option><option value="wab">World Africa Business - Partenariat international</option><option value="pub">Régie Publicitaire - Kit média / Devis</option><option value="autre">Autre service</option></select></div>
            <div><label className="text-[11px] font-bold uppercase tracking-wide text-zinc-600">Votre message</label><textarea required value={form.message} onChange={e=>setForm({...form, message:e.target.value})} placeholder="Décrivez votre besoin en détail..." rows={5} className="mt-1.5 w-full rounded-[18px] border bg-zinc-50 p-4 text-[13px]" /></div>
            <button disabled={loading} className="w-full h-12 rounded-full bg-[#0A1931] text-white font-bold text-[14px] hover:bg-black disabled:opacity-60">{loading?"Envoi...":"Envoyer ma demande →"}</button>
            <div className="text-[11px] text-zinc-500 text-center">Réponse garantie en 24h ouvrées • Support dédié pour abonnés Chef d'entreprise & Soutien</div>
          </form>
        )}

        <div className="mt-10 grid md:grid-cols-3 gap-3">
          <div className="rounded-[14px] bg-white border p-4"><div className="font-bold text-[13px]">💼 Emploi</div><div className="text-[12px] text-zinc-600 mt-1">2 430 offres actives</div></div>
          <div className="rounded-[14px] bg-white border p-4"><div className="font-bold text-[13px]">🛒 Marketplace</div><div className="text-[12px] text-zinc-600 mt-1">Produits africains d'exception</div></div>
          <div className="rounded-[14px] bg-white border p-4"><div className="font-bold text-[13px]">💰 Financement</div><div className="text-[12px] text-zinc-600 mt-1">24 opportunités</div></div>
        </div>
      </div>
    </div>
  );
}
