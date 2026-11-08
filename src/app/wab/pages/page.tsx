"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SvgIcon from "@/components/ui/Icon";

type PageItem = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  avatarUrl?: string;
  coverUrl?: string;
  description?: string;
  status: string;
  postCount?: number;
};

export default function WabPagesHub() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPages = async () => {
    try {
      const res = await fetch("/api/wab/pages");
      if (res.status === 401) {
        window.location.assign(`/auth/login?next=${encodeURIComponent("/wab/pages")}`);
        return;
      }
      const data = await res.json();
      setPages(Array.isArray(data.pages) ? data.pages : []);
    } catch {
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/wab/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), logoUrl: logoUrl.trim() || undefined, coverUrl: coverUrl.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de créer la page.");
      setShowCreateModal(false);
      setName("");
      setDescription("");
      setLogoUrl("");
      setCoverUrl("");
      loadPages();
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
            <p className="text-xs font-black uppercase tracking-widest text-[#006874]">World Africa Business</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-[#001325]">
              Pages Entreprises & Organisations
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Développez la visibilité de votre société, publiez des actualités officielles et fédérez vos partenaires.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#006874] px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-[#00515b] transition"
          >
            <SvgIcon name="add" className="w-4 h-4" />
            Créer une Page Entreprise
          </button>
        </div>

        {/* List of Pages */}
        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Vos Pages Entreprises gérées
          </h2>

          {loading ? (
            <div className="mt-4 rounded-3xl border border-[#d1e9e6] bg-white p-12 text-center text-sm text-slate-500">
              Chargement de vos pages…
            </div>
          ) : pages.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-[#d1e9e6] bg-white p-10 text-center shadow-xs">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e0f5f2] text-[#006874]">
                <SvgIcon name="domain" className="w-8 h-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#001325]">Vous n&apos;avez pas encore de Page Entreprise</h3>
              <p className="mt-2 text-xs text-slate-600 max-w-md mx-auto">
                Créez une page pour représenter votre société, marque ou institution et toucher la communauté de décideurs WAB.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#006874] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#00515b] transition"
              >
                Créer ma première Page maintenant →
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="overflow-hidden rounded-3xl border border-[#d1e9e6] bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="relative h-28 bg-gradient-to-r from-[#006874] to-[#0a9396]">
                    {page.coverUrl && (
                      <img src={page.coverUrl} alt="" className="h-full w-full object-cover" />
                    )}
                    <div className="absolute -bottom-6 left-5 h-14 w-14 rounded-2xl border-2 border-white bg-white shadow-md overflow-hidden grid place-items-center">
                      {page.logoUrl || page.avatarUrl ? (
                        <img src={page.logoUrl || page.avatarUrl} alt={page.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-display font-black text-[#006874] text-lg">{page.name.slice(0, 1)}</span>
                      )}
                    </div>
                  </div>
                  <div className="p-5 pt-8 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-bold text-[#001325]">{page.name}</h4>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                        {page.description || "Aucune description renseignée."}
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-[#edf2f4] flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-600">Active</span>
                      <Link
                        href={`/wab/pages/${encodeURIComponent(page.id)}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#006874] hover:underline"
                      >
                        Voir la Page →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Créer une Page */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#edf2f4] pb-4">
                <h3 className="text-lg font-bold text-[#001325]">Créer une Page Entreprise</h3>
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

              <form onSubmit={handleCreatePage} className="mt-5 space-y-4 text-xs">
                <label className="block font-semibold text-slate-700">
                  Nom officiel de l&apos;entreprise ou marque *
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex. Orange Afrique, Ecobank, Groupe Talents…"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#006874]"
                  />
                </label>

                <label className="block font-semibold text-slate-700">
                  Description & Activités
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Présentez brièvement vos activités, votre mission et votre secteur…"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#006874]"
                  />
                </label>

                <label className="block font-semibold text-slate-700">
                  URL du Logo (optionnel)
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#006874]"
                  />
                </label>

                <label className="block font-semibold text-slate-700">
                  URL de l&apos;image de couverture (optionnel)
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#006874]"
                  />
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
                    {creating ? "Création…" : "Publier ma Page"}
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
