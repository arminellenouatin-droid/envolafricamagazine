"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- module legacy en cours de typage progressif */
import { useEffect, useState } from "react";
import ProjectWizard from "@/components/crowdfunding/ProjectWizard";

type UserProp = {
  id: string;
  prenom?: string;
  nom?: string;
  email: string;
  phone?: string;
  role?: string;
};

export default function PorteurDashboardClient({ user }: { user: UserProp }) {
  const [projets, setProjets] = useState<any[]>([]);
  const [selectedProjet, setSelectedProjet] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [rapports, setRapports] = useState<any[]>([]);
  const [payout, setPayout] = useState<any>(null);
  const [payoutMessage, setPayoutMessage] = useState("");
  const [newRapport, setNewRapport] = useState({
    type: "mensuel",
    periode: "",
    contenu: "",
    kpis: {
      chiffreAffaires: "",
      tresorerieFin: "",
      depensesExploitation: "",
      clientsActifs: "",
      effectif: "",
      jalonsAtteints: ""
    }
  });

  const loadProjects = () => {
    fetch(`/api/crowdfunding/projects?porteurId=${encodeURIComponent(user.id)}&statut=all`)
      .then((r) => r.json())
      .then((d) => {
        const projs = d.projets || [];
        setProjets(projs);
        if (projs.length > 0) {
          setSelectedProjet(projs[0]);
        } else {
          setSelectedProjet(null);
        }
      })
      .catch(() => {
        setProjets([]);
        setSelectedProjet(null);
      });
  };

  useEffect(() => {
    loadProjects();
  }, [user.id]);

  useEffect(() => {
    if (!selectedProjet) {
      setDocuments([]);
      setMessages([]);
      setRapports([]);
      setPayout(null);
      return;
    }
    fetch(`/api/crowdfunding/documents?projetId=${selectedProjet.id}`)
      .then((r) => (r.ok ? r.json() : { documents: [] }))
      .then((d) => setDocuments(d.documents || []))
      .catch(() => setDocuments([]));

    fetch(`/api/crowdfunding/messages?projetId=${selectedProjet.id}`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => setMessages(d.messages || []))
      .catch(() => setMessages([]));

    fetch(`/api/crowdfunding/reports?projetId=${selectedProjet.id}`)
      .then((r) => (r.ok ? r.json() : { reports: [] }))
      .then((d) => setRapports(d.reports || []))
      .catch(() => setRapports([]));

    fetch(`/api/crowdfunding/payouts?projetId=${selectedProjet.id}`)
      .then((r) => (r.ok ? r.json() : { payouts: [] }))
      .then((d) => setPayout((d.payouts || [])[0] || null))
      .catch(() => setPayout(null));
  }, [selectedProjet]);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProjet) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("projetId", selectedProjet.id);
    fd.append("type", type);
    try {
      const res = await fetch("/api/crowdfunding/documents", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setDocuments((prev) => [...prev, data.document]);
        alert(`Document ${type} uploadé avec succès : ${file.name} - En attente de vérification.`);
      } else {
        alert(data.error || "Échec du téléchargement du document.");
      }
    } catch {
      alert("Erreur lors de l'envoi du document.");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedProjet) return;
    const senderName = `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email;
    const res = await fetch("/api/crowdfunding/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projetId: selectedProjet.id,
        fromId: user.id,
        fromNom: senderName,
        toId: "investisseurs",
        toNom: "Investisseurs du projet",
        content: newMessage.trim(),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
    } else {
      alert(data.error || "Impossible d'envoyer le message.");
    }
  };

  const requestPayout = async () => {
    if (!selectedProjet) return;
    setPayoutMessage("");
    const response = await fetch("/api/crowdfunding/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projetId: selectedProjet.id }),
    });
    const result = await response.json();
    if (!response.ok) {
      setPayoutMessage(result.error || "Impossible de demander le reversement.");
      return;
    }
    setPayout(result.payout);
    setPayoutMessage("Demande de reversement enregistrée avec succès.");
  };

  const submitRapport = async () => {
    if (!newRapport.contenu || !selectedProjet || !newRapport.periode) return;
    const [year, month] = newRapport.periode.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const response = await fetch("/api/crowdfunding/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projetId: selectedProjet.id,
        periodeDebut: `${newRapport.periode}-01`,
        periodeFin: `${newRapport.periode}-${String(lastDay).padStart(2, "0")}`,
        resume: newRapport.contenu,
        chiffreAffaires: Number(newRapport.kpis.chiffreAffaires) || null,
        tresorerieFin: Number(newRapport.kpis.tresorerieFin) || null,
        depensesExploitation: Number(newRapport.kpis.depensesExploitation) || null,
        clientsActifs: Number(newRapport.kpis.clientsActifs) || null,
        effectif: Number(newRapport.kpis.effectif) || null,
        jalonsAtteints: Number(newRapport.kpis.jalonsAtteints) || null,
        soumettre: true,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      alert(result.error || "Impossible d’envoyer le rapport");
      return;
    }
    setRapports((current) => [result.report, ...current.filter((report: any) => report.id !== result.report.id)]);
    setNewRapport({
      type: "mensuel",
      periode: "",
      contenu: "",
      kpis: {
        chiffreAffaires: "",
        tresorerieFin: "",
        depensesExploitation: "",
        clientsActifs: "",
        effectif: "",
        jalonsAtteints: ""
      }
    });
    alert("Rapport d’activité envoyé avec succès aux investisseurs.");
  };

  const totalCollecte = selectedProjet ? Number(selectedProjet.montantCollecte || 0) : 0;
  const totalRecherche = selectedProjet ? Math.max(1, Number(selectedProjet.montantRecherche || 1)) : 1;
  const pctObjectif = Math.min(100, Math.round((totalCollecte / totalRecherche) * 100));

  return (
    <div className="bg-[#fcf9f8] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[#9e001f]">Espace Porteur de projet</p>
        <h1 className="text-[28px] font-black mt-1" style={{ fontFamily: "Montserrat" }}>
          Bonjour {user.prenom || "Porteur"}
        </h1>
        <p className="text-[#5c403f] text-[13px] mt-2">
          Pilotez vos campagnes, suivez les contributions en temps réel, fournissez vos documents légaux et échangez avec vos investisseurs.
        </p>

        <div className="mt-8">
          <ProjectWizard onCreated={loadProjects} />
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="text-[11px] uppercase font-bold text-[#5c403f]">Collecte totale</div>
            <div className="text-[22px] font-black mt-1">{totalCollecte.toLocaleString()} F CFA</div>
            <div className="text-[11px] text-green-600 mt-1">{pctObjectif}% de l’objectif atteint</div>
          </div>
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="text-[11px] uppercase font-bold text-[#5c403f]">Vues</div>
            <div className="text-[22px] font-black mt-1">
              {selectedProjet ? Number(selectedProjet.vues || 0).toLocaleString() : "0"}
            </div>
          </div>
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="text-[11px] uppercase font-bold text-[#5c403f]">Investisseurs</div>
            <div className="text-[22px] font-black mt-1">
              {selectedProjet ? Number(selectedProjet.investisseurs || 0).toLocaleString() : "0"}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-bold text-lg text-[#071b36]">Mes projets de financement</h3>
          {projets.length > 0 ? (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {projets.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjet(p)}
                  className={`flex-none w-[280px] text-left border rounded-xl p-4 transition ${
                    selectedProjet?.id === p.id
                      ? "border-[#9e001f] bg-[#ffdad8]/20 shadow-sm"
                      : "bg-white border-[#e5bdbb] hover:border-slate-400"
                  }`}
                >
                  <div className="font-bold text-[14px] line-clamp-1 text-[#071b36]">{p.nom}</div>
                  <div className="text-[11px] text-[#5c403f] mt-1">
                    {Number(p.montantCollecte || 0).toLocaleString()} / {Number(p.montantRecherche || 0).toLocaleString()} F
                  </div>
                  <div className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {p.statut}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[#e5bdbb] bg-white p-8 text-center text-[#5c403f]">
              <p className="text-base font-bold text-[#071b36]">Vous n'avez pas encore de projet actif.</p>
              <p className="mt-1 text-xs text-slate-500">
                Utilisez le formulaire ci-dessus pour lancer votre première campagne de financement.
              </p>
            </div>
          )}
        </div>

        {selectedProjet && (
          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-6 lg:col-span-2 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-[16px] text-[#071b36]">Reversement des fonds collectés</h4>
                  <p className="text-[11px] text-[#5c403f] mt-1">
                    La commission est calculée sur le montant brut collecté et prélevée au moment du reversement.
                  </p>
                </div>
                <button
                  onClick={requestPayout}
                  disabled={Boolean(payout) || Number(selectedProjet.montantCollecte || 0) <= 0}
                  className="h-10 px-5 rounded-full bg-[#9e001f] text-white text-[12px] font-bold transition hover:bg-[#800019] disabled:opacity-50"
                >
                  {payout ? "Demande déjà enregistrée" : "Demander le reversement"}
                </button>
              </div>
              {payout && (
                <div className="mt-4 grid md:grid-cols-4 gap-3 text-[12px]">
                  <div className="rounded-lg bg-[#f6f3f2] p-3">
                    <span className="block text-[10px] text-[#5c403f]">Brut collecté</span>
                    <b>{Number(payout.gross_amount || 0).toLocaleString()} {payout.currency}</b>
                  </div>
                  <div className="rounded-lg bg-[#f6f3f2] p-3">
                    <span className="block text-[10px] text-[#5c403f]">Taux</span>
                    <b>{payout.commission_rate}%</b>
                  </div>
                  <div className="rounded-lg bg-[#f6f3f2] p-3">
                    <span className="block text-[10px] text-[#5c403f]">Commission</span>
                    <b>{Number(payout.commission_amount || 0).toLocaleString()} {payout.currency}</b>
                  </div>
                  <div className="rounded-lg bg-[#f6f3f2] p-3">
                    <span className="block text-[10px] text-[#5c403f]">Net demandé</span>
                    <b>{Number(payout.net_amount || 0).toLocaleString()} {payout.currency}</b>
                  </div>
                </div>
              )}
              {payoutMessage && <p className="mt-3 text-[11px] font-semibold text-[#9e001f]">{payoutMessage}</p>}
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h4 className="font-bold text-[16px] text-[#071b36]">Documents justificatifs & KYC</h4>
              <p className="text-[11px] text-[#5c403f] mt-1">
                Documents obligatoires pour certifier l’identité et l’existence de l’entreprise avant tout déblocage de fonds.
              </p>
              <div className="mt-4 space-y-3">
                {[
                  { type: "plan_affaires", label: "Plan d'affaires", desc: "Business plan complet (PDF)" },
                  { type: "comptes_financiers", label: "Comptes financiers", desc: "Bilans, comptes d'exploitation" },
                  { type: "carte_identite", label: "Pièce d'identité", desc: "Passeport ou CNI du porteur" },
                  { type: "enregistrement_entreprise", label: "Enregistrement entreprise", desc: "RCCM, IFU ou extrait KBIS" },
                  { type: "photo", label: "Photos du projet", desc: "Visuels haute définition" },
                ].map((doc) => (
                  <div key={doc.type} className="border rounded-lg p-3 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <div className="font-bold text-[12px] text-[#071b36]">{doc.label}</div>
                      <div className="text-[10px] text-[#5c403f]">
                        {doc.desc} · {documents.filter((d: any) => d.type === doc.type).length} fichier(s)
                      </div>
                    </div>
                    <label className="h-8 px-3 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition">
                      📤 Déposer
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleDocUpload(e, doc.type)}
                        accept=".pdf,.jpg,.png,.docx"
                      />
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <h5 className="font-bold text-[12px] text-slate-700">Documents enregistrés</h5>
                <div className="mt-2 space-y-1.5 max-h-[140px] overflow-y-auto">
                  {documents.length > 0 ? (
                    documents.map((d: any) => (
                      <div key={d.id} className="text-[11px] bg-slate-50 p-2 rounded flex justify-between items-center">
                        <span className="font-medium truncate max-w-[200px]">{d.nom}</span>
                        <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {d.statut}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Aucun document déposé pour ce projet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Messagerie */}
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h4 className="font-bold text-[16px] text-[#071b36]">Messagerie avec les investisseurs</h4>
              <p className="text-[11px] text-[#5c403f] mt-1">
                Communiquez avec la communauté d’investisseurs qui soutiennent ce projet.
              </p>
              <div className="mt-4 h-[180px] border rounded-lg p-3 overflow-y-auto space-y-2 bg-slate-50/40">
                {messages.length > 0 ? (
                  messages.map((m: any) => (
                    <div key={m.id} className="text-[11px] p-2 rounded bg-white border border-slate-100 shadow-xs">
                      <div className="font-bold text-[#071b36]">{m.from_nom || "Investisseur"} :</div>
                      <div className="mt-0.5 text-slate-600">{m.content}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-10">Aucun message échangé pour le moment.</p>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="flex-1 h-10 border rounded-xl px-3 text-xs outline-none focus:border-[#9e001f]"
                  placeholder="Écrire un message aux investisseurs..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="h-10 px-4 rounded-xl bg-[#087e8b] text-white font-bold text-xs hover:bg-[#066570] transition"
                >
                  Envoyer
                </button>
              </div>
            </div>

            {/* Rapports d'activité */}
            <div className="bg-white rounded-xl border p-6 lg:col-span-2 shadow-sm">
              <h4 className="font-bold text-[16px] text-[#071b36]">Reporting périodique aux investisseurs</h4>
              <p className="text-[11px] text-[#5c403f] mt-1">
                Soumettez vos rapports mensuels pour maintenir la confiance et respecter vos obligations de transparence.
              </p>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <input
                    type="month"
                    className="w-full h-10 border rounded-xl px-3 text-xs outline-none"
                    value={newRapport.periode}
                    onChange={(e) => setNewRapport({ ...newRapport, periode: e.target.value })}
                  />
                  <textarea
                    className="w-full h-24 border rounded-xl p-3 text-xs outline-none"
                    placeholder="Résumé narratif de l'activité du mois..."
                    value={newRapport.contenu}
                    onChange={(e) => setNewRapport({ ...newRapport, contenu: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Chiffre d'affaires"
                    className="h-10 border rounded-xl px-3 text-xs outline-none"
                    value={newRapport.kpis.chiffreAffaires}
                    onChange={(e) =>
                      setNewRapport({
                        ...newRapport,
                        kpis: { ...newRapport.kpis, chiffreAffaires: e.target.value }
                      })
                    }
                  />
                  <input
                    type="number"
                    placeholder="Trésorerie de fin"
                    className="h-10 border rounded-xl px-3 text-xs outline-none"
                    value={newRapport.kpis.tresorerieFin}
                    onChange={(e) =>
                      setNewRapport({
                        ...newRapport,
                        kpis: { ...newRapport.kpis, tresorerieFin: e.target.value }
                      })
                    }
                  />
                  <input
                    type="number"
                    placeholder="Clients actifs"
                    className="h-10 border rounded-xl px-3 text-xs outline-none"
                    value={newRapport.kpis.clientsActifs}
                    onChange={(e) =>
                      setNewRapport({
                        ...newRapport,
                        kpis: { ...newRapport.kpis, clientsActifs: e.target.value }
                      })
                    }
                  />
                  <button
                    onClick={submitRapport}
                    className="h-10 rounded-xl bg-[#9e001f] text-white font-bold text-xs hover:bg-[#800019] transition"
                  >
                    Publier le rapport
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
