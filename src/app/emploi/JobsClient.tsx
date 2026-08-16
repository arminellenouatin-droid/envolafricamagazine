"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AFRICA_COUNTRIES } from "@/lib/africa-context";

type Offer = {
  id: string; title: string; description: string; country: string; city: string; sector: string; contractType: string; salary?: string; skills: string[]; publishedAt: string; expiresAt: string; isBoosted: boolean; views: number; applications: number;
};

const countries = AFRICA_COUNTRIES.map((country) => country.name);
const sectors = ["Finance", "Tech", "Commerce", "Data", "Marketing", "SantÃƒÂ©", "Agro", "Ãƒâ€°ducation", "Industrie"];

const countryFromLocale: Record<string, string> = { BJ: "BÃƒÂ©nin", CI: "CÃƒÂ´te dÃ¢â‚¬â„¢Ivoire", SN: "SÃƒÂ©nÃƒÂ©gal", TG: "Togo", NG: "Nigeria", KE: "Kenya", GH: "Ghana", MA: "Maroc", RW: "Rwanda", CM: "Cameroun" };

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
    const params = new URLSearchParams({ page: String(nextPage), limit: "6" });
    if (search) params.set("q", search);
    if (country) params.set("country", country);
    if (sector) params.set("sector", sector);
    const interests = JSON.parse(localStorage.getItem("ea_jobs_interests") ?? "[]") as string[];
    if (interests.length) params.set("interests", interests.slice(0, 10).join(","));
    try {
      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = await response.json();
      setOffers((previous) => reset ? data.offers : [...previous, ...data.offers]);
      setHasMore(data.pagination.hasMore);
      setTimeout(() => setPage(nextPage), 0);
    } finally { setLoading(false); }
  }, [country, search, sector]);

  useEffect(() => { const timer = window.setTimeout(() => { void loadOffers(1, true); }, 0); return () => window.clearTimeout(timer); }, [loadOffers]);

  useEffect(() => {
    fetch("/api/geo").then((response) => response.json()).then((context) => {
      if (context.country) setCountry(context.country);
      localStorage.setItem("ea_visitor_context", JSON.stringify(context));
    }).catch(() => {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      const region = locale.split("-")[1];
      if (region && countryFromLocale[region]) setCountry(countryFromLocale[region]);
    });
  }, []);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadOffers(page + 1);
    }, { rootMargin: "300px" });
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
    fetch("/api/jobs/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "search", query: search, visitorId, country }) }).catch(() => undefined);
    loadOffers(1, true);
  }

  return <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
    <section className="bg-[#071b36] text-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <p className="mb-4 text-xs font-bold uppercase tracking-[.22em] text-[#8ee0c0]">Envol Africa Jobs Ã‚Â· 54 pays, une seule opportunitÃƒÂ©</p>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">LÃ¢â‚¬â„¢emploi africain, <span className="text-[#8ee0c0]">prÃƒÂ¨s de vous.</span></h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">DÃƒÂ©couvrez les offres de votre ville et de votre rÃƒÂ©gion. Les coordonnÃƒÂ©es des recruteurs restent protÃƒÂ©gÃƒÂ©es jusquÃ¢â‚¬â„¢ÃƒÂ  votre dÃƒÂ©cryptage ou abonnement.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[['54', 'pays couverts'], ['200 XOF', 'pour dÃƒÂ©crypter'], ['2', 'offres gratuites entreprise']].map(([number, label]) => <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4"><strong className="block text-xl text-[#8ee0c0]">{number}</strong><span className="text-xs text-slate-300">{label}</span></div>)}
          </div>
        </div>
        <form onSubmit={submitSearch} className="mt-10 grid gap-3 rounded-2xl bg-white p-3 text-slate-900 shadow-2xl md:grid-cols-[1fr_190px_170px_auto]">
          <label className="sr-only" htmlFor="job-search">MÃƒÂ©tier, compÃƒÂ©tence ou mot-clÃƒÂ©</label><input id="job-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="MÃƒÂ©tier, compÃƒÂ©tence ou mot-clÃƒÂ©" className="h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-[#087e8b]" />
          <select value={country} onChange={(event) => setCountry(event.target.value)} className="h-12 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#087e8b]"><option value="">Tous les pays</option>{countries.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={sector} onChange={(event) => setSector(event.target.value)} className="h-12 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#087e8b]"><option value="">Tous les secteurs</option>{sectors.map((item) => <option key={item}>{item}</option>)}</select>
          <button className="h-12 rounded-xl bg-[#c91f3b] px-6 font-bold text-white transition hover:bg-[#a51630]">Rechercher</button>
        </form>
      </div>
    </section>

    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-bold text-[#087e8b]">OFFRES SÃƒâ€°LECTIONNÃƒâ€°ES</p><h2 className="font-display text-2xl font-extrabold">Les opportunitÃƒÂ©s qui vous correspondent</h2></div><div className="flex gap-3"><Link href="/emploi/publier-candidature" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold hover:border-[#087e8b]">Publier ma candidature</Link><Link href="/emploi/publier-offre" className="rounded-xl bg-[#087e8b] px-4 py-3 text-sm font-bold text-white hover:bg-[#066c77]">Publier une offre</Link></div></div>
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className="space-y-4">{offers.map((offer) => <article key={offer.id} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          {offer.isBoosted && <span className="absolute right-5 top-0 rounded-b-lg bg-[#f6c453] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-900">Ã¢Ëœâ€¦ Offre boostÃƒÂ©e</span>}
          <div className="pr-24"><p className="text-xs font-bold uppercase tracking-wider text-[#087e8b]">{offer.sector} Ã‚Â· {offer.contractType}</p><h3 className="mt-1 font-display text-xl font-extrabold">{offer.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{offer.description}</p></div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600"><span>Ã¢Å’â€“ {offer.city}, {offer.country}</span>{offer.salary && <span className="rounded-full bg-slate-100 px-3 py-1">{offer.salary}</span>}{offer.skills.slice(0, 3).map((skill) => <span key={skill} className="rounded-full bg-[#e9f7f5] px-3 py-1 text-[#087e8b]">{skill}</span>)}</div>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-400">Structure et contacts protÃƒÂ©gÃƒÂ©s Ã‚Â· {offer.views} vues</span><Link href={`/emploi/offres/${offer.id}`} className="rounded-lg bg-[#071b36] px-4 py-2 text-sm font-bold text-white">Voir lÃ¢â‚¬â„¢offre</Link></div>
        </article>)}
        {loading && <div className="py-8 text-center text-sm font-semibold text-slate-500">Chargement des opportunitÃƒÂ©sÃ¢â‚¬Â¦</div>}
        {!loading && offers.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">Aucune offre ne correspond encore ÃƒÂ  cette recherche.</div>}
        <div ref={sentinel} />
        </section>
        <aside className="space-y-4"><div className="rounded-2xl bg-[#e9f7f5] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[#087e8b]">Candidat</p><h3 className="mt-2 font-display text-xl font-extrabold">Postulez en toute confiance</h3><p className="mt-3 text-sm leading-6 text-slate-600">DÃƒÂ©cryptez une offre pour 200 XOF, ou prenez un accÃƒÂ¨s de 24 h, 7 jours ou 30 jours.</p><Link href="/emploi/abonnements" className="mt-5 inline-block text-sm font-extrabold text-[#087e8b]">Voir les accÃƒÂ¨s Ã¢â€ â€™</Link></div><div className="rounded-2xl bg-[#fff3dc] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[#a36300]">Entreprise</p><h3 className="mt-2 font-display text-xl font-extrabold">Recrutez sur tout le continent</h3><p className="mt-3 text-sm leading-6 text-slate-600">Vos deux premiÃƒÂ¨res offres sont gratuites. Boostez-les pour toucher les meilleurs profils.</p><Link href="/emploi/publier-offre" className="mt-5 inline-block text-sm font-extrabold text-[#a36300]">DÃƒÂ©poser une offre Ã¢â€ â€™</Link></div></aside>
      </div>
    </main>
  </div>;
}
