"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type SafeAdmin = {
  id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  role?: string;
};

interface AdminOverviewStats {
  activeCampaigns: number;
  inModerationCampaigns: number;
  pendingCreatives: number;
  unresolvedReports: number;
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  ctr: string;
  activeSlots: number;
  totalSlots: number;
}

interface CreativeModerationItem {
  id: string;
  titre: string;
  texte?: string | null;
  bouton?: string | null;
  media_url?: string | null;
  destination_url: string;
  statut_moderation: "en_attente" | "approuvee" | "refusee" | "suspendue";
  motif_refus?: string | null;
  created_at: string;
  ad_campaigns?: {
    id: string;
    nom: string;
    objectif: string;
    type: string;
    budget_total: number;
    statut: string;
    ad_advertisers?: {
      nom: string;
      email_facturation: string;
      entreprise?: string;
    };
  };
}

interface AdSlotItem {
  id: string;
  code: string;
  nom: string;
  type: string;
  format_dimensions: string;
  cpm_plancher: number;
  cpc_plancher: number;
  cpd_fixe: number;
  priorite: number;
  actif: boolean;
}

interface AdReportItem {
  id: string;
  motif: string;
  details?: string | null;
  traite: boolean;
  decision?: string | null;
  created_at: string;
  ad_creatives?: {
    id: string;
    titre: string;
    media_url?: string | null;
    destination_url: string;
    statut_moderation: string;
  };
}

