"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import PreviewFlipbook from "@/components/kiosque/PreviewFlipbook";
import { useLocale } from "@/components/LocaleProvider";

const formatLabels: Record<string, string> = { numerique: "Numérique", papier: "Papier", cd_audio: "Audio" };

export default function KiosquePage({ initialMagazines = [] }: { initialMagazines?: any[] }) {
  const [magazines] = useState<any[]>(initialMagazines);
  const [filterYear, setFilterYear] = useState("all");
  const [filterFormat, setFilterFormat] = useState("all");
  const [search, setSearch] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMagazine, setPreviewMagazine] = useState<any | null>(null);
  const { locale } = useLocale();


  const years = [...new Set(magazines.map((magazine: any) => magazine.year))].sort((a: any, b: any) => b - a);
  const featured = magazines.find((magazine: any) => magazine.featured) || magazines[0];
  const filtered = useMemo(() => magazines.filter((magazine: any) => {
    const matchesYear = filterYear === "all" || magazine.year?.toString() === filterYear;
    const matchesFormat = filterFormat === "all" || magazine.formats?.includes(filterFormat);
    const matchesSearch = !search || magazine.title?.toLowerCase().includes(search.toLowerCase());
    return matchesYear && matchesFormat && matchesSearch;
  }), [magazines, filterYear, filterFormat, search]);
  const archiveCount = filtered.length;
  const openFeaturedPreview = async () => {
    if (!featured) return;
    setPreviewMagazine(featured);
    setPreviewOpen(true);
    try {
      const response = await fetch(`/api/magazines?id=${encodeURIComponent(featured.id)}`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok && data.magazine) setPreviewMagazine((current: any) => ({ ...current, ...data.magazine }));
    } catch {
      // La couverture reste visible même si les données PDF mettent du temps à répondre.
    }
  };

  return (
    <div className="kiosque-page min-h-screen overflow-x-hidden bg-[#fcf9f8] text-[#2b2525]">
      <main>
        {featured && <section className="kiosque-hero relative overflow-hidden border-b border-[#d8c3c1] bg-[#f4ecea]">
          <div className="kiosque-hero__grain" />
          <div className="relative mx-auto grid max-w-[1380px] items-center gap-12 px-5 py-12 md:px-10 md:py-20 lg:grid-cols-[.82fr_1.18fr] lg:px-16 lg:py-24">
            <div className="order-2 lg:order-1">
              <p className="editorial-kicker">Le kiosque · édition à la une</p>
              <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[.94] text-[#2b2525] md:text-7xl">Lire l’Afrique,<br /><em className="text-[#9e001f]">numéro après numéro.</em></h1>
              <p className="mt-6 max-w-xl font-sans text-sm leading-7 text-[#746665] md:text-base">Des dossiers pour comprendre les transformations du continent, des récits de terrain et les idées qui façonnent les économies africaines.</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href={`/kiosque/${featured.id}`} className="kiosque-primary-cta"><span className="material-symbols-outlined text-[19px]">shopping_bag</span> Découvrir ce numéro <span aria-hidden>↗</span></Link>
                <button type="button" onClick={() => void openFeaturedPreview()} className="kiosque-ghost-cta"><span className="material-symbols-outlined text-[19px]">import_contacts</span> Feuilleter</button>
              </div>
              <div className="mt-10 flex items-center gap-7 border-t border-[#d8c3c1] pt-5 font-sans text-[10px] font-bold uppercase tracking-[.14em] text-[#746665]"><span><strong className="text-2xl font-serif text-[#9e001f]">{magazines.length || "—"}</strong><br />numéros disponibles</span><span><strong className="text-2xl font-serif text-[#9e001f]">2026</strong><br />édition en cours</span></div>
            </div>
            <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
              <div className="kiosque-featured-cover group relative">
                <div className="kiosque-featured-cover__shadow" />
                <div className="relative aspect-[3/4] w-[250px] overflow-hidden bg-white md:w-[355px]"><img src={featured.cover} alt={featured.title} fetchPriority="high" decoding="async" className="h-full w-full object-cover transition duration-1000 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/20" /><span className="absolute left-4 top-4 rounded-full bg-[#9e001f] px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-[.14em] text-white">Numéro vedette</span><div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-20 text-white"><p className="font-sans text-[10px] uppercase tracking-[.14em] text-white/70">Envol Africa Magazine</p><p className="mt-1 font-serif text-2xl">{featured.title}</p></div></div>
                <span className="absolute -right-8 top-12 hidden rounded-full border border-[#9e001f] bg-[#fcf9f8] px-3 py-2 font-sans text-[9px] font-bold uppercase tracking-[.15em] text-[#9e001f] shadow-lg md:block">À la une</span>
              </div>
            </div>
          </div>
        </section>}

        <section className="mx-auto max-w-[1380px] px-5 py-14 md:px-10 lg:px-16 lg:py-20">
          <div className="mb-9 flex flex-col justify-between gap-5 border-b border-[#d8c3c1] pb-5 md:flex-row md:items-end"><div><p className="editorial-kicker">La collection</p><h2 className="mt-2 font-serif text-4xl leading-none md:text-5xl">Tous les numéros</h2></div><p className="max-w-sm font-sans text-xs leading-5 text-[#746665] md:text-right">Une bibliothèque éditoriale à feuilleter, commander et conserver.</p></div>
          <div className="kiosque-filter-bar mb-10">
            <div className="flex flex-wrap gap-2"><label className="kiosque-select"><span className="material-symbols-outlined">calendar_month</span><select value={filterYear} onChange={(event) => setFilterYear(event.target.value)}><option value="all">Toutes les années</option>{years.map((year: any) => <option key={year} value={year.toString()}>{year}</option>)}</select><span className="material-symbols-outlined">expand_more</span></label><label className="kiosque-select"><span className="material-symbols-outlined">tune</span><select value={filterFormat} onChange={(event) => setFilterFormat(event.target.value)}><option value="all">Tous les formats</option><option value="numerique">Numérique</option><option value="papier">Papier</option><option value="cd_audio">Audio</option></select><span className="material-symbols-outlined">expand_more</span></label></div>
            <label className="kiosque-search"><span className="material-symbols-outlined">search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un numéro ou un dossier" type="search" /><kbd>⌘ K</kbd></label>
          </div>
          <div className="mb-6 flex items-center justify-between font-sans text-[10px] font-bold uppercase tracking-[.14em] text-[#746665]"><span>{archiveCount} {archiveCount === 1 ? "numéro" : "numéros"} dans la collection</span><span className="hidden md:inline">Glisser pour parcourir</span></div>
          <div className="kiosque-archive-grid">{filtered.map((magazine: any, index: number) => <Link key={magazine.id} href={`/kiosque/${magazine.id}`} aria-label={`Voir la fiche produit de ${magazine.title}`} className="kiosque-card group cursor-pointer" style={{ "--card-delay": `${Math.min(index, 10) * 45}ms` } as CSSProperties}><div className="kiosque-card__cover"><img src={magazine.cover} alt={magazine.title} loading="lazy" decoding="async" /><span className="kiosque-card__shine" /><span className="kiosque-card__number">N°{magazine.numero}</span><span className="kiosque-card__open material-symbols-outlined">arrow_outward</span></div><div className="mt-4"><p className="font-sans text-[10px] font-bold uppercase tracking-[.13em] text-[#9e001f]">{new Date(magazine.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p><h3 className="mt-1 font-serif text-xl leading-tight text-[#2b2525] transition-colors group-hover:text-[#9e001f]">{magazine.title}</h3><div className="mt-3 flex flex-wrap gap-1.5">{(magazine.formats || []).slice(0, 2).map((format: string) => <span key={format} className="kiosque-format-pill">{formatLabels[format] || format}</span>)}</div></div></Link>)}</div>
          {!filtered.length && <div className="rounded-2xl border border-dashed border-[#cdb7b4] bg-white p-12 text-center"><span className="material-symbols-outlined text-4xl text-[#9e001f]">search_off</span><h3 className="mt-3 font-serif text-2xl">Aucun numéro trouvé</h3><p className="mt-2 font-sans text-sm text-[#746665]">Essayez une autre année, un autre format ou un terme différent.</p></div>}
        </section>

        <section className="kiosque-newsletter relative overflow-hidden bg-[#2b2525] py-16 text-white md:py-20"><div className="relative z-10 mx-auto flex max-w-[1380px] flex-col gap-8 px-5 md:px-10 lg:flex-row lg:items-end lg:justify-between lg:px-16"><div><p className="editorial-kicker text-[#f0b27e]">Le prochain numéro dans votre boîte mail</p><h2 className="mt-3 max-w-2xl font-serif text-4xl leading-none md:text-6xl">Ne manquez pas<br /><em className="text-[#f0b27e]">la prochaine édition.</em></h2><p className="mt-5 max-w-xl font-sans text-sm leading-6 text-white/65">Recevez les alertes de parution, un aperçu gratuit et nos analyses exclusives chaque semaine.</p></div><form className="flex w-full max-w-lg flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); alert("Inscription newsletter OK - merci !"); }}><input className="min-h-14 flex-1 border border-white/20 bg-white/10 px-5 font-sans text-sm text-white outline-none placeholder:text-white/45 focus:border-[#f0b27e]" placeholder="votre@email.com" type="email" required /><button className="min-h-14 bg-[#9e001f] px-7 font-sans text-xs font-bold uppercase tracking-[.14em] text-white transition hover:bg-[#c8102e]">S’inscrire <span aria-hidden>→</span></button></form></div><span className="material-symbols-outlined absolute -bottom-16 right-0 text-[280px] text-white/[.04]">auto_stories</span>        </section>
      </main>
      {previewOpen && (previewMagazine || featured) && (() => {
        const currentMagazine = previewMagazine || featured;
        const language = locale.language || "fr";
        const selectedPdf = currentMagazine.pdfs?.[language] || currentMagazine.pdfs?.fr;
        const protectedPdf = selectedPdf?.startsWith("private-pdf://") ? `/api/magazines/${encodeURIComponent(currentMagazine.id)}/preview?lang=${encodeURIComponent(language)}` : undefined;
        return <PreviewFlipbook title={currentMagazine.title} cover={currentMagazine.cover} pages={currentMagazine.previewImages} pdfUrl={protectedPdf ? undefined : selectedPdf} previewUrl={protectedPdf} language={language} onClose={() => { setPreviewOpen(false); setPreviewMagazine(null); }} onPurchase={() => { window.location.assign(`/kiosque/${currentMagazine.id}#purchase-options-title`); }} />;
      })()}
    </div>
  );
}
