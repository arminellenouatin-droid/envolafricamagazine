"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SocialShareModal from "@/components/SocialShareModal";

export type SearchArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  author: string;
  image: string;
  views?: number;
  likes?: number;
  createdAt: string;
  publishedAt?: string;
  tags?: string[];
};

interface SearchClientProps {
  initialArticles: SearchArticle[];
  initialQuery?: string;
}

export default function SearchClient({ initialArticles, initialQuery = "" }: SearchClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [datePeriod, setDatePeriod] = useState<"all" | "7d" | "30d" | "year">("all");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "views" | "likes">("recent");

  // State pour la modale de partage
  const [shareData, setShareData] = useState<{ url: string; title: string; summary?: string } | null>(null);

  // Extraire les catégories uniques
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialArticles.forEach((a) => {
      if (a.category) set.add(a.category.trim());
    });
    return Array.from(set).sort();
  }, [initialArticles]);

  // Extraire les auteurs uniques
  const authors = useMemo(() => {
    const set = new Set<string>();
    initialArticles.forEach((a) => {
      if (a.author) set.add(a.author.trim());
    });
    return Array.from(set).sort();
  }, [initialArticles]);

  // Filtrage et tri
  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr-FR");
    const now = Date.now();

    return initialArticles
      .filter((article) => {
        // Filtre texte
        if (normalizedQuery) {
          const haystack = [
            article.title,
            article.summary,
            article.category,
            article.author,
            ...(article.tags || []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("fr-FR");

          if (!haystack.includes(normalizedQuery)) return false;
        }

        // Filtre catégorie
        if (selectedCategory !== "all" && article.category !== selectedCategory) {
          return false;
        }

        // Filtre auteur
        if (selectedAuthor !== "all" && article.author !== selectedAuthor) {
          return false;
        }

        // Filtre date
        if (datePeriod !== "all") {
          const artDate = new Date(article.publishedAt || article.createdAt).getTime();
          const diffDays = (now - artDate) / (1000 * 60 * 60 * 24);

          if (datePeriod === "7d" && diffDays > 7) return false;
          if (datePeriod === "30d" && diffDays > 30) return false;
          if (datePeriod === "year" && diffDays > 365) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "recent") {
          return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.publishedAt || a.createdAt).getTime() - new Date(b.publishedAt || b.createdAt).getTime();
        }
        if (sortBy === "views") {
          return (b.views || 0) - (a.views || 0);
        }
        if (sortBy === "likes") {
          return (b.likes || 0) - (a.likes || 0);
        }
        return 0;
      });
  }, [initialArticles, query, selectedCategory, selectedAuthor, datePeriod, sortBy]);

  return (
    <div className="mx-auto max-w-[1180px]">
      {/* En-tête */}
      <Link href="/" className="font-sans text-xs font-bold text-[#9e001f] transition hover:underline">
        ← Retour au Magazine
      </Link>
      <div className="mt-8">
        <p className="font-sans text-[10px] font-black uppercase tracking-[0.18em] text-[#9e001f]">
          Explorer la rédaction
        </p>
        <h1 className="mt-2 font-serif text-4xl leading-tight text-[#292323] md:text-5xl">
          {query ? `Résultats pour « ${query} »` : "Rechercher dans le Magazine"}
        </h1>
        <p className="mt-2 text-sm text-[#746665]">
          Explorez l’ensemble de nos analyses, enquêtes exclusives, dossiers économiques et opportunités africaines.
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="mt-6 flex max-w-3xl gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#746665]">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titre, sujet, entreprise, pays, auteur…"
            className="h-12 w-full rounded-2xl border border-[#d8c3c1] bg-white pl-12 pr-10 font-sans text-sm outline-none transition focus:border-[#9e001f] focus:ring-2 focus:ring-[#9e001f]/10 shadow-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Barre des filtres avancés */}
      <div className="mt-6 rounded-2xl border border-[#ead8d5] bg-white p-4 shadow-xs">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Filtre Catégorie */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-[#746665]">
              Catégorie
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-[#d8c3c1] bg-[#fdfbfb] px-3 text-xs font-semibold text-[#292323] outline-none focus:border-[#9e001f]"
            >
              <option value="all">Toutes les catégories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Auteur */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-[#746665]">
              Auteur
            </label>
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-[#d8c3c1] bg-[#fdfbfb] px-3 text-xs font-semibold text-[#292323] outline-none focus:border-[#9e001f]"
            >
              <option value="all">Tous les auteurs ({authors.length})</option>
              {authors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Période */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-[#746665]">
              Période
            </label>
            <select
              value={datePeriod}
              onChange={(e) => setDatePeriod(e.target.value as typeof datePeriod)}
              className="mt-1.5 h-10 w-full rounded-xl border border-[#d8c3c1] bg-[#fdfbfb] px-3 text-xs font-semibold text-[#292323] outline-none focus:border-[#9e001f]"
            >
              <option value="all">Toutes les dates</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="year">Cette année</option>
            </select>
          </div>

          {/* Filtre Tri / Ordre */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-[#746665]">
              Trier par
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="mt-1.5 h-10 w-full rounded-xl border border-[#d8c3c1] bg-[#fdfbfb] px-3 text-xs font-semibold text-[#292323] outline-none focus:border-[#9e001f]"
            >
              <option value="recent">Plus récents d’abord</option>
              <option value="oldest">Plus anciens d’abord</option>
              <option value="views">Plus lus (Popularité)</option>
              <option value="likes">Plus aimés</option>
            </select>
          </div>
        </div>

        {/* Pilules de catégories rapides */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-[#f0dedd] pt-3">
          <span className="text-[10px] font-bold text-[#8a7b7a]">Accès rapide :</span>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              selectedCategory === "all"
                ? "bg-[#9e001f] text-white"
                : "bg-[#f6f3f2] text-[#5c403f] hover:bg-[#ead8d5]"
            }`}
          >
            Tous
          </button>
          {categories.slice(0, 6).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                selectedCategory === c
                  ? "bg-[#9e001f] text-white"
                  : "bg-[#f6f3f2] text-[#5c403f] hover:bg-[#ead8d5]"
              }`}
            >
              {c}
            </button>
          ))}
          {(selectedCategory !== "all" || selectedAuthor !== "all" || datePeriod !== "all" || query) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedAuthor("all");
                setDatePeriod("all");
                setQuery("");
              }}
              className="ml-auto text-[11px] font-bold text-[#9e001f] underline hover:text-[#7f0019]"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Compteur de résultats */}
      <div className="mt-6 flex items-center justify-between font-sans text-xs text-[#746665]">
        <p>
          <strong className="text-[#292323]">{filteredArticles.length}</strong> article
          {filteredArticles.length > 1 ? "s" : ""} trouvé{filteredArticles.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Liste des résultats */}
      <div className="mt-4 space-y-4">
        {filteredArticles.map((article) => {
          const reads = article.views || 120;
          const likes = article.likes || 18;
          const shares = Math.max(1, Math.floor(likes * 0.45) + 3);
          const formattedDate = new Date(article.publishedAt || article.createdAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <article
              key={article.id}
              className="overflow-hidden rounded-2xl border border-[#ead8d5] bg-white transition-all duration-200 hover:shadow-md hover:border-[#d8c3c1]"
            >
              <div className="grid gap-4 p-5 md:grid-cols-[200px_1fr]">
                {/* Image */}
                <Link
                  href={`/article/${article.slug}`}
                  className="group block h-36 overflow-hidden rounded-xl bg-slate-100 md:h-full"
                >
                  <img
                    src={article.image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400"}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </Link>

                {/* Contenu */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#9e001f]/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#9e001f]">
                        {article.category || "Économie"}
                      </span>
                      <span className="text-[11px] text-[#8a7b7a]">· {formattedDate}</span>
                    </div>

                    <Link href={`/article/${article.slug}`} className="group block mt-2">
                      <h2 className="font-serif text-xl font-bold leading-tight text-[#292323] transition group-hover:text-[#9e001f] md:text-2xl">
                        {article.title}
                      </h2>
                    </Link>

                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#746665]">
                      {article.summary}
                    </p>
                  </div>

                  {/* Bas de carte : Auteur + Métriques (Lectures, J'aime, Partages) + Bouton Partager */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0dedd] pt-3">
                    <span className="text-xs font-semibold text-[#5c403f]">
                      Par <strong className="text-[#292323]">{article.author || "Rédaction Envol Africa"}</strong>
                    </span>

                    <div className="flex items-center gap-3 text-xs text-[#746665]">
                      {/* Nombre de lectures */}
                      <span className="flex items-center gap-1 font-medium" title={`${reads} lectures`}>
                        <span className="material-symbols-outlined text-[17px] text-slate-400">visibility</span>
                        <span>{reads.toLocaleString("fr-FR")}</span>
                      </span>

                      {/* Nombre de j'aime */}
                      <span className="flex items-center gap-1 font-medium text-rose-700" title={`${likes} j'aime`}>
                        <span className="material-symbols-outlined text-[17px] text-rose-500">favorite</span>
                        <span>{likes.toLocaleString("fr-FR")}</span>
                      </span>

                      {/* Nombre de partages */}
                      <span className="flex items-center gap-1 font-medium text-blue-700" title={`${shares} partages`}>
                        <span className="material-symbols-outlined text-[17px] text-blue-500">share</span>
                        <span>{shares}</span>
                      </span>

                      {/* Bouton Partager officiel */}
                      <button
                        type="button"
                        onClick={() =>
                          setShareData({
                            url: `/article/${encodeURIComponent(article.slug)}`,
                            title: article.title,
                            summary: article.summary,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-[#d8c3c1] bg-[#faf6f5] px-2.5 py-1 text-[11px] font-bold text-[#9e001f] transition hover:bg-[#9e001f] hover:text-white"
                        title="Partager cet article"
                      >
                        <span className="material-symbols-outlined text-[15px]">send</span>
                        Partager
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {filteredArticles.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#d8c3c1] bg-white p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-[#9e001f]">search_off</span>
            <h3 className="mt-2 font-serif text-lg font-bold text-[#292323]">Aucun article ne correspond à votre recherche</h3>
            <p className="mt-1 text-xs text-[#746665]">
              Essayez d’élargir vos filtres ou de modifier votre terme de recherche.
            </p>
          </div>
        )}
      </div>

      {/* Modale de partage sociale */}
      {shareData && (
        <SocialShareModal
          isOpen={Boolean(shareData)}
          onClose={() => setShareData(null)}
          url={shareData.url}
          title={shareData.title}
          summary={shareData.summary}
        />
      )}
    </div>
  );
}
