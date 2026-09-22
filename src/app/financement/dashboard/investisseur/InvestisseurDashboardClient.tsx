"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- dashboard legacy en cours de typage progressif */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

type UserProp = {
  id: string;
  prenom?: string;
  nom?: string;
  email: string;
  phone?: string;
  role?: string;
};

export default function InvestisseurDashboardClient({ user }: { user: UserProp }) {
  const { formatPrice } = useLocale();
  const [contribs, setContribs] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedProjectId] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("projetId") || "" : ""
  );

  useEffect(() => {
    fetch("/api/crowdfunding/contributions")
      .then((r) => (r.ok ? r.json() : { contributions: [] }))
      .then((d) => setContribs(d.contributions || []))
      .catch(() => setContribs([]));

    fetch("/api/crowdfunding/repayments")
      .then((r) => (r.ok ? r.json() : { repayments: [] }))
      .then((d) => setRepayments(d.repayments || []))
      .catch(() => setRepayments([]));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    fetch(`/api/crowdfunding/messages?projetId=${encodeURIComponent(selectedProjectId)}`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => setMessages(d.messages || []))
      .catch(() => setMessages([]));

    fetch(`/api/crowdfunding/reports?projetId=${encodeURIComponent(selectedProjectId)}`)
      .then((r) => (r.ok ? r.json() : { reports: [] }))
      .then((d) => setReports(d.reports || []))
      .catch(() => setReports([]));
  }, [selectedProjectId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedProjectId) return;
    const senderName = `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email;
    const res = await fetch("/api/crowdfunding/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projetId: selectedProjectId,
        fromId: user.id,
        fromNom: senderName,
        toId: "porteur",
        toNom: "Porteur du projet",
        content: newMessage.trim(),
      }),
    });
    const data = await responseJsonSafe(res);
    if (res.ok) {
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
    } else {
      alert(data.error || "Impossible d'envoyer le message.");
    }
  };

  async function responseJsonSafe(res: Response) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  const totalInvesti = contribs.reduce((s, c) => s + Number(c.montant || 0), 0);
  const equityContribs = contribs.filter((c: any) => ["equity", "prise_part"].includes(String(c.type)));
  const equityValue = equityContribs.reduce((s, c) => s + Number(c.montant || 0), 0);
  const loanContribs = contribs.filter((c: any) => c.type === "pret");

  return (
    <div className="bg-[#fcf9f8] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[#9e001f]">Espace Investisseur</p>
        <h1 className="text-[28px] font-black mt-1" style={{ fontFamily: "Montserrat" }}>
          Bonjour {user.prenom || "Investisseur"}
        </h1>
        <p className="text-[#5c403f] text-[13px] mt-2">
          Suivi complet de vos investissements : historique des contributions, contrats d'investissement, échéanciers de remboursement et rapports d'activité.
        </p>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="text-[11px] uppercase font-bold text-[#5c403f]">Total investi</div>
            <div className="text-[22px] font-black mt-1 notranslate" translate="no">{formatPrice(totalInvesti)}</div>
            <div className="text-[11px] text-green-600 mt-1">
              {contribs.length} contribution(s) active(s)
            </div>
          </div>
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="text-[11px] uppercase font-bold text-[#5c403f]">Parts détenues</div>
            <div className="text-[22px] font-black mt-1">
              {equityContribs.length ? `${equityContribs.length} participation(s)` : "Aucune part"}
            </div>
            <div className="text-[11px] text-[#5c403f] mt-1 notranslate" translate="no">
              {equityContribs.length
                ? `${formatPrice(equityValue)} en capital`
                : "Participez au capital d'entreprises pour détenir des parts."}
            </div>
          </div>
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="text-[11px] uppercase font-bold text-[#5c403f]">Prêts en cours</div>
            <div className="text-[22px] font-black mt-1">
              {loanContribs.length} prêt(s) actif(s)
            </div>
            <div className="text-[11px] text-amber-700 mt-1">
              {repayments.filter((r: any) => r.statut === "retard").length} échéance(s) en retard
            </div>
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#071b36]">Historique de mes contributions</h3>

            {selectedProjectId && (
              <div className="mt-5 rounded-xl border border-[#e5bdbb] p-4 bg-slate-50/50">
                <h4 className="font-bold text-[14px] text-[#071b36]">Rapports périodiques du projet</h4>
                <div className="mt-3 space-y-2">
                  {reports.length > 0 ? (
                    reports.map((report: any) => (
                      <div key={report.id} className="rounded-lg bg-white border border-slate-200 p-3">
                        <div className="flex justify-between gap-3 text-[11px] font-bold">
                          <span>{report.period_start} → {report.period_end}</span>
                          <span className="text-[#087e8b]">{report.status}</span>
                        </div>
                        <p className="mt-2 text-[11px] text-[#5c403f]">{report.narrative || "Aucun commentaire"}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-[#5c403f]">Aucun rapport publié pour ce projet.</p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              {contribs.length > 0 ? (
                contribs.map((c: any) => (
                  <div key={c.id} className="border rounded-xl p-4 flex justify-between items-center gap-4 bg-slate-50/30">
                    <div className="flex-1">
                      <div className="font-bold text-[14px] text-[#071b36]">
                        {c.projet?.nom || "Projet"} · <span className="capitalize">{c.type?.replace("_", " ")}</span>
                      </div>
                      <div className="text-[11px] text-[#5c403f] mt-1">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : "—"} ·{" "}
                        <span className="font-bold text-slate-800 notranslate" translate="no">{formatPrice(Number(c.montant || 0))}</span>
                        {c.pourcentage ? ` · ${c.pourcentage}%` : ""}
                        {c.tauxInteret ? ` · Taux ${c.tauxInteret}%` : ""}
                      </div>
                    </div>
                    {c.contratPdf && (
                      <a
                        href={c.contratPdf}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        📄 Contrat PDF
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p className="font-bold text-base text-[#071b36]">Vous n'avez pas encore contribué à un projet.</p>
                  <p className="text-xs text-[#5c403f] mt-1">
                    Découvrez les projets en cours et participez au financement des entreprises africaines.
                  </p>
                  <Link
                    href="/financement"
                    className="inline-block mt-4 rounded-xl bg-[#9e001f] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#800019]"
                  >
                    Explorer les projets →
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#071b36]">Échéanciers de remboursement</h3>
            <p className="text-xs text-[#5c403f] mt-1">
              Suivi des remboursements en capital et intérêts de vos prêts participatifs.
            </p>
            <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
              {repayments.length > 0 ? (
                repayments.map((r: any) => (
                  <div key={r.id} className="text-xs border rounded-lg p-3 bg-slate-50/50">
                    <div className="flex justify-between font-bold">
                      <span>Échéance {r.date_prevue}</span>
                      <span className={r.statut === "paye" ? "text-green-600" : "text-amber-700"}>
                        {r.statut}
                      </span>
                    </div>
                    <div className="mt-1 text-slate-600 notranslate" translate="no">
                      Montant : {formatPrice(Number(r.total || 0))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">Aucune échéance de prêt en cours.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
