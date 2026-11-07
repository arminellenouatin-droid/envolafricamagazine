"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Tab = "notifications" | "messages" | "favorites";
type InboxMessage = {
  id: string;
  platform: string;
  body: string;
  subject?: string | null;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
  senderId?: string | null;
  senderName?: string;
  senderAvatar?: string;
};
type InboxNotification = {
  id: string;
  title: string;
  body: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
};
type InboxFavorite = {
  id: string;
  title: string;
  href: string;
  image?: string;
  type: "article" | "product";
  meta?: string;
};

const labels: Record<Tab, string> = {
  notifications: "Notifications",
  messages: "Messages",
  favorites: "Favoris",
};

export default function InboxToolbox({
  open,
  tab,
  onClose,
  platform = "ecosystem",
}: {
  open: boolean;
  tab: Tab;
  onClose: () => void;
  platform?: string;
}) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [favorites, setFavorites] = useState<InboxFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [draft, setDraft] = useState("");
  const [sendStatus, setSendStatus] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    if (tab === "favorites") {
      (async () => {
        try {
          const rawArtFavs = JSON.parse(localStorage.getItem("eam_favorites") || "[]");
          const rawMarketFavs = JSON.parse(localStorage.getItem("eam_marketplace_favorites") || "[]");
          const savedMeta = JSON.parse(localStorage.getItem("eam_saved_products_meta") || "{}");

          const serverRes = await fetch("/api/favorites", { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : { favorites: [] }))
            .catch(() => ({ favorites: [] }));
          const serverFavIds: string[] = Array.isArray(serverRes.favorites) ? serverRes.favorites : [];

          const artIds: string[] = [];
          const artItems: InboxFavorite[] = [];
          rawArtFavs.forEach((item: any) => {
            if (typeof item === "string") {
              artIds.push(item);
            } else if (item && typeof item === "object") {
              artIds.push(item.id);
              artItems.push({
                id: item.id,
                title: item.title || "Article sauvegardé",
                href: item.slug ? `/article/${item.slug}` : `/article/${item.id}`,
                image: item.image,
                type: "article",
                meta: item.category || "Article",
              });
            }
          });

          const prodIds: string[] = [];
          const prodItems: InboxFavorite[] = [];
          rawMarketFavs.forEach((id: string) => {
            prodIds.push(id);
            if (savedMeta[id]) {
              prodItems.push({
                id,
                title: savedMeta[id].title || "Produit Marketplace",
                href: `/marketplace/produits/${id}`,
                image: savedMeta[id].image,
                type: "product",
                meta: savedMeta[id].price
                  ? `${Number(savedMeta[id].price).toLocaleString("fr-FR")} FCFA`
                  : "Marketplace",
              });
            }
          });

          const allIds = Array.from(new Set([...artIds, ...prodIds, ...serverFavIds]));
          const missingIds = allIds.filter(
            (id) => !artItems.some((a) => a.id === id) && !prodItems.some((p) => p.id === id)
          );

          if (missingIds.length > 0) {
            const [artData, prodData] = await Promise.all([
              fetch("/api/articles")
                .then((r) => (r.ok ? r.json() : { articles: [] }))
                .catch(() => ({ articles: [] })),
              fetch("/api/marketplace/products")
                .then((r) => (r.ok ? r.json() : { products: [] }))
                .catch(() => ({ products: [] })),
            ]);

            (artData.articles || []).forEach((art: any) => {
              if (missingIds.includes(art.id) && !artItems.some((a) => a.id === art.id)) {
                artItems.push({
                  id: art.id,
                  title: art.title,
                  href: `/article/${art.slug}`,
                  image: art.image,
                  type: "article",
                  meta: art.category || art.author || "Article",
                });
              }
            });

            (prodData.products || []).forEach((prd: any) => {
              if (missingIds.includes(prd.id) && !prodItems.some((p) => p.id === prd.id)) {
                prodItems.push({
                  id: prd.id,
                  title: prd.title,
                  href: `/marketplace/produits/${prd.id}`,
                  image: prd.image || (Array.isArray(prd.media) ? prd.media[0] : ""),
                  type: "product",
                  meta: `${Number(prd.price_xof ?? prd.priceXof ?? 0).toLocaleString("fr-FR")} FCFA`,
                });
              }
            });
          }

          setFavorites([...artItems, ...prodItems]);
        } catch {
        } finally {
          setLoading(false);
        }
      })();
    } else {
      Promise.all([
        fetch("/api/messages", { cache: "no-store" }).then((r) =>
          r.ok ? r.json() : { messages: [] }
        ),
        fetch("/api/notifications", { cache: "no-store" }).then((r) =>
          r.ok ? r.json() : { notifications: [] }
        ),
      ])
        .then(([messageData, notificationData]) => {
          setMessages(messageData.messages || []);
          setNotifications(notificationData.notifications || []);
        })
        .finally(() => setLoading(false));
    }
  }, [open, tab]);

  if (!open) return null;

  const contextLabel =
    platform === "wab"
      ? "un ami ou un contact WAB"
      : platform === "marketplace"
      ? "un fournisseur ou un client"
      : platform === "jobs"
      ? "un candidat ou un recruteur"
      : platform === "crowdfunding"
      ? "un porteur d’affaires ou un investisseur"
      : "un contact de l’écosystème";

  const sendMessage = async () => {
    if (!recipientId.trim() || !draft.trim()) return;
    setSendStatus("Envoi…");
    try {
      const response = await fetch("/api/wab/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: recipientId.trim(),
          body: draft.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Envoi impossible.");
      setSendStatus("Message envoyé.");
      setRecipientId("");
      setDraft("");
      setComposeOpen(false);
      const refreshed = await fetch("/api/messages", { cache: "no-store" });
      if (refreshed.ok) setMessages((await refreshed.json()).messages || []);
    } catch (error) {
      setSendStatus(error instanceof Error ? error.message : "Envoi impossible.");
    }
  };

  const removeFavoriteItem = async (fav: InboxFavorite) => {
    setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
    try {
      if (fav.type === "article") {
        const art = JSON.parse(localStorage.getItem("eam_favorites") || "[]");
        const next = art.filter((x: any) =>
          typeof x === "string" ? x !== fav.id : x.id !== fav.id
        );
        localStorage.setItem("eam_favorites", JSON.stringify(next));
      } else {
        const prd = JSON.parse(localStorage.getItem("eam_marketplace_favorites") || "[]");
        const next = prd.filter((x: string) => x !== fav.id);
        localStorage.setItem("eam_marketplace_favorites", JSON.stringify(next));
        const meta = JSON.parse(localStorage.getItem("eam_saved_products_meta") || "{}");
        delete meta[fav.id];
        localStorage.setItem("eam_saved_products_meta", JSON.stringify(meta));
      }
      window.dispatchEvent(new Event("eam-favorites-updated"));
      window.dispatchEvent(new Event("storage"));
      await fetch(`/api/favorites?id=${encodeURIComponent(fav.id)}`, {
        method: "DELETE",
      }).catch(() => {});
    } catch {}
  };

  return (
    <div
      className="fixed left-1/2 top-[56px] z-[95] max-h-[72vh] w-[min(92vw,380px)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-[#e5bdbb] bg-white p-3.5 text-[#242020] shadow-2xl dark:bg-[#241d1f] dark:text-white md:left-auto md:right-6 md:top-[64px] md:w-[410px] md:translate-x-0 lg:top-[84px]"
      role="dialog"
      aria-label={labels[tab]}
    >
      <div className="flex items-center justify-between border-b border-[#f0dedd] pb-2.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9e001f]">
            Écosystème Envol Africa
          </p>
          <h2 className="font-display text-base font-black">
            {labels[tab]}
            {tab === "favorites" && favorites.length > 0 && ` (${favorites.length})`}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="grid h-8 w-8 place-items-center rounded-full bg-[#f6f3f2] text-[#9e001f]"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {(Object.keys(labels) as Tab[]).map((item) => (
            <Link
              key={item}
              href={
                item === "notifications"
                  ? "/notifications"
                  : item === "messages"
                  ? "/messages"
                  : "/compte/favoris"
              }
              onClick={onClose}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black ${
                item === tab
                  ? "bg-[#9e001f] text-white"
                  : "bg-[#f6f3f2] text-[#725f4d]"
              }`}
            >
              {labels[item]}
            </Link>
          ))}
        </div>
        {tab === "messages" && (
          <button
            type="button"
            onClick={() => setComposeOpen((value) => !value)}
            className="rounded-full bg-[#9e001f] px-3 py-1.5 text-[11px] font-black text-white"
          >
            Nouveau message
          </button>
        )}
      </div>

      {tab === "messages" && composeOpen && (
        <div className="mt-3 rounded-xl border border-[#f0dedd] bg-[#fff8f6] p-3">
          <p className="text-xs font-bold text-[#725f4d]">Écrire à {contextLabel}</p>
          {platform === "wab" ? (
            <>
              <input
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value)}
                placeholder="Identifiant du destinataire"
                className="mt-2 h-10 w-full rounded-lg border bg-white px-3 text-xs"
              />
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Votre message…"
                className="mt-2 min-h-20 w-full rounded-lg border bg-white p-3 text-xs"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                className="mt-2 rounded-lg bg-[#006874] px-3 py-2 text-xs font-black text-white"
              >
                Envoyer
              </button>
            </>
          ) : (
            <div className="mt-2 grid gap-2">
              {platform === "marketplace" && (
                <Link
                  href="/marketplace/messages"
                  onClick={onClose}
                  className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#9e001f]"
                >
                  Écrire à un fournisseur ou un client
                </Link>
              )}
              {platform === "jobs" && (
                <Link
                  href="/emploi"
                  onClick={onClose}
                  className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#9e001f]"
                >
                  Contacter un candidat ou un recruteur
                </Link>
              )}
              {platform === "crowdfunding" && (
                <Link
                  href="/financement"
                  onClick={onClose}
                  className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#9e001f]"
                >
                  Contacter un porteur ou un investisseur
                </Link>
              )}
              {platform === "ecosystem" && (
                <Link
                  href="/wab/messages"
                  onClick={onClose}
                  className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#9e001f]"
                >
                  Ouvrir la messagerie WAB
                </Link>
              )}
            </div>
          )}
          {sendStatus && (
            <p className="mt-2 text-[11px] font-semibold text-[#806c58]">{sendStatus}</p>
          )}
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-[#806c58]">Chargement…</p>
      ) : tab === "messages" ? (
        <div className="mt-3 divide-y divide-[#f0dedd]">
          {messages.slice(0, 8).map((item) => (
            <Link
              key={item.id}
              href={item.href || "/messages"}
              onClick={onClose}
              className="flex gap-3 py-3 transition hover:bg-[#fff8f6]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#f6f3f2] text-[#9e001f]">
                {item.senderAvatar ? (
                  <img
                    src={item.senderAvatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined">person</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs font-black">
                  {item.senderName || item.subject || "Nouveau message"}
                </strong>
                <span className="mt-1 block truncate text-xs text-[#806c58]">
                  {item.body}
                </span>
              </span>
            </Link>
          ))}
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-[#806c58]">Aucun message reçu.</p>
          )}
        </div>
      ) : tab === "notifications" ? (
        <div className="mt-3 divide-y divide-[#f0dedd]">
          {notifications.slice(0, 8).map((item) => (
            <Link
              key={item.id}
              href={item.link || "/notifications"}
              onClick={onClose}
              className="flex gap-3 py-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f6f3f2] text-[#9e001f]">
                <span className="material-symbols-outlined">notifications</span>
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs font-black">{item.title}</strong>
                <span className="mt-1 block truncate text-xs text-[#806c58]">{item.body}</span>
              </span>
            </Link>
          ))}
          {notifications.length === 0 && (
            <p className="py-8 text-center text-sm text-[#806c58]">Aucune notification.</p>
          )}
        </div>
      ) : (
        <div className="mt-3">
          {favorites.length > 0 ? (
            <div className="space-y-1 divide-y divide-[#f0dedd]/60">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between gap-2.5 py-2 transition hover:bg-[#fff8f6] rounded-xl px-1.5"
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f0eded] border border-[#e5bdbb]/50">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-xs font-bold text-[#9e001f]">
                          {item.type === "article" ? "📰" : "🛍️"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-[#9e001f]/10 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-[#9e001f]">
                          {item.type === "article" ? "Article" : "Marketplace"}
                        </span>
                        {item.meta && (
                          <span className="truncate text-[10px] text-[#746665]">
                            {item.meta}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs font-bold text-[#242020] group-hover:text-[#9e001f]">
                        {item.title}
                      </p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => void removeFavoriteItem(item)}
                    title="Retirer des favoris"
                    aria-label={`Retirer ${item.title} des favoris`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#a8928f] hover:bg-[#ffebee] hover:text-[#9e001f] transition"
                  >
                    <span className="material-symbols-outlined text-[17px]">delete_outline</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-7 text-center">
              <span className="material-symbols-outlined text-4xl text-[#d8c3c1]">
                favorite_border
              </span>
              <p className="mt-2 text-xs font-bold text-[#242020]">
                Aucun favori enregistré
              </p>
              <p className="mt-1 text-[11px] text-[#746665]">
                Ajoutez des articles ou des produits à vos favoris pour les retrouver ici en un clic.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <Link
                  href="/recherche"
                  onClick={onClose}
                  className="rounded-full bg-[#f6f3f2] px-3 py-1.5 text-[11px] font-bold text-[#242020] hover:bg-[#e5bdbb]"
                >
                  Explorer les articles
                </Link>
                <Link
                  href="/marketplace"
                  onClick={onClose}
                  className="rounded-full bg-[#9e001f] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#c8102e]"
                >
                  Marketplace
                </Link>
              </div>
            </div>
          )}

          <div className="mt-3 border-t border-[#f0dedd] pt-2.5 text-center">
            <Link
              href="/compte/favoris"
              onClick={onClose}
              className="text-xs font-black text-[#9e001f] hover:underline flex items-center justify-center gap-1"
            >
              <span>Voir tous mes favoris</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
export type { Tab as InboxToolboxTab };
