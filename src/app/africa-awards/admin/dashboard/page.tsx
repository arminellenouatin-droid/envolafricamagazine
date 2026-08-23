import Link from "next/link";
import { getSupabaseAwardsAdminMetrics } from "@/lib/awards-supabase";

export const dynamic = "force-dynamic";

export default async function AdminDashboardAwards() {
  const metrics = await getSupabaseAwardsAdminMetrics();
  const unavailable = !metrics.configured;
  const value = (number: number) => (unavailable ? "—" : number.toLocaleString("fr-FR"));

  return (
    <div className="min-h-screen bg-[#0B0B0F] pb-20 text-white">
      <div className="mx-auto max-w-[1280px] px-5 py-10 md:px-[64px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">Pilotage Africa Awards</p>
            <h1 className="mt-2 text-[32px] font-black" style={{ fontFamily: "Fraunces" }}>Dashboard administrateur</h1>
            <p className="mt-2 max-w-3xl text-[13px] text-[#A8A6A0]">Vue opérationnelle alimentée par les données réelles Supabase. Les archives sont séparées des compétitions actuellement gérables.</p>
          </div>
          <Link href="/africa-awards/admin/dashboard/competitions/new" className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-black text-black transition hover:bg-[#F4D976]">Créer une compétition</Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Metric label="Compétitions actives" value={value(metrics.totalCompetitions)} detail={`${value(metrics.archivedCompetitions)} archive(s) séparée(s)`} />
          <Metric label="Candidats réels" value={value(metrics.candidates)} detail="Lignes awards_candidates" />
          <Metric label="Votes enregistrés" value={value(metrics.votes)} detail="Lignes awards_votes" accent />
          <Metric label="Lives en cours" value={value(metrics.liveSessions)} detail={`${value(metrics.pendingRequests)} demande(s) à traiter`} />
        </div>

        {unavailable && <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">La connexion Supabase n’est pas disponible dans cet environnement. Aucun chiffre de démonstration n’est affiché.</div>}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ActionCard href="/africa-awards/admin/dashboard/requests" icon="📋" title="Validation demandes" description={`${value(metrics.pendingRequests)} demande(s) soumise(s) à examiner avec motif de décision.`} />
          <ActionCard href="/africa-awards/admin/dashboard/competitions" icon="🏆" title="Gérer les compétitions" description="Modifier les paramètres, ouvrir les inscriptions et faire progresser le cycle de vie." />
          <ActionCard href="/africa-awards/admin/dashboard/applications" icon="🧾" title="Valider les candidatures" description="Examiner les dossiers et convertir uniquement les candidatures approuvées en nominés." />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-[#16161D] p-6">
            <h2 className="font-bold">Indicateurs financiers</h2>
            <p className="mt-3 text-sm leading-6 text-[#A8A6A0]">Le chiffre d’affaires n’est pas affiché tant qu’une agrégation fiable des transactions Awards n’est pas branchée. Cela évite de présenter une estimation comme un résultat réel.</p>
            <Link href="/africa-awards/admin/dashboard/sponsors" className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:border-[#D4AF37]/50">Sponsors et publicité →</Link>
          </section>
          <section className="rounded-xl border border-white/10 bg-[#16161D] p-6">
            <h2 className="font-bold">Source des données</h2>
            <p className="mt-3 text-sm leading-6 text-[#A8A6A0]">Les compteurs affichés proviennent des tables opérationnelles. Les compétitions archivées restent conservées dans la base mais ne sont plus mélangées au pilotage courant.</p>
            <Link href="/africa-awards/admin/dashboard/competitions" className="mt-5 inline-flex rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-black text-black">Ouvrir le module opérationnel →</Link>
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, detail, accent = false }: { label: string; value: string; detail: string; accent?: boolean }) {
  return <div className="rounded-xl border border-white/10 bg-[#16161D] p-5"><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">{label}</div><div className={`mt-1 text-[28px] font-black ${accent ? "text-[#D4AF37]" : "text-white"}`}>{value}</div><div className="mt-1 text-[11px] text-[#A8A6A0]">{detail}</div></div>;
}

function ActionCard({ href, icon, title, description }: { href: string; icon: string; title: string; description: string }) {
  return <Link href={href} className="rounded-xl border border-white/10 bg-[#16161D] p-6 transition hover:border-[#D4AF37]/40 hover:bg-[#1b1b23]"><div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-xl">{icon}</div><div className="mt-4 font-bold">{title}</div><div className="mt-2 text-[12px] leading-5 text-[#A8A6A0]">{description}</div></Link>;
}
