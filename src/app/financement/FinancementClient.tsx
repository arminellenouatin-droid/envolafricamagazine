"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CrowdProject } from "@/lib/crowdfunding-db";

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

export default function FinancementClient() {
  const [projets, setProjets] = useState<CrowdProject[]>([]);
  const [now] = useState(() => Date.now());
  const [filtreSecteur, setFiltreSecteur] = useState("all");
  const [filtreType, setFiltreType] = useState("all");
  const [filtrePays, setFiltrePays] = useState("all");
  const [filtreRisque, setFiltreRisque] = useState("all");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
            </div>
          </div>

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
                      <span className="font-black text-slate-900">
                        {p.montantCollecte.toLocaleString()} F CFA
                      </span>
                      <span className="text-slate-400">
                        sur {p.montantRecherche.toLocaleString()} F
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
                montant: "750 000 / 1 500 000 F CFA",
                pct: 50,
                donateurs: 38,
              },
              {
                id: 2,
                titre: "Forage d'eau potable et maraîchage",
                pays: "Sénégal 🇸🇳",
                montant: "1 800 000 / 2 000 000 F CFA",
                pct: 90,
                donateurs: 74,
              },
              {
                id: 3,
                titre: "Coopérative solaire de transformation agro",
                pays: "Côte d'Ivoire 🇨🇮",
                montant: "1 200 000 / 3 000 000 F CFA",
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

