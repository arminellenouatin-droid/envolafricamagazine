"use client";

import { useEffect, useState } from "react";

type Page = { id: string; name: string; logoUrl?: string; avatarUrl?: string; coverUrl?: string; description?: string; postCount: number };

export default function WabPageDetail({ params }: { params: Promise<{ id: string }> }) {
  const [page, setPage] = useState<Page | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { params.then(({ id }) => fetch(`/api/wab/pages/${id}`).then((response) => response.json()).then((data) => { if (!data.page) throw new Error(data.error); setPage(data.page); }).catch((error) => setMessage(error instanceof Error ? error.message : "Page indisponible."))); }, [params]);
  if (!page) return <main className="min-h-screen bg-[#e9f7f5] px-5 py-12"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center">{message || "Chargement de la page…"}</div></main>;
  const avatar = page.avatarUrl || page.logoUrl;
  return <main className="min-h-screen bg-[#e9f7f5] px-5 py-10"><div className="mx-auto max-w-3xl"><a href="/wab" className="text-sm font-bold text-[#006874]">← Retour au fil WAB</a><section className="mt-6 overflow-hidden rounded-3xl border border-[#d1e9e6] bg-white shadow-sm"><div className="relative h-44 bg-gradient-to-br from-[#006874] via-[#0b8790] to-[#b9e4df] sm:h-56">{page.coverUrl && <img src={page.coverUrl} alt={`Couverture de ${page.name}`} className="h-full w-full object-cover" />}<div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" /><div className="absolute bottom-4 left-5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#006874]">Page WAB</div></div><div className="relative px-6 pb-7 pt-0 sm:px-8"><div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end"><div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-[#eefcfa] shadow-lg sm:h-28 sm:w-28">{avatar ? <img src={avatar} alt={page.name} className="h-full w-full object-cover" /> : <span className="font-display text-4xl font-extrabold text-[#006874]">{page.name.charAt(0)}</span>}</div><div className="pb-1"><h1 className="font-display text-3xl font-extrabold text-[#082843]">{page.name}</h1><p className="mt-1 text-sm text-[#43474d]">{page.postCount} publication{page.postCount > 1 ? "s" : ""}</p></div></div><p className="mt-6 leading-7 text-[#111e1d]">{page.description || "Page officielle et espace de publication du réseau WAB."}</p><a href="/wab#publier" className="mt-6 inline-flex rounded-xl bg-[#006874] px-5 py-3 text-sm font-bold text-white">Créer une publication</a></div></section></div></main>;
}
