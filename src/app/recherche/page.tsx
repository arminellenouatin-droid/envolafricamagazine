// Style Envol Africa : recherche éditoriale sobre, orientée lecture et découverte.
import Link from "next/link";
import { listPublishedArticles } from "@/lib/core-db";

export const metadata = { title: "Recherche | Envol Africa Magazine" };

type SearchPageProps = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = ((await searchParams).q || "").trim();
  const articles = await listPublishedArticles();
  const normalized = query.toLocaleLowerCase("fr-FR");
  const results = normalized ? articles.filter((article: any) => [article.title, article.summary, article.category, article.author, ...(article.tags || [])].filter(Boolean).join(" ").toLocaleLowerCase("fr-FR").includes(normalized)) : articles;

  return <main className="min-h-screen bg-[#fcf9f8] px-5 py-14 md:px-10 md:py-20"><div className="mx-auto max-w-[1180px]"><Link href="/" className="font-sans text-xs font-bold text-[#9e001f]">← Retour au Magazine</Link><p className="mt-10 font-sans text-[10px] font-black uppercase tracking-[0.18em] text-[#9e001f]">Explorer la rédaction</p><h1 className="mt-3 font-serif text-5xl leading-none text-[#292323]">{query ? `Résultats pour « ${query} »` : "Rechercher dans le Magazine"}</h1><form className="mt-8 flex max-w-2xl gap-2" action="/recherche"><input name="q" defaultValue={query} placeholder="Titre, auteur, sujet…" className="h-12 min-w-0 flex-1 rounded-xl border border-[#d8c3c1] bg-white px-4 font-sans text-sm outline-none focus:border-[#9e001f]" /><button className="h-12 rounded-xl bg-[#9e001f] px-5 font-sans text-xs font-black text-white" type="submit">Rechercher</button></form><p className="mt-8 font-sans text-xs text-[#746665]">{results.length} résultat{results.length > 1 ? "s" : ""}</p><div className="mt-4 divide-y divide-[#e6d8d6] border-y border-[#e6d8d6]">{results.slice(0, 30).map((article: any) => <Link href={`/article/${article.slug}`} key={article.id} className="grid gap-4 py-5 transition hover:bg-white md:grid-cols-[180px_1fr] md:px-3"><img src={article.image} alt="" className="h-28 w-full rounded-lg object-cover md:h-24" /><div><span className="font-sans text-[10px] font-black uppercase tracking-[0.14em] text-[#9e001f]">{article.category || "Magazine"}</span><h2 className="mt-2 font-serif text-2xl leading-tight text-[#292323]">{article.title}</h2><p className="mt-2 line-clamp-2 font-sans text-xs leading-5 text-[#746665]">{article.summary}</p><p className="mt-3 font-sans text-[10px] font-bold text-[#746665]">{article.author}</p></div></Link>)}{!results.length && <p className="py-12 font-sans text-sm text-[#746665]">Aucun article ne correspond à votre recherche.</p>}</div></div></main>;
}
