"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CommentsPanel from "./CommentsPanel";
import PostActions from "./PostActions";
import PostMedia from "./PostMedia";
import PostViewTracker from "./PostViewTracker";
import StoriesReelsCarousel from "./StoriesReelsCarousel";
import WabSocialHeader from "./WabSocialHeader";
import FollowButton from "./FollowButton";
import { WAB_BUSINESS_MONTHLY_PRICE } from "@/lib/wab-access";

type Post = {
  id: string;
  author: string;
  authorAvatarUrl?: string;
  authorUserId?: string;
  headline: string;
  location: string;
  content: string;
  type: string;
  media?: Array<{ path: string; mimeType: string; name: string }>;
  tags: string[];
  views: number;
  likes: number;
  comments: number;
  shares: number;
  isBoosted: boolean;
  createdAt: string;
};

const MODEL_PROFILE = "https://lh3.googleusercontent.com/aida-public/AB6AXuCP8i8YbaB6aZyaZZC63wBgR6VK-jUv8nOXtwZhaB1DeN_-5GvOS00PfYP_toDCPENhRLXZh4kosuIzIiH9_QIPvTnjZ-srpMH5aEPi-2Q5RnrlOBRG9toOU0cbJ-cwLO_A0cU_VBFibitAw5e12jVokum1_sobn7RsIuHbMVLxv1MUCJFOQ1nsbsmOX1l4Q9dxSyOQgSaIURYzeoJ3ZvMulJsfUyJy2_SplFYf7nVZTO-kKCivuN034w";
const MODEL_USER = "https://lh3.googleusercontent.com/aida-public/AB6AXuDevGRAv98kbAvzNJaUXni8T6-B4DVBhtBl4G_23OuMdTQuw11Wf5JV-MyaSQ9Y7VCve06sx7uH3tf3AxmQ732rXSf11RPthDPRbwF6d14GI8Uw18dirwOOawqIjOFB9uF4FCPWXNMTk-fLmyCpg51IKKgpFAXHA_PHy-fGIlsbYxJmkWEcF6tzreVTmDZtE5dFlgq3fKSYX68tDa9GPNuCXLQmO2hKetRJ_sLkxpzVYcBUO1J6gBmA";
const MODEL_AUTHOR = "https://lh3.googleusercontent.com/aida-public/AB6AXuASGW7AYP7OUO_aiISVovBkZr-NKHgbZ9NN6Jk3AtudgDFjT6VAYsgos5mEsmqh-PT7G7ousOkRy8-SyKusZmEYRY0PcYTjH0KHfPohNYuasShz-NdTEi92eLCzFTxFP3t9xC0s9wFETOa770YLPLPktuFaumrWRBdyBCH2ZJe-yXw895vJPLOeLwdXRC32x_Ivr6NXFk-AkzzIYknqsS70S143rioteLMU2tR1JUw7312ye7KyXJiVlg";
const MODEL_COMPANY = "https://lh3.googleusercontent.com/aida-public/AB6AXuCXrXAZUl47x4By1KHD8eBuS7xN_j03DfFIQOeKFbC9hpiYX_WvE808iYSDcLcvENaQ8vCpj3deim5_0dJb3StEv8TznpY5Pd4aNwSXQAGX5s_0Uqzkw2kPzvMrs842AqSybybG1dzfxpmRcfXPUJSY_dNjYcMiUqm6mKaUXYm5GayopwpKrWdj0xXwFBDdLhsFJK3pDPkGS7NVgdc19vqGzEdXX9nA0yktK9FXN6LL6mgB-QYb8p4eyw";
const MODEL_SPONSORED = "https://lh3.googleusercontent.com/aida-public/AB6AXuAgX3mnaOeU-bTi7JaTw_hF-FCeOQQ92X9YvRRLKfVwXmaNsLgdlV2me8XRW553qwZi-OVGFRpH8PTrLNb_wpcumzbDypy7SHfxxBclxZZAF_SZq_xc8Zb-c7drpTY_YQl3s_VLLBXMq-2SqhDrZdOVN4OMc6fX2RTv1fTDTHRKj-LRVBeohHwQri14xKrojM7mxay36oewplnH9m-XgJ8fji9MFwGYQIaJugs77ej1vifgP8sfgZ9JZw";

