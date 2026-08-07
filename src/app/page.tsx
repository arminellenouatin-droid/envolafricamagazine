import { readDB } from "@/lib/db";
import Link from "next/link";
import PromoPopup from "@/components/PromoPopup";

export default function HomePage() {
  const db = readDB();
  const articles = db.articles.filter(a=>a.isPublished).sort((a,b)=> new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());
  const magazines = db.magazines.sort((a,b)=> b.numero - a.numero);
  const mainFeatured = articles[0];
  const secondary = articles[1];
  const mini1 = articles[2];
  const mini2 = articles[3];
  const filInfo = articles.slice(4,9);
  const plusLus = [...articles].sort((a,b)=>b.views-a.views).slice(0,5);

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1c] overflow-x-hidden">
      <PromoPopup />

      {/* SECTION 1: ASYMMETRIC HERO MOSAIC */}
      <main className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Featured 8 cols */}
          {mainFeatured && (
            <Link href={`/article/${mainFeatured.slug}`} className="col-span-12 lg:col-span-8 relative group overflow-hidden rounded-lg aspect-square lg:aspect-video">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${mainFeatured.image}')` }}></div>
              <div className="absolute bottom-0 left-0 p-8 z-20 text-white w-full max-w-3xl">
                <span className="inline-block bg-[#9e001f] text-white text-[12px] px-3 py-1 mb-4 uppercase tracking-wider font-bold">{mainFeatured.category}</span>
                <h2 className="text-[24px] md:text-[32px] leading-tight font-bold mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>{mainFeatured.title}</h2>
                <p className="text-[16px] line-clamp-2 opacity-90 mb-6" style={{ fontFamily: "Source Serif 4, serif" }}>{mainFeatured.summary}</p>
                <div className="flex items-center gap-4 text-[12px] opacity-80 italic" style={{ fontFamily: "Inter, sans-serif" }}>
                  <span>Par {mainFeatured.author}</span><span className="w-1 h-1 bg-white rounded-full"></span><span>{new Date(mainFeatured.publishedAt!).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </Link>
          )}

          {/* Right Sidebar 4 cols */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {secondary && (
              <Link href={`/article/${secondary.slug}`} className="bg-[#f0eded] p-6 rounded-lg border border-[#e5bdbb] hover:shadow-md transition-shadow">
                <span className="text-[#9e001f] text-[12px] mb-2 block uppercase font-bold tracking-wider">{secondary.category}</span>
                <h3 className="text-[20px] leading-snug font-bold mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>{secondary.title}</h3>
                <div className="flex items-center gap-4 text-[12px] text-[#5c403f] italic">
                  <span>{secondary.author}</span><span className="w-1 h-1 bg-[#906f6e] rounded-full"></span><span>Hier</span>
                </div>
              </Link>
            )}
            <div className="grid grid-cols-2 gap-4 h-full">
              {[mini1, mini2].map((a:any)=> a && (
                <Link key={a.id} href={`/article/${a.slug}`} className="bg-[#e4e2e1] p-4 rounded-lg flex flex-col justify-between hover:bg-[#e5bdbb] transition-colors group cursor-pointer">
                  <div>
                    <span className="text-[#5c403f] text-[11px] mb-1 block uppercase tracking-wide">{a.category}</span>
                    <h4 className="text-[14px] leading-tight font-semibold group-hover:text-[#9e001f] transition-colors line-clamp-3" style={{ fontFamily: "Inter, sans-serif" }}>{a.title}</h4>
                  </div>
                  <span className="text-[10px] text-[#474646] mt-2">{a.author.split(' ')[0]} • {a.readingTime}min</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* SECTION 2: MAGAZINE CAROUSEL - inverse-surface #303030 */}
      <section className="bg-[#303030] py-[80px] text-white">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <div className="flex items-end justify-between mb-8 border-l-4 border-[#9e001f] pl-6">
            <div>
              <h2 className="text-[32px] font-bold" style={{ fontFamily: "Montserrat, sans-serif" }}>L'édition Papier</h2>
              <p className="text-[#e4e2e1] mt-2" style={{ fontFamily: "Source Serif 4, serif" }}>Retrouvez nos derniers dossiers en version digitale et physique.</p>
            </div>
            <Link href="/kiosque" className="text-[#ffdad8] text-[14px] hover:underline flex items-center gap-2">TOUT LE KIOSQUE <span className="material-symbols-outlined">arrow_forward</span></Link>
          </div>
          <div className="flex overflow-x-auto gap-8 pb-8 custom-scrollbar">
            {magazines.slice(0,6).map((m:any)=>(
              <Link key={m.id} href={`/kiosque/${m.id}`} className="flex-none w-64 group cursor-pointer">
                <div className="relative mb-4 rounded-sm overflow-hidden aspect-[3/4] bg-white shadow-xl magazine-shadow">
                  <img src={m.cover} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                </div>
                <span className="text-[#f2bf5f] text-[11px] block mb-1 uppercase tracking-wider">{new Date(m.date).toLocaleDateString('fr-FR',{month:'long', year:'numeric'})}</span>
                <h3 className="text-[14px] leading-snug font-semibold">N°{m.numero} - {m.title.slice(0,50)}...</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: FIL D'INFO + MANAGER DU MOIS */}
      <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-[80px]">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-[20px] uppercase tracking-widest text-[#5f5e5e] font-bold">Fil d'actualité</h2>
              <div className="h-px bg-[#e5bdbb] flex-grow"></div>
            </div>
            <div className="space-y-6">
              {filInfo.slice(0,1).map((a:any)=>(
                <Link key={a.id} href={`/article/${a.slug}`} className="flex gap-6 border-b border-[#e5bdbb] pb-8 group">
                  <div className="w-1/3 aspect-[4/3] rounded overflow-hidden"><img src={a.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
                  <div className="w-2/3"><span className="text-[#9e001f] text-[12px] uppercase mb-2 block font-bold tracking-wider">{a.category}</span><h3 className="text-[22px] leading-tight font-bold group-hover:underline" style={{ fontFamily: "Montserrat" }}>{a.title}</h3><p className="mt-3 text-[#5c403f] line-clamp-2 text-[16px]">{a.summary}</p></div>
                </Link>
              ))}
              <div className="grid gap-4">
                {filInfo.slice(1,5).map((a:any)=>(
                  <Link key={a.id} href={`/article/${a.slug}`} className="flex gap-4 border-b border-[#e5bdbb] pb-5 group">
                    <div className="text-[#9e001f] font-bold text-[20px]">{new Date(a.publishedAt!).toLocaleTimeString('fr-FR',{hour:'2-digit', minute:'2-digit'})}</div>
                    <div><h4 className="text-[14px] font-semibold mb-1 hover:text-[#9e001f] cursor-pointer">{a.title}</h4><span className="text-[11px] text-[#5c403f]">{a.readingTime} min • {a.author}</span></div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="bg-[#eae7e7] rounded-lg p-8 sticky top-24">
              <h3 className="text-[20px] text-center mb-6 uppercase border-b-2 border-[#9e001f] pb-4 font-bold tracking-wider">Manager du mois</h3>
              <div className="aspect-square rounded-full overflow-hidden mb-6 border-4 border-white shadow-xl max-w-[200px] mx-auto"><img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400" alt="Manager" className="w-full h-full object-cover" /></div>
              <div className="text-center"><h4 className="text-[18px] font-bold mb-1">Fatoumata Kane</h4><p className="text-[#9e001f] text-[12px] mb-3 font-semibold">CEO, Sahel Digital Solutions</p><p className="text-[#5c403f] text-[14px] italic mb-6">"L'innovation technologique en Afrique n'est plus une option, c'est le socle de notre souveraineté économique."</p><Link href="/abonnement" className="w-full bg-[#1b1c1c] text-white text-[12px] py-3 rounded hover:bg-[#9e001f] transition-colors block text-center">LIRE L'INTERVIEW</Link></div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: LES PLUS LUS */}
      <section className="bg-[#ffffff] py-[80px]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <h2 className="text-[28px] font-bold mb-8 flex items-center gap-4" style={{ fontFamily: "Montserrat" }}>Nos articles les plus lus <span className="h-[2px] bg-[#e5bdbb] flex-grow"></span></h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {plusLus.map((a:any, i:number)=>(
              <Link key={a.id} href={`/article/${a.slug}`} className="flex flex-col gap-3 group">
                <span className="text-[64px] font-bold text-[#e5bdbb]/60 leading-none" style={{ fontFamily: "Montserrat" }}>0{i+1}</span>
                <h3 className="text-[14px] font-semibold leading-tight group-hover:text-[#9e001f] transition-colors line-clamp-2">{a.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: FORMATIONS */}
      <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-[80px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[28px] font-bold" style={{ fontFamily: "Montserrat" }}>Formations Certifiées</h2>
          <Link href="/emploi" className="bg-[#5f5e5e] text-white px-6 py-2 rounded-full text-[13px] hover:bg-[#1b1c1c]">Voir tout le catalogue</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title:"Masterclass : Fondamentaux du Trading en Afrique", label:"FORMATION GRATUITE", meta:"Par l'Institut Envol • 15h", cta:"Inscriptions Ouvertes" },
            { title:"Blockchain et Fintech : Anticiper la révolution bancaire", label:null, meta:"Certification Professionnelle • 40h", cta:"Premium" },
            { title:"Leadership & Management Public : Gouverner pour demain", label:"FORMATION GRATUITE", meta:"Module Stratégique • 12h", cta:"Places Limitées" },
          ].map((f,i)=>(
            <div key={i} className="bg-white border border-[#e5bdbb] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow group">
              <div className="relative h-48 bg-[#eae7e7]"><div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-${1517245386807 + i}-bb43f82c33c4?w=600')` }}></div>{f.label && <span className="absolute top-4 left-4 bg-[#9e001f] text-white text-[10px] font-bold px-2 py-1 rounded">{f.label}</span>}</div>
              <div className="p-6"><h3 className="text-[18px] font-bold leading-tight group-hover:text-[#9e001f]">{f.title}</h3><p className="text-[#5c403f] text-[12px] mt-2 mb-4">{f.meta}</p><div className="flex justify-between items-center pt-4 border-t border-[#e5bdbb]"><span className="text-[#9e001f] font-bold text-[12px]">{f.cta}</span><span className="material-symbols-outlined text-[#5f5e5e]">arrow_right_alt</span></div></div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: TABS */}
      <section className="bg-[#f0eded] py-[80px]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <div className="flex justify-center border-b border-[#e5bdbb] mb-8">
            <button className="px-8 py-4 text-[14px] border-b-2 border-[#9e001f] text-[#9e001f] font-bold tracking-wider">FINANCEMENT</button>
            <button className="px-8 py-4 text-[14px] text-[#5c403f] hover:text-[#9e001f]">FORMATIONS</button>
            <button className="px-8 py-4 text-[14px] text-[#5c403f] hover:text-[#9e001f]">CONCOURS</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded shadow-sm border-l-8 border-[#9e001f]"><h3 className="text-[20px] font-bold mb-4">Appel à projets : Innovation Verte 2024</h3><p className="text-[#5c403f] mb-6">Financement jusqu'à 50 000€ pour startups africaines recyclage et énergies renouvelables.</p><Link href="/financement" className="text-[#9e001f] font-bold flex items-center gap-2">EN SAVOIR PLUS <span className="material-symbols-outlined">chevron_right</span></Link></div>
            <div className="bg-white p-8 rounded shadow-sm border-l-8 border-[#5f5e5e]"><h3 className="text-[20px] font-bold mb-4">Fonds de garantie pour PME : Secteur Agro</h3><p className="text-[#5c403f] mb-6">Nouveau mécanisme soutien accès crédit bancaire classique pour transformateurs locaux.</p><Link href="/financement" className="text-[#5f5e5e] font-bold flex items-center gap-2">DÉCOUVRE LE DISPOSITIF <span className="material-symbols-outlined">chevron_right</span></Link></div>
          </div>
        </div>
      </section>

      {/* SECTION 7: ECOSYSTEM MOSAIC */}
      <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-[80px]">
        <h2 className="text-[32px] font-bold text-center mb-8" style={{ fontFamily: "Montserrat" }}>Tout l'écosystème Envol Africa</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name:"Jobs", href:"/emploi", icon:"handshake" },
            { name:"Marketplace", href:"/marketplace", icon:"storefront" },
            { name:"Crowdfunding", href:"/financement", icon:"volunteer_activism" },
            { name:"Africa Awards", href:"/africa-awards", icon:"emoji_events" },
            { name:"World Africa Business", href:"/wab", icon:"public" },
          ].map(e=>(
            <Link key={e.name} href={e.href} className="relative aspect-square rounded-lg overflow-hidden group bg-[#303030]">
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 text-center group-hover:bg-[#9e001f]/80 transition-colors">
                <span className="text-white font-bold text-[16px] uppercase tracking-wider">{e.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 8: CTA */}
      <section className="bg-[#9e001f] py-16">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="text-white text-[36px] md:text-[48px] font-bold mb-6" style={{ fontFamily: "Montserrat" }}>Osez la réussite !</h2>
          <p className="text-[#ffdad8] text-[18px] mb-10 opacity-90">Rejoignez la première communauté de décideurs et d'entrepreneurs panafricains. Accédez à des analyses exclusives et des opportunités d'affaires inédites.</p>
          <Link href="/abonnement" className="bg-white text-[#9e001f] font-bold text-[16px] px-12 py-5 rounded-full hover:shadow-2xl hover:-translate-y-1 transition-all inline-block">S'ABONNER MAINTENANT</Link>
        </div>
      </section>
    </div>
  );
}
