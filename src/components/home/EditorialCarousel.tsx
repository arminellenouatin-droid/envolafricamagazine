"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CarouselItem = {
  id: string;
  title: string;
  href: string;
  image: string;
  eyebrow?: string;
  description?: string;
  meta?: string;
};

type EditorialCarouselProps = {
  items: CarouselItem[];
  mode?: "auto" | "manual";
  visible?: number;
  interval?: number;
  variant?: "image" | "round" | "ecosystem" | "sponsored";
};

export default function EditorialCarousel({
  items,
  mode = "manual",
  visible = 4,
  interval = 4000,
  variant = "image",
}: EditorialCarouselProps) {
  const [index, setIndex] = useState(0);
  const [effectiveVisible, setEffectiveVisible] = useState(visible);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  // Responsive items count calculation
  useEffect(() => {
    const updateVisible = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      if (width < 640) {
        setEffectiveVisible(1);
      } else if (width < 1024) {
        setEffectiveVisible(Math.min(2, visible));
      } else {
        setEffectiveVisible(visible);
      }
    };
    updateVisible();
    window.addEventListener("resize", updateVisible, { passive: true });
    return () => window.removeEventListener("resize", updateVisible);
  }, [visible]);

  const maxIndex = Math.max(0, items.length - effectiveVisible);
  const canMove = items.length > effectiveVisible;

  // Keep index within bounds if window resizes
  useEffect(() => {
    if (index > maxIndex) {
      setIndex(maxIndex);
    }
  }, [maxIndex, index]);

  const step = useCallback(
    (direction: number) => {
      setIndex((current) => {
        if (maxIndex <= 0) return 0;
        const next = current + direction;
        if (next > maxIndex) return 0; // seamless wrap right-to-left
        if (next < 0) return maxIndex;
        return next;
      });
    },
    [maxIndex]
  );

  // Auto right-to-left sliding with hover/touch pause
  useEffect(() => {
    if (mode !== "auto" || !canMove || isPaused) return;
    const timer = window.setInterval(() => step(1), interval);
    return () => window.clearInterval(timer);
  }, [mode, canMove, interval, step, isPaused]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = touchStartXRef.current - e.touches[0].clientX;
    const deltaY = Math.abs((touchStartYRef.current || 0) - e.touches[0].clientY);
    if (Math.abs(deltaX) > deltaY) {
      touchDeltaXRef.current = deltaX;
    }
  };

  const handleTouchEnd = () => {
    const deltaX = touchDeltaXRef.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        step(1); // swipe left -> slide right-to-left
      } else {
        step(-1); // swipe right -> slide left-to-right
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchDeltaXRef.current = 0;
    setTimeout(() => setIsPaused(false), 2000);
  };

  const activeItems = useMemo(() => items, [items]);

  const transformStyle = useMemo(() => {
    if (effectiveVisible === 1) {
      return `translateX(calc(-${index} * (100% + 0.8rem)))`;
    }
    return `translateX(calc(-${index} * (100% / ${effectiveVisible} + 1.25rem / ${effectiveVisible})))`;
  }, [index, effectiveVisible]);

  return (
    <div
      className={`editorial-carousel editorial-carousel--${variant}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="editorial-carousel__viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="editorial-carousel__track"
          style={{ transform: transformStyle }}
        >
          {activeItems.map((item) => (
            <Link
              href={item.href}
              key={item.id}
              className="editorial-carousel__item group"
            >
              {variant === "round" ? (
                <div className="editorial-round-image">
                  <img src={item.image} alt="" loading="lazy" decoding="async" />
                </div>
              ) : (
                <div className="editorial-carousel__image">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="editorial-carousel__veil" />
                </div>
              )}
              <div className="editorial-carousel__copy">
                {item.eyebrow && <span className="editorial-tag">{item.eyebrow}</span>}
                <h3 className="line-clamp-2">{item.title}</h3>
                {item.meta && (
                  <span className="editorial-carousel__meta">{item.meta}</span>
                )}
                {item.description && (
                  <p className="line-clamp-3">{item.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
      {canMove && (
        <div className="editorial-carousel__controls">
          <div className="editorial-carousel__dots">
            {Array.from({ length: maxIndex + 1 }).map((_, dot) => (
              <button
                type="button"
                key={dot}
                aria-label={`Aller à la série ${dot + 1}`}
                aria-pressed={index === dot}
                onClick={() => setIndex(dot)}
              />
            ))}
          </div>
          <div className="editorial-carousel__arrows">
            <button
              type="button"
              aria-label="Précédent"
              onClick={() => step(-1)}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Suivant"
              onClick={() => step(1)}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
