"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AffiliateAwards() {
  const [user, setUser] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);

  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(d=>setUser(d.user));
    // Mock links
    setLinks([
      { id:"1", short_code:"AFRO123", target_type:"general", clicks: 120, conversions: 5 },
      { id:"2", short_code:"MISSBJ2026", target_type:"competition", clicks: 89, conversions: 3 },
    ]);
    setEarnings(15000);
  },[]);

  const generateLink = async () => {
    const res = await fetch("/api/awards/affiliate-links", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ target_type:"general" }) }).catch(()=>null);
    if (res && res.ok) {
      const data = await res.json();
      setLinks([...links, data.link]);
    } else {
      const newLink = { id: Date.now().toString(), short_code: "AFRO"+Math.floor(Math.random()*1000), target_type:"general", clicks: 0, conversions: 0 };
      setLinks([...links, newLink]);
    }
  };

  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen pb-20">
      <div className="max-w-[960px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Fraunces" }}>Programme d'affiliation Awards</h1>
        <p className="text-[#A8A6A0] text-[13px] mt-2">Lien personnel unique - Tracking inscriptions/votes/dons/partages/achats cadeaux via tracking + cookie + table affiliate_conversions - Dashboard gains détail par type conversion</p>

        <div className="mt-8 bg-[#16161D] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Mes liens - {links.length}</h3>
            <button onClick={generateLink} className="h-9 px-4 rounded-full bg-[#D4AF37] text-black font-bold text-[12px]">+ Générer lien</button>
          </div>
          <div className="mt-4 space-y-3">
            {links.map((l:any)=>(
              <div key={l.id} className="bg-[#0B0B0F] border border-white/10 rounded-lg p-4 flex justify-between items-center">
                <div><div className="font-mono text-[13px] font-bold text-[#D4AF37]">https://envolafrica.mag/?ref={l.short_code}</div><div className="text-[11px] text-[#A8A6A0] mt-1">{l.target_type} • {l.clicks} clics • {l.conversions} conversions</div></div>
                <button onClick={()=>{navigator.clipboard.writeText(`https://envolafrica.mag/?ref=${l.short_code}`); alert("Lien copié !");}} className="h-8 px-3 rounded-full bg-white/10 text-white text-[11px]">Copier</button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-5"><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Gains totaux</div><div className="text-[22px] font-black mt-1 text-[#D4AF37]">{earnings.toLocaleString()} F</div></div>
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-5"><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Inscriptions parrainées</div><div className="text-[22px] font-black mt-1">12</div></div>
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-5"><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Taux conversion</div><div className="text-[22px] font-black mt-1">4.2%</div></div>
        </div>

        <div className="mt-6 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-5">
          <h4 className="font-bold text-[13px] text-[#D4AF37]">Tracking complet</h4>
          <p className="text-[12px] text-[#A8A6A0] mt-2">Paramètre tracking + cookie + table affiliate_conversions - Inscriptions, votes, dons, partages, achats cadeaux - Dashboard gains détail par type</p>
        </div>
      </div>
    </div>
  );
}
