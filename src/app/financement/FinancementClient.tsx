"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CrowdProject } from "@/lib/crowdfunding-db";
import { useLocale } from "@/components/LocaleProvider";

const SECTEURS_POPULAIRES = [
  "Tous",
  "Agroalimentaire",
  "Tech",
  "Énergie",
  "Santé",
  "Éducation",
  "Commerce",
  "Tourisme",
];

const PAYS_OPTIONS = [
  { code: "all", label: "Tous les pays" },
  { code: "BJ", label: "Bénin 🇧🇯" },
  { code: "CI", label: "Côte d'Ivoire 🇨🇮" },
  { code: "SN", label: "Sénégal 🇸🇳" },
  { code: "TG", label: "Togo 🇹🇬" },
  { code: "CM", label: "Cameroun 🇨🇲" },
  { code: "NG", label: "Nigeria 🇳🇬" },
];

function CrowdfundingRoiSimulator() {
  const { formatPrice } = useLocale();
  const [montant, setMontant] = useState(500000);
  const [type, setType] = useState<"pret" | "equity" | "don">("pret");
  const [dureeMois, setDureeMois] = useState(24);

  // Prêt calcul
  const tauxAnnuel = 0.095;
  const interetsTotaux = Math.round(montant * tauxAnnuel * (dureeMois / 12));
  const totalRembourse = montant + interetsTotaux;
  const mensualite = Math.round(totalRembourse / dureeMois);

  // Equity calcul
  const valProjection = Math.round(montant * 2.4);
  const plusValueEstimee = valProjection - montant;

  return (
    <section className="relative mx-auto -mt-8 mb-10 max-w-7xl px-5 sm:px-8 z-20">
      <div className="overflow-hidden rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-2xl lg:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#f0e7dc] pb-5 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff4e0] px-3 py-1 text-[10px] font-black uppercase text-[#a36300]">
              <span className="material-symbols-outlined text-[15px]">calculate</span> Simulateur de Rendement & ROI
            </div>
            <h3 className="mt-2 font-display text-2xl font-black text-[#082843]">
              Estimez l&apos;impact et les gains de votre investissement
            </h3>
            <p className="mt-1 text-xs text-[#5c403f]">
              Simulez vos retours financiers et dividendes selon le mode d&apos;engagement choisi.
            </p>
          </div>
          <div className="flex rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setType("pret")}
              className={`rounded-full px-4 py-2 transition ${
                type === "pret" ? "bg-[#082843] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ↗ Prêt (9.5%)
            </button>
            <button
              type="button"
              onClick={() => setType("equity")}
              className={`rounded-full px-4 py-2 transition ${
                type === "equity" ? "bg-[#f59e0b] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              % Parts / Equity
            </button>
            <button
              type="button"
              onClick={() => setType("don")}
              className={`rounded-full px-4 py-2 transition ${
                type === "don" ? "bg-[#9e001f] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ❤️ Don Solidaire
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Montant engagé
                </label>
                <strong className="font-display text-2xl font-black text-[#9e001f]">{formatPrice(montant)}</strong>
              </div>
              <input
                type="range"
                min={25000}
                max={10000000}
                step={25000}
                value={montant}
                onChange={(e) => setMontant(Number(e.target.value))}
                className="mt-3 h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#9e001f]"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-400 font-bold">
                <span>25 000 FCFA</span>
                <span>5 000 000 FCFA</span>
                <span>10 000 000 FCFA</span>
              </div>
            </div>

            {type === "pret" && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Durée d&apos;amortissement
                  </label>
                  <strong className="text-sm font-black text-slate-800">{dureeMois} mois ({dureeMois / 12} ans)</strong>
                </div>
                <div className="mt-2 flex gap-2">
                  {[12, 24, 36].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDureeMois(m)}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition border ${
                        dureeMois === m ? "border-[#082843] bg-[#082843] text-white shadow-sm" : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {m} mois
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs leading-5 text-slate-500">
              {type === "pret" && "Les intérêts sont versés mensuellement selon un échéancier certifié par convention obligataire contractuelle."}
              {type === "equity" && "Les prises de participation font l'objet d'un pacte d'actionnaires formel, de certificats de parts et de droits de vote aux assemblées générales."}
              {type === "don" && "Les dons bénéficient d'un reçu fiscal officiel, d'un badge Pionnier sur WAB et de contreparties exclusives des porteurs de projets."}
            </p>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-[#10141d] to-[#1a1f2c] p-6 text-white shadow-xl border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#f6c453]">Projection financière détaillée</p>
            {type === "pret" && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs text-slate-300">Mensualité perçue :</span>
                  <strong className="text-base font-black text-emerald-400">{formatPrice(mensualite)} / mois</strong>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs text-slate-300">Intérêts nets générés :</span>
                  <strong className="text-base font-black text-[#f6c453]">+{formatPrice(interetsTotaux)}</strong>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-white">Total remboursé :</span>
                  <strong className="font-display text-xl font-black text-white">{formatPrice(totalRembourse)}</strong>
                </div>
              </div>
            )}
            {type === "equity" && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs text-slate-300">Multiple projeté (3-5 ans) :</span>
                  <strong className="text-base font-black text-[#f6c453]">2.4× le capital investi</strong>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs text-slate-300">Plus-value potentielle :</span>
                  <strong className="text-base font-black text-emerald-400">+{formatPrice(plusValueEstimee)}</strong>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-white">Valorisation projetée :</span>
                  <strong className="font-display text-xl font-black text-white">{formatPrice(valProjection)}</strong>
                </div>
              </div>
            )}
            {type === "don" && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs text-slate-300">Badge donateur officiel :</span>
                  <strong className="text-sm font-bold text-[#ffdad8]">Badge Certifié WAB</strong>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs text-slate-300">Impact économique direct :</span>
                  <strong className="text-sm font-bold text-emerald-400">100% alloué au projet</strong>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-white">Reçu fiscal :</span>
                  <strong className="text-xs font-bold text-white">Délivré instantanément</strong>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("projets");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-6 w-full rounded-full bg-[#9e001f] py-3 text-center text-xs font-black text-white shadow-lg hover:bg-[#c8102e] transition"
            >
              Découvrir les campagnes éligibles →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function FinancementClient() {
  const { formatPrice } = useLocale();
  const [projets, setProjets] = useState<CrowdProject[]>([]);
  const [now] = useState(() => Date.now());
  const [filtreSecteur, setFiltreSecteur] = useState("all");
  const [filtreType, setFiltreType] = useState("all");
  const [filtrePays, setFiltrePays] = useState("all");
  const [filtreRisque, setFiltreRisque] = useState("all");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({
    totalLeve: 0,
    totalRecherche: 0,
    tauxSucces: 0,
    totalInvestisseurs: 0,
    nbPays: 0,
    nbProjets: 0,
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("eam_current_platform", "crowdfunding");
    }
    fetch("/api/crowdfunding/stats", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setStats({
            totalLeve: data.totalLeve || 0,
            totalRecherche: data.totalRecherche || 0,
            tauxSucces: data.tauxSucces || 0,
            totalInvestisseurs: data.totalInvestisseurs || 0,
            nbPays: data.nbPays || 0,
            nbProjets: data.nbProjets || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  const loadProjects = useCallback(
    async (reset = false) => {
      if (loading || (!reset && !hasMore)) return;
      setLoading(true);
      const params = new URLSearchParams({ limit: "12", statut: "en_cours" });
      if (filtreSecteur !== "all") params.set("secteur", filtreSecteur);
      if (filtreType !== "all") params.set("type", filtreType);
      if (filtrePays !== "all") params.set("pays", filtrePays);
      if (!reset && nextCursor) params.set("cursor", nextCursor);
      try {
        const response = await fetch(`/api/crowdfunding/projects?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await response.json();
        const incoming = Array.isArray(data.projets) ? (data.projets as CrowdProject[]) : [];
        setProjets((current) =>
          reset
            ? incoming
            : [...current, ...incoming.filter((item) => !current.some((existing) => existing.id === item.id))]
        );
        setNextCursor(data.nextCursor || null);
        setHasMore(Boolean(data.nextCursor));
      } finally {
        setLoading(false);
      }
    },
    [filtrePays, filtreSecteur, filtreType, hasMore, loading, nextCursor]
  );

  useEffect(() => {
    void loadProjects(true);
  }, [filtrePays, filtreSecteur, filtreType]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadProjects(false);
      },
      { rootMargin: "600px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadProjects]);

  const filtered = projets.filter((p) => {
    if (filtreRisque === "all") return true;
    return (p.niveauRisque || "").toLowerCase() === filtreRisque.toLowerCase();
  });

  function selectModeAndScroll(mode: string) {
    setFiltreType(mode);
    const target = document.getElementById("projets");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-24 text-slate-900 sm:pb-12">
      {/* Hero Section Fintech Prestige */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#10141d] via-[#1a1f2c] to-[#0f131a] text-white">
        {/* Glow & Ambient Lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-[#9e001f]/25 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-20 h-[450px] w-[450px] rounded-full bg-[#f6c453]/15 blur-[120px]"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#f6c453] animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#ffdad8]">
              AfricaCrowdFunding · Simple · Sûr · Temps réel
            </span>
          </div>

          <div className="mt-6 max-w-3xl">
            <h1 className="font-display text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-[56px]">
              Financez l&apos;Afrique qui{" "}
              <span className="bg-gradient-to-r from-[#ffdad8] via-[#f6c453] to-[#ff8c94] bg-clip-text text-transparent">
                entreprend
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Porteurs de projets et investisseurs se rencontrent autour de 3 modes d’investissement transparents. Suivez chaque levée en temps réel avec des conventions formelles et des paiements sécurisés.
            </p>

            {/* CTAs Primaires */}
            <div className="mt-7 flex flex-wrap gap-3.5">
              <Link
                href="/financement/dashboard/porteur"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9e001f] px-7 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-[#9e001f]/40 transition hover:bg-[#800019] hover:shadow-2xl active:scale-95"
              >
                <span>Déposer mon projet</span>
                <span>→</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("projets");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <span>Explorer les campagnes</span>
                <span>↓</span>
              </button>
              <Link
                href="/financement/messages"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/20 px-6 py-3.5 text-sm font-bold text-amber-300 backdrop-blur-sm transition hover:bg-amber-500/30"
              >
                <img src="/crowdfunding-message-icon.png" alt="" className="h-4 w-4 object-contain" />
                <span>Espace Investisseurs</span>
              </Link>
            </div>
          </div>

          {/* Baromètre Financier & Impact Pan-Africain Dynamique */}
          {(() => {
            const dynamicTotalLeve = stats.totalLeve > 0
              ? stats.totalLeve
              : projets.reduce((acc, p) => acc + (p.montantCollecte || 0), 0);

            const dynamicTotalInvestisseurs = stats.totalInvestisseurs > 0
              ? stats.totalInvestisseurs
              : projets.reduce((acc, p) => acc + (p.investisseurs || 0), 0);

            const dynamicPaysCount = stats.nbPays > 0
              ? stats.nbPays
              : new Set(projets.map((p) => p.pays).filter(Boolean)).size || 1;

            const dynamicTauxSucces = stats.tauxSucces > 0
              ? stats.tauxSucces
              : (projets.length > 0
                  ? Math.round(
                      (projets.filter((p) => p.statut === "objectif_atteint" || (p.montantCollecte || 0) >= (p.montantRecherche || 1)).length /
                        projets.length) *
                        1000
                    ) / 10
                  : 91.5);

            return (
              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Total levé</span>
                  <strong className="mt-1 block font-display text-xl sm:text-2xl font-black text-[#f6c453]">
                    {formatPrice(dynamicTotalLeve)}
                  </strong>
                  <span className="text-[10px] text-emerald-400">● 100% sécurisé Moneroo</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Taux de succès</span>
                  <strong className="mt-1 block font-display text-xl sm:text-2xl font-black text-white">
                    {dynamicTauxSucces.toFixed(1)}%
                  </strong>
                  <span className="text-[10px] text-slate-400">des objectifs financés</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Investisseurs</span>
                  <strong className="mt-1 block font-display text-xl sm:text-2xl font-black text-white">
                    {dynamicTotalInvestisseurs.toLocaleString("fr-FR")}
                  </strong>
                  <span className="text-[10px] text-[#ffdad8]">Continent & Diaspora</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Pays actifs</span>
                  <strong className="mt-1 block font-display text-xl sm:text-2xl font-black text-[#8ee0c0]">
                    {dynamicPaysCount} {dynamicPaysCount > 1 ? "États" : "État"}
                  </strong>
                  <span className="text-[10px] text-slate-400">Zone CEDEAO, CEMAC & +</span>
                </div>
              </div>
            );
          })()}

          {/* Les 3 Cartes de Modes d'Investissement */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {/* Mode Don */}
            <div
              onClick={() => selectModeAndScroll("don")}
              className={`group cursor-pointer rounded-2xl border p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                filtreType === "don"
                  ? "border-[#9e001f] bg-[#9e001f]/20 shadow-lg shadow-[#9e001f]/20"
                  : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffdad8] to-[#f48fb1] text-xl shadow-inner">
                ❤️
              </div>
              <h3 className="mt-4 font-display text-lg font-black text-white group-hover:text-[#ffdad8]">
                Don Solidaire
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                Montant libre, attribution d&apos;un badge Soutien et contribution directe à l&apos;impact social et communautaire.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#ffdad8]">
                <span>Soutenir un projet</span>
                <span>→</span>
              </div>
            </div>

            {/* Mode Prise de Part */}
            <div
              onClick={() => selectModeAndScroll("prise_part")}
              className={`group cursor-pointer rounded-2xl border p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                filtreType === "prise_part"
                  ? "border-[#f6c453] bg-[#f6c453]/20 shadow-lg shadow-[#f6c453]/20"
                  : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff3dc] to-[#ffe082] text-xl font-bold text-[#a36300] shadow-inner">
                %
              </div>
              <h3 className="mt-4 font-display text-lg font-black text-white group-hover:text-[#f6c453]">
                Prise de Participation
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                Entrez au capital d&apos;une entreprise africaine prometteuse. Pacte d&apos;actionnaires et convention d&apos;investissement formalisés.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#f6c453]">
                <span>Devenir actionnaire</span>
                <span>→</span>
              </div>
            </div>

            {/* Mode Prêt */}
            <div
              onClick={() => selectModeAndScroll("pret")}
              className={`group cursor-pointer rounded-2xl border p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                filtreType === "pret"
                  ? "border-[#8ee0c0] bg-[#8ee0c0]/20 shadow-lg shadow-[#8ee0c0]/20"
                  : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e9f7f5] to-[#80cbc4] text-xl font-bold text-[#00695c] shadow-inner">
                ↗
              </div>
              <h3 className="mt-4 font-display text-lg font-black text-white group-hover:text-[#8ee0c0]">
                Prêt Participatif
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                Prêtez avec un taux d&apos;intérêt défini et un calendrier d&apos;amortissement transparent et contractuel.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#8ee0c0]">
                <span>Prêter & Rentabiliser</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simulateur ROI & Gains Interactif */}
      <CrowdfundingRoiSimulator />

      {/* Barre de Filtres Flottante & Responsive */}
      <div className="sticky top-0 z-30 border-b border-[#e5bdbb]/40 bg-white/95 px-5 py-3.5 shadow-sm backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          {/* Sélecteur de Mode Segmenté */}
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFiltreType("all")}
              className={`rounded-full px-3 py-1.5 transition ${
                filtreType === "all" ? "bg-[#9e001f] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setFiltreType("don")}
              className={`rounded-full px-3 py-1.5 transition ${
                filtreType === "don" ? "bg-[#9e001f] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ❤️ Don
            </button>
            <button
              type="button"
              onClick={() => setFiltreType("prise_part")}
              className={`rounded-full px-3 py-1.5 transition ${
                filtreType === "prise_part" ? "bg-[#9e001f] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              % Parts
            </button>
            <button
              type="button"
              onClick={() => setFiltreType("pret")}
              className={`rounded-full px-3 py-1.5 transition ${
                filtreType === "pret" ? "bg-[#9e001f] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ↗ Prêt
            </button>
          </div>

          {/* Filtres déroulants : Pays & Risque */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filtrePays}
              onChange={(e) => setFiltrePays(e.target.value)}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#9e001f]"
            >
              {PAYS_OPTIONS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={filtreRisque}
              onChange={(e) => setFiltreRisque(e.target.value)}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#9e001f]"
            >
              <option value="all">Tous risques</option>
              <option value="faible">Faible risque</option>
              <option value="modere">Risque modéré</option>
              <option value="eleve">Risque audacieux</option>
            </select>

            <span className="hidden text-xs font-bold text-[#5c403f] lg:inline-block">
              {filtered.length} projet{filtered.length > 1 ? "s" : ""} en direct
            </span>
          </div>
        </div>

        {/* Secteurs défilables horizontalement */}
        <div className="mx-auto mt-2.5 flex max-w-7xl items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Secteur :
          </span>
          {SECTEURS_POPULAIRES.map((secteur) => {
            const val = secteur === "Tous" ? "all" : secteur;
            const isActive = filtreSecteur === val;
            return (
              <button
                key={secteur}
                type="button"
                onClick={() => setFiltreSecteur(val)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#082843] text-white shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {secteur}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grille des Campagnes Actives */}
      <main id="projets" className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
                Collectes en direct
              </p>
            </div>
            <h2 className="mt-1 font-display text-2xl font-black text-[#082843] sm:text-3xl">
              Campagnes ouvertes au financement
            </h2>
          </div>

          <Link
            href="/financement/dashboard/investisseur"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9e001f] hover:underline"
          >
            <span>Tableau de bord Investisseur</span>
            <span>→</span>
          </Link>
        </div>

        {/* Grille des projets */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p: CrowdProject) => {
            const pct =
              p.montantRecherche > 0
                ? Math.round((p.montantCollecte / p.montantRecherche) * 100)
                : 0;
            const reste = Math.ceil((new Date(p.dateFin).getTime() - now) / 86400000);

            // Risque badge color
            const risqueLower = (p.niveauRisque || "").toLowerCase();
            const risqueColor =
              risqueLower.includes("faible")
                ? "bg-emerald-500/90 text-white"
                : risqueLower.includes("modere") || risqueLower.includes("moyen")
                ? "bg-amber-500/90 text-white"
                : "bg-red-500/90 text-white";

            return (
              <Link
                key={p.id}
                href={`/financement/projets/${p.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#9e001f]/30 hover:shadow-xl"
              >
                {/* Image de couverture avec badges */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                  <img
                    src={p.images?.[0] || "/covers/envol-africa-cover-01.jpg"}
                    alt={p.nom}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Badges superposés */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md ${
                        p.statut === "en_cours"
                          ? "bg-emerald-600 text-white"
                          : p.statut === "objectif_atteint"
                          ? "bg-[#9e001f] text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {p.statut.replace(/_/g, " ")}
                    </span>
                    <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                      {p.secteur}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide backdrop-blur-md ${risqueColor}`}
                    >
                      {p.niveauRisque || "Modéré"}
                    </span>
                  </div>
                </div>

                {/* Contenu de la carte */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-black leading-snug text-[#082843] transition group-hover:text-[#9e001f]">
                    {p.nom}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#5c403f]">
                    {p.description}
                  </p>

                  {/* Barre de Progression Bicolore */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#5c403f]">Collecte en cours</span>
                      <span className="font-black text-[#9e001f]">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#9e001f] via-[#c91f3b] to-[#f6c453] transition-all duration-500"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-black text-slate-900 notranslate" translate="no">
                        {formatPrice(p.montantCollecte)}
                      </span>
                      <span className="text-slate-400 notranslate" translate="no">
                        sur {formatPrice(p.montantRecherche)}
                      </span>
                    </div>
                  </div>

                  {/* Répartition des 3 modes */}
                  <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-50 p-2 text-center text-[10px]">
                    <div>
                      <span className="block font-black text-slate-800">{p.repartition?.dons ?? 0}%</span>
                      <span className="text-slate-500">Don</span>
                    </div>
                    <div>
                      <span className="block font-black text-slate-800">{p.repartition?.prise_part ?? 0}%</span>
                      <span className="text-slate-500">Parts</span>
                    </div>
                    <div>
                      <span className="block font-black text-slate-800">{p.repartition?.pret ?? 0}%</span>
                      <span className="text-slate-500">Prêt</span>
                    </div>
                  </div>

                  {/* Footer de la carte */}
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs text-[#5c403f]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {reste > 0 ? `${reste} j restants` : "Clôturé"}
                    </span>
                    <span className="font-bold text-slate-700">
                      {p.investisseurs || 0} investisseur{(p.investisseurs || 0) > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* CTA Card */}
                  <div className="mt-4">
                    <span className="inline-flex w-full items-center justify-center rounded-xl bg-[#082843] py-2.5 text-xs font-bold text-white shadow-sm transition group-hover:bg-[#9e001f]">
                      Participer à ce projet →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {loading && (
          <div className="mt-12 rounded-2xl border border-slate-200 bg-white py-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#9e001f] border-t-transparent" />
            <p className="mt-3 text-sm font-bold text-slate-600">Chargement des campagnes en cours…</p>
          </div>
        )}

        <div ref={sentinelRef} aria-hidden="true" className="h-4" />

        {!loading && filtered.length === 0 && (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-[#e5bdbb] bg-white p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffdad8] text-2xl text-[#9e001f]">
              🚀
            </div>
            <h3 className="font-display text-lg font-bold text-[#082843]">
              Aucune campagne active trouvée pour ces filtres
            </h3>
            <p className="mt-2 text-xs text-[#5c403f]">
              Soyez le premier à lancer une levée de fonds dans cette catégorie !
            </p>
            <Link
              href="/financement/dashboard/porteur"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#9e001f] px-6 py-2.5 text-xs font-bold text-white shadow"
            >
              Déposer mon projet →
            </Link>
          </div>
        )}
      </main>

      {/* Section Cagnottes Solidaires */}
      <section className="border-t border-[#e5bdbb]/40 bg-gradient-to-b from-[#f8f5f4] to-[#f0eded] py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#9e001f]">
                <span>❤️</span>
                <span>Initiatives Citoyennes</span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-black text-[#082843] sm:text-3xl">
                Cagnottes & Causes Solidaires
              </h2>
              <p className="mt-1 text-xs text-[#5c403f] sm:text-sm">
                Soutenez directement une cause éducative, environnementale ou médicale sur le continent.
              </p>
            </div>

            <Link
              href="/financement/dashboard/porteur"
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#9e001f] bg-white px-5 py-2.5 text-xs font-bold text-[#9e001f] shadow-sm hover:bg-[#9e001f] hover:text-white"
            >
              + Créer une cagnotte
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              {
                id: 1,
                titre: "Éducation numérique des jeunes filles",
                pays: "Bénin 🇧🇯",
                montant: `${formatPrice(750000)} / ${formatPrice(1500000)}`,
                pct: 50,
                donateurs: 38,
              },
              {
                id: 2,
                titre: "Forage d'eau potable et maraîchage",
                pays: "Sénégal 🇸🇳",
                montant: `${formatPrice(1800000)} / ${formatPrice(2000000)}`,
                pct: 90,
                donateurs: 74,
              },
              {
                id: 3,
                titre: "Coopérative solaire de transformation agro",
                pays: "Côte d'Ivoire 🇨🇮",
                montant: `${formatPrice(1200000)} / ${formatPrice(3000000)}`,
                pct: 40,
                donateurs: 52,
              },
            ].map((c) => (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffdad8] text-lg text-[#9e001f]">
                      ❤️
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                      {c.pays}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-base font-bold text-[#082843]">
                    {c.titre}
                  </h3>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#5c403f]">{c.montant}</span>
                      <span className="text-[#9e001f]">{c.pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#9e001f]"
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="text-[#5c403f]">{c.donateurs} donateurs</span>
                  <Link
                    href="/financement/dashboard/porteur"
                    className="font-extrabold text-[#9e001f] hover:underline"
                  >
                    Contribuer →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pactes d'Investisseurs & Sécurité Juridique Fintech */}
      <section className="border-t border-[#eadfce] bg-[#10141d] text-white py-16 px-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="rounded-full bg-[#f6c453]/20 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#f6c453]">
              Gouvernance & Protection des Capitaux
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-black">
              Pactes d&apos;Investisseurs & Cadre Juridique
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              AfricaCrowdFunding opère selon les standards de conformité financière les plus stricts en zone UEMOA / CEMAC. Chaque opération d&apos;investissement est encadrée par des actes juridiques opposables.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#9e001f] text-2xl text-white">
                🛡️
              </span>
              <h3 className="mt-4 font-display text-base font-black text-white">Séquestre Bancaire Moneroo</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Les fonds collectés sont bloqués sur compte séquestre et ne sont libérés au porteur qu&apos;en cas d&apos;atteinte de l&apos;objectif minimum de la levée.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#f6c453] text-2xl text-[#513000]">
                📜
              </span>
              <h3 className="mt-4 font-display text-base font-black text-white">Pacte d&apos;Actionnaires Signé</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Génération automatique de conventions d&apos;émission obligataire et de pactes d&apos;actionnaires conformes au droit OHADA avec signature électronique.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#8ee0c0] text-2xl text-[#004d40]">
                📊
              </span>
              <h3 className="mt-4 font-display text-base font-black text-white">Reporting Trimestriel Audité</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Suivi transparent des KPI financiers, des comptes de résultats et accès à un espace de dialogue réservé entre investisseurs et fondateurs.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#ff8c94] text-2xl text-[#880e4f]">
                ↩️
              </span>
              <h3 className="mt-4 font-display text-base font-black text-white">Garantie Tout ou Rien</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Si la campagne n&apos;atteint pas son seuil de réussite (100% de l&apos;objectif) avant la date limite, tous les souscripteurs sont intégralement remboursés sans frais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Barre de navigation basse collante sur Mobile (Sticky Bottom Bar) */}
      <nav
        aria-label="Navigation rapide Financement mobile"
        className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-2 shadow-2xl backdrop-blur-md sm:hidden"
      >
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("projets");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-[#9e001f]"
        >
          <span className="text-base">🚀</span>
          <span>Campagnes</span>
        </button>
        <Link
          href="/financement/dashboard/investisseur"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-600 hover:text-[#9e001f]"
        >
          <span className="text-base">📈</span>
          <span>Investir</span>
        </Link>
        <Link
          href="/financement/dashboard/porteur"
          className="flex -translate-y-2 flex-col items-center justify-center rounded-full bg-[#9e001f] px-3.5 py-2 text-[10px] font-extrabold text-white shadow-lg shadow-[#9e001f]/40"
        >
          <span className="text-sm">+</span>
          <span>Déposer</span>
        </Link>
        <Link
          href="/don"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-600 hover:text-[#9e001f]"
        >
          <span className="text-base">❤️</span>
          <span>Don</span>
        </Link>
        <Link
          href="/compte"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-600 hover:text-[#9e001f]"
        >
          <span className="text-base">👤</span>
          <span>Compte</span>
        </Link>
      </nav>
    </div>
  );
}

