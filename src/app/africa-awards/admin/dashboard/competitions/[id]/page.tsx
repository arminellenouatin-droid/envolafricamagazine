"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const statuses = ["draft", "published", "registrations_open", "registrations_closed", "voting_open", "live_scheduled", "live_running", "voting_closed", "deliberation", "finished", "archived"];

type Competition = { id: string; slug: string; title: string; category: string; description: string; status: string; vote_price_cents: number; starts_at?: string; ends_at?: string };

export default function CompetitionModule({ params }: { params: Promise<{ id: string }> }) {
  const [competitionId, setCompetitionId] = useState("");
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [form, setForm] = useState({ title: "", category: "", description: "", vote_price_cents: "", starts_at: "", ends_at: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => { void params.then(({ id }) => setCompetitionId(id)); }, [params]);
  useEffect(() => {
    if (!competitionId) return;
    void (async () => {
      setLoading(true);
      const response = await fetch(`/api/awards/competitions?id=${encodeURIComponent(competitionId)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) setNotice(data.error || "Compétition introuvable");
      else if (data.competition) {
        const item = data.competition as Competition;
        setCompetition(item);
        setForm({ title: item.title || "", category: item.category || "", description: item.description || "", vote_price_cents: String(item.vote_price_cents || ""), starts_at: toInputDate(item.starts_at), ends_at: toInputDate(item.ends_at) });
      }
      setLoading(false);
    })();
  }, [competitionId]);

  const save = async () => {
    if (!competition) return;
    setBusy(true); setNotice("");
    const response = await fetch("/api/awards/competitions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: competition.id, title: form.title.trim(), category: form.category.trim(), description: form.description.trim(), vote_price_cents: Math.max(100, Number(form.vote_price_cents) || 100), starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null, ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null }) });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Paramètres enregistrés." : (data.error || "Enregistrement refusé."));
    if (response.ok && data.competition) setCompetition(data.competition);
    setBusy(false);
  };

  const updateStatus = async (status: string) => {
    if (!competition) return;
    setBusy(true); setNotice("");
    const response = await fetch("/api/awards/competitions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: competition.id, status }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { setCompetition((current) => current ? { ...current, status } : current); setNotice(`Cycle mis à jour : ${status}`); }
    else setNotice(data.error || "Changement de statut refusé.");
    setBusy(false);
  };

  if (loading) return <main className="min-h-screen bg-[#0B0B0F] px-5 py-12 text-white"><p className="mx-auto max-w-5xl text-sm text-white/60">Chargement du module opérationnel…</p></main>;
  if (!competition) return <main className="min-h-screen bg-[#0B0B0F] px-5 py-12 text-white"><div className="mx-auto max-w-5xl"><Link href="/africa-awards/admin/dashboard/competitions" className="text-xs font-bold text-[#D4AF37]">← Retour aux compétitions</Link><p className="mt-8 rounded-2xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-200">{notice || "Compétition introuvable."}</p></div></main>;

  return <main className="min-h-screen bg-[#0B0B0F] px-5 py-10 text-white md:px-12"><div className="mx-auto max-w-5xl"><Link href="/africa-awards/admin/dashboard/competitions" className="text-xs font-bold text-[#D4AF37]">← Retour aux compétitions</Link><div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#D4AF37]">Module opérationnel</p><h1 className="mt-2 text-3xl font-black" style={{ fontFamily: "Fraunces" }}>{competition.title}</h1><p className="mt-2 text-sm text-white/60">Configurez cette compétition réelle, ouvrez ses phases et accédez aux candidatures.</p></div><span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black text-[#F4D976]">{competition.status}</span></div>{notice && <p role="status" className="mt-6 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4 text-sm text-[#F4D976]">{notice}</p>}

    <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><section className="rounded-2xl border border-white/10 bg-[#16161D] p-6"><h2 className="text-lg font-black">Paramètres de la compétition</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Titre" value={form.title} onChange={(value) => setForm({ ...form, title: value })} /><Field label="Catégorie" value={form.category} onChange={(value) => setForm({ ...form, category: value })} /><Field label="Prix d’un vote (XOF)" value={form.vote_price_cents} type="number" onChange={(value) => setForm({ ...form, vote_price_cents: value })} /><Field label="Début" value={form.starts_at} type="datetime-local" onChange={(value) => setForm({ ...form, starts_at: value })} /><Field label="Fin" value={form.ends_at} type="datetime-local" onChange={(value) => setForm({ ...form, ends_at: value })} /></div><label className="mt-4 block text-xs font-bold text-white/60">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 min-h-32 w-full rounded-xl border border-white/10 bg-[#0B0B0F] p-3 text-sm text-white outline-none focus:border-[#D4AF37]" /></label><button disabled={busy} onClick={() => void save()} className="mt-5 rounded-full bg-[#D4AF37] px-5 py-3 text-xs font-black text-black disabled:opacity-50">{busy ? "Enregistrement…" : "Enregistrer les paramètres"}</button></section>

    <aside className="space-y-6"><section className="rounded-2xl border border-white/10 bg-[#16161D] p-6"><h2 className="text-lg font-black">Faire progresser le cycle</h2><p className="mt-2 text-xs leading-5 text-white/60">Le changement est contrôlé par l’API et réservé à l’administrateur connecté.</p><select disabled={busy} value={competition.status} onChange={(event) => void updateStatus(event.target.value)} className="mt-5 h-11 w-full rounded-xl border border-white/10 bg-[#0B0B0F] px-3 text-sm text-white">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></section><section className="rounded-2xl border border-white/10 bg-[#16161D] p-6"><h2 className="text-lg font-black">Accès associés</h2><div className="mt-4 grid gap-2"><Link href={`/africa-awards/admin/dashboard/applications?competition_id=${competition.id}`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold hover:border-[#D4AF37]/50">Examiner les candidatures →</Link><Link href={`/africa-awards/competitions/${competition.slug}`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold hover:border-[#D4AF37]/50">Voir la page publique →</Link></div></section></aside></div></div></main>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-xs font-bold text-white/60">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#0B0B0F] px-3 text-sm text-white outline-none focus:border-[#D4AF37]" /></label>; }
function toInputDate(value?: string) { return value ? new Date(value).toISOString().slice(0, 16) : ""; }
