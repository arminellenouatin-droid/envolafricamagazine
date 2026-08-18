"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NotificationItem = { id: string; platform: string; type: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string };

const platformLabels: Record<string, string> = { system: "Envol Africa", magazine: "Magazine", wab: "WAB", jobs: "Jobs", marketplace: "Marketplace", crowdfunding: "Crowdfunding", awards: "Africa Awards" };

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger les notifications.");
      setItems(data.notifications || []);
    } catch (err) { setError(err instanceof Error ? err.message : "Impossible de charger les notifications."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
  };

  const visibleItems = useMemo(() => filter === "all" ? items : items.filter((item) => item.platform === filter), [filter, items]);
  const unread = items.filter((item) => !item.readAt).length;
  const platforms = Array.from(new Set(items.map((item) => item.platform)));

  return <main className="min-h-screen bg-[#fcf9f8] px-4 pb-24 pt-8 text-[#221b1b] dark:bg-[#161415] dark:text-[#f8eeee] sm:px-6 lg:px-10"><div className="mx-auto max-w-5xl"><div className="flex flex-col justify-between gap-4 border-b border-[#e5bdbb] pb-6 sm:flex-row sm:items-end"><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9e001f]">Centre de pilotage</p><h1 className="mt-2 font-display text-3xl font-black">Notifications</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b5353] dark:text-[#d7c2c2]">Toutes les alertes de votre compte, de vos pages et de vos groupes, réunies au même endroit.</p></div><button type="button" onClick={markRead} disabled={!unread} className="h-11 rounded-full bg-[#9e001f] px-5 text-xs font-black text-white transition hover:bg-[#c8102e] disabled:cursor-not-allowed disabled:opacity-40">Tout marquer comme lu</button></div><div className="mt-6 flex flex-wrap gap-2"><button type="button" onClick={() => setFilter("all")} className={`rounded-full border px-4 py-2 text-xs font-bold ${filter === "all" ? "border-[#9e001f] bg-[#9e001f] text-white" : "border-[#e5bdbb] bg-white dark:bg-[#241d1f]"}`}>Toutes {unread > 0 && <span className="ml-1">({unread})</span>}</button>{platforms.map((platform) => <button key={platform} type="button" onClick={() => setFilter(platform)} className={`rounded-full border px-4 py-2 text-xs font-bold ${filter === platform ? "border-[#9e001f] bg-[#9e001f] text-white" : "border-[#e5bdbb] bg-white dark:bg-[#241d1f]"}`}>{platformLabels[platform] || platform}</button>)}</div>{error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}{loading ? <div className="mt-8 rounded-2xl border border-[#e5bdbb] bg-white p-8 text-sm text-[#6b5353] dark:bg-[#241d1f]">Chargement des notifications...</div> : visibleItems.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-[#d8c3c1] bg-white p-10 text-center dark:bg-[#241d1f]"><span className="material-symbols-outlined text-4xl text-[#9e001f]">notifications_none</span><h2 className="mt-3 font-display text-lg font-black">Aucune notification</h2><p className="mt-2 text-sm text-[#6b5353] dark:text-[#d7c2c2]">Les nouvelles publications et interactions apparaîtront ici.</p></div> : <div className="mt-8 divide-y divide-[#ead9d7] overflow-hidden rounded-2xl border border-[#e5bdbb] bg-white dark:divide-[#443237] dark:bg-[#241d1f]">{visibleItems.map((item) => <Link key={`${item.platform}-${item.id}`} href={item.link || "/notifications"} className={`flex gap-4 p-5 transition hover:bg-[#fff5f3] dark:hover:bg-[#302628] ${!item.readAt ? "bg-[#fff8f6] dark:bg-[#2b2224]" : ""}`}><span className={`mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full ${!item.readAt ? "bg-[#9e001f] text-white" : "bg-[#f2e8e6] text-[#9e001f]"}`}><span className="material-symbols-outlined text-[20px]">{item.type.includes("message") ? "mail" : "notifications"}</span></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="font-display text-sm font-black">{item.title}</strong>{!item.readAt && <span className="h-2 w-2 rounded-full bg-[#9e001f]" aria-label="Non lu" />}</span><span className="mt-1 block text-sm leading-6 text-[#6b5353] dark:text-[#d7c2c2]">{item.body}</span><span className="mt-2 block text-[11px] font-bold uppercase tracking-wider text-[#9e001f]">{platformLabels[item.platform] || item.platform} · {new Date(item.createdAt).toLocaleString("fr-FR")}</span></span><span className="material-symbols-outlined mt-2 text-[#aa8f8f]">chevron_right</span></Link>)}</div>}</div></main>;
}
