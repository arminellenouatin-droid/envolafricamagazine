"use client";
import { useState } from "react";

export default function MessagesPage() {
  const [messages] = useState([
    { id:"1", from:"Admin", title:"Votre demande de compétition validée !", body:"Félicitations, votre demande Africa Awards Miss Bénin 2026 a été validée. Vous pouvez maintenant gérer vos candidats.", read:false, time:"Il y a 2h" },
    { id:"2", from:"Système", title:"Vous avez reçu un nouveau badge : Top Fan 🥇", body:"Vous avez voté plus de 10 fois, vous êtes maintenant Top Fan !", read:true, time:"Hier" },
    { id:"3", from:"Jury", title:"Notation requise", body:"Veuillez noter les candidats de la compétition Startup 2026 avant clôture délibération.", read:false, time:"Il y a 1j" },
  ]);

  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen pb-20">
      <div className="max-w-[720px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Fraunces" }}>Messagerie interne</h1>
        <p className="text-[#A8A6A0] text-[13px] mt-2">Candidats et organisateurs reçoivent messages/notifications importantes messagerie dédiée dashboard lu/non lu - Badges, niveaux, profils publics enrichis</p>
        <div className="mt-8 space-y-3">
          {messages.map((m:any)=>(
            <div key={m.id} className={`bg-[#16161D] border rounded-xl p-5 ${!m.read?"border-[#D4AF37]/30 bg-[#D4AF37]/5":"border-white/10"}`}>
              <div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">{m.from}</span><span className="text-[11px] text-[#A8A6A0]">{m.time}</span></div>
              <div className="font-bold mt-2">{m.title}</div>
              <div className="text-[13px] text-[#A8A6A0] mt-1">{m.body}</div>
              <div className="mt-3 flex gap-2"><button className="h-7 px-3 rounded-full bg-white/10 text-white text-[11px]">Marquer lu</button><button className="h-7 px-3 rounded-full bg-[#D4AF37] text-black text-[11px] font-bold">Voir</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
