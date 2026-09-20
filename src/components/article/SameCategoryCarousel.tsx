"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type CategoryArticleItem = {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  image?: string;
  category?: string;
  author?: string;
  authorProfilePhoto?: string;
  readingTime?: number;
  publishedAt?: string;
};

type SameCategoryCarouselProps = {
  articles: CategoryArticleItem[];
  categoryName?: string;
};

export default function SameCategoryCarousel({ articles, categoryName }: SameCategoryCarouselProps) {
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

  // Auto-scroll effect: from right to left every 4000ms
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(timer);
  }, [total, isPaused, nextSlide]);

  if (!articles || articles.length === 0) {
    return null;
  }

  // Touch handlers for mobile swipe
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
      // Swiped left -> next slide
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev slide
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Format date helper
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
      aria-labelledby="same-category-heading"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e5bdbb]/80 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9e001f]/10 px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#9e001f]">
            <span className="material-symbols-outlined text-[13px]">category</span>
            Même rubrique
          </span>
          <h2
            id="same-category-heading"
            className="mt-2 text-2xl sm:text-[28px] font-bold tracking-tight text-[#1b1c1c]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Dans la même catégorie {categoryName ? <span className="text-[#9e001f]">· {categoryName}</span> : ""}
          </h2>
        </div>

        {/* Desktop Controls */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Article précédent"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c3c1] bg-white text-[#1b1c1c] transition hover:border-[#9e001f] hover:bg-[#fff1f0] hover:text-[#9e001f]"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Article suivant"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c3c1] bg-white text-[#1b1c1c] transition hover:border-[#9e001f] hover:bg-[#fff1f0] hover:text-[#9e001f]"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          MOBILE VIEW (< 768px): 1 Article at a time, auto-scrolling
          ======================================================== */}
      <div
        className="block md:hidden mt-6 relative overflow-hidden rounded-2xl bg-white p-2 shadow-sm border border-[#e5bdbb]/60"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative min-h-[380px] w-full overflow-hidden rounded-xl">
          {articles.map((item, idx) => {
            const isCurrent = idx === currentIndex;
            const isPrev = idx === (currentIndex - 1 + total) % total;

            return (
              <div
                key={item.id}
                className={`absolute inset-0 h-full w-full transition-all duration-700 ease-in-out ${
                  isCurrent
                    ? "z-10 translate-x-0 opacity-100"
                    : isPrev
                    ? "-translate-x-full opacity-0 pointer-events-none"
                    : "translate-x-full opacity-0 pointer-events-none"
                }`}
              >
                <Link href={`/article/${item.slug}`} className="group flex h-full flex-col justify-between p-3">
                  <div>
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#eee4e2]">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800"}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-[#9e001f] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-md">
                        {item.category || categoryName || "Économie"}
                      </span>
                    </div>

                    <h3
                      className="mt-3 text-lg font-bold leading-snug text-[#1b1c1c] transition group-hover:text-[#9e001f]"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {item.title}
                    </h3>

                    {item.summary && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#5f5e5e]">
                        {item.summary}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#f0e8e6] pt-3 text-[11px] text-[#746665]">
                    <span className="font-semibold text-[#1b1c1c]">{item.author || "Envol Africa"}</span>
                    <div className="flex items-center gap-1.5">
                      <span>{formatDate(item.publishedAt)}</span>
                      <span>•</span>
                      <span>{item.readingTime || 4} min</span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Mobile Controls & Dots */}
        <div className="mt-3 flex items-center justify-between px-3 pb-2 pt-1 border-t border-[#f5ecea]">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Article précédent"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5ecea] text-[#1b1c1c] transition active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {articles.slice(0, 8).map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                aria-label={`Aller au slide ${dotIdx + 1}`}
                onClick={() => setCurrentIndex(dotIdx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  dotIdx === currentIndex ? "w-6 bg-[#9e001f]" : "w-1.5 bg-[#d8c3c1]"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Article suivant"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5ecea] text-[#1b1c1c] transition active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          DESKTOP VIEW (≥ 768px): 3 Articles visible, continuous flow
          ======================================================== */}
      <div className="hidden md:block mt-8 overflow-hidden">
        <div
          className="flex gap-6 transition-transform duration-700 ease-out"
          style={{
            transform: `translateX(-${(currentIndex % Math.max(1, total - 2)) * (100 / 3 + 1.5)}%)`,
          }}
        >
          {articles.map((item) => (
            <div
              key={item.id}
              className="w-[calc(33.333%-1rem)] flex-none"
            >
              <Link
                href={`/article/${item.slug}`}
                className="group flex h-full flex-col justify-between rounded-2xl border border-[#e5bdbb]/60 bg-white p-4 transition-all duration-300 hover:border-[#9e001f]/40 hover:shadow-md"
              >
                <div>
                  <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#eee4e2]">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800"}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>

                  <span className="mt-4 inline-block text-[10px] font-black uppercase tracking-wider text-[#9e001f]">
                    {item.category || categoryName || "Économie"}
                  </span>

                  <h3
                    className="mt-2 line-clamp-2 text-base lg:text-[18px] font-bold leading-tight text-[#1b1c1c] transition group-hover:text-[#9e001f]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {item.title}
                  </h3>

                  {item.summary && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#5f5e5e]">
                      {item.summary}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#f0e8e6] pt-3 text-[11px] text-[#746665]">
                  <span className="font-semibold text-[#1b1c1c]">{item.author || "Envol Africa"}</span>
                  <div className="flex items-center gap-1.5">
                    <span>{formatDate(item.publishedAt)}</span>
                    <span>•</span>
                    <span>{item.readingTime || 4} min</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Desktop Dots Indicator */}
        {total > 3 && (
          <div className="mt-6 flex justify-center gap-1.5">
            {Array.from({ length: total - 2 }).map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                aria-label={`Aller au groupe ${dotIdx + 1}`}
                onClick={() => setCurrentIndex(dotIdx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  dotIdx === currentIndex % (total - 2) ? "w-6 bg-[#9e001f]" : "w-1.5 bg-[#d8c3c1]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
