"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function InvestisseurDashboard() {
  const [contribs, setContribs] = useState<any[]>([]);
  useEffect(()=>{
    // Mock contributions
    setContribs([
      { id:"1", projet:"AgroBio Bénin", type:"don", montant:10000, date:"2026-08-01", statut:"confirmé", contrat:"/contrats/don_1.pdf" },
      { id:"2", projet:"TechVillage Lagos", type:"prise_part", montant:500000, pourcentage:2.5, valorisation:20000000, contrat:"/contrats/part_2.pdf", statut:"confirmé" },
      { id:"3", projet:"Solar Power Sahel", type:"pret", montant:200000, taux:10, echeances:[{date:"2026-09-01", capital:16666, interet:1666, total:18332, statut:"prevu"}, {date:"2026-10-01", capital:16666, interet:1500, total:18166, statut:"prevu"}], statut:"en_cours" },
    ]);
  },[]);

  return (
    <div className="bg-[#fcf9f8] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Montserrat" }}>Espace Investisseur - Suivi investissements</h1>
        <p className="text-[#5c403f] text-[13px] mt-2">Historique contributions, docs et contrats PDF, calendrier remboursement prêts, évolution projets suivis, messagerie avec porteurs, parts d'entreprises valeur mise à jour</p>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-5"><div className="text-[11px] uppercase font-bold text-[#5c403f]">Total investi</div><div className="text-[22px] font-black mt-1">710 000 F</div></div>
          <div className="bg-white border rounded-xl p-5"><div className="text-[11px] uppercase font-bold text-[#5c403f]">Parts détenues</div><div className="text-[22px] font-black mt-1">2.5% • 20M valo</div></div>
          <div className="bg-white border rounded-xl p-5"><div className="text-[11px] uppercase font-bold text-[#5c403f]">Prêts en cours</div><div className="text-[22px] font-black mt-1">1 prêt • 10%</div></div>
        </div>

        <div className="mt-8 bg-white rounded-xl border p-6">
          <h3 className="font-bold">Historique contributions</h3>
          <div className="mt-4 space-y-3">
            {contribs.map((c:any)=>(
              <div key={c.id} className="border rounded-xl p-4 flex justify-between gap-4">
                <div><div className="font-bold text-[14px]">{c.projet} • {c.type.replace("_"," ")}</div><div className="text-[11px] text-[#5c403f] mt-1">{new Date(c.date||Date.now()).toLocaleDateString()} • {c.montant.toLocaleString()} F {c.pourcentage?`• ${c.pourcentage}%`:""} {c.taux?`• ${c.taux}%`:""} • {c.statut}</div>
                {c.type==="pret" && c.echeances && (
                  <div className="mt-2 text-[11px] bg-[#f6f3f2] rounded-lg p-2"><div className="font-bold">Calendrier remboursement</div>{c.echeances.map((e:any,i:number)=><div key={i} className="flex justify-between mt-1"><span>{e.date}</span><span>{e.capital.toLocaleString()} capital + {e.interet.toLocaleString()} intérêts = {e.total.toLocaleString()} F • {e.statut}</span></div>)}</div>
                )}
                </div>
                <div className="flex flex-col gap-2"><a href={c.contrat} className="h-8 px-3 rounded-full bg-[#f6f3f2] border text-[11px] flex items-center justify-center">📄 Contrat PDF</a><button className="h-8 px-3 rounded-full bg-white border text-[11px]">💬 Message porteur</button></div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-5"><h4 className="font-bold text-[14px]">Parts d'entreprises - Valeur mise à jour</h4><p className="text-[12px] text-[#5c403f] mt-2">Valeur calculée auto: montant collecté / % vendu. Ex: TechVillage 20M valo → ta part 2.5% = 500k F</p></div>
          <div className="bg-white border rounded-xl p-5"><h4 className="font-bold text-[14px]">Messagerie porteurs</h4><p className="text-[12px] text-[#5c403f] mt-2">Discutez directement avec porteurs projets par messagerie intégrée</p><button className="mt-3 h-9 px-4 rounded-full bg-[#9e001f] text-white text-[11px] font-bold">Ouvrir messagerie →</button></div>
        </div>
      </div>
    </div>
  );
}
