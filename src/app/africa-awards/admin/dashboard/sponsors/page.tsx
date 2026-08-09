"use client";
import { useState } from "react";

export default function SponsorsAdmin() {
  const [sponsors, setSponsors] = useState([
    { id:"1", name:"Orange Money", logo:"🟠", competition:"Miss Bénin 2026", financing:"500000 F", type:"Financement" },
    { id:"2", name:"MTN", logo:"🟡", competition:"Startup Awards", financing:"Cadeaux", type:"Cadeaux" },
  ]);
  const [newSponsor, setNewSponsor] = useState({ name:"", competition:"", financing:"" });

  const addSponsor = () => {
    if (!newSponsor.name) return;
    setSponsors([...sponsors, { id: Date.now().toString(), name: newSponsor.name, logo:"🏢", competition: newSponsor.competition||"Général", financing: newSponsor.financing||"Logo", type:"Financement" }]);
    setNewSponsor({ name:"", competition:"", financing:"" });
  };

  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen pb-20">
      <div className="max-w-[960px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[24px] font-black" style={{ fontFamily: "Fraunces" }}>Sponsors & Publicité par compétition</h1>
        <p className="text-[#A8A6A0] text-[12px] mt-2">Associer sponsors (logo, lien, description) + logos affichés page compétition + overlay pendant live + espaces pub bannière/pre-roll vidéo + sponsor officiel</p>

        <div className="mt-8 bg-[#16161D] border border-white/10 rounded-xl p-6">
          <h3 className="font-bold text-[14px]">Ajouter sponsor</h3>
          <div className="mt-4 grid md:grid-cols-3 gap-3">
            <input value={newSponsor.name} onChange={e=>setNewSponsor({...newSponsor, name:e.target.value})} placeholder="Nom sponsor" className="h-10 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[12px]" />
            <input value={newSponsor.competition} onChange={e=>setNewSponsor({...newSponsor, competition:e.target.value})} placeholder="Compétition" className="h-10 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[12px]" />
            <input value={newSponsor.financing} onChange={e=>setNewSponsor({...newSponsor, financing:e.target.value})} placeholder="Financement / Cadeaux" className="h-10 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[12px]" />
          </div>
          <button onClick={addSponsor} className="mt-4 h-10 px-6 rounded-full bg-[#D4AF37] text-black font-bold text-[12px]">Ajouter sponsor</button>
        </div>

        <div className="mt-8 space-y-3">
          {sponsors.map((s:any)=>(
            <div key={s.id} className="bg-[#16161D] border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">{s.logo}</div><div><div className="font-bold text-[14px]">{s.name}</div><div className="text-[11px] text-[#A8A6A0]">{s.competition} • {s.financing} • {s.type}</div></div></div>
              <div className="flex gap-2"><button className="h-8 px-3 rounded-full bg-white/10 text-white text-[11px]">Éditer</button><button onClick={()=>setSponsors(sponsors.filter(x=>x.id!==s.id))} className="h-8 px-3 rounded-full bg-red-600/20 text-red-400 text-[11px]">Suppr</button></div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-[#16161D] border border-white/10 rounded-xl p-6">
          <h3 className="font-bold text-[14px]">Espaces publicitaires</h3>
          <div className="mt-4 grid md:grid-cols-3 gap-3 text-[12px]">
            <div className="bg-[#0B0B0F] border border-white/10 rounded-lg p-4"><div className="font-bold">Bannière</div><div className="text-[#A8A6A0] mt-1">Pendant live overlay bas</div></div>
            <div className="bg-[#0B0B0F] border border-white/10 rounded-lg p-4"><div className="font-bold">Vidéo sponsorisée</div><div className="text-[#A8A6A0] mt-1">Pendant live</div></div>
            <div className="bg-[#0B0B0F] border border-white/10 rounded-lg p-4"><div className="font-bold">Pre-roll</div><div className="text-[#A8A6A0] mt-1">Avant live</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
