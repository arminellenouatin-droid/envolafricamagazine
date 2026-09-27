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
      <div className="rounded-[24px] border border-[#e5bdbb]/80 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#9e001f] border-t-transparent" />
        <p className="mt-4 text-xs font-bold text-[#746665]">Chargement de votre réseau...</p>
      </div>
    );
  }

  if (!data || !data.tree) {
    return (
      <div className="rounded-[24px] border border-[#e5bdbb]/80 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0ef] text-2xl text-[#9e001f]">
          🌳
        </div>
        <h3 className="mt-4 font-serif text-lg font-black text-[#2b2525]">Réseau en attente d&apos;activation</h3>
        <p className="mt-1.5 text-xs text-[#746665] max-w-md mx-auto">
          Partagez votre lien d&apos;affiliation pour inscrire vos 5 premiers filleuls directs et lancer le
          développement de votre réseau sur 5 générations.
        </p>
      </div>
    );
  }

  const levelInfo = [
    { lvl: 1, label: "Génération 1 (Directs)", share: "40%", max: 5, color: "text-[#9e001f] bg-[#fff0ef] border border-[#e5bdbb]" },
    { lvl: 2, label: "Génération 2", share: "25%", max: 25, color: "text-[#944400] bg-[#fff8f3] border border-[#f0b27e]/40" },
    { lvl: 3, label: "Génération 3", share: "15%", max: 125, color: "text-[#1b6b44] bg-[#edf7f2] border border-[#b4e2cc]" },
    { lvl: 4, label: "Génération 4", share: "12%", max: 625, color: "text-[#2b2525] bg-[#f4ecea] border border-[#e5bdbb]" },
    { lvl: 5, label: "Génération 5", share: "8%", max: 3125, color: "text-[#746665] bg-[#fcf9f8] border border-[#e5bdbb]" },
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
          className={`relative flex flex-wrap items-center justify-between gap-3 rounded-[18px] border p-3.5 transition ${
            isRoot
              ? "bg-gradient-to-r from-[#2b2525] to-[#421c22] text-white border-transparent shadow-md"
              : "bg-white border-[#e5bdbb]/80 hover:border-[#9e001f]/50 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black transition ${
                  isRoot
                    ? "bg-white/20 text-[#ffdad8] hover:bg-white/30"
                    : "bg-[#f4ecea] text-[#2b2525] hover:bg-[#9e001f] hover:text-white"
                }`}
                title={isExpanded ? "Replier la branche" : "Déplier la branche"}
              >
                {isExpanded ? "−" : "+"}
              </button>
            ) : (
              <div
                className={`h-2.5 w-2.5 rounded-full ml-2 mr-2.5 ${
                  isRoot ? "bg-[#ffdad8]" : "bg-[#e5bdbb]"
                }`}
              />
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${isRoot ? "text-white" : "text-[#2b2525]"}`}>
                  {node.userName}
                </span>
                {isRoot ? (
                  <span className="rounded-full bg-[#9e001f] border border-[#ffdad8]/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                    👑 Vous (Racine)
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      levelInfo[(node.relativeLevel || 1) - 1]?.color || "bg-[#f4ecea] text-[#2b2525]"
                    }`}
                  >
                    G{node.relativeLevel} • {node.relativeLevel === 1 ? "Filleul direct" : `Sous-filleul G${node.relativeLevel}`}
                  </span>
                )}
              </div>
              <div className={`mt-0.5 flex flex-wrap items-center gap-2 text-xs font-mono ${isRoot ? "text-white/80" : "text-[#746665]"}`}>
                <span className="font-bold text-[#9e001f]">{node.referralCode}</span>
                {node.userEmail && <span>• {node.userEmail}</span>}
                {node.sponsorName && !isRoot && (
                  <span className="text-[#746665]/80">
                    • Parrainé par : <strong className="text-[#2b2525]">{node.sponsorName}</strong> ({node.sponsorCode})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-[10px] uppercase font-bold ${isRoot ? "text-white/70" : "text-[#746665]"}`}>
                Filleuls directs
              </div>
              <div className={`text-xs font-black ${isRoot ? "text-white" : "text-[#2b2525]"}`}>
                {node.children.length} / 5
              </div>
            </div>

            <div className="text-right">
              <div className={`text-[10px] uppercase font-bold ${isRoot ? "text-white/70" : "text-[#746665]"}`}>
                Gains cumulés
              </div>
              <div className="text-xs font-black text-[#9e001f] font-mono">
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
                className="rounded-lg bg-[#f4ecea] hover:bg-[#9e001f] hover:text-white px-2.5 py-1.5 text-[11px] font-bold text-[#2b2525] transition"
              >
                Détails
              </button>
            )}
          </div>
        </div>

        {/* Sous-branches */}
        {hasChildren && isExpanded && (
          <div className="relative pl-6 md:pl-8 ml-4 md:ml-6 mt-3 border-l-2 border-dashed border-[#e5bdbb] space-y-3">
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
        <div className="rounded-[20px] bg-[#9e001f] p-5 text-white shadow-md border border-[#800019]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#ffdad8]">
            Taille Totale du Réseau
          </div>
          <div className="mt-2 text-3xl font-serif font-black">{data.totalNetworkCount}</div>
          <div className="mt-1 text-[11px] text-white/80">Ambassadeurs dans vos 5 niveaux</div>
        </div>

        <div className="rounded-[20px] bg-white border border-[#e5bdbb]/80 p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#746665]">
            Filleuls Directs (N1)
          </div>
          <div className="mt-2 text-3xl font-serif font-black text-[#2b2525]">
            {data.directCount} <span className="text-sm font-bold text-[#746665]/60">/ 5</span>
          </div>
          <div className="mt-1 text-[11px] text-[#746665]">
            {5 - data.directCount > 0
              ? `Encore ${5 - data.directCount} place(s) disponible(s)`
              : "Matrice directe complète (5/5)"}
          </div>
        </div>

        <div className="rounded-[20px] bg-white border border-[#e5bdbb]/80 p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#746665]">
            Profondeur Active
          </div>
          <div className="mt-2 text-3xl font-serif font-black text-[#2b2525]">
            {data.networkDepth} <span className="text-sm font-bold text-[#746665]/60">/ 5</span>
          </div>
          <div className="mt-1 text-[11px] text-[#746665]">
            {data.networkDepth >= 3 ? "✓ Éligible au Fonds Prime Annuelle" : "Objectif : atteindre N3"}
          </div>
        </div>

        <div className="rounded-[20px] bg-white border border-[#e5bdbb]/80 p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#746665]">
            Branches Actives
          </div>
          <div className="mt-2 text-3xl font-serif font-black text-[#9e001f]">
            {data.branches.filter((b) => b.totalBranchMembers > 0).length}{" "}
            <span className="text-sm font-bold text-[#746665]/60">/ {data.directCount}</span>
          </div>
          <div className="mt-1 text-[11px] text-[#746665]">Chaînes avec descendance</div>
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
                  ? "bg-[#9e001f] text-white border-[#9e001f] shadow-md"
                  : "bg-white border-[#e5bdbb]/80 hover:border-[#9e001f]/50"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-[11px] font-bold uppercase ${isSelected ? "text-[#ffdad8]" : "text-[#746665]"}`}>
                  Niveau {item.lvl}
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isSelected ? "bg-white/20 text-white" : "bg-[#f4ecea] text-[#9e001f]"}`}>
                  {item.share}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className={`text-2xl font-serif font-black ${isSelected ? "text-white" : "text-[#2b2525]"}`}>
                  {count}
                </span>
                <span className={`text-xs ${isSelected ? "text-white/70" : "text-[#746665]/60"}`}>
                  / {item.max}
                </span>
              </div>
              <div className={`mt-1 text-[10px] truncate ${isSelected ? "text-white/80" : "text-[#746665]"}`}>
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Barre de contrôle : Bascule Arbre / Tableau + Filtres */}
      <div className="rounded-[20px] bg-white border border-[#e5bdbb]/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-[#f4ecea] p-1 border border-[#e5bdbb]/60">
            <button
              onClick={() => setViewMode("tree")}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "tree"
                  ? "bg-[#9e001f] text-white shadow-sm"
                  : "text-[#746665] hover:text-[#2b2525]"
              }`}
            >
              <span>🌳</span> Arbre Dynamique
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-[#9e001f] text-white shadow-sm"
                  : "text-[#746665] hover:text-[#2b2525]"
              }`}
            >
              <span>📋</span> Annuaire des Filleuls ({data.totalNetworkCount})
            </button>
          </div>

          {viewMode === "tree" && (
            <div className="flex items-center gap-2 ml-1">
              <button
                onClick={expandAll}
                className="rounded-lg border border-[#e5bdbb] px-2.5 py-1.5 text-xs font-bold text-[#746665] hover:bg-[#fff0ef] hover:text-[#9e001f] hover:border-[#9e001f] transition"
              >
                Tout déplier
              </button>
              <button
                onClick={collapseAll}
                className="rounded-lg border border-[#e5bdbb] px-2.5 py-1.5 text-xs font-bold text-[#746665] hover:bg-[#fff0ef] hover:text-[#9e001f] hover:border-[#9e001f] transition"
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
              className="h-10 px-3 text-xs border border-[#e5bdbb] rounded-xl bg-white font-bold text-[#2b2525] focus:border-[#9e001f] outline-none"
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
                className="h-10 pl-8 pr-3 text-xs border border-[#e5bdbb] rounded-xl bg-white w-52 md:w-64 text-[#2b2525] focus:border-[#9e001f] outline-none"
              />
              <span className="absolute left-2.5 top-2.5 text-xs text-[#746665]">🔍</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. VUE 1 : ARBRE GÉNÉALOGIQUE DYNAMIQUE */}
      {viewMode === "tree" && (
        <div className="rounded-[24px] border border-[#e5bdbb]/80 bg-[#fcf9f8] p-4 md:p-6 shadow-sm space-y-4 overflow-x-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-black text-[#2b2525] flex items-center gap-2">
              <span>🧬</span> Chaîne Généalogique Descendante Complète (5x5)
            </h3>
            <span className="text-xs text-[#746665]">
              Cliquez sur les boutons <code className="font-bold text-[#9e001f]">+ / −</code> pour explorer
              chaque sous-branche
            </span>
          </div>

          <div className="mt-4">{renderTreeNode(data.tree, 0)}</div>
        </div>
      )}

      {/* 5. VUE 2 : ANNUAIRE & CHAÎNES DÉTAILLÉES TABULAIRES */}
      {viewMode === "table" && (
        <div className="rounded-[24px] border border-[#e5bdbb]/80 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#e5bdbb] bg-[#f4ecea] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-base font-black text-[#2b2525]">
                Liste Détaillée des Membres du Réseau
              </h3>
              <p className="text-xs text-[#746665]">
                Affichage de {filteredMembers.length} filleul(s) sur {data.totalNetworkCount}
                {selectedLevel !== "ALL" && ` (Niveau ${selectedLevel})`}
                {selectedBranch !== "ALL" && " (Branche sélectionnée)"}
              </p>
            </div>

            {selectedLevel !== "ALL" && (
              <button
                onClick={() => setSelectedLevel("ALL")}
                className="rounded-full bg-white border border-[#e5bdbb] hover:bg-[#fff0ef] hover:border-[#9e001f] px-3.5 py-1 text-xs font-bold text-[#2b2525] transition"
              >
                Réinitialiser le niveau (Voir tous)
              </button>
            )}
          </div>

          {filteredMembers.length === 0 ? (
            <div className="p-12 text-center text-[#746665] text-xs">
              Aucun filleul ne correspond aux critères sélectionnés.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f4ecea] text-[#2b2525] font-bold uppercase tracking-wider border-b border-[#e5bdbb]">
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
                <tbody className="divide-y divide-[#e5bdbb]/40">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-[#fcf9f8] transition">
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-black text-[10px] ${
                            levelInfo[m.relativeLevel - 1]?.color || "bg-[#f4ecea] text-[#2b2525]"
                          }`}
                        >
                          Niveau {m.relativeLevel}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#2b2525]">{m.userName}</div>
                        <div className="text-[11px] text-[#746665] font-mono">{m.userEmail}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#9e001f]">{m.referralCode}</td>
                      <td className="p-3">
                        <div className="font-bold text-[#2b2525]">{m.sponsorName}</div>
                        <div className="text-[10px] font-mono text-[#746665]">{m.sponsorCode}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-[#2b2525] font-medium">{m.branchRootName}</div>
                        <div className="text-[10px] font-mono text-[#746665]">{m.branchRootCode}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-black px-2 py-0.5 rounded-full text-[11px] ${
                            m.directCount === 5
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-[#f4ecea] text-[#2b2525]"
                          }`}
                        >
                          {m.directCount} / 5
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-[#9e001f] font-mono">
                        {Number(m.totalEarnings || 0).toLocaleString("fr-FR")} F
                      </td>
                      <td className="p-3 text-center text-[#746665]">
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedMember(m)}
                          className="rounded-lg bg-[#f4ecea] hover:bg-[#9e001f] hover:text-white px-2.5 py-1 text-[11px] font-bold text-[#2b2525] transition"
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
          <div className="w-full max-w-md rounded-[24px] bg-white border border-[#e5bdbb] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-[#fff0ef] text-[#9e001f] border border-[#e5bdbb] font-bold text-[10px] px-2.5 py-0.5 uppercase tracking-wide">
                  Génération {selectedMember.relativeLevel} dans votre réseau
                </span>
                <h4 className="font-serif text-xl font-black text-[#2b2525] mt-2">
                  {selectedMember.userName}
                </h4>
                <div className="text-xs font-mono text-[#9e001f] font-bold">
                  {selectedMember.referralCode}
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="rounded-full bg-[#f4ecea] hover:bg-[#e5bdbb] h-8 w-8 text-sm font-bold text-[#2b2525] transition flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs border-y border-[#e5bdbb]/80 py-4">
              <div className="flex justify-between">
                <span className="text-[#746665]">Adresse e-mail</span>
                <span className="font-mono font-bold text-[#2b2525]">{selectedMember.userEmail || "—"}</span>
              </div>
              {selectedMember.userPhone && (
                <div className="flex justify-between">
                  <span className="text-[#746665]">Téléphone / Contact</span>
                  <span className="font-mono font-bold text-[#2b2525]">{selectedMember.userPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#746665]">Parrain Direct (Sponsor)</span>
                <span className="font-bold text-[#2b2525]">
                  {selectedMember.sponsorName} ({selectedMember.sponsorCode})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#746665]">Chaîne / Branche d&apos;origine</span>
                <span className="font-bold text-[#2b2525]">
                  {selectedMember.branchRootName || "Lignée directe"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#746665]">Filleuls directs recrutés</span>
                <span className="font-black text-[#2b2525]">
                  {selectedMember.directCount} / 5 filleuls
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#746665]">Gains cumulés</span>
                <span className="font-serif font-black text-[#9e001f]">
                  {Number(selectedMember.totalEarnings || 0).toLocaleString("fr-FR")} XOF
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#746665]">Statut du compte</span>
                <span className="font-bold text-emerald-700">
                  {selectedMember.isActive ? "✓ Actif" : "Inactif"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#746665]">Date d&apos;inscription</span>
                <span className="text-[#2b2525]">
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
              className="w-full h-11 rounded-xl bg-[#9e001f] text-white font-bold text-xs hover:bg-[#7f0019] shadow-sm transition"
            >
              Fermer la fiche
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
