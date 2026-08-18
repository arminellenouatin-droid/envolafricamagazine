"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

export default function EditorialCarousel({ items, mode = "manual", visible = 4, interval = 4200, variant = "image" }: EditorialCarouselProps) {
  const [index, setIndex] = useState(0);
  const maxIndex = Math.max(0, items.length - visible);
  const canMove = items.length > visible;
  const step = (direction: number) => setIndex((current) => (current + direction + maxIndex + 1) % (maxIndex + 1));
  const activeItems = useMemo(() => items, [items]);

  useEffect(() => {
    if (mode !== "auto" || !canMove) return;
    const timer = window.setInterval(() => step(1), interval);
    return () => window.clearInterval(timer);
  }, [mode, canMove, interval, maxIndex]);

  return (
    <div className={`editorial-carousel editorial-carousel--${variant}`}>
      <div className="editorial-carousel__viewport">
        <div className="editorial-carousel__track" style={{ transform: `translateX(calc(-${index} * (100% / ${visible} + 1.25rem / ${visible})))` }}>
          {activeItems.map((item) => (
            <Link href={item.href} key={item.id} className="editorial-carousel__item group">
              {variant === "round" ? <div className="editorial-round-image"><img src={item.image} alt="" loading="lazy" decoding="async" /></div> : <div className="editorial-carousel__image"><img src={item.image} alt={item.title} loading="lazy" decoding="async" /><span className="editorial-carousel__veil" /></div>}
              <div className="editorial-carousel__copy"><span className="editorial-tag">{item.eyebrow}</span><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}{item.meta && <span className="editorial-carousel__meta">{item.meta}</span>}</div>
            </Link>
          ))}
        </div>
      </div>
      {canMove && <div className="editorial-carousel__controls"><div className="editorial-carousel__dots">{Array.from({ length: maxIndex + 1 }).map((_, dot) => <button type="button" key={dot} aria-label={`Aller à la série ${dot + 1}`} aria-pressed={index === dot} onClick={() => setIndex(dot)} />)}</div><div className="editorial-carousel__arrows"><button type="button" aria-label="Précédent" onClick={() => step(-1)}>←</button><button type="button" aria-label="Suivant" onClick={() => step(1)}>→</button></div></div>}
    </div>
  );
}
