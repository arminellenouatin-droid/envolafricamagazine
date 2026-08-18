"use client";

import { useEffect, useState } from "react";

type Page = { id: string; name: string; logoUrl?: string; description?: string; postCount: number };
export default function WabPageDetail({ params }: { params: Promise<{ id: string }> }) {
  const [page, setPage] = useState<Page | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { params.then(({ id }) => fetch(`/api/wab/pages/${id}`).then((response) => response.json()).then((data) => { if (!data.page) throw new Error(data.error); setPage(data.page); }).catch((error) => setMessage(error instanceof Error ? error.message : "Page indisponible."))); }, [params]);
  if (!page) return <main className="min-h-screen bg-[#e9f7f5] px-5 py-12"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center">{message || "Chargement de la page…"}</div></main>;
  return <main className="min-h-screen bg-[#e9f7f5] px-5 py-10"><div className="mx-auto max-w-3xl"><a href="/wab" className="text-sm font-bold text-[#006874]">← Retour au fil WAB</a><section className="mt-6 rounded-3xl border border-[#d1e9e6] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-4"><div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-[#eefcfa]">{page.logoUrl ? <img src={page.logoUrl} alt={page.name} className="h-full w-full object-contain p-2" /> : <span className="font-display text-3xl font-extrabold text-[#006874]">{page.name.charAt(0)}</span>}</div><div><p className="text-xs font-bold uppercase tracking-widest text-[#006874]">Page WAB</p><h1 className="mt-1 font-display text-3xl font-extrabold text-[#082843]">{page.name}</h1><p className="mt-1 text-sm text-[#43474d]">{page.postCount} publication{page.postCount > 1 ? "s" : ""}</p></div></div><p className="mt-6 leading-7 text-[#111e1d]">{page.description || "Page officielle et espace de publication du réseau WAB."}</p><a href="/wab#publier" className="mt-6 inline-flex rounded-xl bg-[#006874] px-5 py-3 text-sm font-bold text-white">Créer une publication</a></section></div></main>;
}
