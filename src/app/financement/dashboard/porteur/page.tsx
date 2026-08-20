"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- module legacy en cours de typage progressif */
import { useEffect, useState } from "react";
import Link from "next/link";
import ProjectWizard from "@/components/crowdfunding/ProjectWizard";

export default function PorteurDashboard() {
  const [projets, setProjets] = useState<any[]>([]);
  const [selectedProjet, setSelectedProjet] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [rapports, setRapports] = useState<any[]>([]);
  const [newRapport, setNewRapport] = useState({ type:"mensuel", periode:"", contenu:"" });

  useEffect(()=>{
    fetch("/api/crowdfunding/projects").then(r=>r.json()).then(d=>{
      const projs = (d.projets||[]).slice(0,3);
      setProjets(projs);
      if (projs[0]) setSelectedProjet(projs[0]);
    });
  },[]);

  useEffect(()=>{
    if (!selectedProjet) return;
    fetch(`/api/crowdfunding/documents?projetId=${selectedProjet.id}`).then(r=>r.json()).then(d=>setDocuments(d.documents||[]));
    fetch(`/api/crowdfunding/messages?projetId=${selectedProjet.id}`).then(r=>r.json()).then(d=>setMessages(d.messages||[]));
    fetch(`/api/crowdfunding/reports?projetId=${selectedProjet.id}`).then(r=>r.json()).then(d=>setRapports(d.reports||[]));
  },[selectedProjet]);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProjet) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("projetId", selectedProjet.id);
    fd.append("type", type);
    fd.append("userId", "porteur_demo");
    const res = await fetch("/api/crowdfunding/documents", { method:"POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setDocuments([...documents, data.document]);
      alert(`Document ${type} uploadé: ${file.name} - En attente vérification équipe site`);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedProjet) return;
    const res = await fetch("/api/crowdfunding/messages", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ projetId: selectedProjet.id, fromId:"porteur_demo", fromNom:"Porteur", toId:"investisseur_demo", toNom:"Investisseur", content: newMessage }) });
    const data = await res.json();
    if (res.ok) {
      setMessages([...messages, data.message]);
      setNewMessage("");
    }
  };

  const submitRapport = async () => {
    if (!newRapport.contenu || !selectedProjet || !newRapport.periode) return;
    const [year, month] = newRapport.periode.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const response = await fetch("/api/crowdfunding/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projetId: selectedProjet.id, periodeDebut: `${newRapport.periode}-01`, periodeFin: `${newRapport.periode}-${String(lastDay).padStart(2, "0")}`, resume: newRapport.contenu, soumettre: true }) });
    const result = await response.json();
    if (!response.ok) { alert(result.error || "Impossible d’envoyer le rapport"); return; }
    setRapports((current) => [result.report, ...current.filter((report: any) => report.id !== result.report.id)]);
    setNewRapport({ type:"mensuel", periode:"", contenu:"" });
    alert("Rapport mensuel envoyé aux investisseurs autorisés.");
  };

  return (
    <div className="bg-[#fcf9f8] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Montserrat" }}>Espace Porteur de projet - Gérer sa collecte - Suivi après collecte</h1>
        <p className="text-[#5c403f] text-[13px] mt-2">Modifier projet, historique contributions, gérer documents (plan affaires, comptes financiers, carte identité...), chiffres utiles vues/avancement/taux réussite, messagerie investisseurs, demandes retrait, rapports mensuels/trimestriels + remboursement auto prêts</p>

        <div className="mt-8"><ProjectWizard /></div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-5"><div className="text-[11px] uppercase font-bold text-[#5c403f]">Collecte totale</div><div className="text-[22px] font-black mt-1">3.2M F</div><div className="text-[11px] text-green-600 mt-1">67% objectif atteint</div></div>
          <div className="bg-white border rounded-xl p-5"><div className="text-[11px] uppercase font-bold text-[#5c403f]">Vues</div><div className="text-[22px] font-black mt-1">1 240</div></div>
          <div className="bg-white border rounded-xl p-5"><div className="text-[11px] uppercase font-bold text-[#5c403f]">Taux réussite</div><div className="text-[22px] font-black mt-1">78%</div></div>
        </div>

        <div className="mt-8">
          <h3 className="font-bold">Mes projets - Sélectionnez un projet pour gérer</h3>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {projets.map((p:any)=>(
              <button key={p.id} onClick={()=>setSelectedProjet(p)} className={`flex-none w-[280px] text-left border rounded-xl p-4 ${selectedProjet?.id===p.id?"border-[#9e001f] bg-[#ffdad8]/20":"bg-white border-[#e5bdbb]"}`}>
                <div className="font-bold text-[14px] line-clamp-1">{p.nom}</div>
                <div className="text-[11px] text-[#5c403f] mt-1">{p.montantCollecte.toLocaleString()} / {p.montantRecherche.toLocaleString()} F • {p.statut}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedProjet && (
          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            {/* Documents */}
            <div className="bg-white rounded-xl border p-6">
              <h4 className="font-bold text-[16px]">Gérer documents - Plan affaires, comptes financiers, carte identité, enregistrement entreprise, photos</h4>
              <p className="text-[11px] text-[#5c403f] mt-1">Documents obligatoires pour prouver identité et existence entreprise/projet - Vérification équipe site avant retrait argent</p>
              <div className="mt-4 space-y-3">
                {[
                  { type:"plan_affaires", label:"Plan d'affaires", desc:"Business plan PDF" },
                  { type:"comptes_financiers", label:"Comptes financiers", desc:"Bilans, comptes" },
                  { type:"carte_identite", label:"Carte d'identité", desc:"Pièce identité porteur" },
                  { type:"enregistrement_entreprise", label:"Enregistrement entreprise", desc:"RCCM, IFU" },
                  { type:"photo", label:"Photos projet", desc:"Images projet" },
                ].map(doc=>(
                  <div key={doc.type} className="border rounded-lg p-3 flex justify-between items-center">
                    <div><div className="font-bold text-[12px]">{doc.label}</div><div className="text-[10px] text-[#5c403f]">{doc.desc} • {documents.filter((d:any)=>d.type===doc.type).length} fichier(s)</div></div>
                    <label className="h-8 px-3 rounded-full bg-[#f6f3f2] border text-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5bdbb]">📤 Upload<input type="file" className="hidden" onChange={e=>handleDocUpload(e, doc.type)} accept=".pdf,.jpg,.png" /></label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <h5 className="font-bold text-[12px]">Documents uploadés</h5>
                <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto">
                  {documents.map((d:any)=><div key={d.id} className="text-[11px] flex justify-between bg-[#f6f3f2] rounded p-2"><span>📄 {d.nom} • {d.statut}</span><a href={d.url} target="_blank" className="text-[#9e001f] font-bold">Voir</a></div>)}
                  {documents.length===0 && <div className="text-[11px] text-[#5c403f]">Aucun document - Uploadez vos docs obligatoires</div>}
                </div>
              </div>
            </div>

            {/* Messagerie */}
            <div className="bg-white rounded-xl border p-6">
              <h4 className="font-bold text-[16px]">Messagerie directe avec investisseurs</h4>
              <div className="mt-4 h-[200px] overflow-y-auto border rounded-lg bg-[#f6f3f2] p-3 space-y-2">
                {messages.map((m:any)=><div key={m.id} className={`p-2 rounded-lg text-[12px] ${m.fromId==="porteur_demo"?"bg-[#9e001f] text-white ml-8":"bg-white border mr-8"}`}><div className="font-bold text-[10px]">{m.fromNom}</div><div>{m.content}</div><div className="text-[9px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div></div>)}
                {messages.length===0 && <div className="text-[11px] text-[#5c403f] text-center py-10">Aucun message - Discutez directement avec investisseurs par messagerie</div>}
              </div>
              <div className="mt-3 flex gap-2"><input value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder="Message aux investisseurs..." className="flex-1 h-10 rounded-full border bg-[#f6f3f2] px-4 text-[12px]" /><button onClick={sendMessage} className="h-10 px-4 rounded-full bg-[#9e001f] text-white text-[12px] font-bold">Envoyer</button></div>
            </div>

            {/* Rapports */}
            <div className="bg-white rounded-xl border p-6 lg:col-span-2">
              <h4 className="font-bold text-[16px]">Suivi après collecte - Rapports mensuels/trimestriels + docs justificatifs + rester en contact</h4>
              <div className="mt-4 grid md:grid-cols-3 gap-3">
                <select value={newRapport.type} onChange={e=>setNewRapport({...newRapport, type:e.target.value as any})} className="h-10 rounded-full border bg-[#f6f3f2] px-4 text-[12px]"><option value="mensuel">Mensuel</option><option value="trimestriel">Trimestriel</option></select>
                <input type="month" value={newRapport.periode} onChange={e=>setNewRapport({...newRapport, periode:e.target.value})} className="h-10 rounded-full border bg-[#f6f3f2] px-4 text-[12px]" />
                <button onClick={submitRapport} className="h-10 rounded-full bg-[#303030] text-white text-[12px] font-bold">Envoyer rapport</button>
              </div>
              <textarea value={newRapport.contenu} onChange={e=>setNewRapport({...newRapport, contenu:e.target.value})} placeholder="Contenu rapport régulier - restez en contact avec investisseurs..." rows={3} className="mt-3 w-full rounded-xl border bg-[#f6f3f2] p-3 text-[12px]" />
              <div className="mt-4 space-y-2">
                {rapports.map((r:any)=><div key={r.id} className="border rounded-lg p-3 bg-[#f6f3f2]"><div className="font-bold text-[12px]">Rapport {r.period_start} → {r.period_end} · {r.status}</div><div className="text-[11px] text-[#5c403f] mt-1">{r.narrative || r.contenu}</div></div>)}
              </div>
            </div>

            {/* Remboursement auto prêts */}
            <div className="bg-white rounded-xl border p-6 lg:col-span-2">
              <h4 className="font-bold text-[16px]">Suivi remboursement automatique prêts - Pour les prêts, suivre remboursement automatique argent</h4>
              <p className="text-[11px] text-[#5c403f] mt-1">Calendrier remboursement auto: fréquence mensuelle, capital+intérêts, date paiement - Suivi retards + messages auto préviennent investisseur - Voir /financement/dashboard/investisseur pour test côté investisseur</p>
              <Link href="/financement/dashboard/investisseur" className="mt-3 inline-block h-9 px-4 rounded-full bg-white border text-[11px] font-bold">Voir côté investisseur →</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
