"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ProjetDetail() {
  const params = useParams();
  const id = params.id as string;
  const [projet, setProjet] = useState<any>(null);
  const [tab, setTab] = useState<"don"|"prise_part"|"pret">("don");
  const [montant, setMontant] = useState(10000);

  useEffect(()=>{
    fetch(`/api/crowdfunding/projects?id=${id}`).then(r=>r.json()).then(d=>setProjet(d.projet));
  },[id]);

  if (!projet) return <div className="p-10 text-center">Chargement projet...</div>;

  const pct = Math.round((projet.montantCollecte/projet.montantRecherche)*100);
  const valorisation = projet.valorisation || Math.round(projet.montantRecherche / 0.2);

  return (
    <div className="bg-[#fcf9f8] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#5c403f]"><Link href="/financement" className="hover:text-[#9e001f]">Crowdfunding</Link><span>›</span><span className="text-black font-bold">{projet.nom}</span></div>
        
        <div className="mt-6 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="aspect-video rounded-xl overflow-hidden bg-[#eae7e7]"><img src={projet.images[0]} alt="" className="w-full h-full object-cover" /></div>
            <h1 className="text-[28px] font-black mt-6 leading-tight" style={{ fontFamily: "Montserrat" }}>{projet.nom}</h1>
            <div className="flex items-center gap-2 mt-3 text-[11px]"><span className="bg-[#ffdad8] text-[#9e001f] px-2 py-1 rounded-full font-bold uppercase">{projet.secteur}</span><span className="bg-[#f0eded] px-2 py-1 rounded-full">{projet.pays} • {projet.niveauRisque} risque</span><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">{projet.statut}</span></div>
            <p className="text-[15px] leading-7 mt-4 text-[#1b1c1c]">{projet.description}</p>
            
            <div className="mt-8">
              <h3 className="font-bold text-[16px]">Vidéos d'explication</h3>
              <div className="mt-3 aspect-video bg-[#1b1c1c] rounded-xl flex items-center justify-center text-white">Vidéo présentation (à uploader par porteur)</div>
            </div>

            <div className="mt-8 border-t border-[#e5bdbb]/30 pt-8">
              <h3 className="font-bold">Documents justificatifs</h3>
              <div className="mt-3 flex gap-2"><span className="px-3 py-1.5 rounded-full bg-[#f6f3f2] border text-[11px]">📄 Carte d'identité</span><span className="px-3 py-1.5 rounded-full bg-[#f6f3f2] border text-[11px]">📄 Registre commerce</span><span className="px-3 py-1.5 rounded-full bg-[#f6f3f2] border text-[11px]">📄 Business plan PDF</span></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-[16px] border border-[#e5bdbb] p-6 sticky top-24">
              <div className="flex justify-between text-[11px] mb-1"><span>Progression</span><span className="font-bold">{pct}%</span></div>
              <div className="h-2 bg-[#f0eded] rounded-full overflow-hidden"><div className="h-full bg-[#9e001f]" style={{ width: `${Math.min(100,pct)}%` }}></div></div>
              <div className="flex justify-between text-[12px] mt-2"><span className="font-bold">{projet.montantCollecte.toLocaleString()} F</span><span className="text-[#5c403f]">sur {projet.montantRecherche.toLocaleString()} F</span></div>
              <div className="flex justify-between text-[11px] mt-3 text-[#5c403f]"><span>{projet.investisseurs} investisseurs</span><span>{Math.ceil((new Date(projet.dateFin).getTime()-Date.now())/86400000)}j restants</span></div>

              <div className="mt-6 border-t border-[#e5bdbb]/30 pt-6">
                <h4 className="font-bold text-[14px]">3 façons d'aider</h4>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button onClick={()=>setTab("don")} className={`h-10 rounded-full text-[11px] font-bold border ${tab==="don"?"bg-[#9e001f] text-white border-[#9e001f]":"bg-white border-[#e5bdbb]"}`}>Don</button>
                  <button onClick={()=>setTab("prise_part")} className={`h-10 rounded-full text-[11px] font-bold border ${tab==="prise_part"?"bg-[#9e001f] text-white border-[#9e001f]":"bg-white border-[#e5bdbb]"}`}>Part</button>
                  <button onClick={()=>setTab("pret")} className={`h-10 rounded-full text-[11px] font-bold border ${tab==="pret"?"bg-[#9e001f] text-white border-[#9e001f]":"bg-white border-[#e5bdbb]"}`}>Prêt</button>
                </div>

                {tab==="don" && (
                  <div className="mt-4">
                    <p className="text-[12px] text-[#5c403f]">Montant libre ou proposé. Aucun retour financier. Badge Soutien sur profil.</p>
                    <div className="mt-3 flex gap-2"><button onClick={()=>setMontant(5000)} className="flex-1 h-9 rounded-full border bg-[#f6f3f2] text-[12px]">5k F</button><button onClick={()=>setMontant(10000)} className="flex-1 h-9 rounded-full border bg-white text-[12px] font-bold">10k F</button><button onClick={()=>setMontant(50000)} className="flex-1 h-9 rounded-full border bg-[#f6f3f2] text-[12px]">50k F</button></div>
                    <input type="number" value={montant} onChange={e=>setMontant(parseInt(e.target.value)||0)} className="mt-3 w-full h-11 rounded-full border bg-[#f6f3f2] px-4 text-[14px]" placeholder="Montant libre" />
                    <button className="mt-4 w-full h-11 rounded-full bg-[#9e001f] text-white font-bold text-[13px]">Faire un don de {montant.toLocaleString()} F →</button>
                  </div>
                )}

                {tab==="prise_part" && (
                  <div className="mt-4">
                    <p className="text-[12px] text-[#5c403f]">Achetez % entreprise. Valorisation auto: montant collecté / % vendu = {valorisation.toLocaleString()} F. Contrat PDF auto généré.</p>
                    <div className="mt-3 bg-[#f6f3f2] rounded-lg p-3 text-[12px]">
                      <div className="flex justify-between"><span>Valorisation</span><span className="font-bold">{valorisation.toLocaleString()} F</span></div>
                      <div className="flex justify-between mt-1"><span>% vendu</span><span>{projet.pourcentageVendu}%</span></div>
                      <div className="flex justify-between mt-1 font-bold border-t pt-2"><span>Prix pour 1%</span><span>{Math.round(valorisation/100).toLocaleString()} F</span></div>
                    </div>
                    <div className="mt-3"><label className="text-[11px] font-bold">% souhaité</label><input type="range" min="0.1" max="10" step="0.1" defaultValue="1" className="w-full mt-1" /><div className="text-[11px] text-[#5c403f]">1% = {Math.round(valorisation/100).toLocaleString()} F</div></div>
                    <button className="mt-4 w-full h-11 rounded-full bg-[#9e001f] text-white font-bold text-[13px]">Acheter 1% pour {Math.round(valorisation/100).toLocaleString()} F → Contrat PDF auto</button>
                  </div>
                )}

                {tab==="pret" && (
                  <div className="mt-4">
                    <p className="text-[12px] text-[#5c403f]">Prêtez avec taux {projet.tauxInteret}% fixé par porteur. Calendrier remboursement auto: fréquence mensuelle, capital+intérêts, date paiement. Suivi retards + messages auto.</p>
                    <div className="mt-3 bg-[#f6f3f2] rounded-lg p-3 text-[12px]">
                      <div className="flex justify-between"><span>Taux</span><span className="font-bold">{projet.tauxInteret}%/an</span></div>
                      <div className="flex justify-between mt-1"><span>Durée</span><span>{projet.dureeJours} jours</span></div>
                      <div className="mt-2 text-[10px]">Calendrier: chaque mois, part capital + intérêts, date paiement auto</div>
                    </div>
                    <input type="number" value={montant} onChange={e=>setMontant(parseInt(e.target.value)||0)} placeholder="Montant à prêter" className="mt-3 w-full h-11 rounded-full border bg-[#f6f3f2] px-4 text-[14px]" />
                    <button className="mt-3 w-full h-11 rounded-full bg-[#9e001f] text-white font-bold text-[13px]">Prêter {montant.toLocaleString()} F à {projet.tauxInteret}% →</button>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-[#f6f3f2] border">
                <h4 className="font-bold text-[12px]">Messagerie directe avec investisseurs</h4>
                <p className="text-[11px] text-[#5c403f] mt-1">Discutez avec porteur projet - Suivi demandes retrait - Rapports mensuels/trimestriels + docs justificatifs</p>
                <button className="mt-3 w-full h-9 rounded-full bg-white border text-[11px] font-bold">💬 Contacter porteur</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
