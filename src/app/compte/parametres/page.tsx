"use client";
import { useEffect, useState } from "react";

export default function ParametresPage(){
  const [user,setUser]=useState<any>(null);
  const [lang,setLang]=useState("fr");
  const [currency,setCurrency]=useState("XOF");
  useEffect(()=>{ fetch("/api/auth/me").then(r=>r.json()).then(d=>{ setUser(d.user); if (d.user){ setLang(d.user.lang); setCurrency(d.user.currency); } }); },[]);
  return (
    <div className="space-y-6">
      <h1 className="font-serif font-black text-[24px] text-[#0A1931]">Paramètres</h1>
      <div className="bg-white rounded-[20px] border p-6 space-y-6">
        <div><div className="font-bold text-[14px]">Informations personnelles</div><div className="mt-3 grid md:grid-cols-2 gap-3"><input defaultValue={user?.prenom} placeholder="Prénom" className="h-11 rounded-full border bg-zinc-50 px-5 text-[13px]" /><input defaultValue={user?.nom} placeholder="Nom" className="h-11 rounded-full border bg-zinc-50 px-5 text-[13px]" /><input defaultValue={user?.email} placeholder="Email" className="md:col-span-2 h-11 rounded-full border bg-zinc-50 px-5 text-[13px]" /></div></div>
        <div><div className="font-bold text-[14px]">Langue & devise</div><div className="mt-3 flex gap-2"><select value={lang} onChange={e=>setLang(e.target.value)} className="h-11 rounded-full border bg-zinc-50 px-5 text-[13px]"><option value="fr">Français</option><option value="en">English</option><option value="es">Español</option></select><select value={currency} onChange={e=>setCurrency(e.target.value)} className="h-11 rounded-full border bg-zinc-50 px-5 text-[13px]"><option value="XOF">F CFA</option><option value="EUR">EUR €</option><option value="USD">USD $</option><option value="NGN">NGN ₦</option></select></div></div>
        <div><div className="font-bold text-[14px]">Sécurité</div><div className="mt-3 rounded-[12px] bg-amber-50 border border-amber-100 p-4 text-[12px] text-amber-900">Comptes équipe (rédacteur, rédacteur-chef, gérant, admin) doivent activer la double vérification 2FA avant d'accéder au back-office. <button className="ml-2 font-bold underline">Activer 2FA</button></div></div>
        <button className="h-11 px-6 rounded-full bg-[#0A1931] text-white font-bold text-[13px]">Enregistrer les modifications</button>
      </div>
    </div>
  );
}