export default function AdminPubliciteClient({ user }: { user: SafeAdmin }) {
  const [activeTab, setActiveTab] = useState<"moderation" | "slots" | "reports">("moderation");
  const [overview, setOverview] = useState<AdminOverviewStats | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Modération
  const [creatives, setCreatives] = useState<CreativeModerationItem[]>([]);
  const [loadingCreatives, setLoadingCreatives] = useState(false);
  const [modFilter, setModFilter] = useState<"en_attente" | "all">("en_attente");
  const [rejectModalItem, setRejectModalItem] = useState<CreativeModerationItem | null>(null);
  const [rejectReason, setRejectReason] = useState("Non-respect de la charte de qualité ou lien de destination non conforme.");
  const [processingMod, setProcessingMod] = useState(false);

  // Slots
  const [slots, setSlots] = useState<AdSlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AdSlotItem | null>(null);
  const [savingSlot, setSavingSlot] = useState(false);

  // Signalements
  const [reports, setReports] = useState<AdReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [processingReport, setProcessingReport] = useState(false);

  // Notifications
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1. Fetch overview
  const loadOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await fetch("/api/admin/ads/overview");
      if (res.ok) {
        const data = await res.json();
        setOverview(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOverview(false);
    }
  };

  // 2. Fetch creatives
  const loadCreatives = async (status = modFilter) => {
    try {
      setLoadingCreatives(true);
      const res = await fetch(`/api/admin/ads/moderation?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setCreatives(data.creatives || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCreatives(false);
    }
  };

  // 3. Fetch slots
  const loadSlots = async () => {
    try {
      setLoadingSlots(true);
      const res = await fetch("/api/admin/ads/slots");
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSlots(false);
    }
  };

  // 4. Fetch reports
  const loadReports = async () => {
    try {
      setLoadingReports(true);
      const res = await fetch("/api/admin/ads/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadOverview();
    loadCreatives();
  }, []);

  useEffect(() => {
    if (activeTab === "slots" && slots.length === 0) loadSlots();
    if (activeTab === "reports" && reports.length === 0) loadReports();
    if (activeTab === "moderation") loadCreatives(modFilter);
  }, [activeTab, modFilter]);

  // Actions de modération
  const handleModerate = async (
    creativeId: string,
    action: "approve" | "reject" | "suspend",
    motif?: string
  ) => {
    try {
      setProcessingMod(true);
      setAlertMsg(null);

      const res = await fetch("/api/admin/ads/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creativeId, action, motif }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec modération");

      setAlertMsg({ type: "success", text: data.message });
      setRejectModalItem(null);
      loadOverview();
      loadCreatives(modFilter);
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message });
    } finally {
      setProcessingMod(false);
    }
  };

  // Sauvegarder modification de slot
  const handleSaveSlot = async () => {
    if (!editingSlot) return;
    try {
      setSavingSlot(true);
      const res = await fetch("/api/admin/ads/slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: editingSlot.id,
          actif: editingSlot.actif,
          cpm_plancher: Number(editingSlot.cpm_plancher),
          cpc_plancher: Number(editingSlot.cpc_plancher),
          cpd_fixe: Number(editingSlot.cpd_fixe),
          priorite: Number(editingSlot.priorite),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec modification slot");

      setAlertMsg({ type: "success", text: "Slot publicitaire mis à jour avec succès" });
      setEditingSlot(null);
      loadSlots();
      loadOverview();
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message });
    } finally {
      setSavingSlot(false);
    }
  };

  // Traiter un signalement
  const handleProcessReport = async (reportId: string, decision: string, suspendCreative = false, creativeId?: string) => {
    try {
      setProcessingReport(true);
      const res = await fetch("/api/admin/ads/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, decision, suspendCreative, creativeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec traitement");

      setAlertMsg({ type: "success", text: "Signalement traité." });
      loadReports();
      loadOverview();
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message });
    } finally {
      setProcessingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation retour admin */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              ← Console Principale
            </Link>
            <span className="text-xs text-slate-500">/</span>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Régie Envol Ads & Publicités
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Connecté : <span className="font-semibold text-white">{user.email}</span> ({user.role})
          </div>
        </div>

        {/* Titre & Alerte */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Administration Régie Envol Ads
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Contrôlez les campagnes, modérez les créatives en temps réel et pilotez l&apos;inventaire des 16 slots.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/publicite/espace"
              target="_blank"
              className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              Voir Espace Annonceur ↗
            </Link>
          </div>
        </div>

        {/* Message toast */}
        {alertMsg && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold border flex items-center justify-between ${
              alertMsg.type === "success"
                ? "bg-emerald-950/60 border-emerald-700 text-emerald-300"
                : "bg-rose-950/60 border-rose-700 text-rose-300"
            }`}
          >
            <span>{alertMsg.text}</span>
            <button onClick={() => setAlertMsg(null)} className="text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Cartes KPI Admin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase">En attente Modération</div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {overview?.pendingCreatives ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Créatives à valider</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase">Campagnes Actives</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {overview?.activeCampaigns ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">En diffusion directe</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase">Signalements Non Résolus</div>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {overview?.unresolvedReports ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Plaintes lecteurs</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase">Revenus Consommés</div>
            <div className="text-2xl font-black text-white mt-1">
              {(overview?.totalRevenue ?? 0).toLocaleString("fr-FR")} <span className="text-xs font-normal">FCFA</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Facturation effective</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase">Inventaire Slots</div>
            <div className="text-2xl font-black text-white mt-1">
              {overview?.activeSlots ?? 0} / {overview?.totalSlots ?? 16}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Emplacements actifs</div>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab("moderation")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "moderation"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            🛡️ Modération des Créatives ({overview?.pendingCreatives ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("slots")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "slots"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ⚙️ Inventaire des 16 Slots & Tarifs
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "reports"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ⚠️ Signalements Utilisateurs ({overview?.unresolvedReports ?? 0})
          </button>
        </div>

        {/* ONGLET 1 : MODÉRATION DES CRÉATIVES */}
        {activeTab === "moderation" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModFilter("en_attente")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    modFilter === "en_attente"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  En attente uniquement
                </button>
                <button
                  onClick={() => setModFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    modFilter === "all"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  Toutes les créatives
                </button>
              </div>

              <button
                onClick={() => loadCreatives(modFilter)}
                className="text-xs text-slate-400 hover:text-white"
              >
                🔄 Actualiser
              </button>
            </div>

            {loadingCreatives ? (
              <div className="text-center py-16 text-slate-500">Chargement des créatives...</div>
            ) : creatives.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-3xl">🎉</div>
                <div className="font-bold text-white">Aucune annonce en attente de modération</div>
                <div className="text-xs text-slate-400">Toutes les soumissions ont été traitées.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {creatives.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col lg:flex-row gap-6 items-start justify-between"
                  >
                    <div className="flex gap-4 items-start flex-1">
                      {/* Vignette */}
                      <div className="w-24 h-24 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                        {item.media_url ? (
                          <img
                            src={item.media_url}
                            alt={item.titre}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as any).src = "/covers/envol-africa-cover-01.jpg";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                            Texte seul
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-base">{item.titre}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.statut_moderation === "en_attente"
                                ? "bg-amber-950 border border-amber-700 text-amber-300"
                                : item.statut_moderation === "approuvee"
                                ? "bg-emerald-950 border border-emerald-700 text-emerald-300"
                                : "bg-rose-950 border border-rose-700 text-rose-300"
                            }`}
                          >
                            {item.statut_moderation}
                          </span>
                        </div>

                        {item.texte && (
                          <p className="text-xs text-slate-300 line-clamp-2">{item.texte}</p>
                        )}

                        <div className="text-xs text-slate-400 flex flex-wrap gap-4 pt-1">
                          <div>
                            Cible :{" "}
                            <a
                              href={item.destination_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-400 hover:underline"
                            >
                              {item.destination_url}
                            </a>
                          </div>
                          <div>CTA : &laquo; {item.bouton || "En savoir plus"} &raquo;</div>
                        </div>

                        <div className="text-[11px] text-slate-500 pt-1">
                          Campagne : <span className="text-slate-300">{item.ad_campaigns?.nom}</span> • Annonceur :{" "}
                          <span className="text-slate-300">{item.ad_campaigns?.ad_advertisers?.nom}</span> (
                          {item.ad_campaigns?.ad_advertisers?.email_facturation})
                        </div>

                        {item.motif_refus && (
                          <div className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-900 mt-2">
                            <strong>Motif :</strong> {item.motif_refus}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions de modération */}
                    <div className="flex sm:flex-col gap-2 shrink-0 w-full lg:w-48">
                      {item.statut_moderation === "en_attente" ? (
                        <>
                          <button
                            onClick={() => handleModerate(item.id, "approve")}
                            disabled={processingMod}
                            className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
                          >
                            ✅ Approuver
                          </button>
                          <button
                            onClick={() => setRejectModalItem(item)}
                            disabled={processingMod}
                            className="w-full px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow transition disabled:opacity-50"
                          >
                            ❌ Refuser
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleModerate(item.id, "suspend")}
                          disabled={processingMod}
                          className="w-full px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition disabled:opacity-50"
                        >
                          ⏸️ Suspendre
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal de refus motivé */}
            {rejectModalItem && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                  <h3 className="text-lg font-bold text-white">Refuser l&apos;annonce publicitaire</h3>
                  <p className="text-xs text-slate-400">
                    Conformément aux règles de transparence, l&apos;annonceur recevra une justification détaillée.
                  </p>

                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-300">
                      Motif du refus *
                    </label>
                    <select
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                    >
                      <option value="Image non conforme ou de mauvaise qualité résolutive.">
                        Image non conforme ou de mauvaise qualité
                      </option>
                      <option value="Lien de destination inaccessible, brisé ou non sécurisé (HTTP).">
                        Lien de destination inaccessible ou non HTTPS
                      </option>
                      <option value="Contenu trompeur, clickbait ou allégations infondées.">
                        Contenu trompeur / Clickbait
                      </option>
                      <option value="Secteur prohibé (crypto-spéculation, armes, tabac, jeu non agréé).">
                        Secteur prohibé par la charte
                      </option>
                      <option value="Autre non-conformité éditoriale.">
                        Autre non-conformité
                      </option>
                    </select>

                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setRejectModalItem(null)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleModerate(rejectModalItem.id, "reject", rejectReason)}
                      disabled={processingMod}
                      className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow"
                    >
                      Confirmer le refus
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ONGLET 2 : INVENTAIRE DES 16 SLOTS & TARIFS */}
        {activeTab === "slots" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Inventaire des 16 Emplacements Envol Ads</h3>
                <p className="text-xs text-slate-400">
                  Gérez l&apos;activation des slots et configurez les planchers CPM / CPC / CPD.
                </p>
              </div>
              <button
                onClick={loadSlots}
                className="text-xs text-slate-400 hover:text-white"
              >
                🔄 Recharger
              </button>
            </div>

            {loadingSlots ? (
              <div className="text-center py-16 text-slate-500">Chargement des slots...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((s) => (
                  <div
                    key={s.id}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-400">{s.code}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.actif
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {s.actif ? "Actif" : "Inactif"}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm mt-1">{s.nom}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        {s.type.toUpperCase()} • {s.format_dimensions}
                      </p>
                    </div>

                    <div className="border-t border-slate-800 pt-3 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Plancher CPM :</span>
                        <span className="font-bold text-white">{s.cpm_plancher.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Plancher CPC :</span>
                        <span className="font-bold text-white">{s.cpc_plancher.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">CPD fixe :</span>
                        <span className="font-bold text-white">{s.cpd_fixe.toLocaleString()} FCFA</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingSlot(s)}
                      className="w-full mt-2 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      ✏️ Modifier Tarifs & Statut
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Édition de slot */}
            {editingSlot && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                  <h3 className="text-lg font-bold text-white">Configurer le slot {editingSlot.code}</h3>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingSlot.actif}
                        onChange={(e) => setEditingSlot({ ...editingSlot, actif: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500"
                      />
                      <span>Emplacement activé pour la diffusion</span>
                    </label>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        CPM Plancher (FCFA)
                      </label>
                      <input
                        type="number"
                        value={editingSlot.cpm_plancher}
                        onChange={(e) =>
                          setEditingSlot({ ...editingSlot, cpm_plancher: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        CPC Plancher (FCFA)
                      </label>
                      <input
                        type="number"
                        value={editingSlot.cpc_plancher}
                        onChange={(e) =>
                          setEditingSlot({ ...editingSlot, cpc_plancher: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        CPD Fixe (FCFA / jour)
                      </label>
                      <input
                        type="number"
                        value={editingSlot.cpd_fixe}
                        onChange={(e) =>
                          setEditingSlot({ ...editingSlot, cpd_fixe: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingSlot(null)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveSlot}
                      disabled={savingSlot}
                      className="px-5 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow"
                    >
                      {savingSlot ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ONGLET 3 : SIGNALEMENTS UTILISATEURS */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Signalements de Publicités par les Utilisateurs</h3>
                <p className="text-xs text-slate-400">
                  Transparence totale : tout lecteur peut signaler une publicité non conforme.
                </p>
              </div>
              <button
                onClick={loadReports}
                className="text-xs text-slate-400 hover:text-white"
              >
                🔄 Recharger
              </button>
            </div>

            {loadingReports ? (
              <div className="text-center py-16 text-slate-500">Chargement des signalements...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-3xl">🛡️</div>
                <div className="font-bold text-white">Aucun signalement utilisateur</div>
                <div className="text-xs text-slate-400">Aucune plainte ou non-conformité rapportée.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row gap-4 items-start justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-400 text-sm">Motif : {rep.motif}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rep.traite
                              ? "bg-slate-800 text-slate-400"
                              : "bg-rose-950 text-rose-300 border border-rose-800"
                          }`}
                        >
                          {rep.traite ? "Traité" : "Non traité"}
                        </span>
                      </div>

                      {rep.details && (
                        <p className="text-xs text-slate-300 italic">« {rep.details} »</p>
                      )}

                      {rep.ad_creatives && (
                        <div className="text-xs text-slate-400 pt-1">
                          Annonce : <span className="text-white font-semibold">{rep.ad_creatives.titre}</span> (
                          <a
                            href={rep.ad_creatives.destination_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:underline"
                          >
                            lien
                          </a>
                          )
                        </div>
                      )}

                      {rep.decision && (
                        <div className="text-xs text-slate-500 pt-1">Décision prise : {rep.decision}</div>
                      )}
                    </div>

                    {!rep.traite && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleProcessReport(rep.id, "Rejet du signalement (conforme)")}
                          disabled={processingReport}
                          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                        >
                          Classer sans suite
                        </button>
                        <button
                          onClick={() =>
                            handleProcessReport(
                              rep.id,
                              "Suspension de l'annonce",
                              true,
                              rep.ad_creatives?.id
                            )
                          }
                          disabled={processingReport}
                          className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-xs font-bold text-white shadow transition"
                        >
                          Suspendre l&apos;annonce
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
