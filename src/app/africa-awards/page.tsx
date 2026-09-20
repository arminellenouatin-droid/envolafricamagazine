import Link from "next/link";
import { getSupabaseCandidates, getSupabaseCompetitions, getSupabasePrizes } from "@/lib/awards-supabase";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Africa Awards | Célébrons l'Excellence et les Talents d'Afrique",
  description: "La plus grande plateforme panafricaine de compétitions en direct, votes et cérémonies officielles de remise de prix.",
  alternates: {
    canonical: "/africa-awards",
  },
  openGraph: {
    title: "Africa Awards | Célébrons l'Excellence et les Talents d'Afrique",
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
  { name: "Entrepreneuriat & Impact", icon: "business_center", count: "42 candidats" },
  { name: "Musique & Culture", icon: "music_note", count: "68 candidats" },
  { name: "Innovation Digitale", icon: "lightbulb", count: "35 candidats" },
  { name: "Arts & Design", icon: "palette", count: "29 candidats" },
  { name: "Jeunes Leaders", icon: "workspace_premium", count: "51 candidats" },
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
    <div className="min-h-screen bg-[#07070A] text-[#F5F3EE] selection:bg-[#D4AF37] selection:text-black">
      
      {/* ========================================================
          HERO SECTION: Luxury Gala & Live Ceremony
          ======================================================== */}
      <section className="relative overflow-hidden border-b border-[#D4AF37]/20 pb-16 pt-12 md:pb-28 md:pt-20">
        
        {/* Ambient Golden Radial Glows & Stardust */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-[160px]" />
        <div className="pointer-events-none absolute top-1/4 -right-40 h-[500px] w-[500px] rounded-full bg-[#9e001f]/15 blur-[140px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:32px_32px] opacity-10" />

        <div className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
          
          {/* Top Live Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span>Cérémonie Panafricaine Officielle • En direct</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[#D4AF37]">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span className="font-semibold uppercase tracking-wider">Votes 100% Impartiaux & Certifiés</span>
            </div>
          </div>

          {/* Main Hero Grid: Title & Live Stream Showcase */}
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            
            {/* Left Column: Headlines & Call-to-actions */}
            <div>
              <h1
                className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-black leading-[1.05] tracking-tight text-white"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Célébrons <span className="bg-gradient-to-r from-[#F4D976] via-[#D4AF37] to-[#AA7C11] bg-clip-text text-transparent">l’Excellence</span> et les Talents d’Afrique
              </h1>

              <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[#B5B3AD]">
                La plus grande scène continentale où entrepreneurs, artistes, innovateurs et leaders s’affirment devant des millions de spectateurs. Votez, offrez des cadeaux virtuels et couronnez vos champions en direct.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/africa-awards/competitions"
                  className="inline-flex h-13 items-center gap-2.5 rounded-full bg-gradient-to-r from-[#F4D976] via-[#D4AF37] to-[#B38715] px-8 text-sm font-extrabold text-[#0B0B0F] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">how_to_vote</span>
                  <span>Voter pour un Candidat</span>
                </Link>

                <Link
                  href="/africa-awards/competitions"
                  className="inline-flex h-13 items-center gap-2.5 rounded-full border border-white/20 bg-white/5 px-7 text-sm font-bold text-white backdrop-blur transition-all hover:border-[#D4AF37]/50 hover:bg-white/10"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#D4AF37]">play_circle</span>
                  <span>Regarder le Live</span>
                </Link>
              </div>

              {/* Live Counters */}
              <div className="mt-12 grid grid-cols-2 gap-4 border-t border-[#D4AF37]/20 pt-8 sm:grid-cols-4">
                <div>
                  <div className="font-serif text-3xl font-black text-[#D4AF37]">En direct</div>
                  <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#8A8882]">Votes certifiés</div>
                </div>
                <div>
                  <div className="font-serif text-3xl font-black text-white">54</div>
                  <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#8A8882]">Pays éligibles</div>
                </div>
                <div>
                  <div className="font-serif text-3xl font-black text-white">Annuelle</div>
                  <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#8A8882]">Grande Cérémonie</div>
                </div>
                <div>
                  <div className="font-serif text-3xl font-black text-[#D4AF37]">100%</div>
                  <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#8A8882]">Scrutin audité</div>
                </div>
              </div>
            </div>

            {/* Right Column: Gala Live Stream Card & Golden Trophy Aura */}
            <div className="relative">
              
              {/* Trophy Glow Backdrop */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#D4AF37]/20 to-[#9e001f]/20 blur-xl" />

              <div className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-[#121218]/90 p-5 shadow-2xl backdrop-blur-xl">
                
                {/* Live Stream Stage Preview */}
                <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#1a1a24]">
                  {/* Backdrop stage visual */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                  <img
                    src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
                    alt="Scène officielle des Africa Awards"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105 opacity-80"
                  />

                  {/* Pulsing Live Tag */}
                  <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    <span>Live en direct</span>
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
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-[#D4AF37] text-[#07070A] shadow-[0_0_30px_rgba(212,175,55,0.7)] transition group-hover:scale-110">
                      <span className="material-symbols-outlined text-[36px] ml-1">play_arrow</span>
                    </div>
                  </Link>

                  {/* Bottom title inside stage */}
                  <div className="absolute bottom-3 left-3 right-3 z-20 text-white">
                    <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">Envol Africa Awards 2025</p>
                    <h3 className="text-base font-bold truncate">Cérémonie de Proclamation & Remise des Prix</h3>
                  </div>
                </div>

                {/* Sub-bar inside card: Stats & Quick Action */}
                <div className="mt-4 flex items-center justify-between text-xs text-[#B5B3AD]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">emoji_events</span>
                    <span>Grand Trophée Or + Dotations Financières</span>
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
      </section>

      {/* ========================================================
          CATEGORIES HORIZONTAL BAR
          ======================================================== */}
      <section className="border-b border-white/10 bg-[#0C0C12] py-4">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
          <div className="flex items-center gap-3 overflow-x-auto [scrollbar-width:none]">
            <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              Catégories :
            </span>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href="/africa-awards/competitions"
                className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
              >
                <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-[10px] text-[#8A8882]">({cat.count})</span>
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
          
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Compétitions Officielles</p>
              <h2
                className="mt-1 font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Les Événements & Défis en Direct
              </h2>
            </div>
            <Link
              href="/africa-awards/competitions"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#D4AF37] transition hover:underline"
            >
              <span>Découvrir toutes les compétitions</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
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
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#101016] transition-all hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)]"
              >
                {/* Card Cover Banner */}
                <div className="relative aspect-[16/10] overflow-hidden bg-[#181822]">
                  {comp.cover_image && (
                    <img
                      src={comp.cover_image}
                      alt={comp.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101016] via-transparent to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute left-3 top-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#07070A]">
                      {comp.status === "live" ? "🔴 En direct" : "⭐ Officiel"}
                    </span>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-[#D4AF37] backdrop-blur">
                    {comp.category}
                  </div>

                  <div className="absolute bottom-3 left-3 text-xs font-bold text-white/90">
                    Vote à partir de {comp.vote_price_cents || 200} XOF
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
                  <p className="mt-2 text-xs leading-relaxed text-[#8A8882]">
                    Participez au vote officiel en direct, offrez des encouragements et couronnez le vainqueur de la saison.
                  </p>

                  <div className="mt-auto pt-5">
                    <Link
                      href={`/africa-awards/competitions/${comp.slug}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-extrabold text-[#07070A] transition hover:bg-[#F4D976]"
                    >
                      <span>Voter & Participer</span>
                      <span className="material-symbols-outlined text-[16px]">how_to_vote</span>
                    </Link>
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
      <section className="border-y border-white/10 bg-[#0A0A0F] py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
          
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Les Visages de l'Excellence</p>
              <h2
                className="mt-1 font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Candidats & Nominés en Compétition
              </h2>
            </div>
            <Link
              href="/africa-awards/candidates"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#D4AF37] transition hover:underline"
            >
              <span>Voir tous les nominés</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
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
                className="group flex w-[200px] shrink-0 flex-col items-center rounded-2xl border border-white/10 bg-[#121218] p-4 text-center transition hover:border-[#D4AF37] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
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
                      <div className="grid h-full w-full place-items-center rounded-full bg-[#1e1e28] text-2xl font-black text-[#D4AF37]">
                        {cand.display_name[0]}
                      </div>
                    )}
                  </div>
                  {/* Golden Laurel Icon Badge */}
                  <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-[#D4AF37] text-[#07070A] shadow-md">
                    <span className="material-symbols-outlined text-[17px]">military_tech</span>
                  </span>
                </div>

                <strong className="block truncate font-serif text-sm font-bold text-white group-hover:text-[#D4AF37] transition">
                  {cand.display_name}
                </strong>
                <p className="mt-0.5 text-[11px] text-[#8A8882]">
                  {("category" in cand && cand.category) || ("country" in cand && cand.country) || "Candidat Officiel"}
                </p>

                <div className="mt-2 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-[#D4AF37]">
                  {cand.votes ? `${cand.votes.toLocaleString("fr-FR")} votes` : "En lice"}
                </div>

                <Link
                  href={`/africa-awards/vote/${cand.id}`}
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38715] py-2 text-xs font-black text-[#07070A] transition hover:brightness-110"
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
            <h2
              className="mt-2 font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Comment Participer & Voter en Direct
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-sm text-[#8A8882]">
              Un processus transparent, sécurisé et accessible à l’ensemble des citoyens et passionnés à travers toute l’Afrique et la diaspora.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: "travel_explore",
                title: "1. Découvrez les Talents",
                desc: "Explorez les compétitions officielles, les portraits des nominés et suivez les cérémonies retransmises en streaming HD.",
              },
              {
                step: "02",
                icon: "how_to_vote",
                title: "2. Votez & Offrez des Cadeaux",
                desc: "Soutenez vos favoris via Moneroo (Mobile Money MTN, Moov, Wave, Orange, Cartes Visa/Mastercard) et envoyez des cadeaux virtuels animés.",
              },
              {
                step: "03",
                icon: "military_tech",
                title: "3. Célébrez le Sacre",
                desc: "Suivez le tableau d'affichage des scores en temps réel, assistez à la remise du Grand Trophée et découvrez les classements officiels.",
              },
            ].map((st) => (
              <div
                key={st.step}
                className="relative rounded-3xl border border-white/10 bg-[#0F0F16] p-7 transition hover:border-[#D4AF37]/50"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                    <span className="material-symbols-outlined text-[24px]">{st.icon}</span>
                  </div>
                  <span className="font-serif text-3xl font-black text-white/10">{st.step}</span>
                </div>
                <h3 className="mt-5 font-serif text-lg font-bold text-white">{st.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#8A8882]">{st.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================
          SECTION: Charte de Gouvernance & Certification
          ======================================================== */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12 pb-20">
        <div className="rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#14141E] via-[#1A1A28] to-[#14141E] p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D4AF37] text-[#07070A] font-bold shadow-lg">
              <span className="material-symbols-outlined text-[24px]">gavel</span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-serif text-base font-bold text-[#D4AF37]">
                Gouvernance, Équité & Règle Panafricaine Officielle
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-[#B5B3AD]">
                Pour garantir une impartialité absolue et prévenir toute dérive, <strong>seul le rôle Administrateur Envol Africa</strong> est habilité à créer et lancer officiellement une compétition Africa Awards. Les organisateurs partenaires soumettent leurs demandes de compétition pour audit préalable et validation. Tous les votes sont chiffrés et vérifiés par contrôle d'intégrité RLS.
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
