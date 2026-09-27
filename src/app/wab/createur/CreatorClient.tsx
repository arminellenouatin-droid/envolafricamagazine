"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Reward = {
  id: string;
  type: string;
  threshold: number;
  amount: number;
  status: string;
  createdAt: string;
};

type CreatorWallet = {
  userId: string;
  availableXof: number;
  pendingXof: number;
  totalEarnedXof: number;
  totalCoinsReceived: number;
  updatedAt: string;
};

type WithdrawalRequest = {
  id: string;
  amountXof: number;
  paymentMethod: string;
  operator?: string;
  phoneOrAccount: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  processedAt?: string;
};

export default function CreatorClient() {
  const [activeTab, setActiveTab] = useState<"lives" | "content">("lives");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [wallet, setWallet] = useState<CreatorWallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [minWithdrawalXof, setMinWithdrawalXof] = useState<number>(5000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal Retrait
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(5000);
  const [operator, setOperator] = useState<string>("MTN Mobile Money");
  const [phone, setPhone] = useState<string>("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Charger récompenses de contenu
      const resRewards = await fetch("/api/wab/rewards");
      if (resRewards.status === 401) {
        window.location.assign(`/auth/login?next=${encodeURIComponent("/wab/createur")}`);
        return;
      }
      const dataRewards = await resRewards.json().catch(() => ({}));
      if (dataRewards) {
        setRewards(dataRewards.rewards ?? []);
        setTotals(dataRewards.totals ?? {});
      }

      // 2. Charger portefeuille lives & retraits
      const resWallet = await fetch("/api/wab/creator/wallet");
      if (resWallet.ok) {
        const dataWallet = await resWallet.json().catch(() => ({}));
        if (dataWallet.wallet) setWallet(dataWallet.wallet);
        if (dataWallet.withdrawals) setWithdrawals(dataWallet.withdrawals);
        if (dataWallet.minWithdrawalXof) setMinWithdrawalXof(dataWallet.minWithdrawalXof);
      }
    } catch {
      setError("Impossible de charger les données créateur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      alert("Veuillez renseigner votre numéro de téléphone ou de compte.");
      return;
    }
    if (withdrawAmount < minWithdrawalXof) {
      alert(`Le montant minimum de retrait est de ${minWithdrawalXof.toLocaleString("fr-FR")} XOF.`);
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const res = await fetch("/api/wab/creator/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountXof: withdrawAmount,
          paymentMethod: "mobile_money",
          operator,
          phoneOrAccount: phone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Échec de la demande de retrait.");
        return;
      }

      setWithdrawSuccess("Votre demande de retrait a été transmise à l'administration WAB !");
      setShowWithdrawModal(false);
      setPhone("");
      loadData();
      setTimeout(() => setWithdrawSuccess(null), 5000);
    } catch (err: any) {
      alert(err?.message || "Erreur de transmission.");
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const amount = (key: string) => `${(totals[key] ?? 0).toLocaleString("fr-FR")} XOF`;

  return (
    <main className="min-h-screen bg-[#f4f7f8] py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#087e8b]">
              World Africa Business · Espace Créateurs
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#082843]">
              Mon Studio de Monétisation
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Gérez vos revenus générés par vos Salons en direct et vos publications WAB.
            </p>
          </div>

          <Link
            href="/salons"
            className="inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-red-600 to-[#9e001f] px-5 py-2.5 text-xs font-black text-white shadow-md hover:opacity-90 active:scale-95 transition"
          >
            <span className="material-symbols-outlined text-base">podium</span>
            <span>Lancer un Salon Live</span>
          </Link>
        </div>

        {withdrawSuccess && (
          <div className="mt-5 rounded-2xl bg-emerald-500/10 border border-emerald-400 p-4 text-emerald-800 text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>{withdrawSuccess}</span>
          </div>
        )}

        {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}

        {/* Onglets de navigation */}
        <div className="mt-6 flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("lives")}
            className={`pb-3 px-4 font-display font-black text-sm transition relative ${
              activeTab === "lives"
                ? "text-[#082843] border-b-2 border-red-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            🔴 Salons en Direct & Cadeaux
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`pb-3 px-4 font-display font-black text-sm transition relative ${
              activeTab === "content"
                ? "text-[#082843] border-b-2 border-[#087e8b]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            📊 Récompenses Vidéos & Vues
          </button>
        </div>

        {/* ======================================================== */}
        {/* ONGLET 1 : REVENUS DES SALONS EN DIRECT                   */}
        {/* ======================================================== */}
        {activeTab === "lives" && (
          <div className="mt-6 space-y-6">
            {/* Grille des Soldes & Retrait */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 relative">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Solde Disponible
                </span>
                <p className="mt-2 text-2xl font-black text-emerald-600">
                  {(wallet?.availableXof || 0).toLocaleString("fr-FR")} XOF
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawAmount(Math.max(wallet?.availableXof || minWithdrawalXof, minWithdrawalXof));
                    setShowWithdrawModal(true);
                  }}
                  disabled={!wallet || wallet.availableXof < minWithdrawalXof}
                  className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 text-white font-black text-xs shadow transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">payments</span>
                  <span>Demander un retrait</span>
                </button>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  En Attente de Validation
                </span>
                <p className="mt-2 text-2xl font-black text-amber-500">
                  {(wallet?.pendingXof || 0).toLocaleString("fr-FR")} XOF
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Validation administrative sous 24-48h
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Total Cumulé des Gains
                </span>
                <p className="mt-2 text-2xl font-black text-[#082843]">
                  {(wallet?.totalEarnedXof || 0).toLocaleString("fr-FR")} XOF
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Part nette versée aux créateurs (70%)
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Coins WAB Reçus
                </span>
                <p className="mt-2 text-2xl font-black text-amber-600 flex items-center gap-1.5">
                  <span>🪙</span>
                  <span>{(wallet?.totalCoinsReceived || 0).toLocaleString("fr-FR")}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Cadeaux virtuels offerts par vos spectateurs
                </p>
              </div>
            </div>

            {/* Historique des Retraits */}
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
              <h2 className="font-display text-lg font-black text-[#082843] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">receipt_long</span>
                <span>Historique des demandes de retrait</span>
              </h2>

              <div className="space-y-3">
                {withdrawals.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">account_balance_wallet</span>
                    <p>Aucune demande de retrait effectuée pour le moment.</p>
                  </div>
                ) : (
                  withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-800 text-sm">
                            {w.operator || "Mobile Money"} ({w.phoneOrAccount})
                          </strong>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              w.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : w.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {w.status === "approved"
                              ? "Payé"
                              : w.status === "rejected"
                              ? "Refusé"
                              : "En cours"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Demandé le {new Date(w.requestedAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      <div className="text-right">
                        <strong className="text-base font-black text-[#082843]">
                          {w.amountXof.toLocaleString("fr-FR")} XOF
                        </strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 2 : RÉCOMPENSES CONTENU & PALIERS                   */}
        {/* ======================================================== */}
        {activeTab === "content" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                ["En attente", "pending_review"],
                ["Validées", "validated"],
                ["Payées", "paid"],
                ["Refusées", "rejected"],
              ].map(([label, status]) => (
                <div key={status} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-2 text-xl font-extrabold text-[#082843]">{amount(status)}</p>
                </div>
              ))}
            </div>

            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
              <h2 className="font-display text-lg font-black text-[#082843]">Historique des Paliers</h2>
              <div className="mt-4 space-y-3">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100"
                  >
                    <div>
                      <strong>
                        {reward.type === "views_1000"
                          ? "Palier 1 000 vues"
                          : "Palier 3 000 minutes vidéo"}
                      </strong>
                      <p className="text-xs text-slate-500">
                        Palier n° {reward.threshold} ·{" "}
                        {new Date(reward.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <strong className="text-[#087e8b]">
                        {reward.amount.toLocaleString("fr-FR")} XOF
                      </strong>
                      <span className="ml-3 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm">
                        {reward.status}
                      </span>
                    </div>
                  </div>
                ))}
                {!rewards.length && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Vos récompenses apparaîtront ici lorsque des paliers éligibles seront atteints.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL DEMANDE DE RETRAIT                                 */}
        {/* ======================================================== */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl">account_balance_wallet</span>
                  <h3 className="font-display font-black text-base text-[#082843]">
                    Demande de Retrait
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Opérateur Mobile Money :
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money</option>
                    <option value="Moov Money">Moov Money</option>
                    <option value="Orange Money">Orange Money</option>
                    <option value="Wave">Wave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Numéro de téléphone / Compte :
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: +229 97 00 00 00"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Montant du retrait (XOF) :
                  </label>
                  <input
                    type="number"
                    min={minWithdrawalXof}
                    max={wallet?.availableXof || 0}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Minimum : {minWithdrawalXof.toLocaleString("fr-FR")} XOF · Maximum disponible : {(wallet?.availableXof || 0).toLocaleString("fr-FR")} XOF
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingWithdraw}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs shadow transition active:scale-95"
                  >
                    {submittingWithdraw ? "Transmission..." : "Confirmer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
