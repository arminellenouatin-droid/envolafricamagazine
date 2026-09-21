"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type AuthorInfo = {
  id?: string;
  name: string;
  photoUrl?: string;
  roleLabel?: string;
  bio?: string;
};

export type AuthorArticleItem = {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  image?: string;
  category?: string;
  readingTime?: number;
  publishedAt?: string;
};

type SameAuthorArticlesProps = {
  author: AuthorInfo;
  articles: AuthorArticleItem[];
};

const DEFAULT_ARTICLE_IMAGE = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600";
const DEFAULT_AUTHOR_PHOTO = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600";

export default function SameAuthorArticles({ author, articles }: SameAuthorArticlesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const total = articles.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Carrousel automatique : rotation toutes les 4.5s sauf si l'utilisateur survole ou interagit
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4500);
    return () => clearInterval(interval);
  }, [total, isPaused, nextSlide]);

  if (!articles || total === 0) {
    return null;
  }

  // Gestion du swipe tactile sur mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentArticle = articles[currentIndex] || articles[0];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Récent";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Récent";
    }
  };

  return (
    <section
      className="mt-14 border-t border-[#e5bdbb] pt-10"
      aria-labelledby="same-author-heading"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* En-tête de section */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e5bdbb]/80 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9e001f]/10 px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#9e001f]">
            <span className="material-symbols-outlined text-[13px]">person_edit</span>
            Plume & Rédaction
          </span>
          <h2
            id="same-author-heading"
            className="mt-2 text-2xl sm:text-[28px] font-bold tracking-tight text-[#1b1c1c]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Du même auteur
          </h2>
        </div>

        {/* Indicateurs & contrôles globaux */}
        <div className="flex items-center gap-3">
          {total > 1 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#f5ecea] px-2.5 py-1 text-[10px] font-bold text-[#746665]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isPaused ? "bg-amber-500" : "bg-[#9e001f] animate-pulse"
                }`}
              />
              {isPaused ? "En pause" : "Carrousel automatique"}
            </span>
          )}
          <span className="text-xs font-bold text-[#746665]">
            <span className="text-[#9e001f]">{currentIndex + 1}</span> / {total}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Article précédent"
              disabled={total <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8c3c1] bg-white text-[#1b1c1c] transition hover:border-[#9e001f] hover:bg-[#fff1f0] hover:text-[#9e001f] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Article suivant"
              disabled={total <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8c3c1] bg-white text-[#1b1c1c] transition hover:border-[#9e001f] hover:bg-[#fff1f0] hover:text-[#9e001f] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          VUE MOBILE (< 768px):
          1. Photo de l'auteur avec infos en superposition
          2. En dessous : carrousel automatique avec miniature à gauche du titre
          ======================================================== */}
      <div className="block md:hidden mt-6">
        {/* 1. Photo de l'auteur avec superposition */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#2b2525] shadow-md border border-[#e5bdbb]/50">
          <img
            src={author.photoUrl || DEFAULT_AUTHOR_PHOTO}
            alt={author.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

          <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 text-white">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#9e001f] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow">
              <span className="material-symbols-outlined text-[11px]">verified</span>
              Auteur de l&apos;article
            </span>
            <h3
              className="mt-2 text-xl font-bold leading-tight text-white"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {author.name}
            </h3>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#f0b27e]">
              {author.roleLabel || "Journaliste & Rédacteur"}
            </p>
            {author.bio && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/85">
                {author.bio}
              </p>
            )}
          </div>
        </div>

        {/* 2. En dessous : carrousel automatique avec miniature de la photo à gauche avant le titre */}
        <div
          className="mt-4 rounded-2xl border border-[#e5bdbb]/60 bg-white p-4 shadow-sm"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header du bloc carrousel mobile */}
          <div className="flex items-center justify-between border-b border-[#f5ecea] pb-2.5 text-[11px] font-bold text-[#746665]">
            <span className="flex items-center gap-1.5 text-[#9e001f]">
              <span className="material-symbols-outlined text-[14px]">auto_stories</span>
              Article {currentIndex + 1} sur {total}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1f0] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#9e001f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9e001f] animate-pulse" />
              Carrousel automatique
            </span>
          </div>

          {/* Carte Article Mobile : MINIATURE À GAUCHE AVANT LE TITRE */}
          <div className="pt-3.5">
            <Link
              href={`/article/${currentArticle.slug}`}
              className="group flex items-center gap-3.5"
            >
              {/* Miniature photo à gauche */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-[#2b2525] shadow-sm border border-[#e5bdbb]/40">
                <img
                  src={currentArticle.image || DEFAULT_ARTICLE_IMAGE}
                  alt={currentArticle.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Titre et détails à droite */}
              <div className="flex-1 min-w-0">
                {currentArticle.category && (
                  <span className="inline-block text-[9px] font-black uppercase tracking-wider text-[#9e001f] mb-1">
                    {currentArticle.category}
                  </span>
                )}
                <h4
                  className="text-[14px] sm:text-[15px] font-bold leading-snug text-[#1b1c1c] transition group-hover:text-[#9e001f] line-clamp-2"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  {currentArticle.title}
                </h4>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#746665]">
                  <span>{formatDate(currentArticle.publishedAt)}</span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#9e001f] group-hover:translate-x-0.5 transition">
                    Lire <span>→</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Contrôles manuels & pagination par points sous mobile */}
          <div className="mt-3.5 flex items-center justify-between border-t border-[#f5ecea] pt-3">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Article précédent"
              disabled={total <= 1}
              className="inline-flex items-center gap-1 rounded-full bg-[#f5ecea] px-3 py-1 text-xs font-bold text-[#1b1c1c] transition active:scale-95 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              <span>Précédent</span>
            </button>

            {/* Points de pagination */}
            <div className="flex items-center gap-1">
              {articles.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  aria-label={`Aller au titre ${dotIdx + 1}`}
                  onClick={() => setCurrentIndex(dotIdx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    dotIdx === currentIndex ? "w-5 bg-[#9e001f]" : "w-1.5 bg-[#d8c3c1]"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Article suivant"
              disabled={total <= 1}
              className="inline-flex items-center gap-1 rounded-full bg-[#f5ecea] px-3 py-1 text-xs font-bold text-[#1b1c1c] transition active:scale-95 disabled:opacity-40"
            >
              <span>Suivant</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          VUE ORDINATEUR (≥ 768px):
          Gauche : Carte auteur
          Droite : Carrousel automatique avec miniature à gauche avant le titre
          ======================================================== */}
      <div className="hidden md:grid md:grid-cols-12 gap-8 mt-8 items-stretch">
        {/* Colonne gauche : Carte Auteur */}
        <div className="md:col-span-4 rounded-2xl border border-[#e5bdbb]/60 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#2b2525] shadow-sm">
              <img
                src={author.photoUrl || DEFAULT_AUTHOR_PHOTO}
                alt={author.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 rounded-full bg-[#9e001f] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow">
                Auteur
              </span>
            </div>

            <h3
              className="mt-4 text-xl font-bold leading-tight text-[#1b1c1c]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {author.name}
            </h3>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#9e001f]">
              {author.roleLabel || "Journaliste & Rédacteur"}
            </p>
            {author.bio && (
              <p className="mt-3 text-xs leading-relaxed text-[#5f5e5e]">
                {author.bio}
              </p>
            )}
          </div>

          <div className="mt-5 border-t border-[#f5ecea] pt-3 text-[11px] font-semibold text-[#746665]">
            <span>
              {total} autre{total > 1 ? "s" : ""} publication{total > 1 ? "s" : ""} de cet auteur
            </span>
          </div>
        </div>

        {/* Colonne droite : Carrousel automatique avec miniature à gauche avant le titre */}
        <div className="md:col-span-8 rounded-2xl border border-[#e5bdbb]/60 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#f5ecea] pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9e001f]">
                Articles rédigés par {author.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1f0] px-2.5 py-0.5 text-[10px] font-bold text-[#9e001f]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isPaused ? "bg-amber-500" : "bg-[#9e001f] animate-pulse"
                    }`}
                  />
                  {isPaused ? "En pause" : "Carrousel automatique"}
                </span>
                <span className="text-xs font-bold text-[#746665]">
                  {currentIndex + 1} / {total}
                </span>
              </div>
            </div>

            {/* Article actif : MINIATURE À GAUCHE DU TITRE SUR ORDINATEUR */}
            <div className="py-6">
              <Link
                href={`/article/${currentArticle.slug}`}
                className="group flex flex-col sm:flex-row items-stretch gap-5 lg:gap-6"
              >
                {/* Miniature à gauche avant le titre */}
                <div className="relative w-full sm:w-44 lg:w-52 aspect-[4/3] sm:aspect-auto sm:h-36 shrink-0 overflow-hidden rounded-xl bg-[#2b2525] shadow-sm border border-[#e5bdbb]/40">
                  <img
                    src={currentArticle.image || DEFAULT_ARTICLE_IMAGE}
                    alt={currentArticle.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {currentArticle.category && (
                    <span className="absolute bottom-2 left-2 rounded-md bg-[#9e001f] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow">
                      {currentArticle.category}
                    </span>
                  )}
                </div>

                {/* Contenu textuel à droite de la miniature */}
                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-block rounded-full bg-[#9e001f]/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#9e001f]">
                        {currentArticle.category || "Article"}
                      </span>
                      <span className="text-[11px] text-[#746665]">
                        {formatDate(currentArticle.publishedAt)}
                      </span>
                    </div>

                    <h4
                      className="text-xl lg:text-2xl font-bold leading-snug text-[#1b1c1c] transition group-hover:text-[#9e001f] line-clamp-2"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {currentArticle.title}
                    </h4>

                    {currentArticle.summary && (
                      <p className="mt-2 text-xs text-[#5f5e5e] line-clamp-2 leading-relaxed">
                        {currentArticle.summary}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-[#746665] pt-2 border-t border-[#f5ecea]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">schedule</span>
                      {currentArticle.readingTime || 4} min de lecture
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#9e001f] transition group-hover:translate-x-1">
                      Consulter l&apos;article →
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Liste rapide des autres titres avec miniature à gauche de chaque titre */}
            {total > 1 && (
              <div className="mt-2 border-t border-[#f5ecea] pt-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#8A8882] mb-3">
                  Autres publications de cet auteur (sélection rapide) :
                </p>
                <div className="space-y-2">
                  {articles.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-full text-left p-2 rounded-xl text-xs font-semibold transition flex items-center gap-3 ${
                        idx === currentIndex
                          ? "bg-[#fff1f0] text-[#9e001f] font-bold border-l-4 border-[#9e001f]"
                          : "text-[#5f5e5e] hover:bg-[#fcf9f8] hover:text-[#1b1c1c]"
                      }`}
                    >
                      {/* Miniature miniature pour chaque titre */}
                      <img
                        src={item.image || DEFAULT_ARTICLE_IMAGE}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg object-cover border border-[#e5bdbb]/40"
                      />
                      <span className="truncate flex-1 font-medium">{item.title}</span>
                      <span className="text-[10px] opacity-70 flex-none">
                        {item.readingTime || 4} min
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contrôles du carrousel automatique sur ordinateur */}
          <div className="mt-6 flex items-center justify-between border-t border-[#f5ecea] pt-4">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Titre précédent"
              disabled={total <= 1}
              className="inline-flex items-center gap-2 rounded-full border border-[#d8c3c1] bg-white px-4 py-2 text-xs font-bold text-[#1b1c1c] transition hover:border-[#9e001f] hover:bg-[#fff1f0] hover:text-[#9e001f] disabled:opacity-40 active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Article précédent</span>
            </button>

            {/* Indicateur de statut */}
            <span className="text-[11px] text-[#746665] italic hidden lg:inline">
              {isPaused ? "Lecture en pause" : "Défilement automatique actif"}
            </span>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Titre suivant"
              disabled={total <= 1}
              className="inline-flex items-center gap-2 rounded-full bg-[#9e001f] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#7d0019] disabled:opacity-40 active:scale-95"
            >
              <span>Article suivant</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

