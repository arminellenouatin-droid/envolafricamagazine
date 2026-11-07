import Link from "next/link";
import { getSupabaseCandidates, getSupabaseCompetitions, getSupabasePrizes } from "@/lib/awards-supabase";
import VisitorPrice from "@/components/VisitorPrice";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Africa Awards — Célébrons l'Excellence et les Talents d'Afrique",
  description: "La plus grande plateforme panafricaine de compétitions en direct, votes et cérémonies officielles de remise de prix.",
  alternates: {
    canonical: "/africa-awards",
  },
  openGraph: {
    title: "Africa Awards — Célébrons l'Excellence et les Talents d'Afrique",
    description: "Compétitions panafricaines en direct, votes transparents et galas de distinction.",
    url: "/africa-awards",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Africa Awards",
    description: "Célébrons l'excellence et les talents d'Afrique.",
  },
};

const CATEGORIES = [
  { name: "Entrepreneuriat & Impact", count: "42 candidats" },
  { name: "Musique & Culture", count: "68 candidats" },
  { name: "Innovation Digitale", count: "35 candidats" },
  { name: "Arts & Design", count: "29 candidats" },
  { name: "Jeunes Leaders", count: "51 candidats" },
];

export default async function AfricaAwardsLanding() {
  const remote = await getSupabaseCompetitions();
  const competitions = remote.configured ? remote.competitions : [];
  const [candidateRemote, prizeRemote] = await Promise.all([getSupabaseCandidates(), getSupabasePrizes()]);
  const candidates = candidateRemote.configured
    ? candidateRemote.candidates.filter((candidate) => candidate.status === "accepted")
    : [];
  const prizes = prizeRemote.configured ? prizeRemote.prizes : [];

  return (
    <div className="min-h-screen bg-[#1a1213] text-[#F5F3EE] selection:bg-[#D4AF37] selection:text-black">
      
      {/* ========================================================
          HERO SECTION: Luxury Gala & Live Ceremony (Imperial Bordeaux & Satin Gold)
          ======================================================== */}
      <section className="relative overflow-hidden border-b border-[#D4AF37]/20 pb-16 pt-12 md:pb-28 md:pt-20">
        
        {/* Ambient Royal Radial Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-[160px]" />
        <div className="pointer-events-none absolute top-1/4 -right-40 h-[550px] w-[550px] rounded-full bg-[#9e001f]/25 blur-[150px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:32px_32px] opacity-10" />

        <div className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
          
          {/* Top Live Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <span className="h-2 w-2 rounded-full bg-[#9e001f] animate-ping" />
              <span>Cérémonie Panafricaine Officielle · En direct</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[#D4AF37]">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="font-semibold uppercase tracking-wider">Votes 100&nbsp;% Impartiaux et Certifiés</span>
            </div>
          </div>

          {/* Main Hero Grid: Title & Live Stream Showcase */}
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            
            {/* Left Column: Headlines & Call-to-actions */}
            <div>
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Grand Gala Continental · Édition Annuelle
              </p>
              <h1 className="mt-3 font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold leading-[1.05] tracking-tight text-white">
                Célébrons <span className="bg-gradient-to-r from-[#F4D976] via-[#D4AF37] to-[#f0b27e] bg-clip-text text-transparent">l’Excellence</span> et les Talents d’Afrique
              </h1>

              <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[#d8c3c1]">
                La plus grande scène continentale où entrepreneurs, artistes, innovateurs et bâtisseurs s’affirment devant des millions de spectateurs. Participez aux votes officiels et couronnez vos champions en direct.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/africa-awards/competitions"
                  className="group inline-flex min-h-[48px] items-center gap-3 rounded-full bg-gradient-to-r from-[#F4D976] via-[#D4AF37] to-[#B38715] pl-6 pr-2 text-sm font-extrabold text-[#1a1213] shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4D976]"
                >
                  <span>Participer au Vote Officiel</span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-black/15 text-[#1a1213] transition-transform duration-300 group-hover:rotate-45 font-mono text-base">
                    ↗
                  </span>
                </Link>

                <Link
                  href="/africa-awards/competitions"
                  className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full border border-[#ead8d5]/25 bg-white/5 px-6 text-sm font-bold text-white backdrop-blur-md transition-all hover:border-[#D4AF37]/50 hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                >
                  <svg className="h-5 w-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                  <span>Regarder la Cérémonie en direct</span>
                </Link>
              </div>

              {/* Live Counters */}
              <div className="mt-12 grid grid-cols-2 gap-4 border-t border-[#D4AF37]/20 pt-8 sm:grid-cols-4">
                <div>
                  <div className="font-serif text-3xl font-bold text-[#D4AF37]">En direct</div>
                  <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#d8c3c1]">Votes certifiés</div>
                </div>
                <div>
                  <div className="font-serif text-3xl font-bold text-white">54</div>
                  <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#d8c3c1]">Pays éligibles</div>
                </div>
                <div>
                  <div className="font-serif text-3xl font-bold text-white">Annuelle</div>
                  <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#d8c3c1]">Grande Cérémonie</div>
                </div>
                <div>
                  <div className="font-serif text-3xl font-bold text-[#D4AF37]">100&nbsp;%</div>
                  <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#d8c3c1]">Scrutin audité</div>
                </div>
              </div>
            </div>

            {/* Right Column: Gala Live Stream Card & Golden Trophy Aura */}
            <div className="relative">
              {/* Trophy Glow Backdrop */}
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-r from-[#D4AF37]/25 to-[#9e001f]/35 blur-2xl" />

              {/* Double-Bezel Outer Shell */}
              <div className="relative rounded-[2.2rem] border border-[#D4AF37]/35 bg-gradient-to-b from-[#D4AF37]/25 via-white/5 to-transparent p-2 shadow-2xl backdrop-blur-xl">
                {/* Inner Core */}
                <div className="overflow-hidden rounded-[calc(2.2rem-0.5rem)] border border-white/10 bg-[#241a1c]/95 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                  {/* Live Stream Stage Preview */}
                  <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#2b2525]">
                    {/* Backdrop stage visual */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                    <img
                      src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
                      alt="Scène officielle des Africa Awards"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105 opacity-85"
                    />

                    {/* Pulsing Live Tag */}
                    <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-[#9e001f] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      <span>En direct</span>
                    </div>

                    {/* Category Tag */}
                    <div className="absolute right-3 top-3 z-20 rounded-full border border-[#D4AF37]/40 bg-black/60 px-3 py-1 text-[11px] font-bold text-[#D4AF37] backdrop-blur">
                      Grande Soirée de Gala
                    </div>

                    {/* Play Button Trigger */}
                    <Link
                      href="/africa-awards/competitions"
                      className="absolute inset-0 z-20 grid place-items-center"
                      aria-label="Lancer la vidéo en direct"
                    >
                      <div className="grid h-16 w-16 place-items-center rounded-full bg-[#D4AF37] text-[#1a1213] shadow-[0_0_30px_rgba(212,175,55,0.7)] transition-all duration-300 group-hover:scale-110 active:scale-95">
                        <svg className="h-8 w-8 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </Link>

                    {/* Bottom title inside stage */}
                    <div className="absolute bottom-3 left-3 right-3 z-20 text-white">
                      <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">Envol Africa Awards</p>
                      <h3 className="text-base font-bold truncate">Cérémonie Officielle de Proclamation et Remise des Trophées</h3>
                    </div>
                  </div>

                  {/* Sub-bar inside card: Stats & Quick Action */}
                  <div className="mt-4 flex items-center justify-between text-xs text-[#d8c3c1]">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1c1.94-.31 3.51-1.68 4.61-3.96C19.08 11.63 21 9.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
                      </svg>
                      <span>Grand Trophée Or + Dotations d&apos;Honneur</span>
                    </div>
                    <Link
                      href="/africa-awards/competitions"
                      className="font-bold text-[#D4AF37] hover:underline"
                    >
                      Accéder au direct →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================
          CATEGORIES HORIZONTAL BAR
          ======================================================== */}
      <section className="border-b border-[#ead8d5]/15 bg-[#241a1c] py-4">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
          <div className="flex items-center gap-3 overflow-x-auto [scrollbar-width:none]">
            <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              Catégories&nbsp;:
            </span>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href="/africa-awards/competitions"
                className="flex shrink-0 items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/15 hover:text-[#D4AF37]"
              >
                <span>{cat.name}</span>
                <span className="text-[10px] text-[#d8c3c1]">({cat.count})</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION: Compétitions en lice (Live & Prochaines)
          ======================================================== */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
          
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#ead8d5]/15 pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Compétitions Officielles</p>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Les Événements et Défis en Direct
              </h2>
            </div>
            <Link
              href="/africa-awards/competitions"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#D4AF37] transition hover:underline"
            >
              <span>Découvrir toutes les compétitions</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(competitions.length > 0
              ? competitions.slice(0, 6)
              : [
                  {
                    id: "comp-demo-1",
                    slug: "innovation-tech-2025",
                    title: "Prix de l'Innovation & DeepTech Africaine 2025",
                    category: "Innovation Digitale",
                    status: "live",
                    vote_price_cents: 200,
                    cover_image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
                  },
                  {
                    id: "comp-demo-2",
                    slug: "agribusiness-impact",
                    title: "Trophée de la Transformation Agricole & Climat",
                    category: "Entrepreneuriat",
                    status: "live",
                    vote_price_cents: 250,
                    cover_image: "https://images.unsplash.com/photo-1592417817098-8f3d6ef23a63?auto=format&fit=crop&w=800&q=80",
                  },
                  {
                    id: "comp-demo-3",
                    slug: "voix-dor-afrique",
                    title: "La Voix d'Or d'Afrique : Révélation Musicale",
                    category: "Musique & Culture",
                    status: "soon",
                    vote_price_cents: 300,
                    cover_image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
                  },
                ]
            ).map((comp) => (
              <article
                key={comp.id}
                className="group relative flex flex-col rounded-[2rem] border border-[#D4AF37]/25 bg-gradient-to-b from-[#D4AF37]/15 via-white/5 to-transparent p-1.5 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/60 hover:shadow-[0_12px_35px_rgba(212,175,55,0.25)]"
              >
                <div className="flex flex-1 flex-col overflow-hidden rounded-[calc(2rem-0.375rem)] bg-[#241a1c] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                  {/* Card Cover Banner */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#2b2525]">
                    {comp.cover_image && (
                      <img
                        src={comp.cover_image}
                        alt={comp.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#241a1c] via-transparent to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute left-3 top-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#1a1213] shadow-md">
                        {comp.status === "live" ? "🔴 En direct" : "⭐ Officiel"}
                      </span>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-[#D4AF37] backdrop-blur-md border border-[#D4AF37]/30">
                      {comp.category}
                    </div>

                    <div className="absolute bottom-3 left-3 text-xs font-bold text-white/95">
                      Vote à partir de <VisitorPrice amountInXof={comp.vote_price_cents || 200} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                      {comp.category}
                    </p>
                    <h3 className="mt-1 font-serif text-lg font-bold leading-snug text-white group-hover:text-[#D4AF37] transition">
                      {comp.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#d8c3c1]">
                      Participez au vote officiel en direct, offrez des encouragements et couronnez le vainqueur de la saison.
                    </p>

                    <div className="mt-auto pt-5">
                      <Link
                        href={`/africa-awards/competitions/${comp.slug}`}
                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F4D976] via-[#D4AF37] to-[#B38715] py-2.5 text-xs font-extrabold text-[#1a1213] shadow-xs transition hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4D976]"
                      >
                        <span>Participer et Voter</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================
          SECTION: Candidats en lice (Golden Laurel Portraits)
          ======================================================== */}
      <section className="border-y border-[#ead8d5]/15 bg-[#241a1c] py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
          
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#ead8d5]/15 pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Les Visages de l&apos;Excellence</p>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Candidats et Nominés en Compétition
              </h2>
            </div>
            <Link
              href="/africa-awards/candidates"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#D4AF37] transition hover:underline"
            >
              <span>Voir tous les nominés</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="mt-10 flex gap-6 overflow-x-auto pb-4 [scrollbar-width:thin]">
            {(candidates.length > 0
              ? candidates
              : [
                  {
                    id: "cand-1",
                    display_name: "Oluwaseun Adébayo",
                    photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
                    votes: 215840,
                    category: "Innovation Tech",
                  },
                  {
                    id: "cand-2",
                    display_name: "Aminata Traoré",
                    photo_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80",
                    votes: 184500,
                    category: "Entrepreneuriat",
                  },
                  {
                    id: "cand-3",
                    display_name: "Kwame Mensah",
                    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
                    votes: 142200,
                    category: "Musique & Culture",
                  },
                  {
                    id: "cand-4",
                    display_name: "Fatou Diop",
                    photo_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
                    votes: 129400,
                    category: "Arts & Design",
                  },
                ]
            ).map((cand) => (
              <div
                key={cand.id}
                className="group flex w-[210px] shrink-0 flex-col items-center rounded-2xl border border-[#D4AF37]/25 bg-[#1a1213] p-4 text-center transition hover:border-[#D4AF37] hover:shadow-[0_0_20px_rgba(212,175,55,0.25)]"
              >
                {/* Laurel-rimmed Portrait */}
                <div className="relative mb-3">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[#D4AF37] p-1 shadow-lg">
                    {cand.photo_url ? (
                      <img
                        src={cand.photo_url}
                        alt={cand.display_name}
                        className="h-full w-full rounded-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center rounded-full bg-[#2b2525] text-2xl font-black text-[#D4AF37]">
                        {cand.display_name[0]}
                      </div>
                    )}
                  </div>
                  {/* Golden Badge */}
                  <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-[#D4AF37] text-[#1a1213] shadow-md">
                    ★
                  </span>
                </div>

                <strong className="block truncate font-serif text-sm font-bold text-white group-hover:text-[#D4AF37] transition">
                  {cand.display_name}
                </strong>
                <p className="mt-0.5 text-[11px] text-[#d8c3c1]">
                  {("category" in cand && cand.category) || ("country" in cand && cand.country) || "Candidat Officiel"}
                </p>

                <div className="mt-2 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-[#D4AF37]">
                  {cand.votes ? `${cand.votes.toLocaleString("fr-FR")} votes` : "En lice"}
                </div>

                <Link
                  href={`/africa-awards/vote/${cand.id}`}
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#F4D976] via-[#D4AF37] to-[#B38715] py-2 text-xs font-bold text-[#1a1213] transition hover:brightness-110"
                >
                  Voter
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================
          SECTION: Comment ça marche (3 Étapes Prestige)
          ======================================================== */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
          
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Fonctionnement Officiel</p>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Comment Participer et Voter en Direct
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-sm text-[#d8c3c1]">
              Un processus transparent, sécurisé et accessible à l’ensemble des citoyens et passionnés à travers toute l’Afrique et la diaspora.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "1. Découvrez les Talents",
                desc: "Explorez les compétitions officielles, les portraits des nominés et suivez les cérémonies retransmises en direct.",
              },
              {
                step: "02",
                title: "2. Votez et Soutenez",
                desc: "Soutenez vos favoris en toute sécurité via Moneroo (Mobile Money MTN, Moov, Wave, Orange, Cartes Bancaires).",
              },
              {
                step: "03",
                title: "3. Célébrez le Sacre",
                desc: "Suivez le tableau d'affichage des scores en temps réel, assistez à la proclamation et découvrez les lauréats officiels.",
              },
            ].map((st) => (
              <div
                key={st.step}
                className="relative rounded-3xl border border-[#D4AF37]/25 bg-[#241a1c] p-7 transition hover:border-[#D4AF37]/60 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35">
                    <span className="font-bold text-lg">{st.step}</span>
                  </div>
                  <span className="font-serif text-3xl font-black text-white/10">{st.step}</span>
                </div>
                <h3 className="mt-5 font-serif text-lg font-bold text-white">{st.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#d8c3c1]">{st.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================
          SECTION: Charte de Gouvernance & Certification
          ======================================================== */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12 pb-20">
        <div className="rounded-3xl border border-[#D4AF37]/35 bg-gradient-to-r from-[#241a1c] via-[#2b2525] to-[#241a1c] p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D4AF37] text-[#1a1213] font-bold shadow-lg">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-serif text-base font-bold text-[#D4AF37]">
                Gouvernance, Équité et Règle Panafricaine Officielle
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-[#d8c3c1]">
                Pour garantir une impartialité absolue et prévenir toute dérive, <strong>seul le rôle Administrateur Envol Africa</strong> est habilité à créer et lancer officiellement une compétition Africa Awards. Les organisateurs partenaires soumettent leurs demandes de compétition pour audit préalable et validation. Tous les votes sont chiffrés et vérifiés par contrôle d&apos;intégrité RLS.
              </p>
            </div>
            <Link
              href="/africa-awards/about"
              className="shrink-0 rounded-full border border-[#D4AF37]/40 px-5 py-2 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
