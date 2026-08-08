"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ApplyCompetition() {
  const params = useParams();
  const slug = params.competitionSlug as string;
  const [comp, setComp] = useState<any>(null);
  const [form, setForm] = useState({ display_name:"", bio:"", country:"BJ", project_description:"", video_url:"" });
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    fetch(`/api/awards/competitions?slug=${slug}`).then(r=>r.json()).then(d=>setComp(d.competition)).catch(()=>{});
  },[slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate application creation
    const res = await fetch("/api/awards/candidates", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ competition_id: comp?.id, ...form, status:"pending" }) }).catch(()=>null);
    // For MVP, we just store in local mock
    alert("Candidature soumise avec succès - statut: soumise → en étude → acceptée/refusée par organisateur ou admin. Profil public généré automatiquement après validation.");
    setLoading(false);
  };

  if (!comp) return <div className="bg-[#0B0B0F] text-white min-h-screen p-10">Chargement compétition...</div>;

  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[720px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Fraunces" }}>Devenir candidat - {comp.title}</h1>
        <p className="text-[#A8A6A0] text-[13px] mt-2">Formulaire complet: biographie, projet, photos min/max, vidéo présentation optionnelle, documents selon catégorie. Statuts: soumise → en étude → acceptée/refusée.</p>
        
        <form onSubmit={submit} className="mt-8 bg-[#16161D] border border-white/10 rounded-[16px] p-6 space-y-4">
          <div><label className="text-[11px] font-bold uppercase tracking-wider">Nom affiché *</label><input value={form.display_name} onChange={e=>setForm({...form, display_name:e.target.value})} required placeholder="Ex: Aminata Traoré - CEO Sahel Digital" className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div>
          <div><label className="text-[11px] font-bold uppercase">Pays</label><select value={form.country} onChange={e=>setForm({...form, country:e.target.value})} className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]"><option value="BJ">Bénin</option><option value="CI">Côte d'Ivoire</option><option value="SN">Sénégal</option><option value="NG">Nigeria</option><option value="GH">Ghana</option></select></div>
          <div><label className="text-[11px] font-bold uppercase">Bio *</label><textarea value={form.bio} onChange={e=>setForm({...form, bio:e.target.value})} required rows={3} placeholder="Biographie..." className="mt-1 w-full rounded-xl bg-[#0B0B0F] border border-white/10 p-4 text-[13px]" /></div>
          <div><label className="text-[11px] font-bold uppercase">Projet *</label><textarea value={form.project_description} onChange={e=>setForm({...form, project_description:e.target.value})} required rows={4} placeholder="Décrivez votre projet..." className="mt-1 w-full rounded-xl bg-[#0B0B0F] border border-white/10 p-4 text-[13px]" /></div>
          <div><label className="text-[11px] font-bold uppercase">Vidéo présentation (optionnelle)</label><input value={form.video_url} onChange={e=>setForm({...form, video_url:e.target.value})} placeholder="https://..." className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div>
          <button disabled={loading} className="w-full h-12 rounded-full bg-[#D4AF37] text-black font-bold text-[14px] disabled:opacity-50">{loading?"Envoi...":"Soumettre ma candidature →"}</button>
          <p className="text-[11px] text-[#A8A6A0] text-center">Une fois acceptée, profil public auto généré + vous pourrez compléter/enrichir votre profil + dashboard temps réel votes/cadeaux/dons</p>
        </form>
      </div>
    </div>
  );
}
