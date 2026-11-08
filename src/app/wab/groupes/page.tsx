"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SvgIcon from "@/components/ui/Icon";

type GroupItem = {
  id: string;
  name: string;
  slug: string;
  category?: string;
  avatarUrl?: string;
  coverUrl?: string;
  description?: string;
  isPrivate: boolean;
  memberCount: number;
};

export default function WabGroupsHub() {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Business & Investissement");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => {
    try {
      const res = await fetch("/api/wab/groups");
      if (res.status === 401) {
        window.location.assign(`/auth/login?next=${encodeURIComponent("/wab/groupes")}`);
        return;
      }
      const data = await res.json();
      setGroups(Array.isArray(data.groups) ? data.groups : []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/wab/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), category, isPrivate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de créer le groupe.");
      setShowCreateModal(false);
      setName("");
      setDescription("");
      loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f7f6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d1e9e6] pb-6">
          <div>
            <Link href="/wab" className="text-xs font-bold text-[#006874] hover:underline flex items-center gap-1 mb-2">
              ← Retour au fil WAB
            </Link>
            <p className="text-xs font-black uppercase tracking-widest text-[#006874]">Communautés & Réseau</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-[#001325]">
              Groupes Thématiques WAB
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Rejoignez des cercles d&apos;échanges professionnels sectoriels ou fondez votre propre communauté.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#006874] px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-[#00515b] transition"
          >
            <SvgIcon name="groups" className="w-4 h-4" />
            Créer un Groupe
          </button>
        </div>

        {/* List of Groups */}
        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Groupes disponibles & Recommandés
          </h2>

          {loading ? (
            <div className="mt-4 rounded-3xl border border-[#d1e9e6] bg-white p-12 text-center text-sm text-slate-500">
              Chargement des groupes…
            </div>
          ) : groups.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-[#d1e9e6] bg-white p-10 text-center shadow-xs">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e0f5f2] text-[#006874]">
                <SvgIcon name="groups" className="w-8 h-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#001325]">Aucun groupe pour le moment</h3>
              <p className="mt-2 text-xs text-slate-600 max-w-md mx-auto">
                Soyez le premier à fonder un groupe thématique autour de votre domaine d&apos;expertise.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#006874] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#00515b] transition"
              >
                Créer un Groupe maintenant →
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="rounded-3xl border border-[#d1e9e6] bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[#e0f5f2] px-3 py-1 text-[10px] font-bold text-[#006874]">
                        {group.category || "Général"}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {group.memberCount || 1} membre{(group.memberCount || 1) > 1 ? "s" : ""}
                      </span>
                    </div>
                    <h4 className="mt-3 text-base font-bold text-[#001325]">{group.name}</h4>
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                      {group.description || "Échanges et opportunités professionnelles."}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#edf2f4] flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {group.isPrivate ? "Groupe Privé" : "Groupe Public"}
                    </span>
                    <Link
                      href={`/wab/groupes/${encodeURIComponent(group.id)}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#006874] px-4 py-2 text-xs font-bold text-white hover:bg-[#00515b] transition"
                    >
                      Rejoindre / Voir →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Créer un Groupe */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#edf2f4] pb-4">
                <h3 className="text-lg font-bold text-[#001325]">Créer un Groupe Thématique</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <SvgIcon name="close" className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateGroup} className="mt-5 space-y-4 text-xs">
                <label className="block font-semibold text-slate-700">
                  Nom du groupe *
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex. Fintech Afrique de l'Ouest, IA & AgriTech…"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#006874]"
                  />
                </label>

                <label className="block font-semibold text-slate-700">
                  Catégorie
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#006874]"
                  >
                    <option value="Business & Investissement">Business & Investissement</option>
                    <option value="Tech, IA & Innovation">Tech, IA & Innovation</option>
                    <option value="Agrobusiness & Industrie">Agrobusiness & Industrie</option>
                    <option value="Finance & Banques">Finance & Banques</option>
                    <option value="Art, Mode & Culture">Art, Mode & Culture</option>
                    <option value="Santé & Éducation">Santé & Éducation</option>
                  </select>
                </label>

                <label className="block font-semibold text-slate-700">
                  Description & Règles du groupe
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez les objectifs du groupe et les profils bienvenus…"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#006874]"
                  />
                </label>

                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#006874] focus:ring-[#006874]"
                  />
                  <span>Groupe Privé (adhésion sur invitation ou validation d&apos;un modérateur)</span>
                </label>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#edf2f4]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl bg-[#006874] px-6 py-2.5 font-bold text-white hover:bg-[#00515b] disabled:opacity-50"
                  >
                    {creating ? "Création…" : "Créer le Groupe"}
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
