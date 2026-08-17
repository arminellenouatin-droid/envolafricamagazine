import { listMagazines, listPublishedArticles } from "@/lib/core-db";
import Link from "next/link";
import PromoPopup from "@/components/PromoPopup";

// Design system: Editorial Bordeaux. Une composition de presse économique, ivoire et graphite,
// avec une typographie Source Serif 4 pour les titres et Montserrat pour les repères, boutons et méta.
const dateLabel = (value?: string | Date | null) => value ? new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "À la une";

export default async function HomePage() {
  const [articles, magazines] = await Promise.all([listPublishedArticles(), listMagazines()]);
  const [mainFeatured, secondary, third, fourth, fifth] = articles;
  const readingList = articles.slice(5, 11);
  const mostRead = [...articles].sort((a, b) => b.views - a.views).slice(0, 6);
  const opportunities = [
    { label: "Financement", title: "AfricaGrow Fund", text: "Financement pour PME agro-industrielles", meta: "Jusqu’à 2 M€" },
    { label: "Opportunités", title: "AFD, Climat & Résilience", text: "Appui aux projets d’adaptation climatique", meta: "Jusqu’à 10 M€" },
    { label: "Emplois", title: "Visa Foundation", text: "Financement de l’entrepreneuriat féminin", meta: "Afrique" },
  ];

  return (
    <div className="magazine-home overflow-x-hidden bg-[#fcf9f8] text-[#222223]">
      <PromoPopup />

      <main>
        <section className="magazine-hero mx-auto max-w-[1380px] px-5 pb-14 pt-8 md:px-10 lg:px-16 lg:pt-12">
          <div className="mb-7 flex items-end justify-between gap-5 border-b border-[#d8c3c1] pb-5">
            <div>
              <p className="editorial-kicker">L’édition qui regarde l’Afrique avancer</p>
              <h1 className="magazine-display mt-3 max-w-4xl text-4xl leading-[0.98] md:text-6xl lg:text-[76px]">Comprendre. Anticiper. Agir.</h1>
            </div>
            <p className="hidden max-w-[230px] text-right font-sans text-xs leading-5 text-[#5f5352] md:block">Analyses, récits et opportunités pour celles et ceux qui construisent les économies africaines.</p>
          </div>

          {mainFeatured && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.7fr)]">
              <Link href={`/article/${mainFeatured.slug}`} className="hero-story group relative min-h-[500px] overflow-hidden rounded-[18px] bg-[#201c1c] text-white md:min-h-[590px]">
                <img src={mainFeatured.image} alt={mainFeatured.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,12,12,0.05)_30%,rgba(16,12,12,0.9)_100%)]" />
                <div className="relative flex min-h-[500px] flex-col justify-end p-6 md:min-h-[590px] md:p-10">
                  <span className="mb-4 w-fit rounded-full bg-[#9e001f] px-3 py-1 font-sans text-[10px] font-extrabold uppercase tracking-[0.18em]">Avant-première</span>
                  <h2 className="max-w-3xl font-serif text-4xl leading-[0.96] md:text-6xl">{mainFeatured.title}</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 md:text-base">{mainFeatured.summary}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-3 font-sans text-[11px] text-white/75"><span>{mainFeatured.author}</span><span className="h-1 w-1 rounded-full bg-[#e6a25e]" /><span>{dateLabel(mainFeatured.publishedAt)}</span><span className="h-1 w-1 rounded-full bg-[#e6a25e]" /><span>{mainFeatured.readingTime} min de lecture</span></div>
                </div>
              </Link>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                {[secondary, third, fourth].filter(Boolean).map((article, index) => (
                  <Link key={article!.id} href={`/article/${article!.slug}`} className={`editorial-side-story group relative overflow-hidden rounded-[14px] border border-[#d8c3c1] bg-white ${index === 0 ? "min-h-[250px]" : "min-h-[160px]"}`}>
                    <img src={article!.image} alt={article!.title} className="absolute inset-0 h-full w-full object-cover opacity-25 transition duration-500 group-hover:scale-105 group-hover:opacity-35" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/25" />
                    <div className="relative flex h-full flex-col justify-between p-5"><div><span className="editorial-tag">{article!.category}</span><h3 className="mt-3 max-w-[250px] font-serif text-2xl leading-[1.03] text-[#242020]">{article!.title}</h3></div><p className="font-sans text-[10px] font-semibold text-[#756766]">{article!.author} · {dateLabel(article!.publishedAt)}</p></div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="border-y border-[#d8c3c1] bg-white py-14 md:py-16">
          <div className="mx-auto max-w-[1380px] px-5 md:px-10 lg:px-16">
            <div className="mb-7 flex items-end justify-between gap-4"><div><p className="editorial-kicker">Le kiosque</p><h2 className="magazine-section-title mt-2">Nos derniers magazines</h2></div><Link href="/kiosque" className="editorial-link">Tout le kiosque <span aria-hidden="true">↗</span></Link></div>
            <div className="magazine-rail flex snap-x gap-5 overflow-x-auto pb-3">
              {magazines.slice(0, 8).map((magazine: any) => <Link key={magazine.id} href={`/kiosque/${magazine.id}`} className="magazine-cover group w-[170px] flex-none snap-start md:w-[198px]"><div className="aspect-[3/4] overflow-hidden rounded-[8px] bg-[#e8dedc] shadow-[0_15px_30px_rgba(66,28,34,0.12)]"><img src={magazine.cover} alt={magazine.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><p className="mt-3 font-serif text-base leading-tight text-[#312929]">{magazine.title}</p><span className="mt-1 block font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#9e001f]">{magazine.category || "Économie"}</span></Link>)}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1380px] gap-12 px-5 py-16 md:px-10 lg:grid-cols-[1.35fr_0.65fr] lg:px-16 lg:py-24">
          <div>
            <div className="mb-8 flex items-end justify-between border-b border-[#d8c3c1] pb-4"><div><p className="editorial-kicker">Le fil de la rédaction</p><h2 className="magazine-section-title mt-2">À lire maintenant</h2></div><Link href="/recherche" className="editorial-link">Voir tout <span aria-hidden="true">↗</span></Link></div>
            <div className="space-y-1">
              {readingList.map((article: any, index: number) => <Link key={article.id} href={`/article/${article.slug}`} className="reading-row group grid grid-cols-[42px_1fr_84px] items-center gap-3 border-b border-[#e6d8d6] py-4 md:grid-cols-[54px_1fr_130px] md:gap-5"><span className="font-serif text-3xl text-[#c7aaa7] transition group-hover:text-[#9e001f]">{String(index + 1).padStart(2, "0")}</span><div><span className="editorial-tag">{article.category}</span><h3 className="mt-1 max-w-2xl font-serif text-xl leading-tight text-[#292323] transition group-hover:text-[#9e001f] md:text-2xl">{article.title}</h3><p className="mt-1 font-sans text-[11px] text-[#746665]">{article.author} · {article.readingTime} min</p></div><img src={article.image} alt="" className="h-16 w-20 rounded-[6px] object-cover opacity-90 md:h-20 md:w-[120px]" /></Link>)}
            </div>
          </div>

          <aside className="self-start rounded-[16px] bg-[#2b2525] p-6 text-white lg:sticky lg:top-24"><p className="editorial-kicker text-[#f0b27e]">Les opportunités</p><h2 className="mt-3 font-serif text-4xl leading-none">Des idées à saisir.</h2><div className="mt-7 flex gap-2 overflow-x-auto border-b border-white/20 pb-3">{["Financement", "Opportunités", "Emplois", "Formations", "Concours"].map((label, index) => <span key={label} className={`whitespace-nowrap font-sans text-[10px] font-bold uppercase tracking-[0.12em] ${index === 0 ? "border-b-2 border-[#f0b27e] pb-3 text-white" : "text-white/50"}`}>{label}</span>)}</div><div className="mt-5 space-y-4">{opportunities.map((item) => <Link key={item.title} href="/financement" className="opportunity-line block border-b border-white/15 pb-4"><span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-[#f0b27e]">{item.label}</span><h3 className="mt-2 font-serif text-xl">{item.title}</h3><p className="mt-1 font-sans text-xs text-white/65">{item.text}</p><span className="mt-2 block font-sans text-[10px] text-white/45">{item.meta}</span></Link>)}</div><Link href="/financement" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#9e001f] px-4 py-3 font-sans text-xs font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#b80d32]">Explorer les opportunités <span>↗</span></Link></aside>
        </section>

        <section className="border-t border-[#d8c3c1] bg-[#f0e8e6] py-14 md:py-20"><div className="mx-auto flex max-w-[1380px] flex-col gap-6 px-5 md:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-16"><div><p className="editorial-kicker">La lecture qui accompagne vos décisions</p><h2 className="mt-3 max-w-2xl font-serif text-4xl leading-[0.98] text-[#2b2525] md:text-5xl">Une information claire, quand elle compte.</h2><p className="mt-4 max-w-xl font-sans text-sm leading-6 text-[#625453]">Recevez les nouvelles analyses et découvrez les prochains numéros d’Envol Africa Magazine.</p></div><Link href="/abonnement" className="editorial-cta">S’abonner au magazine <span aria-hidden="true">→</span></Link></div></section>

        <section className="mx-auto max-w-[1380px] px-5 py-14 md:px-10 lg:px-16"><div className="mb-7 flex items-end justify-between border-b border-[#d8c3c1] pb-4"><div><p className="editorial-kicker">Les plus consultés</p><h2 className="magazine-section-title mt-2">Ce qui retient l’attention</h2></div><span className="font-sans text-[11px] text-[#746665]">Mis à jour avec les publications disponibles</span></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{mostRead.map((article: any, index: number) => <Link key={article.id} href={`/article/${article.slug}`} className="most-read-row group flex gap-4 border-b border-[#e6d8d6] py-4"><span className="font-sans text-xs font-bold text-[#9e001f]">0{index + 1}</span><div><span className="editorial-tag">{article.category}</span><h3 className="mt-1 font-serif text-xl leading-tight transition group-hover:text-[#9e001f]">{article.title}</h3><p className="mt-2 font-sans text-[10px] text-[#746665]">{article.views.toLocaleString("fr-FR")} lectures · {article.author}</p></div></Link>)}</div></section>
        <div className="sr-only">{fifth?.title}</div>
      </main>
    </div>
  );
}
