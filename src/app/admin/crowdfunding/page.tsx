"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Project = { id: string; nom: string; secteur: string; description: string; montantRecherche: number; montantCollecte: number; typesFinancement: string[]; statut: string; porteurId: string; pays: string; createdAt: string; dateFin: string; niveauRisque: string; };

const statusLabels: Record<string, string> = { en_attente_validation: "À valider", en_cours: "Approuvé / actif", en_litige: "Rejeté / litige", draft: "Brouillon", objectif_atteint: "Objectif atteint", objectif_depasse: "Objectif dépassé", termine_sans_objectif: "Terminé", cloture: "Clôturé" };
const money = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);

export default function CrowdfundingAdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/crowdfunding/projects", { credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) setUnauthorized(true);
      setMessage(data.error || "Chargement impossible");
    } else {
      setUnauthorized(false);
      setProjects(data.projets || []);
    }
    setLoading(false);
  };

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);

  const filtered = useMemo(() => statusFilter === "all" ? projects : projects.filter((project) => project.statut === statusFilter), [projects, statusFilter]);
  const countPending = projects.filter((project) => project.statut === "en_attente_validation").length;

  const decide = async (project: Project, action: "approve" | "reject" | "draft") => {
    const label = action === "approve" ? "approuver" : action === "reject" ? "rejeter" : "remettre en brouillon";
    if (!window.confirm(`Confirmer : ${label} le projet « ${project.nom} » ?`)) return;
    setBusyId(project.id); setMessage("");
    const response = await fetch("/api/admin/crowdfunding/projects", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ projectId: project.id, action }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setMessage(data.error || "Action impossible");
    else {
      setMessage(action === "approve" ? `Le projet « ${project.nom} » est maintenant approuvé.` : "Décision enregistrée.");
      setProjects((items) => items.map((item) => item.id === data.projet.id ? data.projet : item));
      setSelected((current) => current?.id === data.projet.id ? data.projet : current);
    }
    setBusyId(null);
  };

  if (unauthorized) return <main className="min-h-screen bg-[#f6f4ef] px-4 py-8 text-[#0A1931] sm:px-8 lg:px-12"><div className="mx-auto max-w-xl rounded-3xl border border-[#0A1931]/10 bg-white p-8 text-center shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#b45309]">Accès administrateur requis</p><h1 className="mt-3 text-3xl font-black">Session non reconnue</h1><p className="mt-4 text-sm leading-6 text-[#0A1931]/65">La file de validation est protégée et ne charge les projets qu’après une connexion admin ou gérant sur ce domaine de preview.</p><Link href="/auth/login" className="mt-6 inline-flex rounded-full bg-[#0A1931] px-5 py-3 text-xs font-black text-white">Se connecter</Link></div></main>;

  return <main className="min-h-screen bg-[#f6f4ef] px-4 py-8 text-[#0A1931] sm:px-8 lg:px-12">
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 border-b border-[#0A1931]/15 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div><Link href="/admin" className="text-xs font-bold text-[#9e001f]">← Administration générale</Link><p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-[#b45309]">Finance / contrôle administratif</p><h1 className="mt-2 text-4xl font-black tracking-tight">Projets Crowdfunding</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#0A1931]/65">Examinez les projets soumis, contrôlez les informations du porteur et rendez une décision traçable avant toute contribution.</p></div>
        <div className="rounded-2xl border border-[#b45309]/25 bg-white px-5 py-4"><span className="text-[10px] font-black uppercase tracking-wider text-[#b45309]">À traiter</span><div className="mt-1 text-3xl font-black">{countPending}</div></div>
      </div>
      {message && <div className="mb-5 rounded-xl border border-[#b45309]/30 bg-[#fff8e8] px-4 py-3 text-sm font-semibold">{message}</div>}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-[#0A1931]/10 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">File de validation</h2><p className="text-xs text-[#0A1931]/55">{filtered.length} projet(s) affiché(s)</p></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-full border border-[#0A1931]/15 bg-[#f6f4ef] px-4 text-xs font-bold"><option value="all">Tous les statuts</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          {loading ? <p className="py-12 text-center text-sm text-[#0A1931]/50">Chargement des projets Supabase…</p> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-[#0A1931]/20 px-5 py-12 text-center"><p className="font-bold">Aucun projet dans cette file.</p><p className="mt-2 text-xs text-[#0A1931]/55">Une soumission apparaîtra ici avec son statut « À valider ».</p></div> : <div className="space-y-3">{filtered.map((project) => <article key={project.id} className={`rounded-2xl border p-4 transition hover:shadow-sm ${selected?.id === project.id ? "border-[#b45309] bg-[#fff8e8]" : "border-[#0A1931]/10 bg-white"}`}><button type="button" onClick={() => setSelected(project)} className="w-full text-left"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-wider text-[#0A1931]/45">{project.secteur} · {project.pays}</p><h3 className="mt-1 font-black">{project.nom}</h3><p className="mt-1 text-xs text-[#0A1931]/55">Porteur : {project.porteurId}</p></div><span className="rounded-full bg-[#0A1931]/5 px-3 py-1 text-[10px] font-black">{statusLabels[project.statut] || project.statut}</span></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-bold text-[#0A1931]/65"><span>Recherche : {money(project.montantRecherche)}</span><span>Collecté : {money(project.montantCollecte)}</span><span>{new Date(project.createdAt).toLocaleDateString("fr-FR")}</span></div></button>{project.statut === "en_attente_validation" && <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#0A1931]/10 pt-3"><span className="text-[11px] font-bold text-[#0A1931]/55">Action administrative requise</span><button type="button" disabled={busyId === project.id} onClick={() => void decide(project, "approve")} className="rounded-full bg-[#78c091] px-4 py-2.5 text-[11px] font-black text-[#0A1931] disabled:cursor-wait disabled:opacity-50">{busyId === project.id ? "Validation…" : "Valider le projet"}</button></div>}</article>)}</div>}
        </section>
        <section className="rounded-3xl border border-[#0A1931]/10 bg-[#0A1931] p-6 text-white shadow-sm">{selected ? <><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f2b84b]">Dossier sélectionné</p><h2 className="mt-3 text-2xl font-black">{selected.nom}</h2><p className="mt-3 text-sm leading-6 text-white/70">{selected.description || "Aucune description fournie."}</p><div className="mt-6 grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-white/10 p-3"><span className="text-white/50">Financement</span><strong className="mt-1 block">{selected.typesFinancement.join(", ") || "—"}</strong></div><div className="rounded-xl bg-white/10 p-3"><span className="text-white/50">Risque</span><strong className="mt-1 block">{selected.niveauRisque}</strong></div><div className="rounded-xl bg-white/10 p-3"><span className="text-white/50">Objectif</span><strong className="mt-1 block">{money(selected.montantRecherche)}</strong></div><div className="rounded-xl bg-white/10 p-3"><span className="text-white/50">Fin prévue</span><strong className="mt-1 block">{selected.dateFin ? new Date(selected.dateFin).toLocaleDateString("fr-FR") : "—"}</strong></div></div><div className="mt-8 flex flex-wrap gap-2">{selected.statut === "en_attente_validation" && <><button type="button" disabled={busyId === selected.id} onClick={() => void decide(selected, "approve")} className="rounded-full bg-[#78c091] px-4 py-3 text-xs font-black text-[#0A1931] disabled:opacity-50">Approuver le projet</button><button type="button" disabled={busyId === selected.id} onClick={() => void decide(selected, "reject")} className="rounded-full border border-white/25 px-4 py-3 text-xs font-black text-white disabled:opacity-50">Rejeter / mettre en litige</button></>}{selected.statut !== "draft" && selected.statut !== "en_cours" && <button type="button" disabled={busyId === selected.id} onClick={() => void decide(selected, "draft")} className="rounded-full border border-white/25 px-4 py-3 text-xs font-black text-white disabled:opacity-50">Remettre en brouillon</button>}</div></> : <div className="flex min-h-[420px] flex-col justify-center"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f2b84b]">Contrôle séquentiel</p><h2 className="mt-3 text-2xl font-black">Sélectionnez un projet</h2><p className="mt-3 text-sm leading-6 text-white/65">Le détail, les montants, les modèles de financement et les décisions apparaîtront ici. Aucun paiement ne doit être autorisé avant l’approbation.</p></div>}</section>
      </div>
    </div>
  </main>;
}