const modelNav = [
  { label: "Feed", href: "/wab", icon: "newspaper" },
  { label: "Network", href: "/wab/profil", icon: "share_reviews" },
  { label: "Salons", href: "/salons", icon: "forum" },
  { label: "Rewards", href: "/wab/createur", icon: "workspace_premium" },
  { label: "Settings", href: "/compte/parametres", icon: "settings" },
  { label: "Admin", href: "/wab/admin", icon: "admin_panel_settings" },
];

const mobileModelNav = [
  { label: "Home", href: "/wab", icon: "home" },
  { label: "Search", href: "/wab/recherche", icon: "search" },
  { label: "Post", href: "#publier", icon: "add_box" },
  { label: "Rooms", href: "/salons", icon: "groups" },
  { label: "Profile", href: "/wab/profil", icon: "person" },
];

function ModelAvatar({ src, alt, className }: { src: string; alt: string; className: string }) {
  return <img src={src} alt={alt} className={className} />;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  if (!raw.trim()) throw new Error(`Le serveur a renvoyé une réponse vide (HTTP ${response.status}).`);
  try { return JSON.parse(raw) as T; } catch { throw new Error(`Réponse serveur invalide (HTTP ${response.status}). Veuillez réessayer.`); }
}

function ModelHeader() {
  return (
    <header className="sticky top-14 z-40 mx-auto w-full max-w-[1200px] border-b border-[#d1e9e6] bg-[#eefcfa]/95 shadow-sm backdrop-blur md:top-0">
      <div className="flex h-16 items-center justify-between px-4 md:px-10">
        <div className="h-8 w-8 overflow-hidden rounded-full">
          <ModelAvatar src={MODEL_PROFILE} alt="Profil utilisateur" className="h-full w-full object-cover" />
        </div>
        <div className="font-display text-3xl font-bold tracking-tight text-[#001325]">WAB</div>
        <button type="button" aria-label="Rechercher" className="grid h-10 w-10 place-items-center rounded-full text-[#006874] transition hover:bg-[#d7e5e3]">
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>
      <nav className="flex h-12 items-center justify-around border-t border-[#d1e9e6] bg-[#eefcfa] px-2 md:hidden" aria-label="Navigation WAB mobile">
        {mobileModelNav.map((item) => (
          <a key={item.label} href={item.href} className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[#43474d] transition hover:bg-[#d7e5e3]">
            <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
            <span className="truncate text-[9px] font-semibold">{item.label}</span>
          </a>
        ))}
      </nav>
    </header>
  );
}

function ModelSidebar() {
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-6 py-4 md:flex md:sticky md:top-16 md:h-[calc(100vh-4rem)]">
      <div className="mb-2 flex flex-col items-start gap-2 px-4">
        <div className="h-16 w-16 overflow-hidden rounded-full shadow-sm">
          <ModelAvatar src={MODEL_PROFILE} alt="Profil de Abebe Bikila" className="h-full w-full object-cover" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-[#001325]">Abebe Bikila</h2>
          <p className="text-sm text-[#43474d]">Venture Partner</p>
          <span className="premium-text mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#a36300]"><span className="material-symbols-outlined text-[14px]">workspace_premium</span>Premium Member</span>
        </div>
      </div>
      <nav className="flex w-full flex-col gap-1 text-sm font-semibold text-[#006874]" aria-label="Navigation principale WAB">
        {modelNav.map((item, index) => (
          <a key={item.label} href={item.href} className={`flex items-center gap-3 px-4 py-3 transition ${index === 0 ? "translate-x-1 rounded-lg bg-[#93eefc] font-bold text-[#006d79]" : "text-[#43474d] hover:bg-[#e8f6f4]"}`}>
            <span className="material-symbols-outlined text-[21px]">{item.icon}</span>{item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

function ModelActionButton({ icon, label }: { icon: string; label: string }) {
  return <button type="button" className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-[#43474d] transition hover:bg-[#eefcfa] hover:text-[#006874]"><span className="material-symbols-outlined text-[20px]">{icon}</span><span>{label}</span></button>;
}

export default function WabClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [type, setType] = useState("text");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [visitorCountry, setVisitorCountry] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; nom?: string; prenom?: string; avatar?: string } | null>(null);
  const [wabSubscriptionLoading, setWabSubscriptionLoading] = useState(false);
  const [wabSubscriptionMessage, setWabSubscriptionMessage] = useState("");
  const [commentSignals, setCommentSignals] = useState<Record<string, number>>({});
  const marker = useRef<HTMLDivElement>(null);

  useEffect(() => { fetch("/api/auth/me").then((response) => response.json()).then((data) => setCurrentUser(data.user ?? null)).catch(() => setCurrentUser(null)); }, []);
  useEffect(() => { fetch("/api/geo").then((response) => readJsonResponse<{ country?: string }>(response)).then((data) => setVisitorCountry(data.country ?? "")).catch(() => undefined); fetch("/api/wab/subscription").then((response) => response.json()).then((data) => setIsBusiness(Boolean(data.subscription))).catch(() => setIsBusiness(false)).finally(() => setAccountLoaded(true)); }, []);
  useEffect(() => { const params = new URLSearchParams(window.location.search); const subscriptionId = params.get("wab_subscription_id"); const paymentId = params.get("payment_id"); if (!subscriptionId || !paymentId || (!params.get("verify") && !params.get("mock_success"))) return; fetch("/api/wab/subscription", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscriptionId, paymentId }) }).then((response) => response.json().then((data) => ({ response, data }))).then(({ response, data }) => { if (!response.ok) throw new Error(data.error || "Paiement WAB non confirmé."); setIsBusiness(true); setWabSubscriptionMessage("Votre compte Entreprise WAB est actif. Vous pouvez publier des vidéos."); window.history.replaceState({}, "", "/wab"); }).catch((error) => setWabSubscriptionMessage(error instanceof Error ? error.message : "Vérification du paiement WAB impossible.")); }, []);

  const loadFeed = useCallback(async (nextPage: number, reset = false) => {
    setLoadingFeed(true);
    try {
      const params = new URLSearchParams({ page: String(nextPage) });
      if (visitorCountry) params.set("country", visitorCountry);
      const response = await fetch(`/api/wab/posts?${params}`);
      const data = await readJsonResponse<{ posts?: Post[]; pagination?: { hasMore?: boolean } }>(response);
      if (!response.ok) throw new Error((data as { error?: string }).error || `Impossible de charger le fil (HTTP ${response.status}).`);
      setPosts((items) => reset ? data.posts ?? [] : [...items, ...(data.posts ?? [])]);
      setPage(nextPage);
      setHasMore(Boolean(data.pagination?.hasMore));
    } finally { setLoadingFeed(false); }
  }, [visitorCountry]);

  useEffect(() => { loadFeed(1, true); }, [loadFeed]);
  useEffect(() => {
    const node = marker.current;
    if (!node || !hasMore || loadingFeed) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadFeed(page + 1); }, { rootMargin: "350px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingFeed, loadFeed, page]);

  function openComments(postId: string) { setCommentSignals((signals) => ({ ...signals, [postId]: (signals[postId] ?? 0) + 1 })); }
  function chooseType(nextType: string) { if (nextType === "video" && accountLoaded && !isBusiness) { setType("text"); setMessage(`La vidéo est réservée aux comptes Entreprise WAB abonnés à ${WAB_BUSINESS_MONTHLY_PRICE.toLocaleString("fr-FR")} XOF/mois.`); return; } setMessage(""); setType(nextType); }
  function chooseFiles(files: FileList | null) { const next = Array.from(files ?? []).slice(0, 10); if (next.some((file) => file.type.startsWith("video/") && !isBusiness)) { setMessage(`La publication vidéo est réservée aux comptes Entreprise WAB abonnés à ${WAB_BUSINESS_MONTHLY_PRICE.toLocaleString("fr-FR")} XOF/mois.`); return; } setMessage(""); setSelectedFiles(next); }
  async function startWabSubscription() { setWabSubscriptionLoading(true); setWabSubscriptionMessage(""); try { const response = await fetch("/api/wab/subscription", { method: "POST" }); const data = await response.json(); if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; } if (!response.ok || !data.checkout_url) throw new Error(data.error || "Le paiement WAB est indisponible."); window.location.assign(data.checkout_url); } catch (error) { setWabSubscriptionMessage(error instanceof Error ? error.message : "Activation du compte Entreprise WAB impossible."); } finally { setWabSubscriptionLoading(false); } }

  async function publish() {
    if (!content.trim()) return;
    setBusy(true); setMessage("");
    try {
      let media: unknown[] = [];
      for (const file of selectedFiles) {
        const upload = new FormData(); upload.set("file", file);
        const uploadResponse = await fetch("/api/wab/upload", { method: "POST", body: upload });
        const uploadData = await readJsonResponse<{ error?: string; path?: string; mimeType?: string; name?: string }>(uploadResponse);
        if (!uploadResponse.ok) throw new Error(uploadData.error); media.push(uploadData);
      }
      const response = await fetch("/api/wab/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, type, tags: [], media }) });
      const data = await readJsonResponse<{ error?: string; upgradeUrl?: string; post?: Post }>(response);
      if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
      if (response.status === 403 && data.upgradeUrl) { setMessage(data.error || "Un abonnement Business est requis pour publier une vidéo."); return; }
      if (!response.ok) throw new Error(data.error);
      if (!data.post) throw new Error("La publication n’a pas été renvoyée par le serveur.");
      setPosts((items) => [data.post!, ...items]); setContent(""); setSelectedFiles([]); setPublishOpen(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Publication impossible."); }
    finally { setBusy(false); }
  }

  return (
    <><WabSocialHeader avatar={currentUser?.avatar} /><main className="min-h-screen bg-[#e9f7f5] pb-20 font-body text-[#111e1d] md:pb-0">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-3 md:flex-row md:gap-6 md:px-10 md:py-6">
        <ModelSidebar />
        <section className="flex w-full max-w-[800px] flex-1 flex-col gap-6">
          <StoriesReelsCarousel />
          <div id="publier" className="flex items-center gap-3 rounded-3xl border border-[#d1e9e6] bg-white p-4 shadow-[0_2px_8px_rgba(8,40,67,0.08)]"><div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">{currentUser?.avatar ? <img src={currentUser.avatar} alt="Votre photo de profil" className="h-full w-full object-cover" /> : <ModelAvatar src={MODEL_AUTHOR} alt="Avatar de publication" className="h-full w-full object-cover" />}</div><button type="button" onClick={() => setPublishOpen(true)} className="min-w-0 flex-1 rounded-full bg-[#eefcfa] px-4 py-3 text-left text-sm text-[#43474d] hover:border-[#006874]">What’s on your mind?</button></div>
          {publishOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-[#001325]/60 p-4" role="dialog" aria-modal="true" aria-label="Créer une publication"><div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-extrabold text-[#082843]">Créer une publication</h2><button type="button" onClick={() => setPublishOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-[#eefcfa] text-[#006874]" aria-label="Fermer"><span className="material-symbols-outlined">close</span></button></div><textarea autoFocus value={content} onChange={(event) => setContent(event.target.value)} rows={6} placeholder="Que souhaitez-vous partager ?" className="mt-4 w-full resize-none rounded-2xl border border-[#d1e9e6] bg-[#eefcfa] p-4 text-sm outline-none focus:border-[#006874]" /><div className="mt-4 flex items-center justify-between gap-3"><label className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-[#e9f7f5] text-[#006874]" aria-label="Ajouter des pièces jointes"><span className="material-symbols-outlined">attach_file</span><input type="file" multiple className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,audio/wav,audio/ogg,application/pdf,.docx,.xlsx,.pptx" onChange={(event) => chooseFiles(event.target.files)} /></label><span className="min-w-0 flex-1 truncate text-xs text-slate-500">{selectedFiles.length ? `${selectedFiles.length} pièce(s) jointe(s)` : "Ajouter fichier, photo, son ou vidéo"}</span><select value={type} onChange={(event) => chooseType(event.target.value)} aria-label="Type de publication" className="rounded-lg border border-[#c3c6ce] bg-white px-2 py-2 text-xs"><option value="text">Texte</option><option value="opportunity">Opportunité</option><option value="document">Document</option><option value="video">Vidéo</option></select><button type="button" disabled={busy || !content.trim()} onClick={publish} className="rounded-xl bg-[#006874] px-4 py-3 text-xs font-bold text-white disabled:opacity-40">{busy ? "Publication…" : "Publier"}</button></div>{message && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{message}</p>}</div></div>}

          <div className="flex flex-col gap-6">
            {posts.map((post, index) => (
              <article key={post.id} className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-[#d1e9e6] bg-white p-5 shadow-[0_2px_8px_rgba(8,40,67,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(8,40,67,0.12)]">
                {index === 0 || post.isBoosted ? <div className="premium-gradient absolute inset-x-0 top-0 h-1" /> : null}
                {post.isBoosted && <span className="absolute right-5 top-5 rounded-full bg-[#fff0c7] px-2 py-1 text-[10px] font-bold text-[#875600]">Sponsored</span>}
                {post.id === "model-sponsored" ? null : <PostViewTracker postId={post.id} />}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <a href={`/wab/profil?author=${encodeURIComponent(post.author)}`} aria-label={`Ouvrir le profil de ${post.author}`} className="h-12 w-12 shrink-0 overflow-hidden rounded-full transition hover:scale-105"><ModelAvatar src={post.authorAvatarUrl || (index === 0 ? MODEL_COMPANY : MODEL_AUTHOR)} alt={`Photo de ${post.author}`} className="h-full w-full object-cover" /></a>
                    <div className="min-w-0"><div className="flex items-center truncate"><a href={`/wab/profil?author=${encodeURIComponent(post.author)}`} className="truncate text-sm font-bold text-[#001325] hover:text-[#006874]">{post.author}</a><FollowButton userId={post.authorUserId} /></div><p className="truncate text-xs text-[#43474d]">{post.headline} · {post.location}</p></div>
                  </div>
                  <button type="button" aria-label="Plus d’options" className="text-[#43474d]"><span className="material-symbols-outlined">more_horiz</span></button>
                </div>
                <div className="text-sm leading-6 text-[#111e1d]"><p className="mb-3 whitespace-pre-line">{post.content}</p><div className="mb-3 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-[#e6f2f3] px-3 py-1 text-[11px] font-semibold text-[#006874]">#{tag}</span>)}</div>{post.media && <PostMedia postId={post.id} media={post.media} />}</div>
                <PostActions postId={post.id} initialLikes={post.likes} initialComments={post.comments} initialShares={post.shares} views={post.views} onComment={() => openComments(post.id)} />
                <CommentsPanel postId={post.id} openSignal={commentSignals[post.id] ?? 0} onCountChange={(count) => setPosts((items) => items.map((item) => item.id === post.id ? { ...item, comments: count } : item))} />

              </article>
            ))}
            {loadingFeed && <p className="py-8 text-center text-sm font-semibold text-[#43474d]">Chargement du fil professionnel…</p>}
            {!loadingFeed && posts.length === 0 && <div className="rounded-3xl border border-dashed border-[#c3c6ce] bg-white p-10 text-center"><h2 className="font-display text-lg font-bold">Le réseau se construit avec vous</h2><p className="mt-2 text-sm text-[#43474d]">Soyez le premier à partager une opportunité ou une expertise.</p></div>}
            <div ref={marker} className="flex justify-center py-8"><span className="material-symbols-outlined animate-spin text-3xl text-[#006874]">refresh</span></div>
          </div>
          {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
          {wabSubscriptionMessage && <p className="rounded-xl bg-[#fff3dc] p-3 text-sm font-semibold text-[#875600]">{wabSubscriptionMessage}</p>}
        </section>
      </div>
    </main></>
  );
}
