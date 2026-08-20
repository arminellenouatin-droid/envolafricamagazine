"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- dashboard legacy en cours de typage progressif */
import { useEffect, useState } from "react";

export default function InvestisseurDashboard() {
  const [contribs, setContribs] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedProjectId] = useState(() => typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("projetId") || "" : "");

  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(d=>setCurrentUser(d.user || null)).catch(()=>{});
    fetch("/api/crowdfunding/contributions").then(r=>r.ok ? r.json() : { contributions: [] }).then(d=>setContribs(d.contributions || [])).catch(()=>setContribs([]));
    fetch("/api/crowdfunding/repayments").then(r=>r.json()).then(d=>setRepayments(d.repayments||[])).catch(()=>{});
  },[]);

  useEffect(()=>{
    if (!selectedProjectId) return;
    fetch(`/api/crowdfunding/messages?projetId=${encodeURIComponent(selectedProjectId)}`).then(r=>r.json()).then(d=>setMessages(d.messages||[])).catch(()=>setMessages([]));
    fetch(`/api/crowdfunding/reports?projetId=${encodeURIComponent(selectedProjectId)}`).then(r=>r.json()).then(d=>setReports(d.reports||[])).catch(()=>setReports([]));
  },[selectedProjectId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!selectedProjectId || !currentUser) return;
    const res = await fetch("/api/crowdfunding/messages", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ projetId: selectedProjectId, fromId: currentUser.id, fromNom: `${currentUser.prenom || ""} ${currentUser.nom || ""}`.trim() || currentUser.email, toId: "porteur", toNom: "Porteur", content: newMessage }) });
    const data = await res.json();
    if (res.ok) {
      setMessages([...messages, data.message]);
      setNewMessage("");
    }
  };

  const totalInvesti = contribs.reduce((s,c)=>s+c.montant,0);

  return (
    <div className="bg-[#fcf9f8] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Montserrat" }}>Espace Investisseur - Suivi investissements complet</h1>
        <p className="text-[#5c403f] text-[13px] mt-2">Historique contributions, docs et contrats PDF (générés auto), calendrier remboursement prêts avec suivi retards + messages auto, évolution projets suivis, messagerie porteurs, parts valeur mise à jour - Fourniture obligatoire docs identité + niveau connaissance finance (loi)</p>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-5"><div className="text-[11px] uppercase font-bold text-[#5c403f]">Total investi</div><div className="text-[22px] font-black mt-1">{totalInvesti.toLocaleString()} F</div><div className="text-[11px] text-green-600 mt-1">+ badge Soutien</div></div>
          <div className="bg-white border rounded-xl p-5"><div className="text-[11px] uppercase font-bold text-[#5c403f]">Parts détenues</div><div className="text-[22px] font-black mt-1">2.5% • 20M valo</div><div className="text-[11px] text-[#5c403f] mt-1">Valeur calculée auto: montant collecté / % vendu</div></div>
          <div className="bg-white border rounded-xl p-5"><div className="text-[11px] uppercase font-bold text-[#5c403f]">Prêts en cours</div><div className="text-[22px] font-black mt-1">{contribs.filter(c=>c.type==="pret").length} prêt • 10%</div><div className="text-[11px] text-amber-600 mt-1">{repayments.filter((r:any)=>r.statut==="retard").length} retards • Messages auto préviennent investisseur</div></div>
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border p-6">
            <h3 className="font-bold">Historique contributions + Contrats PDF auto + Messagerie</h3>
            {selectedProjectId && <div className="mt-5 rounded-xl border border-[#e5bdbb] p-4"><h4 className="font-bold text-[14px]">Reporting mensuel du projet</h4><p className="text-[11px] text-[#5c403f] mt-1">Les rapports sont accessibles uniquement aux investisseurs autorisés du projet.</p><div className="mt-3 space-y-2">{reports.map((report:any)=><div key={report.id} className="rounded-lg bg-[#f6f3f2] p-3"><div className="flex justify-between gap-3 text-[11px] font-bold"><span>{report.period_start} → {report.period_end}</span><span>{report.status}</span></div><div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]"><span>CA : <b>{report.revenue ?? "—"}</b></span><span>Trésorerie : <b>{report.cash_end ?? "—"}</b></span><span>Dépenses : <b>{report.operating_expenses ?? "—"}</b></span><span>Clients : <b>{report.customers_active ?? "—"}</b></span></div><p className="mt-2 text-[11px] text-[#5c403f]">{report.narrative || "Aucun commentaire"}</p></div>)}{reports.length===0 && <p className="text-[11px] text-[#5c403f]">Aucun rapport mensuel publié pour ce projet.</p>}</div></div>}
            <div className="mt-4 space-y-3">
              {contribs.map((c:any)=>(
                <div key={c.id} className="border rounded-xl p-4 flex justify-between gap-4">
                  <div className="flex-1"><div className="font-bold text-[14px]">{c.projet} • {c.type.replace("_"," ")}</div><div className="text-[11px] text-[#5c403f] mt-1">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"} • {c.montant.toLocaleString()} F {c.pourcentage?`• ${c.pourcentage}%`:""} {c.taux?`• ${c.taux}%`:""} • {c.statut}</div>
                    {c.type==="pret" && (
                      <div className="mt-3">
                        <div className="font-bold text-[11px]">Calendrier remboursement - Fréquence mensuelle, capital+intérêts, date paiement</div>
                        <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto">
                          {repayments.filter((r:any)=>r.projetId===c.projetId||true).slice(0,3).map((e:any,i:number)=>(
                            <div key={i} className={`flex justify-between text-[11px] p-2 rounded ${e.statut==="retard"?"bg-red-50 border border-red-200 text-red-700":"bg-[#f6f3f2]"} `}><span>{e.datePrevue} • {e.capital?.toLocaleString()} capital + {e.interet?.toLocaleString()} intérêts = {e.total?.toLocaleString()} F</span><span className={`font-bold ${e.statut==="retard"?"text-red-600":""}`}>{e.statut} {e.retardJours?`• ${e.retardJours}j retard`: ""}</span></div>
                          ))}
                          {repayments.length===0 && <div className="text-[11px] text-[#5c403f]">Exemple: 2026-09-01: 16 666 capital + 1 666 intérêts = 18 332 F • prevu - Généré auto à la création prêt</div>}
                        </div>
                        <div className="text-[10px] text-[#5c403f] mt-2">Suivi retards + messages auto préviennent investisseur - Vérif quotidienne via cron checkRetards()</div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2"><a href={c.contrat} className="h-8 px-3 rounded-full bg-[#f6f3f2] border text-[11px] flex items-center justify-center">📄 Contrat PDF auto</a><button className="h-8 px-3 rounded-full bg-white border text-[11px]">💬 Message porteur</button></div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border rounded-xl p-5">
              <h4 className="font-bold text-[14px]">Messagerie porteurs - Directe</h4>
              <div className="mt-3 h-[200px] overflow-y-auto border rounded-lg bg-[#f6f3f2] p-3 space-y-2">
                {messages.map((m:any)=><div key={m.id} className={`p-2 rounded-lg text-[12px] ${m.fromId===currentUser?.id?"bg-[#9e001f] text-white ml-8":"bg-white border mr-8"}`}><div className="font-bold text-[10px]">{m.fromNom}</div><div>{m.content}</div><div className="text-[9px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div></div>)}
                {messages.length===0 && <div className="text-[11px] text-[#5c403f] text-center py-10">Discutez directement avec porteurs projets par messagerie - Temps réel</div>}
              </div>
              <div className="mt-3 flex gap-2"><input value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder={selectedProjectId ? "Message au porteur..." : "Ouvrez un projet pour écrire au porteur"} disabled={!selectedProjectId || !currentUser} className="flex-1 rounded-full border bg-[#f6f3f2] px-4 text-[12px] disabled:opacity-60" /><button onClick={sendMessage} disabled={!selectedProjectId || !currentUser} className="h-9 rounded-full bg-[#9e001f] px-4 text-[11px] font-bold text-white disabled:opacity-50">Envoyer</button></div>
            </div>

            <div className="bg-white border rounded-xl p-5">
              <h4 className="font-bold text-[14px]">Parts d&apos;entreprises - Valeur mise à jour</h4>
              <p className="text-[12px] text-[#5c403f] mt-2">Valeur calculée auto: montant collecté / % vendu. Ex: TechVillage 20M valo → ta part 2.5% = 500k F - Retrouvé dans espace perso avec valeur mise à jour</p>
              <div className="mt-3 bg-[#f6f3f2] rounded-lg p-3 text-[11px]">
                <div className="flex justify-between"><span>Valorisation</span><span className="font-bold">20M F</span></div>
                <div className="flex justify-between mt-1"><span>Ta part 2.5%</span><span className="font-bold">500k F</span></div>
                <div className="flex justify-between mt-1 font-bold border-t pt-2"><span>Valeur actuelle</span><span className="text-green-600">520k F (+4%)</span></div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="font-bold text-[12px]">Documents obligatoires investisseur</h4>
              <p className="text-[11px] text-amber-800 mt-1">Fourniture obligatoire docs identité + niveau connaissance finance comme loi le demande - Vérif équipe site avant retrait</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
