"use client";

import { useEffect } from "react";

export function countAllFavorites(): number {
  if (typeof window === "undefined") return 0;
  try {
    const artFavs = JSON.parse(localStorage.getItem("eam_favorites") || "[]");
    const marketFavs = JSON.parse(localStorage.getItem("eam_marketplace_favorites") || "[]");
    const artCount = Array.isArray(artFavs) ? artFavs.length : 0;
    const marketCount = Array.isArray(marketFavs) ? marketFavs.length : 0;
    return artCount + marketCount;
  } catch {
    return 0;
  }
}

export default function FavoriteBadgeSynchronizer() {
  useEffect(() => {
    const updateHeaderFavoriteBadge = () => {
      if (typeof document === "undefined") return;
      const count = countAllFavorites();
      const favButtons = document.querySelectorAll<HTMLElement>(
        'button[aria-label="Favoris"], button[aria-label^="Favoris ("]'
      );

      favButtons.forEach((btn) => {
        let badge = btn.querySelector<HTMLElement>("#eam-header-fav-badge");
        if (count > 0) {
          btn.setAttribute("aria-label", `Favoris (${count})`);
          if (!btn.classList.contains("relative")) {
            btn.classList.add("relative");
          }
          if (!badge) {
            badge = document.createElement("span");
            badge.id = "eam-header-fav-badge";
            badge.className =
              "absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#9e001f] px-1 text-[9px] font-bold text-white shadow-xs pointer-events-none";
            btn.appendChild(badge);
          }
          badge.textContent = count > 99 ? "99+" : String(count);
          badge.style.display = "grid";
        } else {
          btn.setAttribute("aria-label", "Favoris");
          if (badge) {
            badge.remove();
          }
        }
      });
    };

    updateHeaderFavoriteBadge();

    const interval = window.setInterval(updateHeaderFavoriteBadge, 1500);
    window.addEventListener("storage", updateHeaderFavoriteBadge);
    window.addEventListener("eam-favorites-updated", updateHeaderFavoriteBadge);
    window.addEventListener("focus", updateHeaderFavoriteBadge);

    fetch("/api/favorites", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.favorites && Array.isArray(data.favorites)) {
          try {
            const currentArt = JSON.parse(localStorage.getItem("eam_favorites") || "[]");
            const currentArtIds = new Set(
              currentArt.map((item: any) => (typeof item === "string" ? item : item.id))
            );
            let updated = false;
            data.favorites.forEach((id: string) => {
              if (!currentArtIds.has(id)) {
                currentArt.push({ id, type: "article" });
                updated = true;
              }
            });
            if (updated) {
              localStorage.setItem("eam_favorites", JSON.stringify(currentArt));
              updateHeaderFavoriteBadge();
            }
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", updateHeaderFavoriteBadge);
      window.removeEventListener("eam-favorites-updated", updateHeaderFavoriteBadge);
      window.removeEventListener("focus", updateHeaderFavoriteBadge);
    };
  }, []);

  return null;
}
