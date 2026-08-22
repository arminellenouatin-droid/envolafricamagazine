/*
 * Direction Atelier de preuve WAB : recommandations intégrées au fil.
 * Cartes horizontales, données réelles uniquement, actions courtes et lisibles.
 */
import { useEffect, useState } from "react";
import FollowButton from "./FollowButton";
import FollowPageButton from "./FollowPageButton";

type DiscoveryType = "people" | "reels" | "pages" | "groups";
type DiscoveryItem = { id: string; title: string; subtitle: string; imageUrl?: string; href: string; targetUserId?: string; targetGroupId?: string; targetPageId?: string; mediaUrl?: string };

const LABELS: Record<DiscoveryType, { eyebrow: string; title: string; icon: string }> = {
  people: { eyebrow: "Réseau", title: "Des personnes à connaître", icon: "group_add" },
  reels: { eyebrow: "À regarder", title: "Les réels du moment", icon: "play_circle" },
  pages: { eyebrow: "À suivre", title: "Pages à découvrir", icon: "business" },
  groups: { eyebrow: "Communauté", title: "Groupes à rejoindre", icon: "groups" },
};

export default function DiscoveryCarousel({ type }: { type: DiscoveryType }) {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/wab/discovery?type=${type}`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => { if (active) setItems(Array.isArray(data.items) ? data.items : []); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [type]);

  async function joinGroup(item: DiscoveryItem) {
    if (!item.targetGroupId) return;
    setMessage("");
    try {
      const response = await fetch(`/api/wab/groups/${encodeURIComponent(item.targetGroupId)}/join`, { method: "POST", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
      if (!response.ok) throw new Error(data.error || "Impossible de rejoindre ce groupe.");
      setJoined((current) => ({ ...current, [item.id]: true }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Action impossible."); }
  }

  const label = LABELS[type];
  if (!loading && !items.length) return null;
  return (
    <section className="rounded-3xl border border-[#b9ebe6] bg-[#f7fcfb] p-4 shadow-[0_2px_8px_rgba(8,40,67,0.06)]" aria-label={label.title}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#006874]">{label.eyebrow}</p><h2 className="mt-1 font-display text-lg font-extrabold text-[#082843]">{label.title}</h2></div>
        <span className="material-symbols-outlined rounded-full bg-white p-2 text-[#006874]" aria-hidden="true">{label.icon}</span>
      </div>
      {message && <p role="alert" className="mt-2 text-xs font-semibold text-[#9e001f]">{message}</p>}
      <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {loading ? <div className="h-28 min-w-[210px] animate-pulse rounded-2xl bg-white" /> : items.map((item) => (
          <article key={item.id} className="flex min-w-[214px] snap-start flex-col rounded-2xl border border-[#d1e9e6] bg-white p-3 shadow-sm">
            <a href={item.href} className="flex min-w-0 items-center gap-3" aria-label={`Ouvrir ${item.title}`}>
              {type === "reels" && item.mediaUrl ? <video src={item.mediaUrl} muted playsInline preload="metadata" className="h-12 w-12 shrink-0 rounded-xl bg-[#001325] object-cover" aria-label="Aperçu du Reel" /> : item.imageUrl ? <img src={item.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl bg-[#eefcfa] object-cover" loading="lazy" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#eefcfa] text-lg font-black text-[#006874]">{item.title.slice(0, 1).toUpperCase()}</span>}
              <span className="min-w-0"><strong className="block truncate text-xs font-extrabold text-[#082843]">{item.title}</strong><span className="mt-1 block truncate text-[10px] text-[#687274]">{item.subtitle}</span></span>
            </a>
            <div className="mt-auto pt-3">
              {type === "people" && item.targetUserId ? <FollowButton userId={item.targetUserId} /> : type === "pages" && item.targetPageId ? <FollowPageButton pageId={item.targetPageId} /> : type === "groups" ? <button type="button" onClick={() => joinGroup(item)} disabled={joined[item.id]} className="w-full rounded-xl bg-[#006874] px-3 py-2 text-[10px] font-extrabold text-white disabled:bg-[#d7e5e3] disabled:text-[#43474d]">{joined[item.id] ? "Groupe rejoint" : "Rejoindre"}</button> : <a href={item.href} className="block w-full rounded-xl border border-[#9adbd4] px-3 py-2 text-center text-[10px] font-extrabold text-[#006874] hover:bg-[#eefcfa]">{type === "reels" ? "Regarder" : "Découvrir"}</a>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
