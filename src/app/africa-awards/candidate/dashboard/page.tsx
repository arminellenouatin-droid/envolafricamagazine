"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function CandidateDashboard() {
  const [stats] = useState([
    { name: "Lun", votes: 12 },
    { name: "Mar", votes: 19 },
    { name: "Mer", votes: 33 },
    { name: "Jeu", votes: 45 },
    { name: "Ven", votes: 28 },
    { name: "Sam", votes: 52 },
    { name: "Dim", votes: 38 },
  ]);

  const [badges] = useState([
    { code:"first_voter", name:"Premier Voteur", emoji:"🔥", earned:true },
    { code:"top_fan", name:"Top Fan", emoji:"🥇", earned:true },
    { code:"super_donor", name:"Super Donateur", emoji:"💎", earned:false },
    { code:"ambassador", name:"Ambassadeur", emoji:"👑", earned:false },
  ]);

  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-black" style={{ fontFamily: "Fraunces" }}>Dashboard Candidat</h1>
            <p className="text-white/60 text-sm mt-1">Gérez vos performances, suivez vos dons et intervenez en direct sur scène.</p>
          </div>
          <Link
            href="/africa-awards/candidate/live/aminata-traore"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F4D976] text-black font-black text-sm shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span>Rejoindre le Live en direct</span>
            <span className="text-base">🎥</span>
          </Link>
        </div>

        {/* Bannière d'intervention Live */}
        <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#D4AF37]/20 via-[#16161D] to-black border border-[#D4AF37]/40 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-2xl">
              🎙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-black tracking-wider uppercase border border-red-500/30">
                  En Direct Maintenant
                </span>
                <span className="text-sm font-bold text-white">Gala Africa Awards 2026</span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Votre présence sur scène est attendue. Activez votre caméra selfie, surveillez vos dons et vos votes en temps réel.
              </p>
            </div>
          </div>
          <Link
            href="/africa-awards/candidate/live/aminata-traore"
            className="w-full md:w-auto px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center transition border border-white/20"
          >
            Ouvrir mon Studio Candidat →
          </Link>
        </div>
        
        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#16161D] border border-white/10 rounded-xl p-6">
              <h3 className="font-bold">Statistiques avancées - Graphiques Recharts</h3>
              <p className="text-[11px] text-[#A8A6A0] mt-1">Votes, évolution, visiteurs page, cadeaux/dons reçus, revenus générés - Graphiques temporels</p>
              <div className="mt-6 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" stroke="#A8A6A0" fontSize={11} />
                    <YAxis stroke="#A8A6A0" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor:"#16161D", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px" }} />
                    <Bar dataKey="votes" fill="#D4AF37" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#16161D] border border-white/10 rounded-xl p-6">
              <h3 className="font-bold">Profil public enrichi</h3>
              <div className="mt-4 flex items-center gap-4">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200" alt="" className="w-16 h-16 rounded-full object-cover" />
                <div><div className="font-bold">Aminata Traoré</div><div className="text-[12px] text-[#A8A6A0]">Bio, compétitions suivies, badges, niveau, statistiques façon réseau social</div></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#16161D] border border-white/10 rounded-xl p-6">
              <h4 className="font-bold text-[14px]">Badges</h4>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {badges.map((b:any)=>(
                  <div key={b.code} className={`rounded-xl p-3 text-center border ${b.earned?"bg-[#D4AF37]/10 border-[#D4AF37]/30":"bg-white/5 border-white/10 opacity-50"}`}>
                    <div className="text-[24px]">{b.emoji}</div>
                    <div className="text-[11px] font-bold mt-1">{b.name}</div>
                    <div className="text-[10px] text-[#A8A6A0]">{b.earned?"Obtenu":"À débloquer"}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#16161D] border border-white/10 rounded-xl p-6">
              <h4 className="font-bold text-[14px]">Niveau - Bronze → Diamant</h4>
              <div className="mt-4">
                <div className="flex justify-between text-[11px]"><span className="text-[#A8A6A0]">Niveau actuel</span><span className="font-bold text-[#D4AF37]">Or</span></div>
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#D4AF37] w-[65%]"></div></div>
                <div className="text-[11px] text-[#A8A6A0] mt-2">Progression selon activité - 65% vers Platine</div>
              </div>
              <div className="mt-4 text-[11px] text-[#A8A6A0]">Notification lors obtention nouveau badge/niveau - Realtime + email Resend</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
