"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Competition = { id: string; slug: string; title: string; category: string; status: string; vote_price_cents: number; candidates_count: number; votes_count: number; cover_image?: string };
const statuses = ["draft", "published", "registrations_open", "registrations_closed", "voting_open", "live_scheduled", "live_running", "voting_closed", "deliberation", "finished"];

export default function AdminCompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/awards/competitions?operational=1", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(data.error || "Impossible de charger les compétitions");
    else setCompetitions(Array.isArray(data.competitions) ? data.competitions : []);
    setLoading(false);
  };

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);

  const updateStatus = async (competition: Competition, status: string) => {
    setBusy(competition.id); setNotice("");
    const response = await fetch("/api/awards/competitions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: competition.id, status }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setNotice(data.error || "Modification refusée");
    else { setNotice(`Statut mis à jour : ${status}`); setCompetitions((items) => items.map((item) => item.id === competition.id ? { ...item, status } : item)); }
    setBusy("");
  };

  return <main className="min-h-screen bg-[#0B0B0F] px-5 py-10 text-white md:px-12"><div className="mx-auto max-w-[1280px]"><div className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/africa-awards/admin/dashboard" className="text-xs font-bold text-[#D4AF37]">← Dashboard Awards</Link><p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Pilotage opérationnel</p><h1 className="mt-2 text-4xl font-black" style={{ fontFamily: "Fraunces" }}>Compétitions</h1><p className="mt-2 max-w-2xl text-sm text-[#A8A6A0]">Les compétitions opérationnelles réelles de Supabase. Les archives sont séparées pour éviter de mélanger l’historique avec les campagnes que vous pilotez maintenant.</p></div><Link href="/africa-awards/admin/dashboard/competitions/new" className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black">Créer une compétition</Link></div><p className="mt-5 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4 text-sm text-[#F4D976]">Cette vue affiche uniquement les compétitions non archivées. Ouvrez « Modifier / finaliser » pour gérer une compétition existante.</p>{notice && <p role="status" className="mt-6 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4 text-sm text-[#F4D976]">{notice}</p>}{loading ? <p className="mt-10 text-sm text-[#A8A6A0]">Chargement des compétitions…</p> : !competitions.length ? <p className="mt-10 rounded-xl border border-white/10 bg-[#16161D] p-6 text-sm text-[#A8A6A0]">Aucune compétition n’est disponible.</p> : <div className="mt-8 grid gap-5 lg:grid-cols-2">{competitions.map((competition) => <article key={competition.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#16161D]"><div className="flex gap-4 p-5"><div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-[#0B0B0F]">{competition.cover_image && <img src={competition.cover_image} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">{competition.category}</p><h2 className="mt-1 text-lg font-bold">{competition.title}</h2><p className="mt-2 text-xs text-[#A8A6A0]">{competition.candidates_count} candidat(s) · {competition.votes_count} vote(s) · {competition.vote_price_cents} XOF / vote</p></div></div><div className="border-t border-white/10 p-5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#A8A6A0]">Statut opérationnel</label><select value={competition.status} disabled={busy === competition.id} onChange={(event) => void updateStatus(competition, event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#0B0B0F] px-3 text-sm text-white"><option value={competition.status}>{competition.status}</option>{statuses.filter((status) => status !== competition.status).map((status) => <option key={status} value={status}>{status}</option>)}</select><div className="mt-4 flex flex-wrap gap-2"><Link href={`/africa-awards/admin/dashboard/competitions/${competition.id}`} className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold">Modifier / finaliser</Link><Link href={`/africa-awards/admin/dashboard/applications?competition_id=${competition.id}`} className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold">Candidatures</Link><Link href={`/africa-awards/competitions/${competition.slug}`} className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold">Voir public</Link></div></div></article>)}</div>}</div></main>;
}
