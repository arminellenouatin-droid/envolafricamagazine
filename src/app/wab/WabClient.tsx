"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CommentsPanel from "./CommentsPanel";
import PostActions from "./PostActions";
import PostMedia from "./PostMedia";
import PostViewTracker from "./PostViewTracker";

type Post = {
  id: string;
  author: string;
  headline: string;
  location: string;
  content: string;
  type: string;
  media?: Array<{ path: string; mimeType: string; name: string }>;
  tags: string[];
  views: number;
  likes: number;
  comments: number;
  isBoosted: boolean;
  createdAt: string;
};

const navItems = [
  { label: "Fil d’actualité", href: "/wab", icon: "dynamic_feed" },
  { label: "Mon réseau", href: "/wab/profil", icon: "hub" },
  { label: "Opportunités", href: "/wab/recherche", icon: "lightbulb" },
  { label: "Salons", href: "/salons", icon: "event_seat" },
  { label: "Messages", href: "/wab#messages", icon: "mail" },
];

function WabMark() {
  return <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#8ee0c0] font-display text-lg font-black text-[#082843] shadow-sm">W</div>;
}

export default function WabClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [type, setType] = useState("text");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visitorCountry, setVisitorCountry] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const marker = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/geo").then((response) => response.json()).then((data) => setVisitorCountry(data.country ?? "")).catch(() => undefined);
  }, []);

  const loadFeed = useCallback(async (nextPage: number, reset = false) => {
    setLoadingFeed(true);
    try {
      const params = new URLSearchParams({ page: String(nextPage) });
      if (visitorCountry) params.set("country", visitorCountry);
      const data = await fetch(`/api/wab/posts?${params}`).then((response) => response.json());
      setPosts((items) => reset ? data.posts ?? [] : [...items, ...(data.posts ?? [])]);
      setPage(nextPage);
      setHasMore(Boolean(data.pagination?.hasMore));
    } finally {
      setLoadingFeed(false);
    }
  }, [visitorCountry]);

  useEffect(() => { loadFeed(1, true); }, [loadFeed]);

  useEffect(() => {
    const boost = new URLSearchParams(window.location.search).get("boost");
    if (!boost) return;
    fetch(`/api/wab/boosts/${boost}/verify`, { method: "POST" }).then((response) => response.json()).then((data) => setMessage(data.active ? "Votre campagne WAB est active." : "Votre paiement est en cours de confirmation.")).catch(() => setMessage("Impossible de confirmer le paiement pour le moment."));
  }, []);

  useEffect(() => {
    const node = marker.current;
    if (!node || !hasMore || loadingFeed) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadFeed(page + 1); }, { rootMargin: "350px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingFeed, loadFeed, page]);

  async function publish() {
    if (!content.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      let media: unknown[] = [];
      if (selectedFile) {
        const upload = new FormData();
        upload.set("file", selectedFile);
        const uploadResponse = await fetch("/api/wab/upload", { method: "POST", body: upload });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadData.error);
        media = [uploadData];
      }
      const response = await fetch("/api/wab/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, type, tags: [], media }) });
      const data = await response.json();
      if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
      if (!response.ok) throw new Error(data.error);
      setPosts((items) => [data.post, ...items]);
      setContent("");
      setSelectedFile(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publication impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f8] pb-20">
      <section className="relative overflow-hidden bg-[#082843] text-white">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#087e8b]/30 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[#8ee0c0]/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-8 lg:px-8 lg:pb-14 lg:pt-12">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-3"><WabMark /><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8ee0c0]">World Africa Business</p><p className="mt-1 text-sm text-slate-300">Le réseau professionnel africain</p></div></div>
            <a href="#publier" className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10">Partager une opportunité <span aria-hidden="true">→</span></a>
          </div>
          <div className="mt-10 max-w-3xl"><h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Les idées africaines méritent un réseau à leur hauteur.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Partagez une expertise, trouvez un partenaire, découvrez une opportunité et construisez des collaborations concrètes sur le continent.</p></div>
          <nav className="mt-9 flex gap-2 overflow-x-auto pb-1" aria-label="Navigation WAB">{navItems.map((item, index) => <a key={item.label} href={item.href} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${index === 0 ? "bg-[#8ee0c0] text-[#082843]" : "bg-white/10 text-slate-200 hover:bg-white/15"}`}><span className="material-symbols-outlined text-[18px]">{item.icon}</span>{item.label}</a>)}</nav>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[220px_minmax(0,1fr)_260px] lg:px-8">
        <aside className="hidden lg:block"><div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="px-3 pb-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#087e8b]">Votre espace</p><nav className="space-y-1">{navItems.map((item, index) => <a key={item.label} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${index === 0 ? "bg-[#e9f7f5] text-[#087e8b]" : "text-slate-600 hover:bg-slate-50"}`}><span className="material-symbols-outlined text-[19px]">{item.icon}</span>{item.label}</a>)}</nav><a href="/wab/profil" className="mt-5 flex items-center justify-center rounded-xl bg-[#082843] px-3 py-3 text-sm font-bold text-white transition hover:bg-[#0d3b62]">Compléter mon profil</a></div></aside>

        <section>
          <div id="publier" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex gap-3"><WabMark /><div className="min-w-0 flex-1"><p className="font-display text-base font-extrabold text-slate-900">Qu’avez-vous à partager aujourd’hui ?</p><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={3} placeholder="Une idée, une opportunité ou une expertise professionnelle…" className="mt-3 w-full resize-none rounded-xl bg-slate-50 p-3 text-sm leading-6 outline-none ring-[#087e8b]/20 transition focus:ring-2" /></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><div className="flex flex-wrap items-center gap-2"><select value={type} onChange={(event) => setType(event.target.value)} aria-label="Type de publication" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><option value="text">Texte</option><option value="opportunity">Opportunité</option><option value="document">Document</option><option value="video">Vidéo</option></select><label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-[#087e8b] hover:text-[#087e8b]">Joindre un média<input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf,.docx,.xlsx,.pptx" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} /></label>{selectedFile && <span className="max-w-[180px] truncate text-xs text-slate-500">{selectedFile.name}</span>}</div><button type="button" disabled={busy || !content.trim()} onClick={publish} className="rounded-lg bg-[#087e8b] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#066671] disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Publication…" : "Publier"}</button></div>{message && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}</div>

          <div className="mt-5 space-y-4">{posts.map((post) => <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">{post.type !== "video" && <PostViewTracker postId={post.id} />}{post.isBoosted && <span className="rounded-full bg-[#fff1c9] px-3 py-1 text-xs font-extrabold text-[#875600]">★ Publication sponsorisée</span>}<div className="mt-3 flex items-start justify-between gap-3"><div><h2 className="font-display text-base font-extrabold text-slate-900">{post.author}</h2><p className="mt-1 text-sm text-slate-500">{post.headline} · {post.location}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">{post.type}</span></div><p className="mt-4 whitespace-pre-line leading-7 text-slate-700">{post.content}</p>{post.media && <PostMedia postId={post.id} media={post.media} />}<div className="mt-4 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-[#e9f7f5] px-3 py-1 text-xs font-bold text-[#087e8b]">#{tag}</span>)}</div><PostActions postId={post.id} initialLikes={post.likes} comments={post.comments} /><CommentsPanel postId={post.id} /><p className="mt-3 text-xs text-slate-400">{post.views} vues</p></article>)}{loadingFeed && <p className="py-6 text-center text-sm font-semibold text-slate-500">Chargement du fil professionnel…</p>}{!loadingFeed && posts.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><span className="material-symbols-outlined text-4xl text-[#087e8b]">forum</span><h2 className="mt-3 font-display text-lg font-extrabold">Le réseau se construit avec vous</h2><p className="mt-2 text-sm text-slate-500">Soyez le premier à partager une opportunité ou une expertise.</p></div>}<div ref={marker} /></div>
        </section>

        <aside className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-[#087e8b]">Salons</p><h2 className="mt-2 font-display text-lg font-extrabold">Échangez en direct</h2><p className="mt-2 text-sm leading-6 text-slate-600">Débats, formations et rencontres professionnelles pour apprendre et créer des liens.</p><a href="/salons" className="mt-4 inline-flex text-sm font-bold text-[#087e8b]">Voir les Salons <span className="ml-1">→</span></a></div><div className="rounded-2xl bg-[#fff3dc] p-5"><p className="text-xs font-bold uppercase tracking-wider text-[#a36300]">Créateurs</p><p className="mt-2 text-sm leading-6 text-slate-700">Les publications peuvent être éligibles à une rémunération après validation manuelle des vues et du temps vidéo.</p></div><div className="rounded-2xl bg-[#082843] p-5 text-white"><p className="text-xs font-bold uppercase tracking-wider text-[#8ee0c0]">Construire ensemble</p><p className="mt-2 text-sm leading-6 text-slate-300">Une compétence, un contact ou une idée peut devenir la prochaine grande opportunité africaine.</p></div></aside>
      </div>
    </main>
  );
}
