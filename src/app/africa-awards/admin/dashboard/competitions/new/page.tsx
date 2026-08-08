"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminCreateCompetition() {
  const [form, setForm] = useState({ title:"", description:"", category:"Awards", vote_price_cents:100, points_per_vote:1, jury_weight:30, public_vote_weight:70 });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/awards/competitions", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) {
      alert("Compétition créée (ADMIN UNIQUEMENT) - slug: "+data.competition.slug);
      router.push(`/africa-awards/competitions/${data.competition.slug}`);
    } else {
      alert(data.error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[720px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Fraunces" }}>Admin - Création compétition (ADMIN UNIQUEMENT)</h1>
        <p className="text-[#A8A6A0] text-[12px] mt-2">Règle absolue gouvernance: seul Administrateur peut créer/lancer une compétition. Aucun autre rôle (Organisateur inclus) n'a bouton/endpoint/RLS pour créer/publier. Organisateur que demande. Vérifié dans RLS, API, UI, tests.</p>
        
        <form onSubmit={submit} className="mt-8 bg-[#16161D] border border-white/10 rounded-xl p-6 space-y-4">
          <div><label className="text-[11px] font-bold uppercase">Titre *</label><input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required placeholder="Africa Awards Édition 2026" className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div>
          <div><label className="text-[11px] font-bold uppercase">Description</label><textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} rows={3} className="mt-1 w-full rounded-xl bg-[#0B0B0F] border border-white/10 p-4 text-[13px]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] font-bold">Catégorie</label><select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]"><option>Awards</option><option>Miss</option><option>Talent Show</option><option>Startup</option></select></div>
            <div><label className="text-[11px] font-bold">Prix vote (centimes XOF)</label><input type="number" value={form.vote_price_cents} onChange={e=>setForm({...form, vote_price_cents: parseInt(e.target.value)})} className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[11px] font-bold">Points/vote</label><input type="number" value={form.points_per_vote} onChange={e=>setForm({...form, points_per_vote: parseInt(e.target.value)})} className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div>
            <div><label className="text-[11px] font-bold">Jury %</label><input type="number" value={form.jury_weight} onChange={e=>setForm({...form, jury_weight: parseInt(e.target.value), public_vote_weight: 100-parseInt(e.target.value)})} className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div>
            <div><label className="text-[11px] font-bold">Public %</label><input type="number" value={form.public_vote_weight} readOnly className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px] opacity-60" /></div>
          </div>
          <div className="text-[11px] text-[#A8A6A0]">Pondération jury+public doit sommer à 100 (testée côté API)</div>
          <button disabled={loading} className="w-full h-12 rounded-full bg-[#D4AF37] text-black font-bold text-[14px] disabled:opacity-50">{loading?"Création...":"Créer compétition (ADMIN SEULEMENT) →"}</button>
        </form>
      </div>
    </div>
  );
}
