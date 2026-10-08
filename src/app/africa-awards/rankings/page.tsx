import Link from "next/link";
import { readAwardsDB } from "@/lib/awards-db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseCandidates, getSupabaseCompetitions } from "@/lib/awards-supabase";

export const dynamic = "force-dynamic";

export default async function RankingsPage() {
  let candidates: any[] = [];
  let competitions: any[] = [];

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const [candRes, compRes] = await Promise.all([
        getSupabaseCandidates(),
        getSupabaseCompetitions({ operationalOnly: true }),
      ]);
      candidates = candRes.candidates || [];
      competitions = compRes.competitions || [];
    } catch {}
  }

  if (candidates.length === 0) {
    const db = readAwardsDB();
    candidates = db.candidates || [];
    competitions = db.competitions || [];
  }

  // Trier les candidats par votes décroissants
  const topCandidates = [...candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 10);
  const topCompetitions = [...competitions].sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0)).slice(0, 5);
  const podium = topCandidates.slice(0, 3);

  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-400">
              🏆 Classement Officiel · Envol Africa Awards
            </div>
            <h1 className="text-[32px] sm:text-[40px] font-black mt-2" style={{ fontFamily: "Fraunces" }}>
              Palmarès & Top Leaders d'Afrique
            </h1>
            <p className="text-[#A8A6A0] text-xs sm:text-sm mt-1 max-w-2xl">
              Classement certifié calculé selon la pondération officielle : votes du public vérifiés et évaluations du jury d'experts.
            </p>
          </div>
          <Link
            href="/africa-awards/competitions"
            className="inline-flex rounded-full bg-[#D4AF37] px-6 py-2.5 text-xs font-black text-black hover:bg-[#F4D976] transition shadow-sm"
          >
            Explorer les Compétitions →
          </Link>
        </div>

        {/* PODIUM TOP 3 */}
        {podium.length >= 3 && (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {/* 2ème place */}
            <div className="rounded-2xl border border-white/10 bg-[#16161D] p-6 text-center order-2 md:order-1 flex flex-col justify-between">
              <div>
                <span className="inline-block rounded-full bg-zinc-700/50 px-3 py-1 text-xs font-black text-zinc-300">
                  🥈 2ème Place
                </span>
                <img
                  src={podium[1].photo_url}
                  alt=""
                  className="mx-auto mt-4 h-20 w-20 rounded-full object-cover border-2 border-zinc-400"
                />
                <h3 className="mt-3 text-base font-black text-white">{podium[1].display_name}</h3>
                <p className="text-xs text-[#A8A6A0]">{podium[1].country} • {podium[1].votes} points</p>
              </div>
              <Link
                href={`/africa-awards/candidates/${podium[1].id}`}
                className="mt-4 inline-block text-xs font-bold text-[#D4AF37] hover:underline"
              >
                Voir le profil →
              </Link>
            </div>

            {/* 1ère place */}
            <div className="rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#1E1B10] to-[#16161D] p-6 text-center order-1 md:order-2 shadow-lg relative -translate-y-2 flex flex-col justify-between">
              <div>
                <span className="inline-block rounded-full bg-[#D4AF37] px-4 py-1 text-xs font-black text-black shadow-sm">
                  👑 Grand Vainqueur
                </span>
                <img
                  src={podium[0].photo_url}
                  alt=""
                  className="mx-auto mt-4 h-24 w-24 rounded-full object-cover border-4 border-[#D4AF37] shadow-md"
                />
                <h3 className="mt-3 text-lg font-black text-white">{podium[0].display_name}</h3>
                <p className="text-xs text-[#D4AF37] font-semibold">{podium[0].country} • {podium[0].votes} points</p>
              </div>
              <Link
                href={`/africa-awards/candidates/${podium[0].id}`}
                className="mt-4 inline-block text-xs font-bold text-[#D4AF37] hover:underline"
              >
                Voir le profil →
              </Link>
            </div>

            {/* 3ème place */}
            <div className="rounded-2xl border border-white/10 bg-[#16161D] p-6 text-center order-3 md:order-3 flex flex-col justify-between">
              <div>
                <span className="inline-block rounded-full bg-amber-900/40 px-3 py-1 text-xs font-black text-amber-500">
                  🥉 3ème Place
                </span>
                <img
                  src={podium[2].photo_url}
                  alt=""
                  className="mx-auto mt-4 h-20 w-20 rounded-full object-cover border-2 border-amber-700"
                />
                <h3 className="mt-3 text-base font-black text-white">{podium[2].display_name}</h3>
                <p className="text-xs text-[#A8A6A0]">{podium[2].country} • {podium[2].votes} points</p>
              </div>
              <Link
                href={`/africa-awards/candidates/${podium[2].id}`}
                className="mt-4 inline-block text-xs font-bold text-[#D4AF37] hover:underline"
              >
                Voir le profil →
              </Link>
            </div>
          </div>
        )}

        {/* TABLEAU DES SCORES & CANDIDATS */}
        <div className="mt-12 grid lg:grid-cols-2 gap-8">
          <div className="bg-[#16161D] border border-white/10 rounded-2xl p-6">
            <h2 className="font-bold text-[18px]">🏆 Top 10 Candidats en Tête</h2>
            <div className="mt-4 space-y-2">
              {topCandidates.map((c: any, i: number) => (
                <Link
                  key={c.id}
                  href={`/africa-awards/candidates/${c.id}`}
                  className="flex items-center justify-between bg-[#0B0B0F] border border-white/5 rounded-xl p-3 hover:border-[#D4AF37]/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-black w-6 text-center ${i < 3 ? "text-[#D4AF37]" : "text-white/40"}`}>
                      {i + 1}
                    </span>
                    <img src={c.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />
                    <div>
                      <span className="font-bold text-[13px] block text-white">{c.display_name}</span>
                      <span className="text-[10px] text-zinc-500">{c.country}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-[#D4AF37]">{c.votes} pts</span>
                    <span className="block text-[10px] text-zinc-500 uppercase">{c.status || "qualifié"}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#16161D] border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-[16px]">🔥 Compétitions les Plus Actives</h3>
              <div className="mt-3 space-y-2">
                {topCompetitions.map((comp: any, i: number) => (
                  <Link
                    key={comp.id}
                    href={`/africa-awards/competitions/${comp.slug}`}
                    className="flex items-center justify-between rounded-xl bg-[#0B0B0F] p-3 text-xs border border-white/5 hover:border-[#D4AF37]/30 transition"
                  >
                    <div>
                      <span className="font-bold text-white block">{i + 1}. {comp.title}</span>
                      <span className="text-[10px] text-zinc-500">{comp.category}</span>
                    </div>
                    <span className="text-[#D4AF37] font-mono font-bold">
                      {(comp.votes_count || 0).toLocaleString("fr-FR")} votes
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-[#16161D] border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-[16px]">🌍 Répartition par Pays Phares</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                {["Bénin (BJ)", "Côte d'Ivoire (CI)", "Sénégal (SN)", "Nigéria (NG)", "Cameroun (CM)", "Togo (TG)"].map((country, i) => (
                  <div key={country} className="flex justify-between bg-[#0B0B0F] rounded-lg p-2.5 border border-white/5">
                    <span className="text-zinc-300 font-medium">{country}</span>
                    <span className="text-[#D4AF37] font-bold">Top {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
