import { readDB } from "@/lib/db";
import { SentinellesSection, EssorOmbreSection, MagazineCarousel, FilInfoManager, MostReadFormations, TabsSection, VideoProchainEcosystem } from "@/components/home/HeroSections";
import Link from "next/link";
import PromoPopup from "@/components/PromoPopup";

export default function HomePage() {
  const db = readDB();
  const articles = db.articles.filter(a=>a.isPublished).sort((a,b)=> new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());
  const magazines = db.magazines.sort((a,b)=> b.numero - a.numero);

  return (
    <div className="bg-[#FFFCF5]">
      {/* Hero */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 pt-6 md:pt-8">
        <div className="rounded-[28px] bg-[#0A1931] relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-[#D4AF37]/20 rounded-full blur-[120px]"></div>
            <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]"></div>
          </div>
          <div className="relative grid lg:grid-cols-[1.2fr_0.8fr] gap-8 p-7 md:p-10 lg:p-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-[#F0D878] uppercase">
                <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse"></span>
                Nouveau • N°25 Spécial Investissements 2026 disponible
              </div>
              <h1 className="font-serif font-black text-[32px] md:text-[48px] lg:text-[54px] leading-[0.95] tracking-tight text-white mt-5">
                L'Afrique qui gagne, <span className="text-[#D4AF37]">racontée</span> par ceux qui la font.
              </h1>
              <p className="text-[15px] md:text-[17px] leading-7 text-zinc-300 mt-5 max-w-[560px]">
                Analyses exclusives, enquêtes de terrain, portraits de décideurs. Le magazine économique panafricain haut de gamme, disponible en 12 langues.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/abonnement" className="h-12 px-7 rounded-full bg-[#D4AF37] text-[#0A1931] font-bold text-[14px] flex items-center gap-2 hover:bg-[#F0D878] transition-colors shadow-[0_8px_24px_rgba(212,175,55,0.3)]">
                  S'abonner à partir de 2 000 F CFA <span>→</span>
                </Link>
                <Link href="/kiosque" className="h-12 px-7 rounded-full bg-white/10 border border-white/15 text-white font-semibold text-[14px] flex items-center gap-2 hover:bg-white/15 transition-colors">
                  Découvrir le Kiosque
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-[12px] text-zinc-400">
                <span className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✓</span> 15 articles gratuits/mois</span>
                <span className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✓</span> Sans engagement</span>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-[20px] overflow-hidden bg-white p-2 magazine-shadow rotate-[-2deg] max-w-[340px] mx-auto lg:ml-auto">
                <img src={magazines[0]?.cover || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600"} alt="cover" className="w-full aspect-[3/4] object-cover rounded-[14px]" />
                <div className="p-3">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">En kiosque maintenant</div>
                  <div className="font-serif font-bold text-[16px] leading-tight text-[#0A1931] mt-1">{magazines[0]?.title}</div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="bg-[#0A1931] text-white text-[11px] font-bold px-3 py-1 rounded-full">N°{magazines[0]?.numero}</span>
                    <span className="text-[11px] text-zinc-500">{magazines[0]?.year} • 124 pages</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-[14px] shadow-[0_12px_32px_rgba(0,0,0,0.15)] border border-zinc-100 p-3 flex items-center gap-3 rotate-[2deg] hidden md:flex">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-700 font-bold text-sm">+12%</div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Croissance BRVM</div>
                  <div className="text-[13px] font-semibold text-[#0A1931]">Ce mois-ci</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SentinellesSection articles={articles} />
      <EssorOmbreSection articles={articles} />
      <MagazineCarousel magazines={magazines} />
      <FilInfoManager articles={articles} />
      <MostReadFormations articles={articles} />
      <TabsSection />
      <VideoProchainEcosystem articles={articles} magazines={magazines} />

      <PromoPopup />

      {/* Don / Affiliate CTA */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-[24px] bg-white border border-zinc-100 p-7 flex items-center gap-6">
            <div className="w-14 h-14 rounded-[16px] bg-pink-50 flex items-center justify-center text-2xl">❤️</div>
            <div className="flex-1">
              <h3 className="font-serif font-bold text-[18px] text-[#0A1931]">Soutenir un journalisme indépendant</h3>
              <p className="text-[13px] text-zinc-600 mt-1">Votre don finance nos enquêtes de terrain et nos correspondants dans 25 pays.</p>
            </div>
            <Link href="/don" className="h-10 px-5 rounded-full bg-[#0A1931] text-white text-[13px] font-bold hover:bg-black">Faire un don</Link>
          </div>
          <div className="rounded-[24px] bg-[#0A1931] p-7 flex items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4AF37]/20 rounded-full blur-2xl"></div>
            <div className="w-14 h-14 rounded-[16px] bg-[#D4AF37] flex items-center justify-center text-2xl relative">💸</div>
            <div className="flex-1 relative">
              <h3 className="font-serif font-bold text-[18px] text-white">Gagnez 25% en parrainant</h3>
              <p className="text-[13px] text-zinc-300 mt-1">Devenez affilié, partagez votre lien, touchez une commission à chaque vente.</p>
            </div>
            <Link href="/affiliation" className="h-10 px-5 rounded-full bg-[#D4AF37] text-[#0A1931] text-[13px] font-bold hover:bg-[#F0D878] relative">Devenir affilié</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
