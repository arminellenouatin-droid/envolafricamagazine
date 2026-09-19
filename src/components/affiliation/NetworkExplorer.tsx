"use client";

import React, { useState, useMemo } from "react";
import { TreeNode, DownlineMember } from "@/lib/affiliation/types";

interface BranchData {
  branchRootId: string;
  branchRootCode: string;
  branchRootName: string;
  branchRootEmail: string;
  branchRootEarnings: number;
  totalBranchMembers: number;
  members: DownlineMember[];
}

interface NetworkData {
  networkDepth: number;
  directCount: number;
  maxDirect: number;
  totalNetworkCount: number;
  countsByLevel: Record<number, number>;
  branches: BranchData[];
  flatMembers: DownlineMember[];
  tree: TreeNode | null;
}

interface NetworkExplorerProps {
  data: NetworkData | null;
  loading?: boolean;
}

export default function NetworkExplorer({ data, loading = false }: NetworkExplorerProps) {
  const [viewMode, setViewMode] = useState<"tree" | "table">("tree");
  const [selectedLevel, setSelectedLevel] = useState<number | "ALL">("ALL");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<DownlineMember | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    if (!data?.flatMembers) return;
    const allExpanded: Record<string, boolean> = {};
    if (data.tree) allExpanded[data.tree.id] = true;
    for (const m of data.flatMembers) {
      allExpanded[m.id] = true;
    }
    setExpandedNodes(allExpanded);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // Filtrage pour la vue tabulaire
  const filteredMembers = useMemo(() => {
    if (!data?.flatMembers) return [];

    return data.flatMembers.filter((m) => {
      // Filtre niveau
      if (selectedLevel !== "ALL" && m.relativeLevel !== selectedLevel) {
        return false;
      }
      // Filtre branche
      if (selectedBranch !== "ALL" && m.branchRootCode !== selectedBranch) {
        return false;
      }
      // Filtre recherche
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = m.userName.toLowerCase().includes(q);
        const matchEmail = m.userEmail.toLowerCase().includes(q);
        const matchCode = m.referralCode.toLowerCase().includes(q);
        const matchSponsor = m.sponsorName.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchCode && !matchSponsor) return false;
      }
      return true;
    });
  }, [data, selectedLevel, selectedBranch, searchQuery]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#0A1931] border-t-transparent"></div>
        <p className="mt-4 text-xs font-bold text-zinc-500">Chargement de votre réseau...</p>
      </div>
    );
  }

  if (!data || !data.tree) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl text-zinc-400">
          🌳
        </div>
        <h3 className="mt-4 font-serif text-lg font-black text-[#0A1931]">Réseau en attente d'activation</h3>
        <p className="mt-1.5 text-xs text-zinc-500 max-w-md mx-auto">
          Partagez votre lien d'affiliation pour inscrire vos 5 premiers filleuls directs et lancer le
          développement de votre réseau sur 5 générations.
        </p>
      </div>
    );
  }

  const levelInfo = [
    { lvl: 1, label: "Génération 1 (Directs)", share: "40%", max: 5, color: "text-blue-700 bg-blue-50 border-blue-200" },
    { lvl: 2, label: "Génération 2", share: "25%", max: 25, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { lvl: 3, label: "Génération 3", share: "15%", max: 125, color: "text-amber-700 bg-amber-50 border-amber-200" },
    { lvl: 4, label: "Génération 4", share: "12%", max: 625, color: "text-purple-700 bg-purple-50 border-purple-200" },
    { lvl: 5, label: "Génération 5", share: "8%", max: 3125, color: "text-rose-700 bg-rose-50 border-rose-200" },
  ];

  // Rendu récursif d'un nœud dans l'arbre
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes[node.id] ?? (depth <= 1);
    const hasChildren = node.children && node.children.length > 0;
    const isRoot = depth === 0;

    return (
      <div key={node.id} className="relative">
        {/* Nœud */}
        <div
          className={`relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
            isRoot
              ? "bg-gradient-to-r from-[#0A1931] to-[#12284C] text-white border-transparent shadow-md"
              : "bg-white hover:border-[#0A1931]/40 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black transition ${
                  isRoot
                    ? "bg-white/20 text-[#D4AF37] hover:bg-white/30"
                    : "bg-zinc-100 text-zinc-700 hover:bg-[#0A1931] hover:text-white"
                }`}
                title={isExpanded ? "Replier la branche" : "Déplier la branche"}
              >
                {isExpanded ? "−" : "+"}
              </button>
            ) : (
              <div
                className={`h-2.5 w-2.5 rounded-full ml-2 mr-2.5 ${
                  isRoot ? "bg-[#D4AF37]" : "bg-zinc-300"
                }`}
              />
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${isRoot ? "text-white" : "text-[#0A1931]"}`}>
                  {node.userName}
                </span>
                {isRoot ? (
                  <span className="rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">
                    👑 Vous (Racine)
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      levelInfo[(node.relativeLevel || 1) - 1]?.color || "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    G{node.relativeLevel} • {node.relativeLevel === 1 ? "Filleul direct" : `Sous-filleul G${node.relativeLevel}`}
                  </span>
                )}
              </div>
              <div className={`mt-0.5 flex flex-wrap items-center gap-2 text-xs font-mono ${isRoot ? "text-zinc-300" : "text-zinc-500"}`}>
                <span className="font-bold text-[#D4AF37]">{node.referralCode}</span>
                {node.userEmail && <span>• {node.userEmail}</span>}
                {node.sponsorName && !isRoot && (
                  <span className="text-zinc-400">
                    • Parrainé par : <strong className="text-zinc-600">{node.sponsorName}</strong> ({node.sponsorCode})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-[10px] uppercase font-bold ${isRoot ? "text-white/60" : "text-zinc-400"}`}>
                Filleuls directs
              </div>
              <div className={`text-xs font-black ${isRoot ? "text-white" : "text-[#0A1931]"}`}>
                {node.children.length} / 5
              </div>
            </div>

            <div className="text-right">
              <div className={`text-[10px] uppercase font-bold ${isRoot ? "text-white/60" : "text-zinc-400"}`}>
                Gains cumulés
              </div>
              <div className="text-xs font-black text-emerald-600">
                {Number(node.totalEarnings || 0).toLocaleString("fr-FR")} F
              </div>
            </div>

            {!isRoot && (
              <button
                onClick={() => {
                  setSelectedMember({
                    id: node.id,
                    referralCode: node.referralCode,
                    level: node.level,
                    relativeLevel: node.relativeLevel || depth,
                    userName: node.userName,
                    userEmail: node.userEmail,
                    userPhone: node.userPhone,
                    totalEarnings: node.totalEarnings,
                    directCount: node.children.length,
                    magazineEnrolled: node.magazineEnrolled,
                    marketplaceEnrolled: node.marketplaceEnrolled,
                    isActive: node.isActive ?? true,
                    isFounder: node.isFounder,
                    createdAt: node.createdAt,
                    sponsorName: node.sponsorName || "",
                    sponsorCode: node.sponsorCode || "",
                    branchRootName: "",
                    branchRootCode: "",
                  });
                }}
                className="rounded-lg bg-zinc-100 hover:bg-[#0A1931] hover:text-white px-2.5 py-1.5 text-[11px] font-bold text-zinc-700 transition"
              >
                Détails
              </button>
            )}
          </div>
        </div>

        {/* Sous-branches */}
        {hasChildren && isExpanded && (
          <div className="relative pl-6 md:pl-8 ml-4 md:ml-6 mt-3 border-l-2 border-dashed border-[#D4AF37]/50 space-y-3">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Métriques consolidées du réseau */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#0A1931] p-5 text-white shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
            Taille Totale du Réseau
          </div>
          <div className="mt-2 text-3xl font-black">{data.totalNetworkCount}</div>
          <div className="mt-1 text-[11px] text-white/60">Ambassadeurs dans vos 5 niveaux</div>
        </div>

        <div className="rounded-2xl bg-white border p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Filleuls Directs (N1)
          </div>
          <div className="mt-2 text-3xl font-black text-[#0A1931]">
            {data.directCount} <span className="text-sm font-bold text-zinc-400">/ 5</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {5 - data.directCount > 0
              ? `Encore ${5 - data.directCount} place(s) disponible(s)`
              : "Matrice directe complète (5/5)"}
          </div>
        </div>

        <div className="rounded-2xl bg-white border p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Profondeur Active
          </div>
          <div className="mt-2 text-3xl font-black text-[#0A1931]">
            {data.networkDepth} <span className="text-sm font-bold text-zinc-400">/ 5</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {data.networkDepth >= 3 ? "✓ Éligible au Fonds Prime Annuelle" : "Objectif : atteindre N3"}
          </div>
        </div>

        <div className="rounded-2xl bg-white border p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Branches Actives
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-700">
            {data.branches.filter((b) => b.totalBranchMembers > 0).length}{" "}
            <span className="text-sm font-bold text-zinc-400">/ {data.directCount}</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Chaînes avec descendance</div>
        </div>
      </div>

      {/* 2. Paliers par génération (G1 à G5) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {levelInfo.map((item) => {
          const count = data.countsByLevel[item.lvl] || 0;
          const isSelected = selectedLevel === item.lvl;
          return (
            <button
              key={item.lvl}
              onClick={() => {
                setSelectedLevel(isSelected ? "ALL" : item.lvl);
                setViewMode("table");
              }}
              className={`rounded-xl p-3.5 text-left border transition relative ${
                isSelected
                  ? "bg-[#0A1931] text-white border-[#0A1931] shadow-md"
                  : "bg-white hover:border-[#0A1931]/40"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-[11px] font-bold uppercase ${isSelected ? "text-[#D4AF37]" : "text-zinc-500"}`}>
                  Niveau {item.lvl}
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isSelected ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-700"}`}>
                  {item.share}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className={`text-2xl font-black ${isSelected ? "text-white" : "text-[#0A1931]"}`}>
                  {count}
                </span>
                <span className={`text-xs ${isSelected ? "text-white/60" : "text-zinc-400"}`}>
                  / {item.max}
                </span>
              </div>
              <div className={`mt-1 text-[10px] truncate ${isSelected ? "text-white/70" : "text-zinc-400"}`}>
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Barre de contrôle : Bascule Arbre / Tableau + Filtres */}
      <div className="rounded-2xl bg-white border p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-zinc-100 p-1">
            <button
              onClick={() => setViewMode("tree")}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "tree"
                  ? "bg-[#0A1931] text-white shadow-sm"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              <span>🌳</span> Arbre Dynamique
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-[#0A1931] text-white shadow-sm"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              <span>📋</span> Annuaire des Filleuls ({data.totalNetworkCount})
            </button>
          </div>

          {viewMode === "tree" && (
            <div className="flex items-center gap-2 ml-1">
              <button
                onClick={expandAll}
                className="rounded-lg border px-2.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
              >
                Tout déplier
              </button>
              <button
                onClick={collapseAll}
                className="rounded-lg border px-2.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
              >
                Tout replier
              </button>
            </div>
          )}
        </div>

        {/* Filtres par branche et recherche */}
        <div className="flex flex-wrap items-center gap-2">
          {data.branches.length > 0 && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="h-10 px-3 text-xs border rounded-xl bg-white font-bold text-zinc-700"
            >
              <option value="ALL">Toutes les chaînes / branches</option>
              {data.branches.map((b) => (
                <option key={b.branchRootCode} value={b.branchRootCode}>
                  Chaîne de {b.branchRootName} ({b.branchRootCode}) — {b.totalBranchMembers} membre(s)
                </option>
              ))}
            </select>
          )}

          {viewMode === "table" && (
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher nom, code, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-8 pr-3 text-xs border rounded-xl bg-white w-52 md:w-64"
              />
              <span className="absolute left-2.5 top-2.5 text-xs text-zinc-400">🔍</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. VUE 1 : ARBRE GÉNÉALOGIQUE DYNAMIQUE */}
      {viewMode === "tree" && (
        <div className="rounded-2xl border bg-zinc-50/50 p-4 md:p-6 shadow-sm space-y-4 overflow-x-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-black text-[#0A1931] flex items-center gap-2">
              <span>🧬</span> Chaîne Généalogique Descendante Complète (5x5)
            </h3>
            <span className="text-xs text-zinc-500">
              Cliquez sur les boutons <code className="font-bold text-[#0A1931]">+ / −</code> pour explorer
              chaque sous-branche
            </span>
          </div>

          <div className="mt-4">{renderTreeNode(data.tree, 0)}</div>
        </div>
      )}

      {/* 5. VUE 2 : ANNUAIRE & CHAÎNES DÉTAILLÉES TABULAIRES */}
      {viewMode === "table" && (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-zinc-50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-base font-black text-[#0A1931]">
                Liste Détaillée des Membres du Réseau
              </h3>
              <p className="text-xs text-zinc-500">
                Affichage de {filteredMembers.length} filleul(s) sur {data.totalNetworkCount}
                {selectedLevel !== "ALL" && ` (Niveau ${selectedLevel})`}
                {selectedBranch !== "ALL" && " (Branche sélectionnée)"}
              </p>
            </div>

            {selectedLevel !== "ALL" && (
              <button
                onClick={() => setSelectedLevel("ALL")}
                className="rounded-full bg-zinc-200 hover:bg-zinc-300 px-3 py-1 text-xs font-bold text-zinc-700"
              >
                Réinitialiser le niveau (Voir tous)
              </button>
            )}
          </div>

          {filteredMembers.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-xs">
              Aucun filleul ne correspond aux critères sélectionnés.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase tracking-wider border-b">
                  <tr>
                    <th className="p-3">Génération</th>
                    <th className="p-3">Ambassadeur</th>
                    <th className="p-3">Code Affilié</th>
                    <th className="p-3">Parrain Direct</th>
                    <th className="p-3">Branche Racine</th>
                    <th className="p-3 text-center">Filleuls Directs</th>
                    <th className="p-3 text-right">Gains</th>
                    <th className="p-3 text-center">Date</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-50 transition">
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-black text-[10px] ${
                            levelInfo[m.relativeLevel - 1]?.color || "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          Niveau {m.relativeLevel}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#0A1931]">{m.userName}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{m.userEmail}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-700">{m.referralCode}</td>
                      <td className="p-3">
                        <div className="font-bold text-zinc-700">{m.sponsorName}</div>
                        <div className="text-[10px] font-mono text-zinc-400">{m.sponsorCode}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-zinc-600 font-medium">{m.branchRootName}</div>
                        <div className="text-[10px] font-mono text-zinc-400">{m.branchRootCode}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-black px-2 py-0.5 rounded-full text-[11px] ${
                            m.directCount === 5
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {m.directCount} / 5
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-emerald-700">
                        {Number(m.totalEarnings || 0).toLocaleString("fr-FR")} F
                      </td>
                      <td className="p-3 text-center text-zinc-400">
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedMember(m)}
                          className="rounded-lg bg-zinc-100 hover:bg-[#0A1931] hover:text-white px-2.5 py-1 text-[11px] font-bold text-zinc-700 transition"
                        >
                          Fiche
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. MODAL / FICHE DÉTAILLÉE D'UN MEMBRE */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] px-2.5 py-0.5 uppercase">
                  Génération {selectedMember.relativeLevel} dans votre réseau
                </span>
                <h4 className="text-xl font-black text-[#0A1931] mt-1.5">
                  {selectedMember.userName}
                </h4>
                <div className="text-xs font-mono text-[#D4AF37] font-bold">
                  {selectedMember.referralCode}
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="rounded-full bg-zinc-100 hover:bg-zinc-200 h-8 w-8 text-sm font-bold text-zinc-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs border-y py-4">
              <div className="flex justify-between">
                <span className="text-zinc-500">Adresse e-mail</span>
                <span className="font-mono font-bold text-zinc-800">{selectedMember.userEmail || "—"}</span>
              </div>
              {selectedMember.userPhone && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Téléphone / Contact</span>
                  <span className="font-mono font-bold text-zinc-800">{selectedMember.userPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Parrain Direct (Sponsor)</span>
                <span className="font-bold text-[#0A1931]">
                  {selectedMember.sponsorName} ({selectedMember.sponsorCode})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Chaîne / Branche d'origine</span>
                <span className="font-bold text-zinc-700">
                  {selectedMember.branchRootName || "Lignée directe"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Filleuls directs recrutés</span>
                <span className="font-black text-[#0A1931]">
                  {selectedMember.directCount} / 5 filleuls
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Gains cumulés</span>
                <span className="font-black text-emerald-700">
                  {Number(selectedMember.totalEarnings || 0).toLocaleString("fr-FR")} XOF
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Statut du compte</span>
                <span className="font-bold text-emerald-700">
                  {selectedMember.isActive ? "✓ Actif" : "Inactif"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Date d'inscription</span>
                <span className="text-zinc-700">
                  {selectedMember.createdAt
                    ? new Date(selectedMember.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedMember(null)}
              className="w-full h-10 rounded-xl bg-[#0A1931] text-white font-bold text-xs hover:bg-[#0A1931]/90"
            >
              Fermer la fiche
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
