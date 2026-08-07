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
    // fetch from db via api? For demo, we read from local storage? We'll fetch via API route not yet created, so fallback to direct fetch of db.json? Simpler: call api to get magazine from client side using window fetch to /api/magazines?id
    fetch(`/api/magazines?id=${id}`).then(r=>r.json()).then(data=>{
      setMagazine(data.magazine || data.magazines?.find((m:any)=>m.id===id));
      setLoading(false);
    }).catch(()=>{
      // fallback hardcoded
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

  const addToCart = () => {
    setAdding(true);
    const cart = JSON.parse(localStorage.getItem("eam_cart")||"[]");
    cart.push({ type:"magazine", magazineId: id, format, language, price: selectedFormat?.price || 10000, title: magazine?.title, cover: magazine?.cover, numero: magazine?.numero });
    localStorage.setItem("eam_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    setTimeout(()=>{ setAdding(false); alert("Ajouté au panier !"); }, 400);
  };

  if (loading) return <div className="max-w-[1440px] mx-auto px-6 py-20 text-center">Chargement...</div>;
  if (!magazine) return <div className="max-w-[1440px] mx-auto px-6 py-20 text-center">Magazine introuvable</div>;

  return (
    <div className="bg-[#FFFCF5] min-h-screen pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 pt-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-zinc-500"><Link href="/" className="hover:text-[#0A1931]">Accueil</Link><span>›</span><Link href="/kiosque" className="hover:text-[#0A1931]">Kiosque</Link><span>›</span><span className="text-[#0A1931]">N°{magazine.numero}</span></div>

        <div className="mt-8 grid lg:grid-cols-[420px_1fr] gap-10">
          <div>
            <div className="rounded-[20px] overflow-hidden bg-white border border-zinc-100 magazine-shadow p-2">
              <img src={magazine.cover} alt={magazine.title} className="w-full aspect-[3/4] object-cover rounded-[14px]" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1,2,3].map(i=>(
                <div key={i} className="aspect-[3/4] rounded-[12px] bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[11px] text-zinc-500">Aperçu p.{i*10}</div>
              ))}
            </div>
            <div className="mt-4 rounded-[14px] bg-amber-50 border border-amber-100 p-4 text-[12px] text-amber-900">
              <div className="font-bold">🔒 Aperçu limité</div>
              <div className="mt-1">Vous pouvez feuilleter 5 pages gratuitement. L'intégralité (124 pages) est disponible après achat avec lien sécurisé expirant en 24h.</div>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 bg-[#0A1931] text-white rounded-full px-3 py-1 text-[11px] font-bold uppercase">N°{magazine.numero} • {magazine.year} • 124 pages</div>
            <h1 className="font-serif font-black text-[28px] md:text-[40px] leading-[0.95] tracking-tight text-[#0A1931] mt-4">{magazine.title}</h1>
            <p className="text-[15px] leading-7 text-zinc-600 mt-4">{magazine.description} Ce numéro inclut notre enquête sur la transformation locale du cacao, un entretien avec le CEO de Wave, et le classement des 50 entreprises les plus performantes.</p>

            <div className="mt-8">
              <h3 className="font-bold text-[14px] uppercase tracking-wide text-[#0A1931]">1. Choisissez votre format</h3>
              <div className="mt-3 grid md:grid-cols-2 gap-3">
                {KIOSQUE_FORMATS.map(f=>(
                  <button key={f.id} onClick={()=>setFormat(f.id)} className={`text-left rounded-[16px] border p-4 transition-all ${format===f.id ? "bg-[#0A1931] border-[#0A1931] text-white shadow-lg" : "bg-white border-zinc-200 hover:border-zinc-300"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-[14px] ${format===f.id ? "text-white" : "text-[#0A1931]"}`}>{f.label}</span>
                      <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${format===f.id ? "bg-[#D4AF37] text-[#0A1931]" : "bg-zinc-100 text-zinc-700"}`}>{f.price.toLocaleString()} F CFA</span>
                    </div>
                    <div className={`text-[12px] mt-1 ${format===f.id ? "text-zinc-300" : "text-zinc-500"}`}>{f.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-bold text-[14px] uppercase tracking-wide text-[#0A1931]">2. Choisissez la langue {format.includes("audio") && "(12 langues disponibles)"}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {languagesForFormat.map(code=>(
                  <button key={code} onClick={()=>setLanguage(code)} className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all ${language===code ? "bg-[#D4AF37] border-[#D4AF37] text-[#0A1931] font-bold" : "bg-white border-zinc-200 hover:border-zinc-300"}`}>
                    {LANGUAGE_LABELS[code]} • {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-[20px] bg-white border border-zinc-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-widest font-bold text-zinc-500">Prix total</div>
                  <div className="font-serif font-black text-[28px] text-[#0A1931]">{selectedFormat?.price.toLocaleString()} F CFA</div>
                  <div className="text-[12px] text-zinc-500">+ livraison {format.includes("papier") ? "2 000 F CFA (BJ) à 12 000 F CFA (US) • Calcul auto au panier" : "incluse (digital)"} • {LANGUAGE_LABELS[language]}</div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-1 inline-block">✓ Lien sécurisé 24h</div>
                  <div className="text-[11px] text-zinc-500 mt-2">Aucune donnée bancaire stockée</div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={addToCart} disabled={adding} className="flex-1 h-12 rounded-full bg-[#0A1931] text-white font-bold text-[14px] hover:bg-black disabled:opacity-60 flex items-center justify-center gap-2">
                  {adding ? "Ajout..." : <><span>🛒</span> Ajouter au panier</>}
                </button>
                <Link href="/panier" className="h-12 px-6 rounded-full bg-[#D4AF37] text-[#0A1931] font-bold text-[14px] flex items-center gap-2 hover:bg-[#F0D878]">Acheter maintenant →</Link>
              </div>
              <div className="mt-4 flex items-center gap-3 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">🔒 Paiement Moneroo sécurisé</span>
                <span>•</span>
                <span>Mobile Money & Carte</span>
                <span>•</span>
                <span>Téléchargement immédiat</span>
              </div>
            </div>

            <div className="mt-8 grid md:grid-cols-3 gap-3 text-[12px]">
              <div className="rounded-[14px] bg-zinc-50 border border-zinc-100 p-4"><div className="font-bold">📦 Livraison papier</div><div className="text-zinc-600 mt-1">DHL • Suivi inclus • 3-7 jours</div></div>
              <div className="rounded-[14px] bg-zinc-50 border border-zinc-100 p-4"><div className="font-bold">🎧 Audio 12 langues</div><div className="text-zinc-600 mt-1">Fongbé, Wolof, Swahili, etc.</div></div>
              <div className="rounded-[14px] bg-zinc-50 border border-zinc-100 p-4"><div className="font-bold">♻️ Engagement</div><div className="text-zinc-600 mt-1">1% reversé à la formation journalistique</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
