import { readDB } from "@/lib/db";
import Link from "next/link";
import PromoPopup from "@/components/PromoPopup";
import AvantPremiereCarousel from "@/components/home/AvantPremiereCarousel";

export default function HomePage() {
  const db = readDB();
  const articles = db.articles.filter(a=>a.isPublished).sort((a,b)=> new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());
  const magazines = db.magazines.sort((a,b)=> b.numero - a.numero);
  const mainFeatured = articles[0];
  const secondary = articles[1];
  const essor = articles[2];
  const ombre = articles[3];
  const clarte = articles[4];
  const filInfo = articles.slice(5,14); // 9 sous-blocs
  const plusLus = [...articles].sort((a,b)=>b.views-a.views).slice(0,9);
  const formations = [
    { title:"Masterclass : Fondamentaux du Trading", type:"Gratuite", date:"15h", img:"https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400" },
    { title:"Blockchain et Fintech", type:"Certifiée", date:"40h", img:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400" },
    { title:"Leadership & Management Public", type:"Gratuite", date:"12h", img:"https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400" },
    { title:"Marketing Digital Afrique", type:"Payante", date:"20h", img:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400" },
    { title:"Finance Verte", type:"Certifiée", date:"18h", img:"https://images.unsplash.com/photo-1497366811353-524cc3f3968e?w=400" },
    { title:"Agrobusiness 4.0", type:"Gratuite", date:"10h", img:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400" },
  ];

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1c] overflow-x-hidden">
      <PromoPopup />

      {/* IMAGE CATEGORIE A - 4 blocs avec mesures exactes */}
      <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Avant première 1000x1000 - CARROUSEL DEFILEMENT GAUCHE→DROITE AUTOMATIQUE */}
          {/* Tous les articles ayant "Avant première" dans leurs catégories défilent ici */}
          <AvantPremiereCarousel articles={articles} />

          <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
            {/* Bloc secondaire 1000x460 */}
            {secondary && (
              <Link href={`/article/${secondary.slug}`} className="relative overflow-hidden rounded-lg group" style={{ width: "100%", maxWidth: "1000px", aspectRatio: "1000/460" }}>
                <img src={secondary.image} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <span className="bg-[#c8102e] text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">{secondary.category}</span>
                  <h3 className="text-[16px] font-bold leading-tight mt-2 line-clamp-2">{secondary.title}</h3>
                  <div className="text-[10px] opacity-80 mt-1">{secondary.author} • {new Date(secondary.publishedAt!).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">Bloc secondaire • 1000x460 • fixe</div>
              </Link>
            )}

            <div className="grid grid-cols-2 gap-6">
              {/* Essor 460x460 */}
              {essor && (
                <Link href={`/article/${essor.slug}`} className="relative overflow-hidden rounded-lg group" style={{ width: "100%", maxWidth: "460px", aspectRatio: "1/1" }}>
                  <img src={essor.image} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-3 text-white">
                    <span className="bg-[#845e00] text-white text-[9px] px-2 py-0.5 rounded-full uppercase font-bold">{essor.category}</span>
                    <h4 className="text-[13px] font-bold leading-tight mt-1 line-clamp-2">{essor.title}</h4>
                    <div className="text-[9px] opacity-80 mt-1">{essor.author} • {new Date(essor.publishedAt!).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded">Essor • 460x460</div>
                </Link>
              )}
              {/* Ombre douce 460x460 */}
              {ombre && (
                <Link href={`/article/${ombre.slug}`} className="relative overflow-hidden rounded-lg group" style={{ width: "100%", maxWidth: "460px", aspectRatio: "1/1" }}>
                  <img src={ombre.image} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-3 text-white">
                    <span className="bg-[#5f5e5e] text-white text-[9px] px-2 py-0.5 rounded-full uppercase font-bold">{ombre.category}</span>
                    <h4 className="text-[13px] font-bold leading-tight mt-1 line-clamp-2">{ombre.title}</h4>
                    <div className="text-[9px] opacity-80 mt-1">{ombre.author} • {new Date(ombre.publishedAt!).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded">Ombre douce • 460x460</div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* IMAGE CATEGORIE B CARROUSEL MAGAZINE - 4 photos */}
      <section className="bg-[#303030] py-[60px] text-white">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <div className="flex items-end justify-between mb-8 border-l-4 border-[#9e001f] pl-6">
            <div><h2 className="text-[28px] font-bold" style={{ fontFamily: "Montserrat" }}>L'édition Papier</h2><p className="text-[#e4e2e1] mt-1 text-[14px]">4 photos carousel droite → gauche couvertures derniers numéros</p></div>
            <Link href="/kiosque" className="text-[#ffdad8] text-[13px] hover:underline flex items-center gap-1">TOUT LE KIOSQUE <span className="material-symbols-outlined">arrow_forward</span></Link>
          </div>
          <div className="flex overflow-x-auto gap-6 pb-6 custom-scrollbar">
            {magazines.slice(0,4).map((m:any)=>(
              <Link key={m.id} href={`/kiosque/${m.id}`} className="flex-none w-[260px] group">
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white shadow-xl relative"><img src={m.cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /><div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3"><span className="bg-[#9e001f] text-white text-[10px] px-2 py-1 rounded-full uppercase font-bold">{m.category||"Economie"}</span><div className="text-white text-[12px] font-bold leading-tight mt-1 line-clamp-2">{m.title}</div></div></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FIL D'INFO & MANAGER DU MOIS - 9 sous-blocs */}
      <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-[80px]">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-[20px] uppercase tracking-widest font-bold text-[#5f5e5e]">Fil d'info - 9 sous-blocs</h2>
              <div className="h-px bg-[#e5bdbb] flex-grow"></div>
            </div>

            {/* Clarté 700x933 */}
            {clarte && (
              <Link href={`/article/${clarte.slug}`} className="flex flex-col md:flex-row gap-6 border-b border-[#e5bdbb] pb-8 group mb-8" style={{ maxWidth: "100%" }}>
                <div className="w-full md:w-[700px] aspect-[700/933] max-w-full rounded-lg overflow-hidden bg-[#eae7e7] flex-shrink-0 relative">
                  <img src={clarte.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute top-2 left-2 bg-[#9e001f] text-white text-[10px] px-2 py-1 rounded">Clarté • 700x933</div>
                </div>
                <div className="flex-1">
                  <span className="text-[#9e001f] text-[12px] uppercase font-bold tracking-wider">{clarte.category}</span>
                  <h3 className="text-[22px] font-bold leading-tight mt-2 group-hover:text-[#9e001f]">{clarte.title}</h3>
                  <p className="text-[#5c403f] mt-3 line-clamp-3 text-[14px]">{clarte.summary}</p>
                  <div className="text-[11px] text-[#5f5e5e] mt-4">{clarte.author} • {new Date(clarte.publishedAt!).toLocaleDateString('fr-FR')}</div>
                </div>
              </Link>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {filInfo.map((a:any,i:number)=>(
                <Link key={a.id} href={`/article/${a.slug}`} className="flex gap-4 border-b border-[#e5bdbb]/50 pb-4 group">
                  <div className="text-[#9e001f] font-bold text-[14px]">{String(i+1).padStart(2,'0')}</div>
                  <div><h4 className="text-[13px] font-semibold leading-tight group-hover:text-[#9e001f] line-clamp-2">{a.title}</h4><div className="text-[11px] text-[#5c403f] mt-1">{a.category} • {a.readingTime}min • {a.author.split(' ')[0]}</div></div>
                </Link>
              ))}
            </div>
            <div className="mt-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">7 sous-blocs Fil d'info restants à finaliser avec Quentin §12.1 - proposition: Pouls du jour, Chronique, Focus Régional, Interview flash, Chiffre clé, Agenda, Opportunité du jour - UI admin bloquée avec message explicite en attente validation</div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="bg-[#eae7e7] rounded-xl p-6 sticky top-24">
              <h3 className="text-[18px] font-bold text-center mb-6 uppercase border-b-2 border-[#9e001f] pb-3">Manager du mois</h3>
              <div className="aspect-square rounded-full overflow-hidden mb-4 border-4 border-white shadow-xl max-w-[200px] mx-auto"><img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400" alt="" className="w-full h-full object-cover" /></div>
              <div className="text-center"><h4 className="font-bold">Fatoumata Kane</h4><p className="text-[#9e001f] text-[12px] font-bold">CEO, Sahel Digital</p><p className="text-[13px] italic mt-2 text-[#5c403f] line-clamp-2">"L'innovation technologique en Afrique n'est plus une option..."</p><Link href="/abonnement" className="mt-4 w-full bg-[#1b1c1c] text-white text-[12px] py-2 rounded-full block text-center">LIRE L'INTERVIEW - 2 lignes</Link></div>
            </div>
          </div>
        </div>
      </section>

      {/* PLUS LUS - 3 lignes x 3 carreaux = 9 articles */}
      <section className="bg-white py-[60px] border-y border-[#e5bdbb]/30">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <h2 className="text-[22px] font-bold mb-6 flex items-center gap-3">Nos articles les plus lus - 3 lignes x 3 carreaux (9 articles auto) <span className="h-px bg-[#e5bdbb] flex-1"></span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plusLus.map((a:any, i:number)=>(
              <Link key={a.id} href={`/article/${a.slug}`} className="rounded-xl border border-[#e5bdbb] p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start"><span className="text-[20px] font-black text-[#e5bdbb]">{String(i+1).padStart(2,'0')}</span><span className="text-[10px] bg-[#f0eded] px-2 py-0.5 rounded-full uppercase font-bold">{a.category}</span></div>
                <h3 className="text-[13px] font-semibold leading-tight line-clamp-2">{a.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FORMATIONS - 6 photos cercle */}
      <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-[80px]">
        <div className="flex items-center justify-between mb-8"><h2 className="text-[26px] font-bold" style={{ fontFamily: "Montserrat" }}>Formations Certifiées ENVOL AFRICA - 6 photos cercle</h2><Link href="/emploi" className="bg-[#5f5e5e] text-white px-5 py-2 rounded-full text-[12px]">Voir tout</Link></div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
          {formations.map((f:any, i:number)=>(
            <div key={i} className="text-center group cursor-pointer">
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-[#e5bdbb] group-hover:border-[#9e001f] transition-colors"><img src={f.img} alt="" className="w-full h-full object-cover" /></div>
              <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#9e001f]">{f.type}</div>
              <div className="text-[12px] font-semibold leading-tight mt-1 line-clamp-2">{f.title}</div>
              <div className="text-[10px] text-[#5c403f] mt-1">{f.date}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ONGLETS - Financement/Opportunités/Emplois/Formations/Concours - 3 lignes 2 colonnes */}
      <section className="bg-[#f0eded] py-[80px]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <div className="flex justify-center border-b border-[#e5bdbb] mb-8 gap-2 overflow-x-auto">
            {["Financement","Opportunités","Emplois","Formations","Concours"].map((tab,i)=>(
              <button key={tab} className={`px-6 py-3 text-[13px] font-bold uppercase tracking-wider whitespace-nowrap border-b-2 ${i===0?"border-[#9e001f] text-[#9e001f]":"border-transparent text-[#5c403f]"}`}>{tab}</button>
            ))}
          </div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_,i)=>(
                  <div key={i} className="bg-white rounded-xl border border-[#e5bdbb] p-5">
                    <h4 className="font-bold text-[14px] leading-tight">Financement innovation verte {i+1}</h4>
                    <p className="text-[12px] text-[#5c403f] mt-2 line-clamp-2">Financement jusqu'à 50 000€ pour startups africaines recyclage et énergies renouvelables...</p>
                    <div className="text-[11px] text-[#5f5e5e] mt-3">Auteur • {new Date().toLocaleDateString('fr-FR')}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-white rounded-xl border p-4 h-[320px] flex flex-col">
                <div className="text-[11px] font-bold uppercase tracking-wider mb-3">Publicité - Google Adsense standard</div>
                <div className="flex-1 bg-[#eae7e7] rounded-lg flex items-center justify-center text-[12px] text-[#5c403f]">Pub défilant droite → gauche</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEOS - fond noir 2 blocs */}
      <section className="bg-[#1b1c1c] py-[80px] text-white">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <h2 className="text-[26px] font-bold mb-8">Vidéos</h2>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-7 aspect-video bg-[#303030] rounded-xl flex items-center justify-center">Vidéo principale</div>
            <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i=><div key={i} className="aspect-video bg-[#303030] rounded-lg flex items-center justify-center text-[12px]">Vidéo {i}</div>)}
            </div>
          </div>
        </div>
      </section>

      {/* DANS NOTRE PROCHAIN NUMERO - carousel 3 photos */}
      <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-[80px]">
        <h2 className="text-[26px] font-bold mb-8">Dans notre prochain numéro - carousel 3 photos avant-première</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[1,2,3].map(i=>(
            <div key={i} className="group cursor-pointer">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#eae7e7]"><img src={`https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>
              <h4 className="font-bold text-[14px] mt-3 leading-tight">Article prochain numéro {i}</h4>
              <p className="text-[12px] text-[#5c403f] mt-1 line-clamp-2">Petite description avant-première...</p>
              <div className="flex items-center justify-between mt-2"><span className="text-[11px] text-[#5f5e5e]">Auteur {i}</span><span className="text-[11px] font-bold text-[#9e001f]">Commander ce numéro →</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* TOUT L'ECOSYSTEME - fond gris clair full écran carousel 4 photos portrait grand */}
      <section className="bg-[#f6f3f2] py-[80px]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <h2 className="text-[32px] font-bold text-center mb-8" style={{ fontFamily: "Montserrat" }}>Tout l'écosystème ENVOL AFRICA - 4 photos portrait grand carousel</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Jobs","Marketplace","Crowdfunding","Africa Awards"].map(name=>(
              <Link key={name} href={`/${name.toLowerCase()}`} className="aspect-[3/4] rounded-xl overflow-hidden bg-[#303030] relative group">
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white font-bold uppercase tracking-wider">{name}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* START'UPS - 4 images non défilant titre+desc 4 lignes */}
      <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-[60px]">
        <h2 className="text-[24px] font-bold mb-6">Start'ups - 4 images</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i=>(
            <div key={i} className="group"><div className="aspect-square rounded-xl bg-[#eae7e7]"></div><h4 className="font-bold text-[14px] mt-3">Start-up {i}</h4><p className="text-[12px] text-[#5c403f] mt-1 line-clamp-4">Description sur 4 lignes de la start-up africaine innovante qui change le continent avec sa solution tech...</p></div>
          ))}
        </div>
      </section>

      {/* RECRUTEMENT - 3 blocs sans contour image carrée arrondie + société + poste */}
      <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-[60px] border-t border-[#e5bdbb]/30">
        <h2 className="text-[24px] font-bold mb-6">Recrutement - 3 blocs</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[1,2,3].map(i=>(
            <div key={i} className="flex gap-3 p-4 rounded-xl hover:bg-[#f6f3f2] transition-colors">
              <img src={`https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100`} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div><div className="font-bold text-[13px]">Société {i} - Poste</div><div className="text-[12px] text-[#5c403f]">Développeur Fullstack - Cotonou</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTENUS SPONSORISES - carousel photo + description */}
      <section className="bg-white py-[60px] border-y">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <h2 className="text-[20px] font-bold mb-6">Contenus sponsorisés - carousel pub partenaires</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1,2,3,4].map(i=><div key={i} className="flex-none w-64 rounded-xl border p-3"><div className="aspect-video bg-[#eae7e7] rounded"></div><p className="text-[12px] mt-2">Pub partenaire {i} - Description</p></div>)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#9e001f] py-16">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="text-white text-[36px] font-bold mb-4" style={{ fontFamily: "Montserrat" }}>Osez la réussite !</h2>
          <p className="text-[#ffdad8] mb-8">Rejoignez la première communauté de décideurs panafricains.</p>
          <Link href="/abonnement" className="bg-white text-[#9e001f] px-10 py-4 rounded-full font-bold inline-block">S'ABONNER MAINTENANT</Link>
        </div>
      </section>
    </div>
  );
}
