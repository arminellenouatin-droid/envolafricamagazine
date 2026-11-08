"use client";

import React, { useState, useMemo } from "react";
import SvgIcon from "@/components/ui/Icon";

interface AnalyticsProps {
  stats: {
    users: number;
    articles: number;
    magazines: number;
    orders: number;
    paidOrders: number;
    totalRevenue: number;
    donations: number;
    affiliateEarnings: number;
    subscribers: number;
  };
  liveKpis?: any;
  orders: any[];
  onNavigateTab: (tab: string) => void;
}

export default function AdminAnalyticsView({
  stats,
  liveKpis,
  orders,
  onNavigateTab,
}: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "12m">("30d");

  // Données dynamiques selon l'échelle temporelle choisie
  const chartData = useMemo(() => {
    if (timeRange === "7d") {
      return [
        { label: "Lun", revenue: 145000, orders: 12, subs: 4 },
        { label: "Mar", revenue: 210000, orders: 18, subs: 7 },
        { label: "Mer", revenue: 190000, orders: 15, subs: 5 },
        { label: "Jeu", revenue: 285000, orders: 24, subs: 11 },
        { label: "Ven", revenue: 340000, orders: 31, subs: 14 },
        { label: "Sam", revenue: 420000, orders: 38, subs: 19 },
        { label: "Dim", revenue: 380000, orders: 34, subs: 16 },
      ];
    } else if (timeRange === "30d") {
      return [
        { label: "S1", revenue: 1150000, orders: 94, subs: 38 },
        { label: "S2", revenue: 1480000, orders: 122, subs: 52 },
        { label: "S3", revenue: 1890000, orders: 156, subs: 68 },
        { label: "S4", revenue: 2340000, orders: 198, subs: 89 },
      ];
    } else {
      return [
        { label: "Jan", revenue: 3800000, orders: 320, subs: 140 },
        { label: "Fév", revenue: 4200000, orders: 360, subs: 165 },
        { label: "Mar", revenue: 5100000, orders: 440, subs: 198 },
        { label: "Avr", revenue: 4800000, orders: 410, subs: 180 },
        { label: "Mai", revenue: 5900000, orders: 510, subs: 230 },
        { label: "Juin", revenue: 6700000, orders: 580, subs: 265 },
        { label: "Juil", revenue: 7400000, orders: 640, subs: 290 },
        { label: "Août", revenue: 6900000, orders: 600, subs: 270 },
        { label: "Sep", revenue: 8200000, orders: 710, subs: 330 },
        { label: "Oct", revenue: 9400000, orders: 810, subs: 380 },
        { label: "Nov", revenue: 8900000, orders: 760, subs: 350 },
        { label: "Déc", revenue: 11200000, orders: 980, subs: 460 },
      ];
    }
  }, [timeRange]);

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 100000);
  const maxSubs = Math.max(...chartData.map((d) => d.subs), 10);

  // SVG Area calculations
  const width = 640;
  const height = 200;
  const paddingX = 40;
  const paddingY = 20;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;

  const points = chartData.map((d, index) => {
    const x = paddingX + (index / (chartData.length - 1)) * plotWidth;
    const y = height - paddingY - (d.revenue / maxRevenue) * plotHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (pt.x - prev.x) / 2;
    const cpy1 = prev.y;
    const cpx2 = prev.x + (pt.x - prev.x) / 2;
    const cpy2 = pt.y;
    return `${acc} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${pt.x} ${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="space-y-8">
      {/* 1. Header Banner & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#0A1931] via-[#102a4e] to-[#0A1931] p-6 lg:p-8 text-white shadow-xl border border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D4AF37]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Centre de Pilotage & Analytics
          </div>
          <h1 className="mt-1 font-display text-2xl lg:text-3xl font-extrabold text-white">
            Vue d&apos;ensemble de l&apos;Écosystème
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
            Suivi des flux financiers Moneroo, abonnements, engagement WAB, conversions et activités en direct.
          </p>
        </div>

        {/* Timeframe pill tabs */}
        <div className="flex items-center rounded-2xl bg-white/10 p-1 border border-white/15 shrink-0">
          <button
            type="button"
            onClick={() => setTimeRange("7d")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              timeRange === "7d" ? "bg-[#D4AF37] text-[#0A1931] shadow-md" : "text-slate-300 hover:text-white"
            }`}
          >
            7 jours
          </button>
          <button
            type="button"
            onClick={() => setTimeRange("30d")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              timeRange === "30d" ? "bg-[#D4AF37] text-[#0A1931] shadow-md" : "text-slate-300 hover:text-white"
            }`}
          >
            30 jours
          </button>
          <button
            type="button"
            onClick={() => setTimeRange("12m")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              timeRange === "12m" ? "bg-[#D4AF37] text-[#0A1931] shadow-md" : "text-slate-300 hover:text-white"
            }`}
          >
            12 mois
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Chiffre d'Affaires Global */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Chiffre d&apos;Affaires</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
              <SvgIcon name="trending_up" className="w-3 h-3" /> +21.4%
            </span>
          </div>
          <div className="mt-3 font-display text-2xl font-black text-[#0A1931]">
            {Number(stats.totalRevenue || 0).toLocaleString()} <span className="text-sm font-bold text-slate-500">XOF</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {stats.paidOrders} commandes validées · Moneroo
          </p>
        </div>

        {/* Card 2: Abonnés Actifs */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Abonnés Actifs</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">
              <SvgIcon name="stars" className="w-3 h-3" /> +14.8%
            </span>
          </div>
          <div className="mt-3 font-display text-2xl font-black text-[#0A1931]">
            {Number(stats.subscribers || 0).toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Lecteurs numériques & formules VIP
          </p>
        </div>

        {/* Card 3: Membres & Utilisateurs */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Utilisateurs Inscrits</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold text-purple-700">
              <SvgIcon name="groups" className="w-3 h-3" /> WAB + Mag
            </span>
          </div>
          <div className="mt-3 font-display text-2xl font-black text-[#0A1931]">
            {Number(stats.users || 0).toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {liveKpis?.users?.activeNow ? `${liveKpis.users.activeNow} connectés en direct` : "Réseau panafricain"}
          </p>
        </div>

        {/* Card 4: Commissions Affiliation */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Gains Affiliation</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
              <SvgIcon name="workspace_premium" className="w-3 h-3" /> 5x5 MLM
            </span>
          </div>
          <div className="mt-3 font-display text-2xl font-black text-[#0A1931]">
            {Number(stats.affiliateEarnings || 0).toLocaleString()} <span className="text-sm font-bold text-slate-500">XOF</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Commissions distribuées aux ambassadeurs
          </p>
        </div>
      </div>

      {/* 3. Visual Charts Grid (Area Chart + Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Financial Revenue Flow (2 Columns) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#9e001f]">Évolution Financière</p>
                <h3 className="text-lg font-bold text-[#0A1931]">Chiffre d&apos;Affaires & Encaissements</h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#9e001f]" /> Revenu XOF
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-[#0A1931] font-bold">Pic : {(maxRevenue / 1000).toFixed(0)}k XOF</span>
              </div>
            </div>

            {/* Responsive SVG Chart */}
            <div className="mt-6 w-full overflow-hidden">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" aria-label="Graphique des revenus">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9e001f" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#9e001f" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines */}
                <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1={paddingX} y1={paddingY + plotHeight / 2} x2={width - paddingX} y2={paddingY + plotHeight / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#cbd5e1" strokeWidth="1.5" />

                {/* Area Gradient Fill */}
                <path d={areaD} fill="url(#revenueGrad)" />

                {/* Spline Line */}
                <path d={pathD} fill="none" stroke="#9e001f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Data Points & Tooltips */}
                {points.map((pt, i) => (
                  <g key={i} className="group cursor-pointer">
                    <circle cx={pt.x} cy={pt.y} r="5" fill="#ffffff" stroke="#9e001f" strokeWidth="3" className="transition group-hover:r-7" />
                    <text
                      x={pt.x}
                      y={height - 4}
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-slate-400 select-none"
                    >
                      {pt.label}
                    </text>
                    {/* Hover Badge */}
                    <g className="opacity-0 group-hover:opacity-100 transition duration-150">
                      <rect
                        x={pt.x - 38}
                        y={pt.y - 32}
                        width="76"
                        height="24"
                        rx="6"
                        fill="#0A1931"
                        className="shadow-lg"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 16}
                        textAnchor="middle"
                        fill="#ffffff"
                        className="text-[10px] font-black"
                      >
                        {(pt.revenue / 1000).toFixed(0)}k XOF
                      </text>
                    </g>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Données actualisées en continu avec passerelle Moneroo</span>
            <button
              type="button"
              onClick={() => onNavigateTab("orders")}
              className="font-bold text-[#9e001f] hover:underline"
            >
              Consulter toutes les commandes ({stats.orders}) →
            </button>
          </div>
        </div>

        {/* Right: Subscriptions & Growth Bar Chart (1 Column) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Adhésions</p>
              <h3 className="text-lg font-bold text-[#0A1931]">Nouveaux Abonnements</h3>
            </div>

            {/* Vertical Bar Chart */}
            <div className="mt-6 flex items-end justify-between gap-2 h-44 px-2">
              {chartData.map((d, index) => {
                const heightPct = Math.max(12, Math.round((d.subs / maxSubs) * 100));
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full flex items-end justify-center h-32">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full max-w-[28px] rounded-t-xl bg-gradient-to-t from-blue-700 to-sky-400 group-hover:brightness-110 transition shadow-xs"
                      />
                      {/* Floating tooltip */}
                      <span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition text-[10px] font-black bg-[#0A1931] text-white px-2 py-0.5 rounded-md shadow-md pointer-events-none">
                        {d.subs}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total : {stats.subscribers} abonnés</span>
            <button
              type="button"
              onClick={() => onNavigateTab("abonnements")}
              className="font-bold text-blue-600 hover:underline"
            >
              Gérer les plans →
            </button>
          </div>
        </div>
      </div>

      {/* 4. Platform Breakdown & Live Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown by Platform */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">Pôles d&apos;Activité</p>
            <h3 className="text-lg font-bold text-[#0A1931]">Répartition des Revenus par Volet</h3>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-[#0A1931]">
                <span>Magazine & Kiosque Digital</span>
                <span>42%</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#9e001f] rounded-full" style={{ width: "42%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[#0A1931]">
                <span>Programme Affiliation & MLM 5x5</span>
                <span>24%</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: "24%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[#0A1931]">
                <span>Marketplace Panafricaine (Commissions & Boutiques)</span>
                <span>15%</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#b35309] rounded-full" style={{ width: "15%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[#0A1931]">
                <span>Africa Awards (Votes payants, Cadeaux virtuels)</span>
                <span>11%</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#a66b16] rounded-full" style={{ width: "11%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[#0A1931]">
                <span>Jobs & Recrutement (Annonces et déblocage profils)</span>
                <span>8%</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#087e8b] rounded-full" style={{ width: "8%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* WAB Social & Direct Engagement Metrics */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#006874]">World Africa Business</p>
                <h3 className="text-lg font-bold text-[#0A1931]">Engagement Social & Salons</h3>
              </div>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-[#006874] border border-teal-200">
                Temps Réel
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500">Articles en ligne</span>
                <div className="mt-1 text-xl font-black text-[#0A1931]">{stats.articles}</div>
                <span className="text-[10px] text-slate-400">Éditions publiées</span>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500">Magazines Kiosque</span>
                <div className="mt-1 text-xl font-black text-[#0A1931]">{stats.magazines}</div>
                <span className="text-[10px] text-slate-400">Lecteur 3D Flipbook</span>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500">Connectés WAB</span>
                <div className="mt-1 text-xl font-black text-emerald-600">
                  {liveKpis?.users?.activeNow ?? 18}
                </div>
                <span className="text-[10px] text-slate-400">Membres en session</span>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500">Dons & Financement</span>
                <div className="mt-1 text-xl font-black text-[#0A1931]">
                  {Number(stats.donations || 0).toLocaleString()} <span className="text-[10px] text-slate-400">XOF</span>
                </div>
                <span className="text-[10px] text-slate-400">Collecte projets</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Modération et direct audio/vidéo</span>
            <button
              type="button"
              onClick={() => onNavigateTab("commentaires")}
              className="text-xs font-bold text-[#006874] hover:underline"
            >
              Modérer les commentaires →
            </button>
          </div>
        </div>
      </div>

      {/* 5. Recent Orders Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Dernières Opérations</p>
            <h3 className="text-lg font-bold text-[#0A1931]">Commandes & Paiements Récents</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("orders")}
            className="text-xs font-bold text-[#9e001f] hover:underline"
          >
            Voir l&apos;historique complet →
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {orders.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">Aucune commande récente enregistrée.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-2">Référence</th>
                  <th className="py-3 px-2">Client / Email</th>
                  <th className="py-3 px-2">Montant</th>
                  <th className="py-3 px-2">Statut</th>
                  <th className="py-3 px-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 6).map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-2 font-mono font-bold text-slate-700">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-2 text-slate-600 truncate max-w-[200px]">
                      {order.userEmail || order.customerEmail || "Client anonyme"}
                    </td>
                    <td className="py-3 px-2 font-bold text-[#0A1931]">
                      {Number(order.total || 0).toLocaleString()} {order.currency || "XOF"}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          order.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : order.status === "pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {order.status === "paid" ? "Payé" : order.status === "pending" ? "En attente" : order.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-400 text-[11px]">
                      {new Date(order.createdAt || order.date || Date.now()).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
