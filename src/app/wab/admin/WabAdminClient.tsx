"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Post = { id: string; author: string; content: string; moderationStatus: string };
type Report = { id: string; targetType: string; reason: string; status: string };
type Profile = { id: string; fullName: string; headline: string; status: string };
type Reward = { id: string; type: string; threshold: number; amount: number; status: string };

type Salon = {
  id: string;
  host: string;
  title: string;
  theme?: string;
  status: string;
  participants?: number;
  startsAt: string;
  salesModeEnabled?: boolean;
};

type LiveReport = {
  id: string;
  salonId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
};

type Withdrawal = {
  id: string;
  userId: string;
  amountXof: number;
  operator?: string;
  phoneOrAccount: string;
  status: string;
  requestedAt: string;
};

type LiveSettings = {
  coinRateXof: number;
  giftCommissionRate: number;
  salesCommissionRate: number;
  minWithdrawalXof: number;
  retentionDaysReplay: number;
};

export default function WabAdminClient() {
  const [tab, setTab] = useState("salons");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // WAB standard state
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);

  // Salons & Directs state (PRD Lot 6)
  const [liveSalons, setLiveSalons] = useState<Salon[]>([]);
  const [allSalons, setAllSalons] = useState<Salon[]>([]);
  const [liveReports, setLiveReports] = useState<LiveReport[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [settings, setSettings] = useState<LiveSettings>({
    coinRateXof: 10,
    giftCommissionRate: 0.3,
    salesCommissionRate: 0.1,
    minWithdrawalXof: 5000,
    retentionDaysReplay: 30,
  });

  const loadData = async () => {
    try {
      // 1. Charger données WAB classiques
      const resWab = await fetch("/api/wab/admin");
      if (resWab.ok) {
        const dataWab = await resWab.json();
        setPosts(dataWab.posts || []);
        setReports(dataWab.reports || []);
        setProfiles(dataWab.profiles || []);
        setRewards(dataWab.rewards || []);
      }

      // 2. Charger données Salons & Directs
      const resSalons = await fetch("/api/admin/salons");
      if (resSalons.ok) {
        const dataSalons = await resSalons.json();
        setLiveSalons(dataSalons.liveSalons || []);
        setAllSalons(dataSalons.salons || []);
        setLiveReports(dataSalons.reports || []);
        setWithdrawals(dataSalons.withdrawals || []);
        if (dataSalons.settings) setSettings(dataSalons.settings);
      }
    } catch (err: any) {
      setError(err?.message || "Accès administrateur requis.");
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function update(targetType: string, targetId: string, status: string) {
    const response = await fetch("/api/wab/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, status }),
    });
    if (!response.ok) {
      setError("Mise à jour impossible.");
      return;
    }
    if (targetType === "post") setPosts((items) => items.map((item) => (item.id === targetId ? { ...item, moderationStatus: status } : item)));
    if (targetType === "report") setReports((items) => items.map((item) => (item.id === targetId ? { ...item, status } : item)));
    if (targetType === "profile") setProfiles((items) => items.map((item) => (item.id === targetId ? { ...item, status } : item)));
    if (targetType === "reward") setRewards((items) => items.map((item) => (item.id === targetId ? { ...item, status } : item)));
  }

  // Action Admin: Arrêt forcé d'un live (PRD Section 3.3)
  const handleForceStopLive = async (salonId: string) => {
    if (!confirm("Voulez-vous vraiment forcer l'arrêt immédiat de ce salon en direct ?")) return;
    try {
      const res = await fetch("/api/admin/salons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "force_stop_salon",
          salonId,
          reason: "Intervention administrative",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Salon interrompu avec succès.");
        loadData();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        alert(data.error || "Échec de l'arrêt forcé.");
      }
    } catch (err: any) {
      alert(err?.message || "Erreur.");
    }
  };

  // Action Admin: Traitement signalement live
  const handleResolveLiveReport = async (reportId: string, decision: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/admin/salons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "handle_report",
          reportId,
          decision,
          banTarget: decision === "approved",
        }),
      });
      if (res.ok) {
        loadData();
      }
    } catch {}
  };

  // Action Admin: Traitement demande de retrait
  const handleProcessWithdrawal = async (withdrawalId: string, decision: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/admin/salons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "handle_withdrawal",
          withdrawalId,
          decision,
        }),
      });
      if (res.ok) {
        loadData();
      }
    } catch {}
  };

  // Action Admin: Sauvegarde paramètres globaux
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/salons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_settings",
          settings,
        }),
      });
      if (res.ok) {
        setSuccess("Paramètres des Salons WAB mis à jour !");
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {}
  };

  const tabs = [
    { id: "salons", label: "🔴 Salons & Directs (Lives)" },
    { id: "posts", label: "Publications" },
    { id: "reports", label: "Signalements Feed" },
    { id: "profiles", label: "Comptes WAB" },
    { id: "rewards", label: "Récompenses" },
  ];

  return (
    <main className="min-h-screen bg-[#f4f7f8] py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#087e8b]">
              World Africa Business · Back-Office
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#082843]">
              Supervision & Modération WAB
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Pilotage des Salons en direct, des flux shopping, de la modération et des retraits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/salons"
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <span className="material-symbols-outlined text-base">visibility</span>
              <span>Voir le Hub Salons</span>
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#082843] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
            >
              <span>Dashboard Général →</span>
            </Link>
          </div>
        </div>

        {success && (
          <div className="mt-5 rounded-2xl bg-emerald-500/10 border border-emerald-400 p-4 text-emerald-800 text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}

        {/* Barre d'onglets */}
        <div className="mt-7 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition shadow-sm ${
                tab === item.id ? "bg-[#082843] text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ======================================================== */}
        {/* ONGLET SALONS & DIRECTS (PRD LOT 6 SECTION 11.1)          */}
        {/* ======================================================== */}
        {tab === "salons" && (
          <div className="mt-6 space-y-8">
            {/* 1. Salons actuellement en direct */}
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  <h2 className="font-display text-lg font-black text-[#082843]">
                    Salons en Direct Actuellement ({liveSalons.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={loadData}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>Actualiser</span>
                </button>
              </div>

              {liveSalons.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">tv_off</span>
                  <p>Aucun salon en direct n'est actif pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveSalons.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase">
                            LIVE
                          </span>
                          <strong className="text-sm text-[#082843] truncate">{s.title}</strong>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Hôte : <strong>{s.host}</strong> · Thème : <strong>{s.theme || "Networking"}</strong> · Spectateurs :{" "}
                          <strong>{s.participants || 1}</strong>
                          {s.salesModeEnabled && (
                            <span className="ml-2 text-purple-600 font-bold">🛍️ Mode Vente Actif</span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/salons/${s.id}`}
                          target="_blank"
                          className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                        >
                          Rejoindre
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleForceStopLive(s.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow transition active:scale-95 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">stop_circle</span>
                          <span>Arrêt forcé</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 2. File de Modération & Signalements Live */}
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
              <h2 className="font-display text-lg font-black text-[#082843] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">warning</span>
                <span>Signalements en Attente ({liveReports.filter((r) => r.status === "pending").length})</span>
              </h2>

              <div className="space-y-3">
                {liveReports.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Aucun signalement de salon enregistré.</p>
                ) : (
                  liveReports.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            {r.targetType}
                          </span>
                          <span className="text-xs text-slate-400">Salon ID : {r.salonId}</span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {r.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 font-bold mt-1.5">{r.reason}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Signalé le {new Date(r.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      {r.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleResolveLiveReport(r.id, "approved")}
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow transition"
                          >
                            Sanctionner & Bannir
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveLiveReport(r.id, "rejected")}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                          >
                            Classer sans suite
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 3. Validation des Demandes de Retrait Créateurs */}
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
              <h2 className="font-display text-lg font-black text-[#082843] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">account_balance_wallet</span>
                <span>Demandes de Retrait Créateurs ({withdrawals.filter((w) => w.status === "pending").length})</span>
              </h2>

              <div className="space-y-3">
                {withdrawals.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Aucune demande de retrait en attente.</p>
                ) : (
                  withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-[#082843]">
                            {w.amountXof.toLocaleString("fr-FR")} XOF
                          </strong>
                          <span className="text-xs text-slate-600 font-bold">
                            via {w.operator || "Mobile Money"} ({w.phoneOrAccount})
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              w.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : w.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {w.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Créateur ID: {w.userId} · Date : {new Date(w.requestedAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>

                      {w.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleProcessWithdrawal(w.id, "approved")}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow transition"
                          >
                            Valider le versement
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProcessWithdrawal(w.id, "rejected")}
                            className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition"
                          >
                            Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 4. Configuration Globale des Salons WAB */}
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
              <h2 className="font-display text-lg font-black text-[#082843] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600">tune</span>
                <span>Paramètres Économiques des Salons & Coins</span>
              </h2>

              <form onSubmit={handleSaveSettings} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Valeur d'un Coin (XOF) :
                  </label>
                  <input
                    type="number"
                    value={settings.coinRateXof}
                    onChange={(e) => setSettings({ ...settings, coinRateXof: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Commission Cadeaux (%) :
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={Math.round(settings.giftCommissionRate * 100)}
                    onChange={(e) => setSettings({ ...settings, giftCommissionRate: Number(e.target.value) / 100 })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Plateforme (ex: 30% / Créateur 70%)</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Commission Live Shopping (%) :
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={Math.round(settings.salesCommissionRate * 100)}
                    onChange={(e) => setSettings({ ...settings, salesCommissionRate: Number(e.target.value) / 100 })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Commission sur ventes marketplace</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Seuil minimum de retrait (XOF) :
                  </label>
                  <input
                    type="number"
                    value={settings.minWithdrawalXof}
                    onChange={(e) => setSettings({ ...settings, minWithdrawalXof: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow transition active:scale-95"
                  >
                    Sauvegarder les Paramètres
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* AUTRES ONGLETS WAB CLASSIQUES                             */}
        {/* ======================================================== */}
        {tab === "posts" && (
          <section className="mt-5 space-y-3">
            {posts.map((post) => (
              <article key={post.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <strong>{post.author}</strong>
                <p className="mt-2 text-sm text-slate-600">{post.content}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                    {post.moderationStatus}
                  </span>
                  {["published", "hidden", "rejected"].map((status) => (
                    <button
                      key={status}
                      onClick={() => update("post", post.id, status)}
                      className="text-xs font-bold text-[#087e8b]"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}

        {tab === "reports" && (
          <section className="mt-5 space-y-3">
            {reports.map((report) => (
              <article key={report.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <strong>Signalement {report.targetType}</strong>
                <p className="mt-2 text-sm text-slate-600">{report.reason}</p>
                <div className="mt-4 flex gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{report.status}</span>
                  {["reviewing", "resolved", "dismissed"].map((status) => (
                    <button
                      key={status}
                      onClick={() => update("report", report.id, status)}
                      className="text-xs font-bold text-[#087e8b]"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}

        {tab === "profiles" && (
          <section className="mt-5 space-y-3">
            {profiles.map((profile) => (
              <article key={profile.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <strong>{profile.fullName}</strong>
                <p className="mt-1 text-sm text-slate-600">{profile.headline}</p>
                <div className="mt-4 flex gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{profile.status}</span>
                  {["active", "silent", "banned"].map((status) => (
                    <button
                      key={status}
                      onClick={() => update("profile", profile.id, status)}
                      className="text-xs font-bold text-[#087e8b]"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}

        {tab === "rewards" && (
          <section className="mt-5 space-y-3">
            {rewards.map((reward) => (
              <article key={reward.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <strong>
                  {reward.type === "views_1000" ? "1 000 vues éligibles" : "3 000 minutes vidéo"}
                </strong>
                <p className="mt-1 text-sm text-slate-600">
                  Palier n° {reward.threshold} · {reward.amount.toLocaleString("fr-FR")} XOF
                </p>
                <div className="mt-4 flex gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{reward.status}</span>
                  {["validated", "rejected", "paid"].map((status) => (
                    <button
                      key={status}
                      onClick={() => update("reward", reward.id, status)}
                      className="text-xs font-bold text-[#087e8b]"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
