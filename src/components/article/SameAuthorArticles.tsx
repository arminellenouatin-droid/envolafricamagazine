"use client";

import Link from "next/link";
import { useRef, useState } from "react";

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
  category?: string;
  readingTime?: number;
  publishedAt?: string;
};

type SameAuthorArticlesProps = {
  author: AuthorInfo;
  articles: AuthorArticleItem[];
};

export default function SameAuthorArticles({ author, articles }: SameAuthorArticlesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const total = articles.length;

  if (total === 0) {
    return null;
  }

  // Manual navigation handlers
  const nextSlide = () => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  // Touch handlers for manual swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
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

  const currentArticle = articles[currentIndex];

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
    >
      {/* Header section */}
      <div className="flex items-end justify-between border-b border-[#e5bdbb]/80 pb-5">
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

        {/* Global manual counter */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#746665]">
            <span className="text-[#9e001f]">{currentIndex + 1}</span> / {total}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Titre précédent"
              disabled={total <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8c3c1] bg-white text-[#1b1c1c] transition hover:border-[#9e001f] hover:bg-[#fff1f0] hover:text-[#9e001f] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Titre suivant"
              disabled={total <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8c3c1] bg-white text-[#1b1c1c] transition hover:border-[#9e001f] hover:bg-[#fff1f0] hover:text-[#9e001f] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          MOBILE VIEW (< 768px):
          1. Photo with author info overlaid ON the photo
          2. Below: article titles scrollable MANUALLY ONE BY ONE
          ======================================================== */}
      <div className="block md:hidden mt-6">
        {/* 1. Author photo with information overlaid on photo */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#2b2525] shadow-md border border-[#e5bdbb]/50">
          <img
            src={author.photoUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600"}
            alt={author.name}
            className="h-full w-full object-cover"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

          {/* Overlaid text content */}
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

        {/* 2. Below photo: manual one-by-one title carousel */}
        <div
          className="mt-4 rounded-2xl border border-[#e5bdbb]/60 bg-white p-5 shadow-sm"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center justify-between border-b border-[#f5ecea] pb-2 text-[11px] font-bold text-[#746665]">
            <span className="flex items-center gap-1.5 text-[#9e001f]">
              <span className="material-symbols-outlined text-[14px]">auto_stories</span>
              Article {currentIndex + 1} sur {total}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#8A8882]">
              Défilement manuel
            </span>
          </div>

          {/* Title Card (One by One) */}
          <div className="relative min-h-[140px] pt-4">
            <Link
              href={`/article/${currentArticle.slug}`}
              className="group block"
            >
              {currentArticle.category && (
                <span className="inline-block text-[10px] font-black uppercase tracking-wider text-[#9e001f]">
                  {currentArticle.category}
                </span>
              )}
              <h4
                className="mt-1.5 text-lg font-bold leading-snug text-[#1b1c1c] transition group-hover:text-[#9e001f]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {currentArticle.title}
              </h4>
              <div className="mt-3 flex items-center justify-between text-xs text-[#746665]">
                <div className="flex items-center gap-2">
                  <span>{formatDate(currentArticle.publishedAt)}</span>
                  <span>•</span>
                  <span>{currentArticle.readingTime || 4} min de lecture</span>
                </div>
                <span className="inline-flex items-center gap-1 font-bold text-[#9e001f] transition group-hover:translate-x-1">
                  Lire <span>→</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Mobile Manual Controls */}
          <div className="mt-4 flex items-center justify-between border-t border-[#f5ecea] pt-3">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Article précédent"
              disabled={total <= 1}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f5ecea] px-3.5 py-1.5 text-xs font-bold text-[#1b1c1c] transition active:scale-95 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Précédent</span>
            </button>

            {/* Step Dots */}
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
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f5ecea] px-3.5 py-1.5 text-xs font-bold text-[#1b1c1c] transition active:scale-95 disabled:opacity-40"
            >
              <span>Suivant</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          DESKTOP VIEW (≥ 768px):
          Author Card on left, Title List/Slider on right
          ======================================================== */}
      <div className="hidden md:grid md:grid-cols-12 gap-8 mt-8 items-stretch">
        {/* Left Column: Author Presentation Card */}
        <div className="md:col-span-4 rounded-2xl border border-[#e5bdbb]/60 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#2b2525]">
              <img
                src={author.photoUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600"}
                alt={author.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 rounded-full bg-[#9e001f] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
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
            <span>{total} autre{total > 1 ? "s" : ""} publication{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Right Column: Titles in Manual Progression */}
        <div className="md:col-span-8 rounded-2xl border border-[#e5bdbb]/60 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#f5ecea] pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9e001f]">
                Articles rédigés par {author.name}
              </span>
              <span className="text-xs font-bold text-[#746665]">
                {currentIndex + 1} / {total}
              </span>
            </div>

            {/* Featured Active Title */}
            <div className="py-6">
              <Link
                href={`/article/${currentArticle.slug}`}
                className="group block"
              >
                {currentArticle.category && (
                  <span className="inline-block rounded-full bg-[#9e001f]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#9e001f]">
                    {currentArticle.category}
                  </span>
                )}
                <h4
                  className="mt-3 text-2xl lg:text-3xl font-bold leading-snug text-[#1b1c1c] transition group-hover:text-[#9e001f]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  {currentArticle.title}
                </h4>
                <div className="mt-4 flex items-center gap-4 text-xs text-[#746665]">
                  <span>Publié le {formatDate(currentArticle.publishedAt)}</span>
                  <span>•</span>
                  <span>{currentArticle.readingTime || 4} min de lecture</span>
                  <span>•</span>
                  <span className="font-bold text-[#9e001f] transition group-hover:translate-x-1 inline-flex items-center gap-1">
                    Consulter l&apos;article →
                  </span>
                </div>
              </Link>
            </div>

            {/* Quick List of upcoming other titles for quick access */}
            {total > 1 && (
              <div className="mt-2 border-t border-[#f5ecea] pt-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#8A8882] mb-3">
                  Autres titres de cet auteur (cliquez pour basculer) :
                </p>
                <div className="space-y-2">
                  {articles.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-between ${
                        idx === currentIndex
                          ? "bg-[#fff1f0] text-[#9e001f] font-bold border-l-2 border-[#9e001f]"
                          : "text-[#5f5e5e] hover:bg-[#fcf9f8] hover:text-[#1b1c1c]"
                      }`}
                    >
                      <span className="truncate pr-4">{item.title}</span>
                      <span className="text-[10px] opacity-70 flex-none">{item.readingTime || 4} min</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Manual Controls */}
          <div className="mt-6 flex items-center justify-between border-t border-[#f5ecea] pt-4">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Titre précédent"
              disabled={total <= 1}
              className="inline-flex items-center gap-2 rounded-full border border-[#d8c3c1] bg-white px-4 py-2 text-xs font-bold text-[#1b1c1c] transition hover:border-[#9e001f] hover:bg-[#fff1f0] hover:text-[#9e001f] disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Titre précédent</span>
            </button>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Titre suivant"
              disabled={total <= 1}
              className="inline-flex items-center gap-2 rounded-full bg-[#9e001f] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#7d0019] disabled:opacity-40"
            >
              <span>Titre suivant</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
