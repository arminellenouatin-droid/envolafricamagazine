"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type SafeUser = {
  id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  role?: string;
  country?: string;
};

interface CampaignCreative {
  id: string;
  titre: string;
  texte?: string | null;
  bouton?: string | null;
  media_url?: string | null;
  destination_url: string;
  statut_moderation: "en_attente" | "approuvee" | "refusee" | "suspendue";
  motif_refus?: string | null;
}

interface Campaign {
  id: string;
  nom: string;
  objectif: string;
  type: string;
  modele_facturation: string;
  enchere: number;
  budget_total: number;
  budget_consomme: number;
  date_debut: string;
  date_fin: string;
  statut: "brouillon" | "en_moderation" | "active" | "en_pause" | "terminee" | "refusee";
  created_at: string;
  ad_creatives?: CampaignCreative[];
}

const OBJECTIVES = [
  {
    id: "notoriete",
    title: "Notoriété de marque",
    desc: "Maximisez vos vues et l'impact visuel auprès des décideurs africains.",
    icon: "🌟",
  },
  {
    id: "trafic",
    title: "Trafic qualifié",
    desc: "Générez des visites vers votre site web, boutique ou application.",
    icon: "🚀",
  },
  {
    id: "conversion",
    title: "Vente & Conversion",
    desc: "Incitez à l'achat direct, à la réservation ou à la demande de devis.",
    icon: "💎",
  },
  {
    id: "telechargement",
    title: "Téléchargement & Leads",
    desc: "Recueillez des prospects ou favorisez l'installation d'une application.",
    icon: "📲",
  },
];

const FORMAT_OPTIONS = [
  {
    id: "wab_feed_native",
    name: "Native In-Feed WAB",
    badge: "Populaire",
    desc: "S'intègre harmonieusement dans le fil d'actualités communautaire WAB.",
    dim: "Format dynamique Responsive",
    cpmBase: 1200,
  },
  {
    id: "article_inline_1",
    name: "Pavé Article MPU",
    badge: "Haute visibilité",
    desc: "Positionné au cœur des grands dossiers et analyses éditoriales.",
    dim: "300x250 ou 336x280",
    cpmBase: 1500,
  },
  {
    id: "leaderboard_home",
    name: "Leaderboard Accueil",
    badge: "Prestige",
    desc: "Bannière majestueuse en tête de la page d'accueil d'Envol Africa.",
    dim: "728x90 (Desktop) / 320x50 (Mobile)",
    cpmBase: 2000,
  },
  {
    id: "wab_video_between",
    name: "Vidéo In-Stream WAB",
    badge: "Impact maximal",
    desc: "Spot vidéo captivant entre deux clips de la plateforme WAB Vidéo.",
    dim: "Vidéo 9:16 ou 16:9 (15-30s)",
    cpmBase: 2500,
  },
];

const TARGET_COUNTRIES = [
  { code: "BJ", label: "Bénin 🇧🇯" },
  { code: "CI", label: "Côte d'Ivoire 🇨🇮" },
  { code: "SN", label: "Sénégal 🇸🇳" },
  { code: "TG", label: "Togo 🇹🇬" },
  { code: "CM", label: "Cameroun 🇨🇲" },
  { code: "BF", label: "Burkina Faso 🇧🇫" },
  { code: "ML", label: "Mali 🇲🇱" },
  { code: "NE", label: "Niger 🇳🇪" },
  { code: "FR", label: "France & Europe (Diaspora) 🇪🇺" },
  { code: "US", label: "États-Unis & Canada 🇺🇸" },
];

const CONTENT_CATEGORIES = [
  "Économie & Finance",
  "Tech, IA & Télécoms",
  "Agrobusiness & Industrie",
  "Énergie & Transition",
  "Culture & Lifestyle",
  "Jeunesse & Innovation",
];

