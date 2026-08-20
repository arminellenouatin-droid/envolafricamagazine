import Link from "next/link";

import { getSupabaseCompetitions } from "@/lib/awards-supabase";

export default async function AfricaAwardsLanding() {
  const remote = await getSupabaseCompetitions();
  const competitions = remote.configured ? remote.competitions : [];
  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B2A6B]/20 via-transparent to-[#D4AF37]/10"></div>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[120px]"></div>
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-20 md:py-32 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wider text-[#D4AF37] uppercase">
            <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse"></span> Live • Cérémonie en direct
          </div>
          <h1 className="text-[42px] md:text-[72px] font-black leading-[0.9] tracking-tight mt-6" style={{ fontFamily: "Fraunces, Playfair Display, serif" }}>
            La plus grande <span className="text-[#D4AF37]">plateforme africaine</span> de compétitions en direct
          </h1>
          <p className="text-[18px] md:text-[20px] leading-7 text-[#A8A6A0] mt-6 max-w-[640px]">
            Talents, entrepreneurs, artistes et organisations se révèlent devant des millions de spectateurs. Votez, offrez des cadeaux virtuels, soutenez vos candidats en temps réel.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/africa-awards/competitions" className="h-12 px-8 rounded-full bg-[#D4AF37] text-[#0B0B0F] font-bold text-[14px] flex items-center gap-2 hover:bg-[#F4D976] transition-colors shadow-[0_0_20px_rgba(212,175,55,0.3)]">Regarder un live →</Link>
            <Link href="/africa-awards/competitions" className="h-12 px-8 rounded-full bg-white/10 border border-white/15 text-white font-semibold text-[14px] flex items-center gap-2 hover:bg-white/15">Voter pour un candidat</Link>
          </div>
          <div className="mt-12 grid grid-cols-3 md:grid-cols-6 gap-6 text-center border-t border-white/10 pt-8">
            <div><div className="text-[28px] font-black text-[#D4AF37]">2.5M+</div><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Spectateurs</div></div>
            <div><div className="text-[28px] font-black text-white">150+</div><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Compétitions</div></div>
            <div><div className="text-[28px] font-black text-white">500K+</div><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Votes</div></div>
            <div><div className="text-[28px] font-black text-white">25</div><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Pays</div></div>
            <div><div className="text-[28px] font-black text-white">50K+</div><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Cadeaux</div></div>
            <div><div className="text-[28px] font-black text-[#D4AF37]">100%</div><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Transparent</div></div>
          </div>
        </div>
      </section>

      {/* Live now */}
      <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[24px] font-bold flex items-center gap-3"><span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span> En direct maintenant</h2>
          <Link href="/africa-awards/competitions" className="text-[#D4AF37] text-[13px] font-bold hover:underline">Voir tout →</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {competitions.filter((competition) => competition.status !== "archived").slice(0, 2).map((competition) => (
            <Link key={competition.id} href={`/africa-awards/competitions/${competition.slug}`} className="group rounded-[20px] overflow-hidden bg-[#16161D] border border-white/10 hover:border-[#D4AF37]/30 transition-all">
              <div className="aspect-video bg-[#1B2A6B]/30 relative overflow-hidden">
                {competition.cover_image && <img src={competition.cover_image} alt={competition.title} className="w-full h-full object-cover" />}
                <div className="absolute top-3 left-3 bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-1 rounded-full">{competition.status === "draft" ? "Bientôt" : competition.status}</div>
                <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[11px]"><span className="bg-black/60 text-white px-2 py-1 rounded-full">Vote à partir de {competition.vote_price_cents} F</span><span className="bg-[#D4AF37] text-black px-2 py-1 rounded-full font-bold">{competition.category}</span></div>
              </div>
              <div className="p-4"><div className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-bold">{competition.category}</div><div className="font-bold text-[16px] mt-1 leading-tight">{competition.title}</div><div className="text-[12px] text-[#A8A6A0] mt-2">Compétition Africa Awards • Paramètres en préparation</div></div>
            </Link>
          ))}
        </div>
      </section>

      {/* Comment ça marche 3 étapes */}
      <section className="bg-[#16161D] border-y border-white/5 py-16">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <h2 className="text-[28px] font-bold text-center mb-12">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center"><div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto text-2xl">👀</div><h3 className="font-bold mt-4">1. Regardez</h3><p className="text-[13px] text-[#A8A6A0] mt-2">Découvrez les lives, les candidats et les compétitions en direct</p></div>
            <div className="text-center"><div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto text-2xl">🗳️</div><h3 className="font-bold mt-4">2. Votez & Soutenez</h3><p className="text-[13px] text-[#A8A6A0] mt-2">Votez via Moneroo Mobile Money/Carte, envoyez des cadeaux virtuels animés</p></div>
            <div className="text-center"><div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto text-2xl">🏆</div><h3 className="font-bold mt-4">3. Célébrez</h3><p className="text-[13px] text-[#A8A6A0] mt-2">Suivez le classement live, regardez les résultats et le replay</p></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <h2 className="text-[32px] font-black">Osez briller !</h2>
        <p className="text-[#A8A6A0] mt-3 max-w-[600px] mx-auto">Devenez candidat, organisateur ou jury. Seul l'Administrateur crée et lance officiellement une compétition pour garantir transparence et équité.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/africa-awards/competitions" className="h-12 px-8 rounded-full bg-[#D4AF37] text-black font-bold">Devenir candidat</Link>
          <Link href="/africa-awards/organizer/dashboard/requests/new" className="h-12 px-8 rounded-full border border-white/15 text-white font-semibold">Organiser une compétition</Link>
        </div>
      </section>

      {/* Gouvernance reminder */}
      <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] pb-20">
        <div className="rounded-[20px] bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-6 flex gap-4">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-black flex items-center justify-center font-bold">!</div>
          <div className="text-[13px] leading-6"><strong>Règle de gouvernance :</strong> Seul le rôle Administrateur peut créer et lancer une compétition. Aucun autre rôle (Organisateur inclus) n'a de bouton, d'endpoint API ou de policy RLS lui permettant de créer/publier une compétition. L'Organisateur ne peut que soumettre une demande. Cette règle est vérifiée dans RLS, API, UI et tests.</div>
        </div>
      </section>
    </div>
  );
}
