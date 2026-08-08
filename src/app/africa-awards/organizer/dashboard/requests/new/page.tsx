"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCompetitionRequest() {
  const [form, setForm] = useState({ category:"Awards", title:"", description:"", proposed_rules:"", proposed_rewards:"", organization:"" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/awards/requests", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) {
      alert("Demande soumise avec succès - statut: Demande soumise - en attente validation admin");
      router.push("/africa-awards/organizer/dashboard/requests");
    } else {
      alert(data.error || "Erreur");
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[720px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Fraunces" }}>Soumettre une demande de compétition</h1>
        <p className="text-[#A8A6A0] text-[13px] mt-2">Seul l'administrateur peut créer et lancer une compétition. Vous ne pouvez que soumettre une demande. Aucun bouton "Créer une compétition" n'existe pour votre rôle - test 403 si tentative directe API.</p>
        
        <form onSubmit={submit} className="mt-8 bg-[#16161D] border border-white/10 rounded-[16px] p-6 space-y-4">
          <div><label className="text-[11px] font-bold uppercase tracking-wider">Catégorie *</label><select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]"><option>Awards</option><option>Miss</option><option>Talent Show</option><option>Chant</option><option>Danse</option><option>Startup</option><option>Culture</option><option>Sport</option><option>Innovation</option><option>Entrepreneuriat</option></select></div>
          <div><label className="text-[11px] font-bold uppercase tracking-wider">Titre *</label><input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required placeholder="Africa Awards - Miss Côte d'Ivoire 2026" className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div>
          <div><label className="text-[11px] font-bold uppercase tracking-wider">Description</label><textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} rows={4} placeholder="Décrivez votre compétition..." className="mt-1 w-full rounded-[12px] bg-[#0B0B0F] border border-white/10 p-4 text-[13px]" /></div>
          <div><label className="text-[11px] font-bold uppercase tracking-wider">Règlement proposé</label><textarea value={form.proposed_rules} onChange={e=>setForm({...form, proposed_rules:e.target.value})} rows={3} placeholder="Règlement souhaité..." className="mt-1 w-full rounded-[12px] bg-[#0B0B0F] border border-white/10 p-4 text-[13px]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] font-bold uppercase">Récompenses envisagées</label><input value={form.proposed_rewards} onChange={e=>setForm({...form, proposed_rewards:e.target.value})} placeholder="Trophée, Cagnotte 2M F" className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div>
            <div><label className="text-[11px] font-bold uppercase">Organisation</label><input value={form.organization} onChange={e=>setForm({...form, organization:e.target.value})} placeholder="Mon entreprise / ONG" className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div>
          </div>
          <button disabled={loading} className="w-full h-12 rounded-full bg-[#D4AF37] text-black font-bold text-[14px] hover:bg-[#F4D976] disabled:opacity-50">{loading?"Envoi...":"Soumettre ma demande →"}</button>
          <p className="text-[11px] text-[#A8A6A0] text-center">Après soumission, statut visible "Demande soumise", non modifiable. Notification auto changement statut validée/refusée + motif.</p>
        </form>
      </div>
    </div>
  );
}
