"use client";

import { useEffect, useRef } from "react";

type AdSenseSlotProps = {
  slot: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
  consentGranted?: boolean;
};

export default function AdSenseSlot({ slot, format = "auto", className = "", consentGranted = false }: AdSenseSlotProps) {
  const pushed = useRef(false);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const enabled = Boolean(client && slot && consentGranted);

  useEffect(() => {
    if (!enabled || pushed.current) return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-eam-adsense="true"]');
    const script: HTMLScriptElement = existing || document.createElement("script");
    if (!existing) {
      script.setAttribute("data-eam-adsense", "true");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client || "")}`;
      document.head.appendChild(script);
    }
    const pushAd = () => {
      try {
        (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle ||= [];
        (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle?.push({});
        pushed.current = true;
      } catch {
        // Google peut refuser l’emplacement avant validation du compte ; le contenu principal ne doit pas casser.
      }
    };
    script.addEventListener("load", pushAd, { once: true });
    if (existing) pushAd();
    return () => script.removeEventListener("load", pushAd);
  }, [client, enabled]);

  if (!enabled) return null;
  return <ins className={`adsbygoogle block min-h-[90px] overflow-hidden ${className}`} style={{ display: "block" }} data-ad-client={client} data-ad-slot={slot} data-ad-format={format} data-full-width-responsive="true" />;
}
