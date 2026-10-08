"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Wallet, WalletHold, WalletTransaction, WalletWithdrawal, WithdrawalMethod } from "@/lib/wallet/types";

export default function WalletPage() {
  const searchParams = useSearchParams();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [holds, setHolds] = useState<WalletHold[]>([]);
  const [withdrawals, setWithdrawals] = useState<WalletWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "holds" | "withdrawals">("transactions");

  // Form states - Recharge
  const [depositAmount, setDepositAmount] = useState<number>(5000);
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Form states - Retrait
  const [withdrawAmount, setWithdrawAmount] = useState<number>(5000);
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawalMethod>("mtn_momo");
  const [destinationAccount, setDestinationAccount] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const isDepositSuccess = searchParams?.get("deposit_success") === "1";

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/wallet");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/auth/login?next=${encodeURIComponent("/compte/wallet")}`;
          return;
        }
        throw new Error("Impossible de charger les données du portefeuille");
      }
      const data = await res.json();
      if (data.wallet) {
        setWallet(data.wallet);
        setTransactions(data.recentTransactions || []);
        setHolds(data.allHolds || []);
        setWithdrawals(data.allWithdrawals || []);
        if (data.user) {
          if (!accountHolder) setAccountHolder(`${data.user.prenom || ""} ${data.user.nom || ""}`.trim());
          if (!destinationAccount && data.user.phone) setDestinationAccount(data.user.phone);
        }
      }
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount < 500) {
      setDepositError("Le montant minimum est de 500 XOF");
      return;
    }
    setDepositSubmitting(true);
    setDepositError(null);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: depositAmount }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Échec de l'initialisation du paiement");
      }
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setDepositError(err.message || "Erreur de connexion");
      setDepositSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount < 1000) {
      setWithdrawError("Le montant minimum est de 1 000 XOF");
      return;
    }
    if (wallet && withdrawAmount > wallet.availableBalance) {
      setWithdrawError("Solde disponible insuffisant pour ce montant");
      return;
    }
    if (!destinationAccount) {
      setWithdrawError("Numéro de compte ou de téléphone requis");
      return;
    }
    if (!accountHolder) {
      setWithdrawError("Nom du titulaire requis");
      return;
    }

    setWithdrawSubmitting(true);
    setWithdrawError(null);
    setWithdrawSuccess(null);

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawAmount,
          method: withdrawMethod,
          destinationAccount,
          accountHolder,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de la demande de retrait");
      }
      setWithdrawSuccess("Votre demande de retrait a été enregistrée avec succès.");
      await fetchWalletData();
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess(null);
      }, 2000);
    } catch (err: any) {
      setWithdrawError(err.message || "Erreur lors du traitement");
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const estimatedFee = Math.max(100, Math.round(withdrawAmount * 0.015));
  const estimatedNet = Math.max(0, withdrawAmount - estimatedFee);

  return (
    <div className="space-y-6">
      {/* Alerte succès de recharge */}
      {isDepositSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-bold text-sm">Rechargement réussi !</p>
              <p className="text-xs text-emerald-700">Votre portefeuille a été crédité. Les fonds sont disponibles immédiatement.</p>
            </div>
          </div>
          <Link href="/compte/wallet" className="text-xs font-bold text-emerald-800 underline">Fermer</Link>
        </div>
      )}

      {/* Hero Header */}
      <div className="rounded-[24px] bg-gradient-to-br from-[#0A1931] via-[#102A43] to-[#9e001f] p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300">
              💳 Financial Core · Hub Central
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black">Mon Portefeuille (Wallet)</h1>
            <p className="mt-1 max-w-xl text-xs sm:text-sm text-white/80">
              Solde unique pour vos achats Marketplace, vos séquestres sécurisés, dons, participations Crowdfunding et retraits Mobile Money.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowDepositModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-xs font-black text-[#0A1931] transition hover:bg-amber-400 shadow-sm"
            >
              <span>+</span> Recharger mon compte
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-xs font-black text-white transition hover:bg-white/25 backdrop-blur-sm"
            >
              <span>↓</span> Demander un retrait
            </button>
          </div>
        </div>
      </div>

      {/* 3 Balances KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Solde Disponible */}
        <div className="rounded-[22px] border border-emerald-100 bg-white p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-50 rounded-bl-full flex items-center justify-center font-bold text-emerald-300 text-lg">
            ✓
          </div>
          <div className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
            Solde Disponible
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#0A1931]">
            {loading ? "..." : (wallet?.availableBalance ?? 0).toLocaleString("fr-FR")} {wallet?.currency || "XOF"}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Fonds libres prêts pour paiements immédiats, votes Awards ou retraits.
          </p>
        </div>

        {/* Solde en Séquestre (Escrow) */}
        <div className="rounded-[22px] border border-amber-100 bg-white p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-amber-50 rounded-bl-full flex items-center justify-center font-bold text-amber-400 text-lg">
            🔒
          </div>
          <div className="text-[11px] font-black uppercase tracking-wider text-amber-700">
            Séquestre / Escrow
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#0A1931]">
            {loading ? "..." : (wallet?.heldBalance ?? 0).toLocaleString("fr-FR")} {wallet?.currency || "XOF"}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Fonds bloqués en sécurité jusqu'à confirmation de livraison ou validation projet.
          </p>
        </div>

        {/* En Cours de Retrait */}
        <div className="rounded-[22px] border border-blue-100 bg-white p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-blue-50 rounded-bl-full flex items-center justify-center font-bold text-blue-400 text-lg">
            ⏳
          </div>
          <div className="text-[11px] font-black uppercase tracking-wider text-blue-700">
            Retraits en cours
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#0A1931]">
            {loading ? "..." : (wallet?.pendingBalance ?? 0).toLocaleString("fr-FR")} {wallet?.currency || "XOF"}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Demandes de virement Mobile Money / Banque en cours d'exécution.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="rounded-[20px] border border-zinc-200 bg-white p-2 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`rounded-full px-4 py-2 text-xs font-bold transition ${
            activeTab === "transactions" ? "bg-[#0A1931] text-white" : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          Historique Ledger ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab("holds")}
          className={`rounded-full px-4 py-2 text-xs font-bold transition ${
            activeTab === "holds" ? "bg-[#0A1931] text-white" : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          Séquestres Escrow ({holds.length})
        </button>
        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`rounded-full px-4 py-2 text-xs font-bold transition ${
            activeTab === "withdrawals" ? "bg-[#0A1931] text-white" : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          Demandes de Retraits ({withdrawals.length})
        </button>
      </div>

      {/* Tab 1 : Historique Transactions */}
      {activeTab === "transactions" && (
        <div className="rounded-[22px] border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-[#0A1931] mb-4">
            Grand Livre des Mouvements (Ledger Immuable)
          </h2>
          {loading ? (
            <div className="py-8 text-center text-sm text-zinc-500">Chargement des transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-zinc-400 text-sm">Aucune transaction enregistrée pour le moment.</p>
              <button
                onClick={() => setShowDepositModal(true)}
                className="mt-3 inline-flex rounded-full bg-[#0A1931] px-4 py-2 text-xs font-bold text-white"
              >
                Effectuer une première recharge
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-xs min-w-[580px]">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Référence</th>
                    <th className="pb-3 text-right">Montant</th>
                    <th className="pb-3 text-right">Solde après</th>
                    <th className="pb-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50/50 transition">
                      <td className="py-3 text-zinc-500 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 font-semibold text-zinc-800">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] uppercase font-bold text-zinc-700">
                          {tx.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-600 max-w-xs truncate">{tx.description}</td>
                      <td className="py-3 font-mono text-[10px] text-zinc-400">{tx.reference}</td>
                      <td className={`py-3 text-right font-black ${tx.direction === "CREDIT" ? "text-emerald-600" : "text-rose-600"}`}>
                        {tx.direction === "CREDIT" ? "+" : "-"}{tx.amount.toLocaleString("fr-FR")} {tx.currency}
                      </td>
                      <td className="py-3 text-right font-mono text-zinc-700">
                        {tx.balanceAfter.toLocaleString("fr-FR")} {tx.currency}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            tx.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : tx.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2 : Séquestres Escrow */}
      {activeTab === "holds" && (
        <div className="rounded-[22px] border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-[#0A1931] mb-4">
            Fonds Placés en Séquestre (Escrow Marketplace & Financement)
          </h2>
          {holds.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-sm">
              Aucun fonds sous séquestre pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-xs min-w-[580px]">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Motif</th>
                    <th className="pb-3">Référence</th>
                    <th className="pb-3 text-right">Montant Séquestré</th>
                    <th className="pb-3 text-center">Statut</th>
                    <th className="pb-3">Date Libération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {holds.map((h) => (
                    <tr key={h.id} className="hover:bg-zinc-50/50 transition">
                      <td className="py-3 text-zinc-500 whitespace-nowrap">
                        {new Date(h.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 font-semibold text-zinc-800">
                        {h.reason.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 font-mono text-[10px] text-zinc-400">{h.reference}</td>
                      <td className="py-3 text-right font-black text-amber-700">
                        {h.amount.toLocaleString("fr-FR")} {h.currency}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            h.status === "held"
                              ? "bg-amber-100 text-amber-800"
                              : h.status === "released"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {h.status === "held" ? "Bloqué" : h.status === "released" ? "Libéré" : "Remboursé"}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-500">
                        {h.releasedAt ? new Date(h.releasedAt).toLocaleDateString("fr-FR") : "En attente"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3 : Demandes de Retrait */}
      {activeTab === "withdrawals" && (
        <div className="rounded-[22px] border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-[#0A1931] mb-4">
            Demandes de Versements Mobile Money & Banque
          </h2>
          {withdrawals.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-sm">
              Aucune demande de retrait effectuée.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-xs min-w-[580px]">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Opérateur</th>
                    <th className="pb-3">Destinataire</th>
                    <th className="pb-3 text-right">Brut</th>
                    <th className="pb-3 text-right">Frais</th>
                    <th className="pb-3 text-right">Net Reçu</th>
                    <th className="pb-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-zinc-50/50 transition">
                      <td className="py-3 text-zinc-500 whitespace-nowrap">
                        {new Date(w.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 font-bold uppercase text-zinc-800">
                        {w.method.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 text-zinc-700">
                        <div className="font-semibold">{w.accountHolder}</div>
                        <div className="text-[10px] font-mono text-zinc-400">{w.destinationAccount}</div>
                      </td>
                      <td className="py-3 text-right font-mono text-zinc-600">
                        {w.amount.toLocaleString("fr-FR")} {w.currency}
                      </td>
                      <td className="py-3 text-right font-mono text-rose-500">
                        -{w.fee.toLocaleString("fr-FR")} {w.currency}
                      </td>
                      <td className="py-3 text-right font-black text-emerald-700">
                        {w.netAmount.toLocaleString("fr-FR")} {w.currency}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            w.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : w.status === "pending" || w.status === "processing"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {w.status === "pending"
                            ? "En attente"
                            : w.status === "processing"
                            ? "En cours"
                            : w.status === "completed"
                            ? "Exécuté"
                            : "Rejeté"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL RECHARGEMENT */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <h3 className="text-base font-black text-[#0A1931]">Recharger mon Portefeuille</h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeposit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Montant à recharger (XOF)
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-lg font-black text-[#0A1931] focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              {/* Boutons montants prédéfinis */}
              <div className="grid grid-cols-3 gap-2">
                {[2000, 5000, 10000, 25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`rounded-lg py-1.5 text-xs font-bold border transition ${
                      depositAmount === amt
                        ? "border-amber-500 bg-amber-50 text-amber-900"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {amt.toLocaleString("fr-FR")} F
                  </button>
                ))}
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 space-y-1">
                <p className="font-semibold text-zinc-800">Moyens de paiement acceptés :</p>
                <p>MTN Mobile Money, Moov Money, Orange Money, Wave & Cartes Bancaires via Moneroo.</p>
              </div>

              {depositError && (
                <div className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
                  {depositError}
                </div>
              )}

              <button
                type="submit"
                disabled={depositSubmitting}
                className="w-full rounded-full bg-amber-500 py-3 text-sm font-black text-[#0A1931] transition hover:bg-amber-400 disabled:opacity-50"
              >
                {depositSubmitting ? "Initialisation sécurisée..." : `Payer ${depositAmount.toLocaleString("fr-FR")} XOF`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RETRAIT */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <h3 className="text-base font-black text-[#0A1931]">Demander un Retrait</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="mt-4 space-y-4">
              <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 flex justify-between items-center">
                <span>Solde disponible :</span>
                <span className="font-black text-sm">
                  {(wallet?.availableBalance ?? 0).toLocaleString("fr-FR")} XOF
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Montant du retrait (XOF)
                </label>
                <input
                  type="number"
                  min="1000"
                  max={wallet?.availableBalance || 10000000}
                  step="100"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-lg font-black text-[#0A1931] focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Moyen de versement
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as WithdrawalMethod)}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-800 focus:border-amber-500 focus:outline-none"
                >
                  <option value="mtn_momo">MTN Mobile Money</option>
                  <option value="moov_money">Moov Money</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="wave">Wave</option>
                  <option value="celtiis_cash">Celtiis Cash</option>
                  <option value="bank_transfer">Virement Bancaire (RIB)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Numéro de téléphone / Compte
                </label>
                <input
                  type="text"
                  placeholder="Ex: +229 97 00 00 00 ou IBAN"
                  value={destinationAccount}
                  onChange={(e) => setDestinationAccount(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-medium text-zinc-800 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Nom du titulaire du compte
                </label>
                <input
                  type="text"
                  placeholder="Nom et prénom exacts"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-medium text-zinc-800 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              {/* Récapitulatif frais */}
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs space-y-1">
                <div className="flex justify-between text-zinc-500">
                  <span>Frais de traitement (1.5%) :</span>
                  <span>{estimatedFee.toLocaleString("fr-FR")} XOF</span>
                </div>
                <div className="flex justify-between font-black text-[#0A1931] border-t border-zinc-200 pt-1">
                  <span>Net à recevoir sur votre compte :</span>
                  <span className="text-emerald-700">{estimatedNet.toLocaleString("fr-FR")} XOF</span>
                </div>
              </div>

              {withdrawError && (
                <div className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
                  {withdrawError}
                </div>
              )}

              {withdrawSuccess && (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
                  {withdrawSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={withdrawSubmitting || (wallet ? withdrawAmount > wallet.availableBalance : false)}
                className="w-full rounded-full bg-[#0A1931] py-3 text-sm font-black text-white transition hover:bg-[#102A43] disabled:opacity-50"
              >
                {withdrawSubmitting ? "Traitement..." : `Demander le versement`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
