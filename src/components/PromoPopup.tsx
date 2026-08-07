"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function PromoPopup() {
  const [show, setShow] = useState(false);

  useEffect(()=>{
    const dismissed = localStorage.getItem("eam_promo_dismissed");
    const lastShow = localStorage.getItem("eam_promo_last");
    const now = Date.now();
    // Show after 8 seconds, max once per session, not if dismissed in last 24h
    if (dismissed && now - parseInt(lastShow||"0") < 24*60*60*1000) return;
    const timer = setTimeout(()=>setShow(true), 8000);
    return ()=>clearTimeout(timer);
  },[]);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("eam_promo_dismissed","1");
    localStorage.setItem("eam_promo_last", Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] max-w-[480px] w-full overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-fade-in relative">
        <button onClick={dismiss} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600">×</button>
        <div className="bg-[#0A1931] p-6 text-white relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#D4AF37]/20 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#0A1931] rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide">Offre limitée • -60% le 1er mois</div>
            <h3 className="font-serif font-black text-[24px] leading-tight mt-4">L'Afrique qui gagne, à partir de 2 000 F CFA</h3>
            <p className="text-[13px] leading-5 text-zinc-300 mt-2">12 000 décideurs lisent déjà Envol Africa. Analyses exclusives, 1 magazine offert / mois, audio 12 langues, sans engagement.</p>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="rounded-[12px] bg-zinc-50 border p-3 text-center"><div className="font-black text-[#0A1931]">15</div><div className="text-zinc-500">articles / jour</div></div>
            <div className="rounded-[12px] bg-zinc-50 border p-3 text-center"><div className="font-black text-[#0A1931]">12</div><div className="text-zinc-500">langues audio</div></div>
            <div className="rounded-[12px] bg-zinc-50 border p-3 text-center"><div className="font-black text-[#0A1931]">1</div><div className="text-zinc-500">mag offert / mois</div></div>
          </div>
          <Link href="/abonnement" onClick={dismiss} className="mt-5 w-full h-12 rounded-full bg-[#0A1931] text-white font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-black">S'abonner à partir de 2 000 F CFA →</Link>
          <button onClick={dismiss} className="mt-3 w-full text-[12px] text-zinc-500 hover:text-zinc-700">Non merci, continuer la lecture</button>
          <div className="mt-3 text-[10px] text-zinc-400 text-center">Sans engagement • Annulable à tout moment • Paiement Moneroo sécurisé</div>
        </div>
      </div>
    </div>
  );
}
