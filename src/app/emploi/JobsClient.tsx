/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AFRICA_COUNTRIES } from "@/lib/africa-context";

type Offer = {
  id: string;
  title: string;
  description: string;
  country: string;
  city: string;
  sector: string;
  contractType: string;
  salary?: string;
  skills: string[];
  publishedAt: string;
  expiresAt: string;
  isBoosted: boolean;
  views: number;
  applications: number;
};

const countries = AFRICA_COUNTRIES.map((country) => country.name);
const sectors = [
  "Tech",
  "Finance",
  "Santé",
  "Agro",
  "Commerce",
  "Marketing",
  "Data",
  "Éducation",
  "Industrie",
];

const countryFromLocale: Record<string, string> = {
  BJ: "Bénin",
  CI: "Côte d’Ivoire",
  SN: "Sénégal",
  TG: "Togo",
  NG: "Nigeria",
  KE: "Kenya",
  GH: "Ghana",
  MA: "Maroc",
  RW: "Rwanda",
  CM: "Cameroun",
};

export default function JobsClient() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [sector, setSector] = useState("");
  const sentinel = useRef<HTMLDivElement | null>(null);

  const loadOffers = useCallback(async (nextPage: number, reset = false) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(nextPage), limit: "8" });
    if (search) params.set("q", search);
    if (country) params.set("country", country);
    if (sector) params.set("sector", sector);
    const interests = JSON.parse(localStorage.getItem("ea_jobs_interests") ?? "[]") as string[];
    if (interests.length) params.set("interests", interests.slice(0, 10).join(","));
    try {
      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = await response.json();
      setOffers((previous) => (reset ? data.offers : [...previous, ...data.offers]));
      setHasMore(data.pagination.hasMore);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }, [country, search, sector]);

  useEffect(() => {
    loadOffers(1, true);
  }, [loadOffers]);

  useEffect(() => {
    fetch("/api/geo")
      .then((response) => response.json())
      .then((context) => {
        if (context.country) setCountry(context.country);
        localStorage.setItem("ea_visitor_context", JSON.stringify(context));
      })
      .catch(() => {
        const locale = Intl.DateTimeFormat().resolvedOptions().locale;
        const region = locale.split("-")[1];
        if (region && countryFromLocale[region]) setCountry(countryFromLocale[region]);
      });
  }, []);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadOffers(page + 1);
      },
      { rootMargin: "300px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadOffers, loading, page]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const terms = search.trim().toLocaleLowerCase().split(/\s+/).filter((term) => term.length > 2);
    const saved = JSON.parse(localStorage.getItem("ea_jobs_interests") ?? "[]") as string[];
    const interests = [...terms, ...saved.filter((term) => !terms.includes(term))].slice(0, 10);
    localStorage.setItem("ea_jobs_interests", JSON.stringify(interests));
    const visitorId = localStorage.getItem("ea_visitor_id") || crypto.randomUUID();
    localStorage.setItem("ea_visitor_id", visitorId);
    fetch("/api/jobs/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "search", query: search, visitorId, country }),
    }).catch(() => undefined);
    loadOffers(1, true);
  }

  function handleSelectSector(s: string) {
    const newSector = sector === s ? "" : s;
    setSector(newSector);
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-24 text-slate-900 sm:pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#071b36] via-[#0b2447] to-[#071b36] text-white">
        {/* Glow Effects */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-32 h-[450px] w-[450px] rounded-full bg-[#9e001f]/20 blur-[100px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-10 right-0 h-[400px] w-[400px] rounded-full bg-[#087e8b]/20 blur-[110px]"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#8ee0c0] animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8ee0c0]">
              Envol Africa Jobs · Panafricain & Confidentialité Garantie
            </span>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
            <div>
              <h1 className="font-display text-3xl font-black leading-[1.1] sm:text-5xl lg:text-[54px]">
                L’emploi africain, <br />
                <span className="bg-gradient-to-r from-[#8ee0c0] via-[#5be0b5] to-[#f6c453] bg-clip-text text-transparent">
                  connecté à vos ambitions.
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                Accédez aux opportunités professionnelles exclusives à travers 54 pays. Les coordonnées des recruteurs demeurent protégées jusqu’à votre décryptage pour une relation directe et de confiance.
              </p>
            </div>

            {/* Chiffres clés */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm transition-all hover:bg-white/10 sm:p-4">
                <strong className="block text-2xl font-black text-[#8ee0c0] sm:text-3xl">54</strong>
                <span className="text-[11px] font-medium text-slate-300 sm:text-xs">pays couverts</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm transition-all hover:bg-white/10 sm:p-4">
                <strong className="block text-2xl font-black text-[#f6c453] sm:text-3xl">200 F</strong>
                <span className="text-[11px] font-medium text-slate-300 sm:text-xs">pour décrypter</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm transition-all hover:bg-white/10 sm:p-4">
                <strong className="block text-2xl font-black text-white sm:text-3xl">2</strong>
                <span className="text-[11px] font-medium text-slate-300 sm:text-xs">offres gratuites PME</span>
              </div>
            </div>
          </div>

          {/* Formulaire de Recherche Unifié */}
          <form
            onSubmit={submitSearch}
            className="mt-8 rounded-2xl border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur-md md:grid md:grid-cols-[1.5fr_1fr_1fr_auto] md:gap-3"
          >
            <div className="relative mb-2 md:mb-0">
              <label className="sr-only" htmlFor="job-search">
                Métier, compétence ou mot-clé
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="job-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Poste, compétence, mot-clé..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-[#087e8b] focus:ring-2 focus:ring-[#087e8b]/20"
              />
            </div>

            <div className="mb-2 md:mb-0">
              <select
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#087e8b] focus:ring-2 focus:ring-[#087e8b]/20"
              >
                <option value="">Tous les pays d&apos;Afrique</option>
                {countries.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3 md:mb-0">
              <select
                value={sector}
                onChange={(event) => setSector(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#087e8b] focus:ring-2 focus:ring-[#087e8b]/20"
              >
                <option value="">Tous les secteurs</option>
                {sectors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="h-12 w-full rounded-xl bg-[#9e001f] px-7 font-bold text-white shadow-lg shadow-[#9e001f]/30 transition hover:bg-[#800019] hover:shadow-xl active:scale-[0.98] md:w-auto"
            >
              Rechercher
            </button>
          </form>

          {/* Filtres Tactiles par Chips Horizontaux (Mobile & Desktop) */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-slate-400">
              Secteurs rapides :
            </span>
            <button
              type="button"
              onClick={() => setSector("")}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                sector === ""
                  ? "bg-[#9e001f] text-white shadow-md shadow-[#9e001f]/30"
                  : "border border-white/20 bg-white/10 text-slate-200 hover:bg-white/20"
              }`}
            >
              Tous
            </button>
            {sectors.map((item) => {
              const isActive = sector === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSelectSector(item)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#8ee0c0] text-[#071b36] shadow-md shadow-[#8ee0c0]/30"
                      : "border border-white/20 bg-white/10 text-slate-200 hover:bg-white/20"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        {/* Header de la liste */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#e5bdbb]/40 pb-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#087e8b]" />
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#087e8b]">
                Opportunités Vérifiées
              </p>
            </div>
            <h2 className="mt-1 font-display text-2xl font-black text-[#082843] sm:text-3xl">
              Offres d&apos;emploi sélectionnées
            </h2>
            <p className="text-xs text-[#5c403f] sm:text-sm">
              {offers.length} offre{offers.length > 1 ? "s" : ""} disponible{offers.length > 1 ? "s" : ""} en temps réel
              {country ? ` · Filtré sur ${country}` : ""}
              {sector ? ` · Secteur ${sector}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/emploi/publier-candidature"
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:border-[#087e8b] hover:text-[#087e8b]"
            >
              Déposer mon CV
            </Link>
            <Link
              href="/emploi/publier-offre"
              className="rounded-full bg-[#087e8b] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#087e8b]/20 transition hover:bg-[#066c77]"
            >
              + Publier une offre
            </Link>
          </div>
        </div>

        {/* Grille principale : Offres + Sidebar */}
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Liste des offres */}
          <section className="space-y-4">
            {offers.map((offer) => (
              <article
                key={offer.id}
                className="group relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#9e001f]/40 hover:shadow-lg sm:p-6"
              >
                {/* Badge Boosté */}
                {offer.isBoosted && (
                  <span className="absolute top-0 right-6 rounded-b-xl bg-gradient-to-r from-[#f6c453] to-[#e6ac2f] px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-950 shadow-sm">
                    ★ Offre Sponsorisée
                  </span>
                )}

                <div className="flex flex-col gap-2 pr-0 sm:pr-28">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-[#087e8b]/10 px-2.5 py-1 font-bold text-[#087e8b]">
                      {offer.sector}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
                      {offer.contractType}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      Candidature en 1 clic
                    </span>
                  </div>

                  <h3 className="mt-1 font-display text-lg font-black text-[#082843] transition group-hover:text-[#9e001f] sm:text-xl">
                    {offer.title}
                  </h3>

                  <p className="line-clamp-2 text-xs leading-relaxed text-[#5c403f] sm:text-sm">
                    {offer.description}
                  </p>
                </div>

                {/* Métadonnées : Localisation, Salaire, Compétences */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <svg className="h-4 w-4 text-[#9e001f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {offer.city}, {offer.country}
                  </span>

                  {offer.salary && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-800">
                      💰 {offer.salary}
                    </span>
                  )}

                  {offer.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-[#087e8b]/20 bg-[#e9f7f5] px-2.5 py-0.5 text-[11px] font-bold text-[#087e8b]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Footer de la carte : Sécurité + CTA */}
                <div className="mt-5 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                      🔒 Recruteur protégé
                    </span>
                    <span>·</span>
                    <span>{offer.views} consultation{offer.views > 1 ? "s" : ""}</span>
                  </div>

                  <Link
                    href={`/emploi/offres/${offer.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#071b36] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#9e001f] active:scale-95"
                  >
                    <span>Voir l’offre & Décrypter</span>
                    <span>→</span>
                  </Link>
                </div>
              </article>
            ))}

            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center shadow-sm">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#087e8b] border-t-transparent" />
                <p className="mt-3 text-sm font-bold text-slate-600">Chargement des opportunités en cours…</p>
              </div>
            )}

            {!loading && offers.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-[#e5bdbb] bg-white p-12 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffdad8] text-2xl text-[#9e001f]">
                  🔍
                </div>
                <h3 className="font-display text-lg font-bold text-[#082843]">
                  Aucune offre ne correspond actuellement à vos filtres
                </h3>
                <p className="mt-2 text-xs text-[#5c403f]">
                  Modifiez votre recherche ou réinitialisez les filtres de pays et secteurs.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCountry("");
                    setSector("");
                  }}
                  className="mt-4 rounded-full bg-[#087e8b] px-5 py-2 text-xs font-bold text-white shadow"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}

            <div ref={sentinel} className="h-4" aria-hidden="true" />
          </section>

          {/* Sidebar Desktop */}
          <aside className="space-y-5">
            {/* Carte Candidat */}
            <div className="overflow-hidden rounded-2xl border border-[#087e8b]/20 bg-gradient-to-br from-[#e9f7f5] to-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#087e8b]">
                <span>🎓</span>
                <span>Espace Candidat</span>
              </div>
              <h3 className="mt-2 font-display text-xl font-black text-[#082843]">
                Multipliez vos opportunités
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Décryptez une offre immédiatement pour <strong>200 XOF</strong>, ou débloquez un pass illimité 24h, 7j ou 30j pour contacter les recruteurs directement.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/emploi/abonnements"
                  className="inline-flex items-center justify-center rounded-xl bg-[#087e8b] px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#066c77]"
                >
                  Découvrir les pass illimités →
                </Link>
                <Link
                  href="/emploi/publier-candidature"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-[#087e8b]"
                >
                  Déposer mon profil dans la CVthèque
                </Link>
              </div>
            </div>

            {/* Carte Entreprise */}
            <div className="overflow-hidden rounded-2xl border border-[#f6c453]/40 bg-gradient-to-br from-[#fff9ea] to-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#a36300]">
                <span>🏢</span>
                <span>Espace Recruteur</span>
              </div>
              <h3 className="mt-2 font-display text-xl font-black text-[#082843]">
                Recrutez les meilleurs talents
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Vos <strong>deux premières annonces sont 100% gratuites</strong>. Boostez vos publications pour toucher les cadres et experts du continent.
              </p>
              <Link
                href="/emploi/publier-offre"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#9e001f] px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#800019]"
              >
                Publier une annonce gratuite →
              </Link>
            </div>

            {/* Carte Confiance & Sécurité */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="font-display text-sm font-extrabold text-[#082843]">
                Pourquoi Envol Africa Jobs ?
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-[#5c403f]">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Protection contre le spam et les faux recruteurs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Rémunérations claires et profils vérifiés</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Paiements mobiles Moneroo (MTN, Moov, Orange, Wave)</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* Barre de navigation basse collante sur Mobile (Sticky Bottom Bar) */}
      <nav
        aria-label="Navigation rapide Emploi mobile"
        className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-2 shadow-2xl backdrop-blur-md sm:hidden"
      >
        <Link
          href="/emploi"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-[#9e001f]"
        >
          <span className="text-base">💼</span>
          <span>Offres</span>
        </Link>
        <Link
          href="/emploi/candidats"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-600 hover:text-[#087e8b]"
        >
          <span className="text-base">👥</span>
          <span>Candidats</span>
        </Link>
        <Link
          href="/emploi/publier-offre"
          className="flex -translate-y-2 flex-col items-center justify-center rounded-full bg-[#9e001f] px-3.5 py-2 text-[10px] font-extrabold text-white shadow-lg shadow-[#9e001f]/40"
        >
          <span className="text-sm">+</span>
          <span>Publier</span>
        </Link>
        <Link
          href="/emploi/abonnements"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-600 hover:text-[#087e8b]"
        >
          <span className="text-base">⭐</span>
          <span>Accès</span>
        </Link>
        <Link
          href="/compte"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-600 hover:text-[#087e8b]"
        >
          <span className="text-base">👤</span>
          <span>Compte</span>
        </Link>
      </nav>
    </div>
  );
}

