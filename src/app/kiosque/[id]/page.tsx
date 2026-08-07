"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { KIOSQUE_FORMATS, LANGUAGE_LABELS } from "@/lib/constants";

export default function MagazineDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [magazine, setMagazine] = useState<any>(null);
  const [format, setFormat] = useState<string>("numerique");
  const [language, setLanguage] = useState<string>("fr");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(()=>{
    fetch(`/api/magazines?id=${id}`).then(r=>r.json()).then(data=>{
      setMagazine(data.magazine || data.magazines?.find((m:any)=>m.id===id));
      setLoading(false);
    }).catch(()=>{
      setMagazine({
        id,
        numero: 25,
        title: `Envol Africa N°25 - Spécial Investissements 2026`,
        cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600",
        date: "2026-01-01",
        description: "Notre grand dossier investissements, 40 pages d'analyses exclusives.",
        year: 2026,
      });
      setLoading(false);
    });
  },[id]);

  const selectedFormat = KIOSQUE_FORMATS.find(f=>f.id===format);
  const languagesForFormat = format.includes("audio") || format==="cd_audio" 
    ? ["fr","en","es","sw","ha","yo","ig","fon","ff","zu","ee","wo"] 
    : ["fr","en","es"];

  const prices: any = { numerique: "12,90 €", papier: "19,50 €", cd_audio: "24,00 €", audio_pdf: "15,50 €", audio_papier: "29,90 €" };

  const addToCart = () => {
    setAdding(true);
    const cart = JSON.parse(localStorage.getItem("eam_cart")||"[]");
    cart.push({ type:"magazine", magazineId: id, format, language, price: selectedFormat?.price || 10000, title: magazine?.title, cover: magazine?.cover, numero: magazine?.numero });
    localStorage.setItem("eam_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    setTimeout(()=>{ setAdding(false); alert("Ajouté au panier !"); }, 400);
  };

  if (loading) return <div className="max-w-[1280px] mx-auto px-6 py-20 text-center">Chargement...</div>;
  if (!magazine) return <div className="max-w-[1280px] mx-auto px-6 py-20 text-center">Magazine introuvable</div>;

  return (
    <div className="bg-[#fcf9f8] min-h-screen">
      <main className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-[80px]">
        <nav className="mb-8 flex items-center gap-2 text-[#5c403f]/70 text-[12px]">
          <Link href="/" className="hover:text-[#9e001f]">Accueil</Link><span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link href="/kiosque" className="hover:text-[#9e001f]">Kiosque</Link><span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#1b1c1c] font-semibold">Numéro {magazine.numero} - {new Date(magazine.date).toLocaleDateString('fr-FR',{month:'long', year:'numeric'})}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-5 lg:col-span-4 sticky top-32">
            <div className="relative group">
              <div className="aspect-[3/4] w-full bg-[#eae7e7] rounded-lg overflow-hidden shadow-2xl relative" style={{ boxShadow: "inset 12px 0 15px -10px rgba(0,0,0,0.5)" }}>
                <img src={magazine.cover} alt={magazine.title} className="w-full h-full object-cover rounded-lg" />
                <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
                <button onClick={()=>alert("Feuilletage: 5 pages gratuites - aperçu limité")} className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-md text-[#9e001f] px-6 py-3 rounded-full text-[12px] font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined">menu_book</span> FEUILLETER L'APERÇU</button>
              </div>
              <div className="mt-4 flex gap-4 justify-center">
                {[1,2].map(i=>(
                  <div key={i} className="w-16 h-20 bg-[#f6f3f2] rounded border border-[#e5bdbb]/30 overflow-hidden"><img src={magazine.cover} alt="" className="w-full h-full object-cover" /></div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-7 lg:col-span-8 space-y-6">
            <header>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-[#ffdad8] text-[#9e001f] rounded-full text-[11px] uppercase tracking-wider font-bold">Magazine Mensuel</span>
                <span className="text-[#5c403f] text-[12px] italic">N° {magazine.numero} — {magazine.year} • 124 pages</span>
              </div>
              <h1 className="text-[32px] md:text-[40px] font-bold leading-tight text-[#1b1c1c] mb-2" style={{ fontFamily: "Montserrat" }}>{magazine.title}</h1>
              <p className="text-[18px] text-[#5f5e5e] leading-relaxed max-w-2xl" style={{ fontFamily: "Source Serif 4" }}>{magazine.description} Ce numéro inclut notre enquête sur la transformation locale du cacao, entretien CEO Wave, classement 50 entreprises les plus performantes.</p>
            </header>

            <section className="p-6 bg-[#f0eded] rounded-xl">
              <h3 className="text-[14px] font-bold uppercase tracking-widest mb-4">Au sommaire de ce numéro</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[#5c403f] text-[14px]">
                <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#9e001f] text-[20px] mt-0.5">check_circle</span><span><strong>Économie :</strong> Les nouveaux corridors commerciaux de l'Est.</span></li>
                <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#9e001f] text-[20px]">check_circle</span><span><strong>Finance :</strong> Pourquoi les banques misent sur la Fintech.</span></li>
                <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#9e001f] text-[20px]">check_circle</span><span><strong>Tech :</strong> L'IA au service de l'agriculture.</span></li>
                <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#9e001f] text-[20px]">check_circle</span><span><strong>Focus :</strong> Portrait de 10 leaders tech africains.</span></li>
              </ul>
            </section>

            <div className="space-y-6">
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-widest mb-3">1. Choisir la version</h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id:"numerique", label:"Numérique", icon:"tablet_android", desc:"Accès immédiat PDF/Web" },
                    { id:"papier", label:"Papier", icon:"auto_stories", desc:"Livraison à domicile" },
                    { id:"audio_pdf", label:"Audio + PDF", icon:"headphones", desc:"Lecture & écoute" },
                    { id:"cd_audio", label:"CD Audio", icon:"album", desc:"Version collector" },
                    { id:"audio_papier", label:"Audio + Papier", icon:"auto_awesome", desc:"Expérience complète" },
                  ].map(f=>(
                    <button key={f.id} onClick={()=>setFormat(f.id)} className={`p-4 border-2 rounded-xl text-left hover:border-[#9e001f] transition-all group flex flex-col ${format===f.id?"border-[#9e001f] bg-[#9e001f]/10 text-[#9e001f]":"border-[#e5bdbb]"}`}>
                      <span className="material-symbols-outlined mb-2 group-hover:scale-110 transition-transform">{f.icon}</span>
                      <span className="font-bold text-[14px]">{f.label}</span>
                      <span className="text-[11px] opacity-70">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-widest mb-3">2. Choisir la langue {format.includes("audio")&&"(12 langues)"}</h4>
                <div className="flex flex-wrap gap-2">
                  {languagesForFormat.map((code:string)=>(
                    <button key={code} onClick={()=>setLanguage(code)} className={`px-6 py-2 border-2 rounded-lg text-[14px] font-medium transition-colors ${language===code?"border-[#9e001f] bg-[#9e001f]/10 text-[#9e001f]":"border-[#e5bdbb] hover:border-[#9e001f]"}`}>
                      {LANGUAGE_LABELS[code]} • {code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#e5bdbb] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <span className="text-[#5c403f] text-[12px] block">Prix TTC</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[48px] font-bold text-[#9e001f]" style={{ fontFamily: "Montserrat" }}>{prices[format]||"12,90 €"}</span>
                  <span className="text-[#5c403f] text-[14px] line-through">15,00 €</span>
                </div>
              </div>
              <div className="flex flex-col w-full sm:w-auto gap-3">
                <button onClick={addToCart} disabled={adding} className="flex items-center justify-center gap-3 bg-[#9e001f] text-white px-10 py-5 rounded-xl font-bold text-[16px] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#9e001f]/20 disabled:opacity-60">
                  <span className="material-symbols-outlined">shopping_cart</span> {adding?"Ajout...":"AJOUTER AU PANIER"}
                </button>
                <p className="text-center text-[11px] text-[#5f5e5e]">Livraison offerte Papier en zone CEDEAO • Lien sécurisé 24h</p>
              </div>
            </div>

            <div className="mt-12 border-t border-[#e5bdbb]/30 pt-8">
              <div className="flex gap-8 border-b border-[#e5bdbb]/30 mb-8">
                <button className="pb-4 border-b-2 border-[#9e001f] text-[#9e001f] text-[14px] font-bold">Description détaillée</button>
                <button className="pb-4 border-b-2 border-transparent text-[#5f5e5e] text-[14px]">Spécifications</button>
                <button className="pb-4 border-b-2 border-transparent text-[#5f5e5e] text-[14px]">Avis (12)</button>
              </div>
              <div className="max-w-3xl">
                <p className="text-[16px] leading-loose">Ce numéro spécial de {magazine.year} dresse un état des lieux sans concession de la maturité numérique sur le continent. Alors que les câbles sous-marins multiplient les points d'ancrage, comment les entreprises locales s'approprient-elles ces nouvelles capacités ? Nos journalistes ont voyagé de Nairobi à Lagos. Inclus : guide pratique 12 pages sécurisation transactions.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
