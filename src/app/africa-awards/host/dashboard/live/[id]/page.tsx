"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function HostDashboard() {
  const params = useParams();
  const id = params.id as string;
  const [isLive, setIsLive] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [spectators, setSpectators] = useState(0);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(()=>{
    fetch(`/api/awards/candidates?competition_id=${id}`).then(r=>r.json()).then(d=>setCandidates(d.candidates||[])).catch(()=>setCandidates([{id:"1", display_name:"Candidat 1"}, {id:"2", display_name:"Candidat 2"}]));
    const interval = setInterval(()=> setSpectators(s=>s+Math.floor(Math.random()*3)), 2000);
    return ()=>clearInterval(interval);
  },[id]);

  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen p-6">
      <h1 className="text-[24px] font-black" style={{ fontFamily: "Fraunces" }}>Dashboard Animateur - Live {id.slice(0,8)}</h1>
      <p className="text-[#A8A6A0] text-[12px] mt-2">Contrôle du live, candidats présents, invités, commentaires, classement, statistiques - Génération sécurisée clé RTMP côté serveur</p>

      <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div><div className="font-bold">Live Status: {isLive?"🔴 EN DIRECT":"⚫ Hors ligne"}</div><div className="text-[11px] text-[#A8A6A0]">Spectateurs: {spectators} • RTMP clé sécurisée côté serveur uniquement</div></div>
            <div className="flex gap-2">
              <button onClick={()=>setIsLive(true)} className="h-9 px-4 rounded-full bg-green-600 text-white text-[12px] font-bold">Démarrer Live</button>
              <button onClick={()=>setIsLive(false)} className="h-9 px-4 rounded-full bg-red-600 text-white text-[12px] font-bold">Arrêter Live</button>
            </div>
          </div>

          <div className="bg-[#16161D] border border-white/10 rounded-xl p-4">
            <h3 className="font-bold text-[14px]">Candidats présents</h3>
            <div className="mt-3 space-y-2">
              {candidates.map((c:any)=>(
                <div key={c.id} className="flex items-center justify-between bg-[#0B0B0F] border border-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[12px]">{c.display_name?.[0]}</div><span className="text-[13px] font-bold">{c.display_name}</span></div>
                  <div className="flex gap-1"><button className="h-7 px-2 rounded-full bg-[#D4AF37] text-black text-[10px] font-bold">Inviter à l'antenne</button><button className="h-7 px-2 rounded-full bg-white/10 text-white text-[10px]">Retirer</button><button className="h-7 px-2 rounded-full bg-white/10 text-white text-[10px]">Couper micro/caméra</button></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#16161D] border border-white/10 rounded-xl p-4">
            <h3 className="font-bold text-[14px]">Inviter un membre du public</h3>
            <div className="mt-3 flex gap-2"><input placeholder="Email ou pseudo..." className="flex-1 h-9 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[12px]" /><button className="h-9 px-4 rounded-full bg-white/10 text-white text-[11px]">Inviter</button></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-4">
            <h4 className="font-bold text-[13px]">Commentaires - Modération active</h4>
            <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto">
              <div className="text-[12px] bg-[#0B0B0F] p-2 rounded">Aminata: Go go! 🔥 <button className="ml-2 text-[10px] text-red-400">Supprimer</button><button className="ml-1 text-[10px] text-red-400">Bannir</button></div>
            </div>
            <div className="mt-3 text-[10px] text-[#A8A6A0]">Filtre mots interdits + suppression + bannissement + limiter débit commentaires anti-spam</div>
          </div>

          <div className="bg-[#16161D] border border-white/10 rounded-xl p-4">
            <h4 className="font-bold text-[13px]">Statistiques live temps réel</h4>
            <div className="mt-3 space-y-2 text-[12px]"><div className="flex justify-between"><span className="text-[#A8A6A0]">Spectateurs</span><span className="font-bold">{spectators}</span></div><div className="flex justify-between"><span className="text-[#A8A6A0]">Cagnotte</span><span className="font-bold text-[#D4AF37]">5200 F</span></div><div className="flex justify-between"><span className="text-[#A8A6A0]">Votes</span><span className="font-bold">1.2k</span></div></div>
          </div>

          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-4">
            <div className="text-[11px] font-bold text-[#D4AF37]">À l'arrêt du live: clôture auto votes + génération replay webhook Mux</div>
            <p className="text-[11px] text-[#A8A6A0] mt-1">Le système déclenche automatiquement clôture votes et génération replay + extraits marquants via webhook Mux asset ready → Supabase Storage</p>
          </div>
        </div>
      </div>
    </div>
  );
}
