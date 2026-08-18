"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { KIOSQUE_FORMATS, LANGUAGE_LABELS } from "@/lib/constants";
import { getAvailablePaymentMethods } from "@/lib/payment-methods";
import PreviewFlipbook from "@/components/kiosque/PreviewFlipbook";

type Magazine = {
  id: string;
  numero?: number;
  title: string;
  cover: string;
  date: string;
  description?: string;
  year?: number;
  previewImages?: string[];
  pdfs?: Record<string, string>;
  prices?: Record<string, number>;
  priceOverrides?: Record<string, number>;
};

type MagazineResponse = { magazine?: Magazine; magazines?: Magazine[] };

export default function MagazineDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [allMagazines, setAllMagazines] = useState<Magazine[]>([]);
  const [selections, setSelections] = useState<Array<{ format: string; language: string }>>([{ format: "numerique", language: "fr" }]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currency, setCurrency] = useState("XOF");
  const [countryCode, setCountryCode] = useState("BJ");
  const [paymentMethods, setPaymentMethods] = useState(() => getAvailablePaymentMethods("BJ", "XOF"));

  useEffect(()=>{
    fetch(`/api/magazines?id=${id}`).then((response) => response.json() as Promise<MagazineResponse>).then((data) => {
      setMagazine(data.magazine ?? data.magazines?.find((item) => item.id === id) ?? null);
      setLoading(false);
    }).catch(()=>{
      setMagazine({
        id,
        numero: 25,
        title: `Envol Africa N°25 - Spécial Investissements 2026`,
        cover: "/covers/envol-africa-cover-01.jpg",
        date: "2026-01-01",
        description: "Notre grand dossier investissements, 40 pages d'analyses exclusives.",
        year: 2026,
      });
      setLoading(false);
    });
  },[id]);

  useEffect(() => {
    fetch("/api/magazines").then((response) => response.json() as Promise<MagazineResponse>).then((data) => {
      setAllMagazines(data.magazines || []);
    }).catch(() => setAllMagazines([]));
  }, []);

  useEffect(() => {
    fetch("/api/geo").then((response) => response.json()).then((data: { currency?: string; countryCode?: string }) => {
      setCurrency(data.currency || "XOF");
      setCountryCode(data.countryCode || "BJ");
    }).catch(() => { setCurrency("XOF"); setCountryCode("BJ"); });
  }, []);

  const formatOptions = [
    { id: "numerique", label: "Numérique", icon: "tablet_android", desc: "Accès immédiat PDF/Web" },
    { id: "papier", label: "Papier", icon: "auto_stories", desc: "Livraison à domicile" },
    { id: "audio_pdf", label: "Audio + PDF", icon: "headphones", desc: "Lecture & écoute" },
    { id: "cd_audio", label: "CD Audio", icon: "album", desc: "Version collector" },
    { id: "audio_papier", label: "Audio + Papier", icon: "auto_awesome", desc: "Expérience complète" },
  ];
  const formatPriceInXof: Record<string, number> = Object.fromEntries(KIOSQUE_FORMATS.map((item) => [item.id, item.price]));
  const prices: Record<string, number> = { ...formatPriceInXof, ...(magazine?.prices || {}), ...(magazine?.priceOverrides || {}) };
  const currencyRates: Record<string, number> = { XOF: 1, EUR: 0.00152, USD: 0.00165, NGN: 2.5, GHS: 0.025 };
  const formatPrice = (value: number) => currency === "XOF"
    ? `${Math.round(value).toLocaleString("fr-FR")} F CFA`
    : `${new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(value * (currencyRates[currency] || 1))}`;

  const languagesForFormat = (formatId: string) => formatId.includes("audio") || formatId === "cd_audio"
    ? ["fr", "en", "es", "sw", "ha", "yo", "ig", "fon", "ff", "zu", "ee", "wo"]
    : ["fr", "en", "es"];

  const total = selections.reduce((sum, selection) => sum + (prices[selection.format] || 0), 0);
  const recommendedMagazines = allMagazines.filter((item) => item.id !== magazine?.id).slice(0, 6);
  useEffect(() => {
    const fallback = getAvailablePaymentMethods(countryCode, currency);
    setPaymentMethods(fallback);
    fetch(`/api/payment/methods?country=${encodeURIComponent(countryCode)}&currency=${encodeURIComponent(currency)}`)
      .then((response) => response.json() as Promise<{ methods?: Array<{ code: string; label: string; logo?: string; icon?: string }> }>)
      .then((data) => {
        if (!data.methods?.length) return;
        setPaymentMethods(data.methods.map((method) => ({
          code: method.code,
          label: method.label,
          logo: method.logo,
          icon: method.icon || "payments",
          tone: "text-[#1b1c1c]",
        })));
      })
      .catch(() => undefined);
  }, [countryCode, currency]);

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
    window.dispatchEvent(new Event("eam-cart-updated"));
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
                <button type="button" onClick={() => setPreviewOpen(true)} className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/95 px-5 py-3 text-[12px] font-bold text-[#9e001f] shadow-lg backdrop-blur-md opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"><span className="material-symbols-outlined">menu_book</span> FEUILLETER L&apos;APERÇU</button>
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
              <p className="mb-4 text-right text-[11px] text-[#746665]">Pays détecté : {countryCode} · Devise : {currency}</p>
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
                <div className="flex w-full flex-nowrap items-center justify-between gap-3 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {paymentMethods.map((method) => <span key={method.code} role="img" aria-label={method.label} title={method.label} className={`inline-flex h-10 min-w-12 shrink-0 items-center justify-center rounded-md border border-[#d8c3c1] bg-white px-2 ${method.tone}`}>{method.logo ? <img src={method.logo} alt="" className="max-h-7 max-w-14 object-contain" /> : <span className="material-symbols-outlined text-[23px]" aria-hidden="true">{method.icon}</span>}</span>)}
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

        {recommendedMagazines.length > 0 && <section className="mt-16 border-t border-[#e5bdbb]/40 pt-10" aria-labelledby="recommended-magazines-title">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#9e001f]">À découvrir aussi</p>
              <h2 id="recommended-magazines-title" className="mt-2 font-serif text-3xl leading-tight text-[#2b2525] md:text-4xl">Complétez votre collection</h2>
            </div>
            <Link href="/kiosque" className="hidden text-[11px] font-bold uppercase tracking-[.12em] text-[#9e001f] hover:underline sm:block">Voir tous les numéros ↗</Link>
          </div>
          <div className="flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recommendedMagazines.map((item) => <Link key={item.id} href={`/kiosque/${item.id}`} aria-label={`Découvrir ${item.title}`} className="group w-[138px] shrink-0 snap-start sm:w-[160px]">
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-[#eae7e7] shadow-[0_10px_24px_rgba(66,28,34,0.12)]">
                <img src={item.cover} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <p className="mt-3 line-clamp-2 font-serif text-[15px] leading-tight text-[#2b2525] transition-colors group-hover:text-[#9e001f]">{item.title}</p>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[.12em] text-[#746665]">N° {item.numero}</span>
            </Link>)}
          </div>
          <Link href="/kiosque" className="mt-2 block text-center text-[11px] font-bold uppercase tracking-[.12em] text-[#9e001f] hover:underline sm:hidden">Voir tous les numéros ↗</Link>
        </section>}
      </main>
      {previewOpen && <PreviewFlipbook title={magazine.title} cover={magazine.cover} pages={magazine.previewImages} onClose={() => setPreviewOpen(false)} onPurchase={() => { setPreviewOpen(false); document.getElementById("purchase-options-title")?.scrollIntoView({ behavior: "smooth", block: "center" }); }} />}
    </div>
  );
}
