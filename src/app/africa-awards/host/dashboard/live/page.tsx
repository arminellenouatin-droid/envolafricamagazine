"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SvgIcon from "@/components/ui/Icon";

type Competition = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  status?: string;
  isLive?: boolean;
  startDate?: string;
  endDate?: string;
  potAmount?: number;
  totalVotes?: number;
};

export default function HostLiveConsoleHubPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/awards/competitions")
      .then((r) => (r.ok ? r.json() : { competitions: [] }))
      .then((data) => {
        const list = Array.isArray(data.competitions) ? data.competitions : (data.items || []);
        setCompetitions(list);
      })
      .catch(() => setCompetitions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#07131e] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#d4af37]">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Régie Live Animateur & Jury
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-white">
              Studio Direct Africa Awards
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Sélectionnez une compétition pour lancer ou piloter le direct, animer la scène et modérer les passages.
            </p>
          </div>
          <Link
            href="/africa-awards"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
          >
            ← Retour au portail Awards
          </Link>
        </div>

        {/* Live Active Notice */}
        <div className="mt-8 rounded-2xl border border-[#d4af37]/30 bg-gradient-to-r from-[#d4af37]/10 via-[#0a2337] to-[#07131e] p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-[#d4af37] px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#07131e]">
                Direct Panafricain Agora RTC
              </span>
              <h2 className="mt-2 text-lg font-bold text-white">
                Régie multi-caméras, passage sur scène et vote en direct
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                La régie permet à l&apos;animateur de couper/activer les micros, inviter des nominés sur scène, épingler des messages et suivre la cagnotte en temps réel.
              </p>
            </div>
          </div>
        </div>

        {/* Competition List */}
        <div className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Compétitions disponibles pour la régie
          </h3>

          {loading ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-sm text-slate-400">
              Chargement des compétitions…
            </div>
          ) : competitions.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
              <SvgIcon name="podcasts" className="mx-auto h-12 w-12 text-slate-500" />
              <p className="mt-3 text-base font-bold text-white">Aucune compétition active trouvée</p>
              <p className="mt-1 text-xs text-slate-400">
                Lancez une session de démonstration ou créez une compétition depuis l&apos;espace organisateur.
              </p>
              <Link
                href="/africa-awards/host/dashboard/live/demo"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#d4af37] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#07131e] hover:bg-[#e5c04b] transition shadow-lg"
              >
                Ouvrir le Studio Démo Live →
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {competitions.map((comp) => {
                const targetId = comp.id || comp.slug || "main";
                return (
                  <div
                    key={comp.id}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-[#d4af37]/50 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#d4af37]">
                          {comp.category || "Compétition Officielle"}
                        </span>
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                          {comp.status || "Ouverte"}
                        </span>
                      </div>
                      <h4 className="mt-2 text-base font-bold text-white">{comp.title}</h4>
                      <p className="mt-1 text-xs text-slate-400">
                        Total votes : {Number(comp.totalVotes || 0).toLocaleString()} · Cagnotte : {Number(comp.potAmount || 0).toLocaleString()} XOF
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                      <Link
                        href={`/africa-awards/host/dashboard/live/${encodeURIComponent(targetId)}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#07131e] hover:bg-[#e5c04b] transition"
                      >
                        <SvgIcon name="podcasts" className="w-4 h-4" />
                        Accéder à la régie
                      </Link>
                      <Link
                        href={`/africa-awards/competitions/${encodeURIComponent(comp.slug || comp.id)}`}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Voir la fiche →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
