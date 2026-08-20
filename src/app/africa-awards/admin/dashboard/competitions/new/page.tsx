"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminCreateCompetition() {
  const [form, setForm] = useState({ title:"", description:"", category:"Awards", vote_price_cents:100, points_per_vote:1, jury_weight:30, public_vote_weight:70, form_mode:"simple", registration_fee_xof:0, registrations_start_at:"", registrations_end_at:"", voting_start_at:"", voting_end_at:"", initial_prize_pool_xof:0 });
  const [registrationFields, setRegistrationFields] = useState<any[]>([]);
  const [newField, setNewField] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { form_mode, registration_fee_xof, registrations_start_at, registrations_end_at, voting_start_at, voting_end_at, initial_prize_pool_xof, ...competition } = form;
    const res = await fetch("/api/awards/competitions", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ ...competition, registration_config:{ form_mode, registration_fee_xof, registrations_start_at: registrations_start_at || null, registrations_end_at: registrations_end_at || null, voting_start_at: voting_start_at || null, voting_end_at: voting_end_at || null, initial_prize_pool_xof, min_pool_contribution_xof:100, min_donation_xof:100 }, registration_fields: registrationFields }) });
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
          <div className="border-t border-white/10 pt-4 space-y-3"><h2 className="font-bold">Configuration des inscriptions</h2><div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] font-bold">Mode de formulaire</label><select value={form.form_mode} onChange={e=>setForm({...form, form_mode:e.target.value})} className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]"><option value="simple">Simple</option><option value="entrepreneurship">Entrepreneuriat détaillé</option></select></div><div><label className="text-[11px] font-bold">Frais d’inscription (XOF)</label><input type="number" min={0} value={form.registration_fee_xof} onChange={e=>setForm({...form, registration_fee_xof:Math.max(0, Number(e.target.value))})} className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] font-bold">Ouverture inscriptions</label><input type="datetime-local" value={form.registrations_start_at} onChange={e=>setForm({...form, registrations_start_at:e.target.value})} className="mt-1 w-full h-11 rounded-xl bg-[#0B0B0F] border border-white/10 px-3 text-[12px]" /></div><div><label className="text-[11px] font-bold">Clôture inscriptions</label><input type="datetime-local" value={form.registrations_end_at} onChange={e=>setForm({...form, registrations_end_at:e.target.value})} className="mt-1 w-full h-11 rounded-xl bg-[#0B0B0F] border border-white/10 px-3 text-[12px]" /></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] font-bold">Ouverture votes</label><input type="datetime-local" value={form.voting_start_at} onChange={e=>setForm({...form, voting_start_at:e.target.value})} className="mt-1 w-full h-11 rounded-xl bg-[#0B0B0F] border border-white/10 px-3 text-[12px]" /></div><div><label className="text-[11px] font-bold">Clôture votes</label><input type="datetime-local" value={form.voting_end_at} onChange={e=>setForm({...form, voting_end_at:e.target.value})} className="mt-1 w-full h-11 rounded-xl bg-[#0B0B0F] border border-white/10 px-3 text-[12px]" /></div></div><div><label className="text-[11px] font-bold">Cagnotte initiale (XOF)</label><input type="number" min={0} value={form.initial_prize_pool_xof} onChange={e=>setForm({...form, initial_prize_pool_xof:Math.max(0, Number(e.target.value))})} className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div><div className="flex gap-2"><input value={newField} onChange={e=>setNewField(e.target.value)} placeholder="Champ supplémentaire" className="flex-1 h-10 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[12px]" /><button type="button" onClick={()=>{if(newField.trim()){setRegistrationFields([...registrationFields,{field_key:newField.trim().toLowerCase().replace(/[^a-z0-9]+/g,"_"),label:newField.trim(),field_type:"text",is_required:false}]);setNewField("");}}} className="px-4 rounded-full border border-white/10 text-[12px]">Ajouter</button></div>{registrationFields.map((field,index)=><div key={field.field_key} className="text-[12px] text-[#A8A6A0]">{field.label}<button type="button" onClick={()=>setRegistrationFields(registrationFields.filter((_,i)=>i!==index))} className="ml-2 text-red-300">Retirer</button></div>)}</div>
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