export default function EspaceAnnonceurClient({ user }: { user: SafeUser }) {
  const [activeTab, setActiveTab] = useState<"campaigns" | "wizard" | "compliance">("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalImpressions: 0,
    totalClicks: 0,
    activeCampaigns: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Wizard State (6 étapes)
  const [wizardStep, setWizardStep] = useState(1);
  const [savingCampaign, setSavingCampaign] = useState(false);

  // Étape 1 : Objectif
  const [selectedObjective, setSelectedObjective] = useState("notoriete");

  // Étape 2 : Format
  const [selectedSlot, setSelectedSlot] = useState("wab_feed_native");

  // Étape 3 : Créative
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [adCta, setAdCta] = useState("En savoir plus");
  const [adMediaUrl, setAdMediaUrl] = useState("/covers/envol-africa-cover-01.jpg");
  const [adDestUrl, setAdDestUrl] = useState("https://");

  // Étape 4 : Ciblage
  const [selectedCountries, setSelectedCountries] = useState<string[]>([user.country || "BJ", "CI", "SN"]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Économie & Finance", "Tech, IA & Télécoms"]);
  const [targetDevices, setTargetDevices] = useState<string[]>(["mobile", "desktop"]);

  // Étape 5 : Budget & Calendrier
  const [billingModel, setBillingModel] = useState<"cpm" | "cpc" | "cpd">("cpm");
  const [budgetTotal, setBudgetTotal] = useState<number>(30000); // 30 000 FCFA
  const [campaignDurationDays, setCampaignDurationDays] = useState<number>(14);

  // Étape 6 : Récapitulatif & Paiement
  const [paymentGateway, setPaymentGateway] = useState<"gateway" | "wallet">("gateway");

  // Chargement des données
  const fetchCampaigns = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/ads/campaigns");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      if (data.stats) setStats(data.stats);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Calculateur de portée en temps réel
  const currentFormat = FORMAT_OPTIONS.find((f) => f.id === selectedSlot) || FORMAT_OPTIONS[0];
  const cpmUnit = currentFormat.cpmBase;
  const estimatedImpressions = Math.max(1000, Math.round((budgetTotal / cpmUnit) * 1000));
  const estimatedClicks = Math.round(estimatedImpressions * 0.025); // CTR moyen estimé à 2.5%
  const budgetDaily = Math.round(budgetTotal / campaignDurationDays);

  // Toggle pays
  const toggleCountry = (code: string) => {
    if (selectedCountries.includes(code)) {
      if (selectedCountries.length > 1) {
        setSelectedCountries(selectedCountries.filter((c) => c !== code));
      }
    } else {
      setSelectedCountries([...selectedCountries, code]);
    }
  };

  // Toggle catégorie
  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // Soumission de la campagne
  const handleCreateCampaign = async () => {
    setActionMsg(null);
    if (!adTitle.trim() || !adDestUrl.trim() || adDestUrl === "https://") {
      setActionMsg({ type: "error", text: "Veuillez renseigner un titre et une URL de destination valide (HTTPS)." });
      return;
    }

    try {
      setSavingCampaign(true);
      const now = new Date();
      const dateFin = new Date(now.getTime() + campaignDurationDays * 24 * 60 * 60 * 1000);

      const payload = {
        nom: `Campagne ${adTitle.slice(0, 30)} - ${new Date().toLocaleDateString("fr-FR")}`,
        objectif: selectedObjective,
        type: "display",
        modeleFacturation: billingModel,
        enchere: cpmUnit,
        budgetTotal,
        budgetQuotidien: budgetDaily,
        dateDebut: now.toISOString(),
        dateFin: dateFin.toISOString(),
        targeting: {
          pays: selectedCountries,
          categories: selectedCategories,
          appareils: targetDevices,
        },
        creative: {
          titre: adTitle,
          texte: adDescription,
          bouton: adCta,
          mediaUrl: adMediaUrl,
          destinationUrl: adDestUrl,
        },
      };

      const res = await fetch("/api/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de créer la campagne");
      }

      setActionMsg({
        type: "success",
        text: "Votre campagne a été créée avec succès ! Elle a été transmise à l'équipe de modération (validation sous 4 heures).",
      });

      // Réinitialisation et retour aux campagnes
      setActiveTab("campaigns");
      setWizardStep(1);
      setAdTitle("");
      setAdDescription("");
      setAdDestUrl("https://");
      fetchCampaigns();
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "Erreur de création" });
    } finally {
      setSavingCampaign(false);
    }
  };

  // Mettre en pause ou reprendre une campagne
  const handleToggleStatus = async (camp: Campaign) => {
    const nextStatus = camp.statut === "active" ? "en_pause" : "active";
    try {
      const res = await fetch(`/api/ads/campaigns/${camp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action impossible");

      setCampaigns((prev) =>
        prev.map((c) => (c.id === camp.id ? { ...c, statut: nextStatus as any } : c))
      );
    } catch (e: any) {
      alert(e.message || "Erreur modification statut");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête Espace Annonceur */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Régie Commerciale Propriétaire Envol Ads
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
              Espace Annonceur Libre-Service
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Bienvenue, {user.prenom || user.nom || user.email}. Pilotez vos campagnes et diffusez vos messages avec un impact certifié.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/publicite/politique"
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 transition"
            >
              Charte & Éthique Ads
            </Link>
            <button
              onClick={() => {
                setActiveTab("wizard");
                setWizardStep(1);
              }}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition flex items-center gap-2"
            >
              <span>+</span> Lancer une Campagne
            </button>
          </div>
        </div>

        {/* Message d'action / notification */}
        {actionMsg && (
          <div
            className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between ${
              actionMsg.type === "success"
                ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-300"
                : "bg-rose-950/40 border-rose-700/60 text-rose-300"
            }`}
          >
            <span>{actionMsg.text}</span>
            <button
              onClick={() => setActionMsg(null)}
              className="text-xs opacity-75 hover:opacity-100"
            >
              ✕ Fermer
            </button>
          </div>
        )}

        {/* Cartes KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Campagnes Actives
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {stats.activeCampaigns}
            </div>
            <div className="text-xs text-emerald-400 mt-1">En diffusion temps réel</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Impressions Certifiées
            </div>
            <div className="text-2xl font-black text-amber-400 mt-2">
              {stats.totalImpressions.toLocaleString("fr-FR")}
            </div>
            <div className="text-xs text-slate-400 mt-1">Visibilité réelle &ge; 50% 1s</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Clics Qualifiés
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {stats.totalClicks.toLocaleString("fr-FR")}
            </div>
            <div className="text-xs text-slate-400 mt-1">Trafic direct vers vos liens</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Budget Consommé
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {stats.totalSpent.toLocaleString("fr-FR")} <span className="text-sm font-normal text-slate-400">FCFA</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Facturation au réel</div>
          </div>
        </div>

        {/* Navigation des Onglets */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "campaigns"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            📋 Mes Campagnes ({campaigns.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("wizard");
              setWizardStep(1);
            }}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "wizard"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ✨ Créer une Campagne
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "compliance"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            🛡️ Conformité & Règles
          </button>
        </div>

        {/* CONTENU ONGLET 1 : LISTE DES CAMPAGNES */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-16 text-slate-500">
                <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-3" />
                Chargement de vos campagnes...
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
                <div className="text-4xl">📢</div>
                <h3 className="text-lg font-bold text-white">Vous n&apos;avez aucune campagne en cours</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Diffusez vos messages auprès de milliers d&apos;abonnés, entrepreneurs et décideurs économiques africains.
                </p>
                <button
                  onClick={() => {
                    setActiveTab("wizard");
                    setWizardStep(1);
                  }}
                  className="px-5 py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                >
                  Créer ma première campagne
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {campaigns.map((camp) => {
                  const creative = camp.ad_creatives?.[0];
                  const isPending = camp.statut === "en_moderation";
                  const isActive = camp.statut === "active";
                  const isPaused = camp.statut === "en_pause";
                  const isRejected = camp.statut === "refusee";

                  return (
                    <div
                      key={camp.id}
                      className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-white">{camp.nom}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isActive
                                ? "bg-emerald-950 border border-emerald-700 text-emerald-300"
                                : isPending
                                ? "bg-amber-950 border border-amber-700 text-amber-300"
                                : isPaused
                                ? "bg-slate-800 border border-slate-700 text-slate-300"
                                : isRejected
                                ? "bg-rose-950 border border-rose-700 text-rose-300"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {isActive
                              ? "🟢 Active"
                              : isPending
                              ? "⏳ En modération"
                              : isPaused
                              ? "⏸️ En pause"
                              : isRejected
                              ? "❌ Refusée"
                              : camp.statut}
                          </span>
                          <span className="text-xs text-slate-500">
                            Modèle : {camp.modele_facturation.toUpperCase()} ({camp.enchere.toLocaleString()} FCFA)
                          </span>
                        </div>

                        {creative && (
                          <div className="text-xs text-slate-300 flex items-center gap-2">
                            <span className="font-semibold text-slate-400">Créative :</span>
                            <span>{creative.titre}</span>
                            <span className="text-slate-600">•</span>
                            <a
                              href={creative.destination_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-400 hover:underline truncate max-w-xs"
                            >
                              {creative.destination_url}
                            </a>
                          </div>
                        )}

                        {creative?.motif_refus && (
                          <div className="text-xs text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-800/50">
                            <strong>Motif de refus :</strong> {creative.motif_refus}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                          <div>
                            Budget consommé :{" "}
                            <span className="font-bold text-white">
                              {Number(camp.budget_consomme || 0).toLocaleString()} / {Number(camp.budget_total).toLocaleString()} FCFA
                            </span>
                          </div>
                          <div>
                            Période : {new Date(camp.date_debut).toLocaleDateString("fr-FR")} au{" "}
                            {new Date(camp.date_fin).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        {(isActive || isPaused) && (
                          <button
                            onClick={() => handleToggleStatus(camp)}
                            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                          >
                            {isActive ? "Mettre en pause" : "Réactiver"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONTENU ONGLET 2 : ASSISTANT DE CRÉATION EN 6 ÉTAPES */}
        {activeTab === "wizard" && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8">
            {/* Barre de progression des 6 étapes */}
            <div className="border-b border-slate-800 pb-6">
              <div className="flex items-center justify-between max-w-3xl mx-auto">
                {[
                  { n: 1, label: "Objectif" },
                  { n: 2, label: "Format" },
                  { n: 3, label: "Créative" },
                  { n: 4, label: "Ciblage" },
                  { n: 5, label: "Budget" },
                  { n: 6, label: "Paiement" },
                ].map((s) => (
                  <div key={s.n} className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        wizardStep === s.n
                          ? "bg-amber-500 text-slate-950 ring-4 ring-amber-500/20"
                          : wizardStep > s.n
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {wizardStep > s.n ? "✓" : s.n}
                    </div>
                    <span
                      className={`text-[11px] font-medium hidden sm:inline ${
                        wizardStep === s.n ? "text-amber-400" : "text-slate-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ÉTAPE 1 : OBJECTIF */}
            {wizardStep === 1 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div>
                  <h3 className="text-xl font-bold text-white">Étape 1 : Quel est votre objectif principal ?</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Ce choix calibre l&apos;algorithme de diffusion d&apos;Envol Ads pour maximiser votre retour sur investissement.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {OBJECTIVES.map((obj) => (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => setSelectedObjective(obj.id)}
                      className={`p-5 rounded-2xl text-left border transition ${
                        selectedObjective === obj.id
                          ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/30"
                          : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-3xl mb-2">{obj.icon}</div>
                      <div className="font-bold text-white text-base">{obj.title}</div>
                      <div className="text-xs text-slate-400 mt-1">{obj.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-6 py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                  >
                    Continuer vers le format →
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : FORMAT & EMPLACEMENT */}
            {wizardStep === 2 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div>
                  <h3 className="text-xl font-bold text-white">Étape 2 : Choisissez l&apos;emplacement de diffusion</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Sélectionnez le format qui correspond le mieux à votre création publicitaire.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FORMAT_OPTIONS.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`p-5 rounded-2xl text-left border transition ${
                        selectedSlot === slot.id
                          ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/30"
                          : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-base">{slot.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-400/20 text-amber-300">
                          {slot.badge}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-2">{slot.desc}</div>
                      <div className="text-[11px] text-slate-500 mt-3 font-mono">
                        {slot.dim} • CPM base : {slot.cpmBase.toLocaleString()} FCFA
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                  >
                    Continuer vers la créative →
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : CRÉATIVE & VISUEL AVEC LIVE PREVIEW */}
            {wizardStep === 3 && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                  <h3 className="text-xl font-bold text-white">Étape 3 : Confectionnez votre annonce & prévisualisez</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Les annonces Envol Ads sont soignées, respectueuses des lecteurs et garanties sans pop-up intempestif.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  {/* Formulaire créative */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Titre d&apos;accroche (obligatoire) *
                      </label>
                      <input
                        type="text"
                        value={adTitle}
                        onChange={(e) => setAdTitle(e.target.value)}
                        placeholder="Ex: Découvrez la nouvelle solution solaire hybride"
                        maxLength={100}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {adTitle.length}/100 caractères
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Texte explicatif court
                      </label>
                      <textarea
                        value={adDescription}
                        onChange={(e) => setAdDescription(e.target.value)}
                        placeholder="Ex: Réduisez vos coûts d'énergie de 60% avec une installation garantie 10 ans partout en Afrique de l'Ouest."
                        rows={3}
                        maxLength={250}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        URL de destination (HTTPS obligatoire) *
                      </label>
                      <input
                        type="url"
                        value={adDestUrl}
                        onChange={(e) => setAdDestUrl(e.target.value)}
                        placeholder="https://votresite.com/offre"
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Bouton d&apos;action (CTA)
                        </label>
                        <select
                          value={adCta}
                          onChange={(e) => setAdCta(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-sm"
                        >
                          <option>En savoir plus</option>
                          <option>Découvrir l&apos;offre</option>
                          <option>Acheter maintenant</option>
                          <option>Demander un devis</option>
                          <option>S&apos;inscrire</option>
                          <option>Télécharger</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Visuel / Image URL
                        </label>
                        <input
                          type="text"
                          value={adMediaUrl}
                          onChange={(e) => setAdMediaUrl(e.target.value)}
                          placeholder="/covers/envol-africa-cover-01.jpg"
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Prévisualisation dynamique en direct */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Aperçu de rendu en direct</span>
                      <span className="text-[10px] text-amber-400">Mode {currentFormat.name}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                      {/* Simulation de rendu de l'annonce */}
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90 shadow-md">
                        <div className="p-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-amber-400 tracking-wide uppercase text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10">
                            Sponsorisé • Envol Ads
                          </span>
                          <span>🔒 Annonce vérifiée</span>
                        </div>

                        {adMediaUrl && (
                          <div className="w-full h-44 bg-slate-800 relative overflow-hidden">
                            <img
                              src={adMediaUrl}
                              alt="Aperçu annonce"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as any).src = "/covers/envol-africa-cover-01.jpg";
                              }}
                            />
                          </div>
                        )}

                        <div className="p-4 space-y-2">
                          <h4 className="text-sm font-bold text-white line-clamp-2">
                            {adTitle || "Votre titre d'accroche percutant apparaîtra ici"}
                          </h4>
                          <p className="text-xs text-slate-300 line-clamp-3">
                            {adDescription ||
                              "La description détaillée de votre offre paraîtra ici, valorisant vos produits et services."}
                          </p>
                          <div className="pt-2 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                              {adDestUrl}
                            </span>
                            <span className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold shadow-sm">
                              {adCta} →
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={() => {
                      if (!adTitle.trim()) {
                        alert("Veuillez saisir un titre d'annonce.");
                        return;
                      }
                      setWizardStep(4);
                    }}
                    className="px-6 py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                  >
                    Continuer vers le ciblage →
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAPE 4 : CIBLAGE GÉOGRAPHIQUE & AUDIENCE */}
            {wizardStep === 4 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div>
                  <h3 className="text-xl font-bold text-white">Étape 4 : Définissez votre audience & géolocalisation</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Diffusez auprès des utilisateurs situés dans vos pays cibles ou intéressés par des thématiques précises.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Pays ciblés (sélection multiple)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TARGET_COUNTRIES.map((cty) => {
                        const isSelected = selectedCountries.includes(cty.code);
                        return (
                          <button
                            key={cty.code}
                            type="button"
                            onClick={() => toggleCountry(cty.code)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border text-left flex items-center justify-between transition ${
                              isSelected
                                ? "bg-amber-500/15 border-amber-400 text-amber-300 font-bold"
                                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <span>{cty.label}</span>
                            <span>{isSelected ? "✓" : "+"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Centres d&apos;intérêt / Catégories de contenu
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CONTENT_CATEGORIES.map((cat) => {
                        const isSelected = selectedCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleCategory(cat)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border text-left flex items-center justify-between transition ${
                              isSelected
                                ? "bg-amber-500/15 border-amber-400 text-amber-300 font-bold"
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <span>{cat}</span>
                            <span>{isSelected ? "✓" : "+"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Appareils
                    </label>
                    <div className="flex gap-4">
                      {["mobile", "desktop"].map((dev) => (
                        <label key={dev} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={targetDevices.includes(dev)}
                            onChange={(e) => {
                              if (e.target.checked) setTargetDevices([...targetDevices, dev]);
                              else if (targetDevices.length > 1)
                                setTargetDevices(targetDevices.filter((d) => d !== dev));
                            }}
                            className="rounded border-slate-700 bg-slate-900 text-amber-500"
                          />
                          <span>{dev === "mobile" ? "📱 Smartphones & Tablettes" : "💻 Ordinateurs Desktop"}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={() => setWizardStep(5)}
                    className="px-6 py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                  >
                    Continuer vers le budget →
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAPE 5 : BUDGET, CALENDRIER & CALCULATEUR */}
            {wizardStep === 5 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div>
                  <h3 className="text-xl font-bold text-white">Étape 5 : Budget, Modèle de facturation & Calendrier</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Définissez votre investissement. Le simulateur estime immédiatement votre couverture.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Modèle de facturation
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "cpm", label: "CPM (Impressions)", desc: "Coût par mille vues certifiées" },
                        { id: "cpc", label: "CPC (Clics)", desc: "Facturation au clic réel qualifié" },
                        { id: "cpd", label: "CPD (Journée fixe)", desc: "Visibilité garantie 24h/24" },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setBillingModel(m.id as any)}
                          className={`p-3 rounded-xl text-left border transition ${
                            billingModel === m.id
                              ? "bg-amber-500/15 border-amber-400 text-amber-300"
                              : "bg-slate-900 border-slate-800 text-slate-400"
                          }`}
                        >
                          <div className="font-bold text-sm text-white">{m.label}</div>
                          <div className="text-[10px] text-slate-400 mt-1">{m.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Budget global (FCFA)
                    </label>
                    <div className="flex gap-2 mb-3">
                      {[15000, 30000, 75000, 150000].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBudgetTotal(b)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            budgetTotal === b
                              ? "bg-amber-500 text-slate-950 border-amber-400"
                              : "bg-slate-900 text-slate-300 border-slate-700"
                          }`}
                        >
                          {b.toLocaleString()} F
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={budgetTotal}
                      onChange={(e) => setBudgetTotal(Math.max(5000, Number(e.target.value)))}
                      min={5000}
                      step={5000}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono font-bold text-base focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Durée de la campagne : {campaignDurationDays} jours
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={60}
                      value={campaignDurationDays}
                      onChange={(e) => setCampaignDurationDays(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                      <span>3 jours</span>
                      <span>14 jours</span>
                      <span>30 jours</span>
                      <span>60 jours</span>
                    </div>
                  </div>

                  {/* Simulateur / Estimation en direct */}
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      ⚡ Estimation d&apos;impact en temps réel
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      <div>
                        <div className="text-xs text-slate-400">Vues estimées</div>
                        <div className="text-xl font-black text-white">
                          ~{estimatedImpressions.toLocaleString("fr-FR")}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Clics estimés</div>
                        <div className="text-xl font-black text-white">
                          ~{estimatedClicks.toLocaleString("fr-FR")}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Rythme quotidien</div>
                        <div className="text-xl font-black text-amber-400">
                          {budgetDaily.toLocaleString("fr-FR")} F/j
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setWizardStep(4)}
                    className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={() => setWizardStep(6)}
                    className="px-6 py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                  >
                    Vérifier & Valider →
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAPE 6 : RÉCAPITULATIF & SOUMISSION */}
            {wizardStep === 6 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div>
                  <h3 className="text-xl font-bold text-white">Étape 6 : Récapitulatif & Finalisation de la campagne</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Vérifiez attentivement les informations avant de transmettre votre campagne à la modération.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-sm text-slate-400">Annonce :</span>
                    <span className="text-sm font-bold text-white">{adTitle}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-sm text-slate-400">Format & Slot :</span>
                    <span className="text-sm font-bold text-amber-400">{currentFormat.name}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-sm text-slate-400">Ciblage :</span>
                    <span className="text-sm text-slate-200">
                      {selectedCountries.join(", ")} • {selectedCategories.length} catégories
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-sm text-slate-400">Durée :</span>
                    <span className="text-sm text-slate-200">{campaignDurationDays} jours</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-bold text-white">Budget total engagé :</span>
                    <span className="text-2xl font-black text-amber-400">
                      {budgetTotal.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>

                {/* Option de facturation / débit */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Mode de règlement
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentGateway("gateway")}
                      className={`p-4 rounded-xl border text-left transition ${
                        paymentGateway === "gateway"
                          ? "border-amber-400 bg-amber-500/10 text-white"
                          : "border-slate-800 bg-slate-900/50 text-slate-400"
                      }`}
                    >
                      <div className="font-bold text-sm">💳 Mobile Money / Carte</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Paiement sécurisé via Moneroo & Chariow (150+ pays)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentGateway("wallet")}
                      className={`p-4 rounded-xl border text-left transition ${
                        paymentGateway === "wallet"
                          ? "border-amber-400 bg-amber-500/10 text-white"
                          : "border-slate-800 bg-slate-900/50 text-slate-400"
                      }`}
                    >
                      <div className="font-bold text-sm">💼 Solde Portefeuille EAM</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Débit immédiat sur votre compte annonceur
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                  ℹ️ <strong>Réglementation & Sécurité :</strong> Toute campagne publicitaire est revue par l&apos;équipe éditoriale Envol Africa Magazine dans un délai maximal de 4 heures ouvrées avant d&apos;être activée. Les contenus trompeurs, illégaux ou contraires aux règles Google Ads et ARPP sont strictement rejetés.
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setWizardStep(5)}
                    className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={handleCreateCampaign}
                    disabled={savingCampaign}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition disabled:opacity-50"
                  >
                    {savingCampaign ? "Enregistrement en cours..." : "🚀 Valider & Soumettre en Modération"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTENU ONGLET 3 : RÈGLES & CONFORMITÉ */}
        {activeTab === "compliance" && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-bold text-white">Charte d&apos;Intégrité Publicitaire Envol Ads</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Envol Ads s&apos;engage à protéger ses lecteurs, ses annonceurs et l&apos;indépendance éditoriale d&apos;Envol Africa Magazine.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-amber-400 text-sm">✅ Critères d&apos;éligibilité</h4>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  <li>Identité claire de l&apos;annonceur et lien de destination en HTTPS actif.</li>
                  <li>Visuels professionnels respectant les ratios d&apos;affichage recommandés.</li>
                  <li>Promesses commerciales vérifiables et conformes au droit des affaires.</li>
                  <li>Transparence totale : mention « Sponsorisé » apposée systématiquement.</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-rose-400 text-sm">❌ Contenus strictement prohibés</h4>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  <li>Promesses de gains financiers irréalistes, schémas pyramidaux ou crypto-fraudes.</li>
                  <li>Substances illicites, armes ou jeux de hasard non agréés.</li>
                  <li>Clickbait trompeur simulant une notification système ou fausse alerte.</li>
                  <li>Collecte déloyale de données personnelles sans politique de confidentialité.</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Besoin d&apos;un dispositif sur-mesure ou grand compte ?</span>
              <Link
                href="/publicite"
                className="text-amber-400 hover:underline font-semibold"
              >
                Consulter notre Régie Print & Web →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
