"use client";

import { useState, useEffect } from "react";
import { AffiliateRecord, AffiliateStats, TreeNode, WithdrawalRecord } from "@/lib/affiliation/types";

interface Props {
  initialEarnings?: any[];
}

type SubTab = "kpi" | "affiliates" | "tree" | "withdrawals" | "founder" | "audit";

export default function AffiliateManager({ initialEarnings = [] }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("kpi");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [annualFunds, setAnnualFunds] = useState<any[]>([]);
  const [recentUnallocated, setRecentUnallocated] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [selectedTreeAffiliateId, setSelectedTreeAffiliateId] = useState<string>("");

  // Filters
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("ALL");
  const [withdrawalFilter, setWithdrawalFilter] = useState<string>("ALL");

  // Founder form
  const [founderEmail, setFounderEmail] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [founderMsg, setFounderMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Simulation test form
  const [testSaleId, setTestSaleId] = useState(`SIM-${Date.now()}`);
  const [testSellerId, setTestSellerId] = useState("");
  const [testAmount, setTestAmount] = useState(10000);
  const [testResult, setTestResult] = useState<any>(null);

  // Action processing
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/affiliate/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setAnnualFunds(data.annualFunds || []);
        setRecentUnallocated(data.recentUnallocated || []);
      }
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  };

  const fetchAffiliates = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (programFilter !== "ALL") params.set("program", programFilter);
      const res = await fetch(`/api/admin/affiliate/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAffiliates(data.affiliates || []);
      }
    } catch (e) {
      console.error("Failed to load affiliates", e);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const params = new URLSearchParams();
      if (withdrawalFilter !== "ALL") params.set("status", withdrawalFilter);
      const res = await fetch(`/api/admin/affiliate/withdrawals?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (e) {
      console.error("Failed to load withdrawals", e);
    }
  };

  const fetchTree = async (affId?: string) => {
    try {
      const url = affId
        ? `/api/admin/affiliate/tree?affiliateId=${affId}`
        : `/api/admin/affiliate/tree`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTreeData(data.tree);
      }
    } catch (e) {
      console.error("Failed to load tree", e);
    }
  };

  const reloadAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchAffiliates(), fetchWithdrawals()]);
    setLoading(false);
  };

  useEffect(() => {
    reloadAll();
  }, []);

  useEffect(() => {
    if (subTab === "affiliates") fetchAffiliates();
    if (subTab === "withdrawals") fetchWithdrawals();
    if (subTab === "tree") fetchTree(selectedTreeAffiliateId || undefined);
    if (subTab === "kpi") fetchStats();
  }, [subTab, search, programFilter, withdrawalFilter]);

  const handleProcessWithdrawal = async (id: string, action: "PAID" | "REJECTED" | "APPROVED") => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/affiliate/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId: id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || "Action enregistrée.");
        fetchWithdrawals();
        fetchStats();
      } else {
        alert(data.error || "Erreur lors de l'action");
      }
    } catch (e) {
      alert("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateFounder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!founderEmail.trim()) return;
    setLoading(true);
    setFounderMsg(null);
    try {
      const res = await fetch("/api/admin/affiliate/founder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: founderEmail.trim(),
          customReferralCode: customCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFounderMsg({ type: "success", text: data.message });
        setFounderEmail("");
        setCustomCode("");
        fetchAffiliates();
        fetchStats();
      } else {
        setFounderMsg({ type: "error", text: data.error || "Erreur lors de la création" });
      }
    } catch (err) {
      setFounderMsg({ type: "error", text: "Erreur réseau" });
    } finally {
      setLoading(false);
    }
  };

  const handleTestCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testSellerId) {
      alert("Veuillez choisir un affilié vendeur");
      return;
    }
    setLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/commissions/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceSaleId: testSaleId,
          sellerAffiliateId: testSellerId,
          amount: Number(testAmount),
          volet: "MAGAZINE",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult(data.result);
        fetchStats();
        fetchAffiliates();
      } else {
        alert(data.error || "Erreur lors du calcul");
      }
    } catch (e) {
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-[#0A1931] text-white px-5 py-3 text-xs font-bold shadow-2xl border border-[#D4AF37] flex items-center gap-2 animate-fade-in">
          <span>✨</span> {feedback}
        </div>
      )}

      {/* Bar d'en-tête & Onglets */}
      <div className="bg-white rounded-[18px] border p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37] bg-[#0A1931] px-2 py-0.5 rounded">
                Affiliation 5×5 & Marketplace
              </span>
              <span className="text-[11px] font-bold text-zinc-500">
                Portefeuille Unifié • MLM 5 Niveaux
              </span>
            </div>
            <h2 className="text-xl font-black text-[#0A1931] mt-1">
              Administration du Système d'Affiliation
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={reloadAll}
              disabled={loading}
              className="h-9 px-4 rounded-full border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition"
            >
              {loading ? "Actualisation…" : "🔄 Actualiser"}
            </button>
          </div>
        </div>

        {/* Navigation sous-onglets */}
        <div className="flex flex-wrap gap-2 mt-5 border-t pt-4">
          {[
            { id: "kpi", label: "📊 Tableau de Bord & Réserves" },
            { id: "affiliates", label: `👥 Annuaire (${stats?.totalAffiliates ?? affiliates.length})` },
            { id: "tree", label: "🌳 Inspecteur d'Arbre 5×5" },
            {
              id: "withdrawals",
              label: `💸 Retraits Mobile Money ${
                stats?.pendingWithdrawalsCount ? `(${stats.pendingWithdrawalsCount} en attente)` : ""
              }`,
            },
            { id: "founder", label: "👑 Créer Fondateur (Niveau 0)" },
            { id: "audit", label: "🛡️ Audit & Simulateur" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as SubTab)}
              className={`h-9 px-4 rounded-full text-xs font-bold transition ${
                subTab === tab.id
                  ? "bg-[#0A1931] text-white shadow-sm"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. SOUS-ONGLET : TABLEAU DE BORD & RÉSERVES (KPI) */}
      {subTab === "kpi" && (
        <div className="space-y-6">
          {/* Cartes KPI Principales */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-[16px] border p-4">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Total Affiliés</div>
              <div className="font-black text-xl text-[#0A1931] mt-1">
                {stats?.totalAffiliates ?? 0}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                {stats?.magazineAffiliates ?? 0} Mag • {stats?.marketplaceAffiliates ?? 0} Mkt
              </div>
            </div>

            <div className="bg-white rounded-[16px] border p-4">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Commissions Générées</div>
              <div className="font-black text-xl text-emerald-700 mt-1">
                {(stats?.totalCommissionsGenerated ?? 0).toLocaleString()} F
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">15% sur ventes mag</div>
            </div>

            <div className="bg-white rounded-[16px] border p-4">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Part Réseau (70%)</div>
              <div className="font-black text-xl text-blue-700 mt-1">
                {(stats?.totalDistributedToNetwork ?? 0).toLocaleString()} F
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">Versé aux parrains (N1-N5)</div>
            </div>

            <div className="bg-white rounded-[16px] border p-4 border-[#D4AF37]/30 bg-amber-50/40">
              <div className="text-[10px] uppercase font-bold text-amber-900">Fonds Réseau (10%)</div>
              <div className="font-black text-xl text-amber-800 mt-1">
                {(stats?.networkSizeFundTotal ?? 0).toLocaleString()} F
              </div>
              <div className="text-[10px] text-amber-700 mt-1">Primes taille de réseau</div>
            </div>

            <div className="bg-white rounded-[16px] border p-4 border-[#D4AF37]/30 bg-amber-50/40">
              <div className="text-[10px] uppercase font-bold text-amber-900">Fonds Cérémonie (20%)</div>
              <div className="font-black text-xl text-amber-800 mt-1">
                {(stats?.ceremonyFundTotal ?? 0).toLocaleString()} F
              </div>
              <div className="text-[10px] text-amber-700 mt-1">Prix annuel ambassadeurs</div>
            </div>

            <div className="bg-white rounded-[16px] border p-4">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Fonds Système Incomplet</div>
              <div className="font-black text-xl text-purple-700 mt-1">
                {(stats?.unallocatedFundTotal ?? 0).toLocaleString()} F
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">Niveaux &lt; 5 non pourvus</div>
            </div>
          </div>

          {/* Deuxième ligne : Retraits & Règle MLM */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[18px] border p-5 space-y-4">
              <h3 className="font-bold text-sm text-[#0A1931] flex items-center gap-2">
                <span>💸</span> Statut des Retraits Mobile Money (Seuil : 10 000 XOF)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                  <div className="text-[11px] font-bold text-orange-800">En Attente de Validation</div>
                  <div className="text-xl font-black text-orange-900 mt-1">
                    {(stats?.totalPendingWithdrawals ?? 0).toLocaleString()} F
                  </div>
                  <div className="text-[10px] text-orange-700 mt-0.5">
                    {stats?.pendingWithdrawalsCount ?? 0} demande(s)
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-[11px] font-bold text-emerald-800">Total Payé à ce jour</div>
                  <div className="text-xl font-black text-emerald-900 mt-1">
                    {(stats?.totalPaidWithdrawals ?? 0).toLocaleString()} F
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">Payé par Mobile Money</div>
                </div>
              </div>
              <button
                onClick={() => setSubTab("withdrawals")}
                className="w-full h-9 rounded-full bg-[#0A1931] text-white text-xs font-bold hover:bg-black transition"
              >
                Gérer les demandes de retrait en attente →
              </button>
            </div>

            <div className="bg-white rounded-[18px] border p-5 space-y-3">
              <h3 className="font-bold text-sm text-[#0A1931] flex items-center gap-2">
                <span>📐</span> Clé de Répartition Réglementaire
              </h3>
              <div className="text-xs space-y-2 text-zinc-600">
                <div className="flex justify-between p-2 rounded-lg bg-zinc-50 border">
                  <span className="font-medium">Vente Magazine / Abonnement</span>
                  <span className="font-bold text-[#0A1931]">15% commission brute</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                  <span>Part Réseau Ambassadeurs (70%)</span>
                  <span className="font-bold text-blue-900">
                    N1: 40% • N2: 25% • N3: 15% • N4: 12% • N5: 8%
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                  <span>Fonds Primes Réseau (10%)</span>
                  <span className="font-bold text-amber-900">Dès profondeur N3 active</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                  <span>Fonds Prix Cérémonie (20%)</span>
                  <span className="font-bold text-amber-900">Prix annuels des ambassadeurs</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-purple-50/50 border border-purple-100">
                  <span>Ventes Marketplace (Hors MLM)</span>
                  <span className="font-bold text-purple-900">92% affilié • 8% plateforme EAM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des réserves annuelles */}
          <div className="bg-white rounded-[18px] border p-5">
            <h3 className="font-bold text-sm text-[#0A1931] mb-3">
              Fonds de Réserve Annuels Cumulés
            </h3>
            {annualFunds.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">
                Aucun fonds annuel enregistré pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-y text-zinc-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Année</th>
                      <th className="py-2.5 px-3">Fonds Primes Réseau (10%)</th>
                      <th className="py-2.5 px-3">Fonds Prix Cérémonie (20%)</th>
                      <th className="py-2.5 px-3">Total Réserve</th>
                      <th className="py-2.5 px-3">Statut Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {annualFunds.map((f) => (
                      <tr key={f.year} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-3 font-bold">{f.year}</td>
                        <td className="py-2.5 px-3 font-semibold text-amber-800">
                          {f.networkSizeFund.toLocaleString()} XOF
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-amber-800">
                          {f.ceremonyFund.toLocaleString()} XOF
                        </td>
                        <td className="py-2.5 px-3 font-black text-[#0A1931]">
                          {(f.networkSizeFund + f.ceremonyFund).toLocaleString()} XOF
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              f.distributed
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {f.distributed ? "Distribué" : "En cours de cumul"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SOUS-ONGLET : ANNUAIRE DES AFFILIÉS */}
      {subTab === "affiliates" && (
        <div className="bg-white rounded-[18px] border p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                placeholder="Rechercher par nom, email ou code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 px-3 text-xs border rounded-full bg-zinc-50 w-full focus:bg-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="h-9 px-3 text-xs border rounded-full bg-zinc-50 font-bold text-zinc-700"
              >
                <option value="ALL">Tous les programmes</option>
                <option value="MAGAZINE">Programme Magazine (MLM)</option>
                <option value="MARKETPLACE">Programme Marketplace</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b text-zinc-500 text-[10px] uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Affilié / Contact</th>
                  <th className="py-3 px-4">Code Parrainage</th>
                  <th className="py-3 px-4">Niveau</th>
                  <th className="py-3 px-4">Filleuls Directs</th>
                  <th className="py-3 px-4">Programmes</th>
                  <th className="py-3 px-4">Gains Totaux</th>
                  <th className="py-3 px-4">Solde Dispo</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-zinc-400">
                      Aucun affilié ne correspond à ces critères.
                    </td>
                  </tr>
                ) : (
                  affiliates.map((aff) => {
                    const available = Math.max(0, aff.totalEarnings - aff.withdrawnTotal);
                    return (
                      <tr key={aff.id} className="hover:bg-zinc-50/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#0A1931]">
                            {aff.user ? `${aff.user.prenom} ${aff.user.nom}` : "Utilisateur Inconnu"}
                          </div>
                          <div className="text-[11px] text-zinc-400">{aff.user?.email}</div>
                          {aff.isFounder && (
                            <span className="inline-block mt-0.5 text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                              👑 FONDATEUR (RACINE)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-800">
                          {aff.referralCode}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 font-bold text-[11px]">
                            Niveau {aff.level}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              (aff.directReferralsCount || 0) >= 5
                                ? "bg-amber-100 text-amber-800"
                                : "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {aff.directReferralsCount || 0} / 5
                          </span>
                        </td>
                        <td className="py-3 px-4 space-y-1">
                          {aff.magazineEnrolled && (
                            <span className="inline-block mr-1 text-[9px] bg-red-50 text-red-700 font-bold px-1.5 py-0.5 rounded border border-red-100">
                              Magazine
                            </span>
                          )}
                          {aff.marketplaceEnrolled && (
                            <span className="inline-block text-[9px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded border border-purple-100">
                              Marketplace
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-700">
                          {aff.totalEarnings.toLocaleString()} F
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-700">
                          {available.toLocaleString()} F
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedTreeAffiliateId(aff.id);
                              setSubTab("tree");
                            }}
                            className="h-7 px-3 rounded-full bg-zinc-100 hover:bg-[#0A1931] hover:text-white text-[11px] font-bold transition"
                          >
                            Inspecter arbre →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SOUS-ONGLET : INSPECTEUR D'ARBRE 5×5 */}
      {subTab === "tree" && (
        <div className="bg-white rounded-[18px] border p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="font-bold text-sm text-[#0A1931]">
                Généalogie Descendante de la Matrice 5×5
              </h3>
              <p className="text-xs text-zinc-500">
                Visualisation en temps réel des 5 générations sous le membre racine sélectionné.
              </p>
            </div>
            {selectedTreeAffiliateId && (
              <button
                onClick={() => {
                  setSelectedTreeAffiliateId("");
                  fetchTree();
                }}
                className="text-xs font-bold text-blue-700 hover:underline"
              >
                ← Revenir à la racine principale
              </button>
            )}
          </div>

          {treeData ? (
            <div className="space-y-4">
              {/* Racine */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-[#0A1931] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-md">
                <div>
                  <div className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">
                    {treeData.isFounder ? "👑 RACINE FONDATEUR" : "NOEUD RACINE"} • NIVEAU {treeData.level}
                  </div>
                  <div className="text-lg font-black">{treeData.userName}</div>
                  <div className="text-xs text-zinc-300 font-mono mt-0.5">
                    Code : {treeData.referralCode} • {treeData.userEmail}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase text-zinc-300">Gains Réseau</div>
                  <div className="text-xl font-black text-[#D4AF37]">
                    {treeData.totalEarnings.toLocaleString()} XOF
                  </div>
                  <div className="text-[11px] text-zinc-300 font-bold mt-0.5">
                    {treeData.children.length} / 5 Filleuls directs
                  </div>
                </div>
              </div>

              {/* Filleuls Génération 1 à 5 */}
              <div className="pl-4 md:pl-8 border-l-2 border-dashed border-zinc-200 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Génération 1 ({treeData.children.length} / 5 membres) — Réversion 40%
                </div>
                {treeData.children.length === 0 ? (
                  <div className="text-xs text-zinc-400 italic py-2">
                    Aucun filleul direct inscrit sous ce parrain.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {treeData.children.map((child) => (
                      <div
                        key={child.id}
                        className="p-3.5 rounded-xl border bg-zinc-50/70 hover:bg-white hover:shadow-sm transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-xs text-[#0A1931]">{child.userName}</div>
                            <div className="text-[10px] font-mono text-blue-700 font-bold">
                              {child.referralCode}
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                            N1
                          </span>
                        </div>
                        <div className="mt-2.5 pt-2 border-t flex justify-between items-center text-[11px]">
                          <span className="text-zinc-500">{child.children.length}/5 directs</span>
                          <span className="font-black text-emerald-700">
                            {child.totalEarnings.toLocaleString()} F
                          </span>
                        </div>
                        {child.children.length > 0 && (
                          <div className="mt-2 pt-2 border-t text-[10px] text-zinc-500">
                            <span className="font-bold text-zinc-700">Sous-réseau (N2) :</span>{" "}
                            {child.children.map((c2) => c2.userName.split(" ")[0]).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-400 text-xs">
              Aucun arbre à afficher. Créez d'abord un compte Fondateur.
            </div>
          )}
        </div>
      )}

      {/* 4. SOUS-ONGLET : RETRAITS MOBILE MONEY */}
      {subTab === "withdrawals" && (
        <div className="bg-white rounded-[18px] border p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-[#0A1931]">
                Demandes de Retrait Mobile Money (MTN, Moov, Orange, Wave)
              </h3>
              <p className="text-xs text-zinc-500">
                Seuil de paiement minimum : 10 000 XOF. Le rejet recrédite automatiquement le solde.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={withdrawalFilter}
                onChange={(e) => setWithdrawalFilter(e.target.value)}
                className="h-9 px-3 text-xs border rounded-full bg-zinc-50 font-bold text-zinc-700"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PENDING">En attente (PENDING)</option>
                <option value="PAID">Payés (PAID)</option>
                <option value="REJECTED">Rejetés (REJECTED)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b text-zinc-500 text-[10px] uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Date demande</th>
                  <th className="py-3 px-4">Affilié</th>
                  <th className="py-3 px-4">Opérateur Mobile</th>
                  <th className="py-3 px-4">Numéro de Téléphone</th>
                  <th className="py-3 px-4">Montant Demandé</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions Gérant</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-zinc-400">
                      Aucune demande de retrait trouvée.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-zinc-50/50">
                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        {new Date(w.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0A1931]">
                          {w.affiliate?.user
                            ? `${w.affiliate.user.prenom} ${w.affiliate.user.nom}`
                            : "Affilié"}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400">
                          {w.affiliate?.referralCode}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-yellow-100 text-yellow-900 uppercase">
                          {w.mobileMoneyProvider}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0A1931]">
                        {w.mobileMoneyNumber}
                      </td>
                      <td className="py-3 px-4 font-black text-sm text-emerald-800">
                        {w.amount.toLocaleString()} XOF
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status === "PENDING"
                              ? "bg-orange-100 text-orange-800"
                              : w.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {w.status === "PENDING"
                            ? "En attente"
                            : w.status === "PAID"
                            ? "Payé"
                            : "Rejeté"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {w.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleProcessWithdrawal(w.id, "PAID")}
                              disabled={actionLoading === w.id}
                              className="h-7 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-sm"
                            >
                              Valider & Payer
                            </button>
                            <button
                              onClick={() => handleProcessWithdrawal(w.id, "REJECTED")}
                              disabled={actionLoading === w.id}
                              className="h-7 px-2.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold transition"
                            >
                              Rejeter
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400">
                            {w.processedAt ? new Date(w.processedAt).toLocaleDateString("fr-FR") : "Traité"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SOUS-ONGLET : CRÉER UN FONDATEUR RACINE (NIVEAU 0) */}
      {subTab === "founder" && (
        <div className="max-w-2xl bg-white rounded-[18px] border p-6 space-y-5">
          <div>
            <div className="text-[10px] uppercase font-black text-[#D4AF37] tracking-wider">
              Arbre MLM 5×5
            </div>
            <h3 className="text-lg font-black text-[#0A1931] mt-0.5">
              Créer ou Promouvoir un Compte Fondateur (Racine)
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-5">
              Un fondateur est positionné au <strong>Niveau 0</strong> de la matrice sans aucun parrain requis.
              Il peut ensuite parrainer directement jusqu'à 5 ambassadeurs (Niveau 1).
            </p>
          </div>

          {founderMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold border ${
                founderMsg.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {founderMsg.text}
            </div>
          )}

          <form onSubmit={handleCreateFounder} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Email de l'utilisateur existant *
              </label>
              <input
                type="email"
                required
                placeholder="ex: admin@envolafricamagazine.com"
                value={founderEmail}
                onChange={(e) => setFounderEmail(e.target.value)}
                className="w-full h-10 px-3 text-xs border rounded-xl bg-zinc-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Code de parrainage personnalisé (facultatif)
              </label>
              <input
                type="text"
                placeholder="ex: EAM-RACINE01 (laisser vide pour générer automatiquement)"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                className="w-full h-10 px-3 text-xs border rounded-xl bg-zinc-50 font-mono focus:bg-white focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="h-10 px-6 rounded-full bg-[#0A1931] text-white text-xs font-bold hover:bg-black transition shadow-sm"
              >
                {loading ? "Création en cours…" : "👑 Établir comme Fondateur Racine"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. SOUS-ONGLET : AUDIT & SIMULATEUR */}
      {subTab === "audit" && (
        <div className="space-y-6">
          {/* Simulateur */}
          <div className="bg-white rounded-[18px] border p-5 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-[#0A1931]">
                Simulateur de Répartition MLM Magazine (Test d'application de vente)
              </h3>
              <p className="text-xs text-zinc-500">
                Testez le moteur de distribution en direct sans passer par la passerelle de paiement.
              </p>
            </div>

            <form onSubmit={handleTestCommission} className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  ID Vente Unique
                </label>
                <input
                  type="text"
                  required
                  value={testSaleId}
                  onChange={(e) => setTestSaleId(e.target.value)}
                  className="w-full h-9 px-3 text-xs border rounded-xl bg-zinc-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  Affilié Réalisant la Vente *
                </label>
                <select
                  required
                  value={testSellerId}
                  onChange={(e) => setTestSellerId(e.target.value)}
                  className="w-full h-9 px-3 text-xs border rounded-xl bg-zinc-50 font-bold"
                >
                  <option value="">Sélectionner un affilié…</option>
                  {affiliates.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.referralCode} - {a.user?.nom || "Affilié"} (Niv {a.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  Montant Vente (XOF)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Number(e.target.value))}
                  className="w-full h-9 px-3 text-xs border rounded-xl bg-zinc-50"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition"
                >
                  {loading ? "Calcul en cours…" : "⚡ Exécuter la Distribution Réseau"}
                </button>
              </div>
            </form>

            {testResult && (
              <div className="p-4 rounded-xl bg-zinc-50 border space-y-2 text-xs">
                <div className="font-bold text-emerald-800 text-sm">
                  ✅ Distribution effectuée avec succès !
                </div>
                <div className="grid sm:grid-cols-4 gap-2 pt-2">
                  <div className="p-2.5 rounded-lg bg-white border">
                    <span className="text-zinc-500 block">Commission Totale (15%)</span>
                    <span className="font-black text-[#0A1931]">
                      {testResult.commissionTotal} XOF
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border">
                    <span className="text-zinc-500 block">Part Réseau (70%)</span>
                    <span className="font-black text-blue-700">
                      {testResult.networkShareAmount} XOF
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border">
                    <span className="text-zinc-500 block">Fonds Réseau (10%)</span>
                    <span className="font-black text-amber-700">
                      {testResult.networkSizeFundAmount} XOF
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border">
                    <span className="text-zinc-500 block">Fonds Cérémonie (20%)</span>
                    <span className="font-black text-amber-700">
                      {testResult.ceremonyFundAmount} XOF
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="font-bold text-zinc-700">Détail des niveaux payés :</div>
                  {testResult.distributed?.map((d: any) => (
                    <div key={d.level} className="text-[11px] text-zinc-600">
                      • Niveau {d.level} : {d.amount} XOF crédités à l'affilié {d.affiliateId.slice(0, 8)}
                    </div>
                  ))}
                  {testResult.unallocated?.map((u: any) => (
                    <div key={u.level} className="text-[11px] text-purple-700 font-semibold">
                      • Niveau {u.level} (manquant) : {u.amount} XOF basculés en Fonds Système ({u.reason})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Table des fonds non alloués récents */}
          <div className="bg-white rounded-[18px] border p-5">
            <h3 className="font-bold text-sm text-[#0A1931] mb-2">
              Historique des Fonds Non Alloués (Fonds Système)
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Généré automatiquement lorsqu'une vente survient dans un réseau n'ayant pas encore atteint 5 niveaux de profondeur.
            </p>
            {recentUnallocated.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">
                Aucun versement au fonds système pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-y text-zinc-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">ID Vente Source</th>
                      <th className="py-2.5 px-3">Niveau Manquant</th>
                      <th className="py-2.5 px-3">Montant</th>
                      <th className="py-2.5 px-3">Motif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentUnallocated.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-3 text-zinc-500 text-[11px]">
                          {new Date(u.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{u.source_sale_id}</td>
                        <td className="py-2.5 px-3 font-bold">Niveau {u.level_missing}</td>
                        <td className="py-2.5 px-3 font-black text-purple-800">
                          {Number(u.amount).toLocaleString()} XOF
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600">{u.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
