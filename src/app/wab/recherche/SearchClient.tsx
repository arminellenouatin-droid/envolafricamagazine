"use client";

import { useEffect, useState } from "react";
import { AFRICA_COUNTRIES } from "@/lib/africa-context";
import ConnectButton from "./ConnectButton";
import RichTextContent from "@/components/RichTextContent";

type Profile = {
  id: string;
  fullName: string;
  headline: string;
  companyName?: string;
  industry?: string;
  country: string;
  city?: string;
  about: string;
};

type Post = {
  id: string;
  author: string;
  content: string;
  tags: string[];
};

export default function SearchClient() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const executeSearch = async (searchTerm: string, selectedCountry: string, selectedIndustry: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        country: selectedCountry,
        industry: selectedIndustry,
      });
      const res = await fetch(`/api/wab/search?${params}`);
      const data = await res.json();
      setProfiles(data.profiles ?? []);
      setPosts(data.posts ?? []);
    } catch {
      setProfiles([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialQ = new URLSearchParams(window.location.search).get("q") || "";
    if (initialQ) {
      setQ(initialQ);
      void executeSearch(initialQ, "", "");
    }
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await executeSearch(q, country, industry);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f8] py-10">
      <div className="mx-auto max-w-5xl px-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#087e8b]">
          World Africa Business
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-[#082843]">
          Trouver des professionnels, publications et hashtags
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-7 grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px_auto]"
        >
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Rechercher mot-clé, #hashtag, nom ou métier…"
            className="rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#087e8b]"
          />
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="rounded-xl border border-slate-200 p-3 text-sm outline-none"
          >
            <option value="">Tous les pays</option>
            {AFRICA_COUNTRIES.map((item) => (
              <option key={item.code} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
          <input
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            placeholder="Secteur"
            className="rounded-xl border border-slate-200 p-3 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#087e8b] px-5 py-3 font-bold text-white transition hover:bg-[#06646f] disabled:opacity-50"
          >
            {loading ? "Recherche…" : "Rechercher"}
          </button>
        </form>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Section Profils */}
          <section>
            <h2 className="font-display text-xl font-extrabold text-[#082843]">
              Professionnels
            </h2>
            <div className="mt-4 space-y-3">
              {profiles.map((profile) => (
                <article key={profile.id} className="rounded-2xl bg-white p-5 shadow-sm">
                  <h3 className="font-display font-extrabold text-[#082843]">{profile.fullName}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#087e8b]">{profile.headline}</p>
                  <p className="mt-2 text-xs text-slate-600">
                    {profile.companyName} · {profile.industry} · {profile.city}, {profile.country}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{profile.about}</p>
                  <div className="mt-3">
                    <ConnectButton profileId={profile.id} />
                  </div>
                </article>
              ))}
              {!loading && !profiles.length && (
                <p className="text-sm text-slate-500 bg-white p-4 rounded-xl">
                  Aucun profil trouvé pour cette recherche.
                </p>
              )}
            </div>
          </section>

          {/* Section Publications */}
          <section>
            <h2 className="font-display text-xl font-extrabold text-[#082843]">
              Publications et opportunités
            </h2>
            <div className="mt-4 space-y-3">
              {posts.map((post) => (
                <article key={post.id} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-sm font-bold text-[#082843]">{post.author}</strong>
                    <a
                      href={`/wab/posts/${post.id}`}
                      className="text-xs font-bold text-[#087e8b] hover:underline"
                    >
                      Voir le post →
                    </a>
                  </div>
                  <div
                    className="mt-2 text-sm leading-6 text-slate-800 font-['Arial_Black',sans-serif]"
                    style={{ fontFamily: "'Arial Black', 'Arial Bold', Gadget, sans-serif" }}
                  >
                    <RichTextContent value={post.content} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <a
                        key={tag}
                        href={`/wab/recherche?q=%23${encodeURIComponent(tag.replace(/^#/, ""))}`}
                        className="rounded-full bg-[#e9f7f5] px-3 py-1 text-xs font-bold text-[#087e8b] transition hover:bg-[#d0f0eb]"
                      >
                        #{tag.replace(/^#/, "")}
                      </a>
                    ))}
                  </div>
                </article>
              ))}
              {!loading && !posts.length && (
                <p className="text-sm text-slate-500 bg-white p-4 rounded-xl">
                  Aucune publication correspondante.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
