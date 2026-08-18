"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { KIOSQUE_FORMATS, LANGUAGE_LABELS } from "@/lib/constants";

type Magazine = {
  id: string;
  numero?: number;
  title: string;
  cover: string;
  date: string;
  description?: string;
  year?: number;
};

type MagazineResponse = { magazine?: Magazine; magazines?: Magazine[] };

export default function MagazineDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [selections, setSelections] = useState<Array<{ format: string; language: string }>>([{ format: "numerique", language: "fr" }]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(()=>{
    fetch(`/api/magazines?id=${id}`).then((response) => response.json() as Promise<MagazineResponse>).then((data) => {
      setMagazine(data.magazine ?? data.magazines?.find((item) => item.id === id) ?? null);
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

  const formatOptions = [
    { id: "numerique", label: "Numérique", icon: "tablet_android", desc: "Accès immédiat PDF/Web" },
    { id: "papier", label: "Papier", icon: "auto_stories", desc: "Livraison à domicile" },
    { id: "audio_pdf", label: "Audio + PDF", icon: "headphones", desc: "Lecture & écoute" },
    { id: "cd_audio", label: "CD Audio", icon: "album", desc: "Version collector" },
    { id: "audio_papier", label: "Audio + Papier", icon: "auto_awesome", desc: "Expérience complète" },
  ];
  const prices: Record<string, number> = { numerique: 12.9, papier: 19.5, cd_audio: 24, audio_pdf: 15.5, audio_papier: 29.9 };
  const formatPriceInXof: Record<string, number> = Object.fromEntries(KIOSQUE_FORMATS.map((item) => [item.id, item.price]));

  const languagesForFormat = (formatId: string) => formatId.includes("audio") || formatId === "cd_audio"
    ? ["fr", "en", "es", "sw", "ha", "yo", "ig", "fon", "ff", "zu", "ee", "wo"]
    : ["fr", "en", "es"];

  const total = selections.reduce((sum, selection) => sum + (prices[selection.format] || 0), 0);
  const formatPrice = (value: number) => `${value.toFixed(2).replace(".", ",")} €`;

  const updateSelection = (index: number, key: "format" | "language", value: string) => {
    setSelections((current) => current.map((selection, selectionIndex) => {
      if (selectionIndex !== index) return selection;
      if (key === "format") {
        const availableLanguages = languagesForFormat(value);
        return { format: value, language: availableLanguages.includes(selection.language) ? selection.language : "fr" };
      }
      return { ...selection, language: value };
    }));
  };

  const addSelection = () => setSelections((current) => [...current, { format: "numerique", language: "fr" }]);
  const removeSelection = (index: number) => setSelections((current) => current.filter((_, selectionIndex) => selectionIndex !== index));

  const addToCart = () => {
    setAdding(true);
    const cart = JSON.parse(localStorage.getItem("eam_cart") || "[]");
    selections.forEach(({ format, language }) => {
      cart.push({ type: "magazine", magazineId: id, format, language, price: formatPriceInXof[format] || 10000, title: magazine?.title, cover: magazine?.cover, numero: magazine?.numero });
    });
    localStorage.setItem("eam_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    setTimeout(() => setAdding(false), 400);
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
          <div className="md:col-span-5 lg:col-span-4 md:sticky md:top-32 md:self-start">
            <div className="relative group">
              <div className="aspect-[3/4] w-full bg-[#eae7e7] rounded-lg overflow-hidden shadow-2xl relative" style={{ boxShadow: "inset 12px 0 15px -10px rgba(0,0,0,0.5)" }}>
                <img src={magazine.cover} alt={magazine.title} className="w-full h-full object-cover rounded-lg" />
                <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
                <button onClick={()=>alert("Feuilletage : 5 pages gratuites - aperçu limité")} className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/95 backdrop-blur-md text-[#9e001f] px-5 py-3 rounded-full text-[12px] font-bold shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined">menu_book</span> FEUILLETER L&apos;APERÇU</button>
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
                <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#9e001f] text-[20px] mt-0.5">check_circle</span><span><strong>Économie :</strong> Les nouveaux corridors commerciaux de l&apos;Est.</span></li>
                <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#9e001f] text-[20px]">check_circle</span><span><strong>Finance :</strong> Pourquoi les banques misent sur la Fintech.</span></li>
                <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#9e001f] text-[20px]">check_circle</span><span><strong>Tech :</strong> L&apos;IA au service de l&apos;agriculture.</span></li>
                <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#9e001f] text-[20px]">check_circle</span><span><strong>Focus :</strong> Portrait de 10 leaders tech africains.</span></li>
              </ul>
            </section>

            <section className="rounded-xl border border-[#e5bdbb] bg-white p-4 sm:p-6" aria-labelledby="purchase-options-title">
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-[#eadad8] pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#9e001f]">Personnalisez votre achat</p>
                  <h2 id="purchase-options-title" className="mt-1 text-[20px] font-bold text-[#1b1c1c]">Choisissez vos éditions</h2>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] uppercase tracking-wider text-[#5c403f]">Total</span>
                  <strong className="text-[24px] text-[#9e001f]">{formatPrice(total)}</strong>
                </div>
              </div>

              <div className="space-y-3">
                {selections.map((selection, index) => {
                  const availableLanguages = languagesForFormat(selection.format);
                  return (
                    <div key={`${index}-${selection.format}`} className="rounded-lg border border-[#eadad8] bg-[#fcf9f8] p-3 sm:p-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <label className="block text-[12px] font-bold text-[#2b2525]">
                          <span className="mb-1.5 block uppercase tracking-wider text-[#5c403f]">Choix de version</span>
                          <select value={selection.format} onChange={(event) => updateSelection(index, "format", event.target.value)} className="min-h-11 w-full rounded-md border border-[#cdb7b4] bg-white px-3 text-[14px] text-[#2b2525] outline-none focus:border-[#9e001f] focus:ring-2 focus:ring-[#9e001f]/15">
                            {formatOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                          </select>
                        </label>
                        <label className="block text-[12px] font-bold text-[#2b2525]">
                          <span className="mb-1.5 block uppercase tracking-wider text-[#5c403f]">Choix de langue</span>
                          <select value={selection.language} onChange={(event) => updateSelection(index, "language", event.target.value)} className="min-h-11 w-full rounded-md border border-[#cdb7b4] bg-white px-3 text-[14px] text-[#2b2525] outline-none focus:border-[#9e001f] focus:ring-2 focus:ring-[#9e001f]/15">
                            {availableLanguages.map((code) => <option key={code} value={code}>{LANGUAGE_LABELS[code]} • {code.toUpperCase()}</option>)}
                          </select>
                        </label>
                        <div className="flex items-center justify-between gap-3 sm:min-w-[116px] sm:justify-end">
                          <span className="text-[11px] uppercase tracking-wider text-[#746665]">Prix TTC</span>
                          <strong className="text-[20px] text-[#9e001f]">{formatPrice(prices[selection.format])}</strong>
                          {selections.length > 1 && <button type="button" onClick={() => removeSelection(index)} className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-[#9e001f] hover:bg-[#ffdad8]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9e001f]" aria-label={`Supprimer la combinaison ${index + 1}`}><span className="material-symbols-outlined text-[20px]">delete</span></button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button type="button" onClick={addSelection} className="mt-4 flex min-h-11 items-center gap-2 text-[13px] font-bold text-[#9e001f] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9e001f]"><span className="material-symbols-outlined">add_circle</span> Ajouter une autre version</button>

              <div className="mt-5 flex flex-col gap-4 border-t border-[#eadad8] pt-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="block text-[11px] uppercase tracking-wider text-[#5c403f]">Total de votre sélection</span>
                  <strong className="text-[36px] font-bold text-[#9e001f]" style={{ fontFamily: "Montserrat" }}>{formatPrice(total)}</strong>
                </div>
                <div className="w-full sm:w-auto">
                  <button onClick={addToCart} disabled={adding} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#9e001f] px-8 py-4 text-[15px] font-bold text-white shadow-lg shadow-[#9e001f]/20 transition hover:brightness-110 active:scale-[.98] disabled:opacity-60 sm:w-auto">
                    <span className="material-symbols-outlined">shopping_cart</span> {adding ? "Ajout..." : "AJOUTER AU PANIER"}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-[#5f5e5e]">Livraison offerte Papier en zone CEDEAO • Lien sécurisé 24h</p>
                </div>
              </div>

              <div className="mt-5 border-t border-[#eadad8] pt-4" aria-label="Options de paiement acceptées">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#5c403f]">Options de paiement</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#d8c3c1] bg-white px-3 text-[11px] font-semibold text-[#2b2525]"><span className="material-symbols-outlined text-[17px]">credit_card</span> Carte bancaire</span>
                  <span className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#d8c3c1] bg-white px-3 text-[11px] font-semibold text-[#2b2525]"><span className="material-symbols-outlined text-[17px]">smartphone</span> Mobile Money</span>
                  <span className="inline-flex min-h-9 items-center rounded-md border border-[#d8c3c1] bg-white px-3 text-[11px] font-semibold text-[#635b5a]">Stripe</span>
                  <span className="inline-flex min-h-9 items-center rounded-md border border-[#d8c3c1] bg-white px-3 text-[11px] font-semibold text-[#635b5a]">PayPal</span>
                  <span className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#d8c3c1] bg-white px-3 text-[11px] font-semibold text-[#2b2525]"><span className="material-symbols-outlined text-[17px]">currency_bitcoin</span> Crypto</span>
                </div>
              </div>
            </section>

            <div className="mt-12 border-t border-[#e5bdbb]/30 pt-8">
              <div className="flex gap-8 border-b border-[#e5bdbb]/30 mb-8">
                <button className="pb-4 border-b-2 border-[#9e001f] text-[#9e001f] text-[14px] font-bold">Description détaillée</button>
                <button className="pb-4 border-b-2 border-transparent text-[#5f5e5e] text-[14px]">Spécifications</button>
                <button className="pb-4 border-b-2 border-transparent text-[#5f5e5e] text-[14px]">Avis (12)</button>
              </div>
              <div className="max-w-3xl">
                <p className="text-[16px] leading-loose">Ce numéro spécial de {magazine.year} dresse un état des lieux sans concession de la maturité numérique sur le continent. Alors que les câbles sous-marins multiplient les points d&apos;ancrage, comment les entreprises locales s&apos;approprient-elles ces nouvelles capacités ? Nos journalistes ont voyagé de Nairobi à Lagos. Inclus : guide pratique 12 pages sécurisation transactions.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
