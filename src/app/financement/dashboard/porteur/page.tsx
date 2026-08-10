"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function PorteurDashboard() {
  const [projets, setProjets] = useState<any[]>([]);
  useEffect(()=>{
    fetch("/api/crowdfunding/projects").then(r=>r.json()).then(d=>setProjets((d.projets||[]).slice(0,3)));
  },[]);

  return (
    <div className="bg-[#fcf9f8] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Montserrat" }}>Espace Porteur de projet - Gérer sa collecte</h1>
        <p className="text-[#5c403f] text-[13px] mt-2">Modifier projet, voir historique contributions reçues, gérer documents (plan affaires, comptes financiers), voir chiffres utiles (vues, avancement, taux réussite), discuter avec investisseurs, suivre demandes retrait, suivi après collecte rapports mensuels/trimestriels + docs justificatifs + remboursement automatique prêts</p>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-5"><div className="text-[11px] uppercase font-bold text-[#5c403f]">Collecte totale</div><div className="text-[22px] font-black mt-1">3.2M F</div><div className="text-[11px] text-green-600 mt-1">67% objectif atteint</div></div>
          <div className="bg-white border rounded-xl p-5"><div className="text-[11px] uppercase font-bold text-[#5c403f]">Vues</div><div className="text-[22px] font-black mt-1">1 240</div></div>
          <div className="bg-white border rounded-xl p-5"><div className="text-[11px] uppercase font-bold text-[#5c403f]">Taux réussite</div><div className="text-[22px] font-black mt-1">78%</div></div>
        </div>

        <div className="mt-8 bg-white rounded-xl border p-6">
          <h3 className="font-bold">Mes projets</h3>
          <div className="mt-4 space-y-3">
            {projets.map((p:any)=>(
              <div key={p.id} className="border rounded-xl p-4 flex justify-between">
                <div><div className="font-bold">{p.nom}</div><div className="text-[11px] text-[#5c403f] mt-1">{p.montantCollecte.toLocaleString()} / {p.montantRecherche.toLocaleString()} F • {p.investisseurs} investisseurs • {p.statut}</div></div>
                <div className="flex gap-2"><button className="h-8 px-3 rounded-full border text-[11px]">Modifier</button><Link href={`/financement/projets/${p.id}`} className="h-8 px-3 rounded-full bg-[#9e001f] text-white text-[11px] flex items-center justify-center">Voir</Link></div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-5"><h4 className="font-bold text-[14px]">Historique contributions reçues</h4><p className="text-[12px] text-[#5c403f] mt-2">Liste de tous les dons, prises de part, prêts reçus avec détails investisseurs</p></div>
          <div className="bg-white border rounded-xl p-5"><h4 className="font-bold text-[14px]">Gérer documents</h4><p className="text-[12px] text-[#5c403f] mt-2">Plan d'affaires, comptes financiers, carte d'identité, document enregistrement entreprise, photos</p><button className="mt-3 h-8 px-3 rounded-full border text-[11px]">📄 Gérer documents</button></div>
          <div className="bg-white border rounded-xl p-5"><h4 className="font-bold text-[14px]">Demandes de retrait</h4><p className="text-[12px] text-[#5c403f] mt-2">Retrait argent collecté seulement après validation équipe site + fin collecte + vérif docs. Pour projets multi-étapes, versement petit à petit selon avancement.</p><button className="mt-3 h-8 px-3 rounded-full bg-[#9e001f] text-white text-[11px]">Demander retrait</button></div>
          <div className="bg-white border rounded-xl p-5"><h4 className="font-bold text-[14px]">Suivi après collecte</h4><p className="text-[12px] text-[#5c403f] mt-2">Rapports réguliers mensuels/trimestriels + docs justificatifs + rester en contact investisseurs + suivi remboursement automatique prêts</p></div>
        </div>
      </div>
    </div>
  );
}
