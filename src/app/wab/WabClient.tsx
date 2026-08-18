"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CommentsPanel from "./CommentsPanel";
import PostActions from "./PostActions";
import PostMedia from "./PostMedia";
import PostViewTracker from "./PostViewTracker";
import StoriesReelsCarousel from "./StoriesReelsCarousel";
import FollowButton from "./FollowButton";
import MediaInteractions from "./MediaInteractions";
import { WAB_BUSINESS_MONTHLY_PRICE } from "@/lib/wab-access";
import { optimizeSelectedImages } from "@/lib/client-image-optimizer";

type Reel = { id: string; author: string; mediaUrl: string; mimeType: string; caption: string; views: number; likes: number };
type PublishPage = { id: string; name: string; logoUrl?: string; logo_url?: string };
type PublishGroup = { id: string; name: string; privacy: "community" | "private" };

type Post = {
  id: string;
  author: string;
  authorAvatarUrl?: string;
  authorUserId?: string;
  pageId?: string;
  pageName?: string;
  groupId?: string;
  groupName?: string;
  visibility?: "public" | "community" | "group";
  pageLogoUrl?: string;
  publisherName?: string;
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
  sourceType?: string;
  sourceTitle?: string;
  sourceUrl?: string;
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

function LocalAttachmentPreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  if (!url) return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eefcfa] text-[#006874]"><span className="material-symbols-outlined text-[18px]">attach_file</span></span>;
  if (file.type.startsWith("image/")) return <img src={url} alt={`Aperçu de ${file.name}`} className="h-10 w-10 shrink-0 rounded-lg object-cover" />;
  if (file.type.startsWith("video/")) return <video src={url} muted playsInline className="h-10 w-10 shrink-0 rounded-lg bg-black object-cover" />;
  if (file.type.startsWith("audio/")) return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eefcfa] text-[#006874]"><span className="material-symbols-outlined text-[18px]">audio_file</span></span>;
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eefcfa] text-[#006874]"><span className="material-symbols-outlined text-[18px]">description</span></span>;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  if (!raw.trim()) throw new Error(`Le serveur a renvoyé une réponse vide (HTTP ${response.status}).`);
  try { return JSON.parse(raw) as T; } catch { throw new Error(`Réponse serveur invalide (HTTP ${response.status}). Veuillez réessayer.`); }
}

function ModelHeader({ user }: { user: { id: string; nom?: string; prenom?: string; avatar?: string } | null }) {
  const displayName = [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Mon compte";
  return (
    <header className="sticky top-14 z-40 mx-auto w-full max-w-[1200px] border-b border-[#d1e9e6] bg-[#eefcfa]/95 shadow-sm backdrop-blur md:top-0">
      <div className="flex h-16 items-center justify-between px-4 md:px-10">
        <div className="h-8 w-8 overflow-hidden rounded-full">
          {user?.avatar ? <ModelAvatar src={user.avatar} alt={`Photo de profil de ${displayName}`} className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-xs font-bold text-[#006874]">{displayName.slice(0, 1).toUpperCase()}</span>}
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

function ModelSidebar({ user }: { user: { id: string; nom?: string; prenom?: string; avatar?: string } | null }) {
  const displayName = [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Mon compte";
  const initials = displayName.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "W";
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-6 py-4 md:flex md:sticky md:top-16 md:h-[calc(100vh-4rem)]">
      <div className="mb-2 flex flex-col items-start gap-2 px-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-[#d7e5e3] shadow-sm">
            {user?.avatar ? <ModelAvatar src={user.avatar} alt={`Photo de profil de ${displayName}`} className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-lg font-bold text-[#006874]">{initials}</span>}
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-[#001325]">{displayName}</h2>
            <p className="text-sm text-[#43474d]">{user ? "Membre Envol Africa" : "Visiteur WAB"}</p>
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
  const [reels, setReels] = useState<Reel[]>([]);
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
  const [pages, setPages] = useState<PublishPage[]>([]);
  const [groups, setGroups] = useState<PublishGroup[]>([]);
  const [publishTarget, setPublishTarget] = useState<"profile" | "page" | "group">("profile");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [wabSubscriptionLoading, setWabSubscriptionLoading] = useState(false);
  const [wabSubscriptionMessage, setWabSubscriptionMessage] = useState("");
  const [upgradeRequired, setUpgradeRequired] = useState<"video" | "large" | null>(null);
  const [commentSignals, setCommentSignals] = useState<Record<string, number>>({});
  const marker = useRef<HTMLDivElement>(null);

  useEffect(() => { fetch("/api/auth/me").then((response) => response.json()).then((data) => setCurrentUser(data.user ?? null)).catch(() => setCurrentUser(null)); fetch("/api/wab/pages").then((response) => response.json()).then((data) => setPages(data.pages ?? [])).catch(() => setPages([])); fetch("/api/wab/groups").then((response) => response.json()).then((data) => setGroups(data.groups ?? [])).catch(() => setGroups([])); fetch("/api/wab/reels").then((response) => response.json()).then((data) => setReels(data.reels ?? [])).catch(() => setReels([])); const draft = sessionStorage.getItem("wab-publish-draft"); if (draft) { try { const parsed = JSON.parse(draft) as { content?: string; type?: string }; setContent(parsed.content || ""); setType(parsed.type || "text"); setPublishOpen(true); } catch { sessionStorage.removeItem("wab-publish-draft"); } } }, []);
  useEffect(() => { fetch("/api/geo").then((response) => readJsonResponse<{ country?: string }>(response)).then((data) => setVisitorCountry(data.country ?? "")).catch(() => undefined); fetch("/api/wab/subscription").then((response) => response.json()).then((data) => setIsBusiness(Boolean(data.subscription))).catch(() => setIsBusiness(false)).finally(() => setAccountLoaded(true)); }, []);
  useEffect(() => { const params = new URLSearchParams(window.location.search); const subscriptionId = params.get("wab_subscription_id"); const paymentId = params.get("paymentId") || params.get("payment_id"); if (!subscriptionId || !paymentId || (!params.get("verify") && !params.get("mock_success"))) return; fetch("/api/wab/subscription", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscriptionId, paymentId }) }).then((response) => response.json().then((data) => ({ response, data }))).then(({ response, data }) => { if (!response.ok) throw new Error(data.error || "Paiement WAB non confirmé."); setIsBusiness(true); setWabSubscriptionMessage("Votre compte Entreprise WAB est actif. Vous pouvez publier des vidéos."); window.history.replaceState({}, "", "/wab"); }).catch((error) => setWabSubscriptionMessage(error instanceof Error ? error.message : "Vérification du paiement WAB impossible.")); }, []);

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
  function chooseType(nextType: string) { setMessage(""); setType(nextType); }
  async function chooseFiles(files: FileList | null) {
    const picked = Array.from(files ?? []).slice(0, 10);
    if (!picked.length) return;
    setMessage("Optimisation des images en cours…");
    try {
      const result = await optimizeSelectedImages(picked);
      setSelectedFiles(result.files);
      if (result.savedBytes > 0) setMessage(`Images optimisées avant publication : ${(result.savedBytes / 1024 / 1024).toFixed(1)} Mo économisés.`);
      else setMessage("");
      if (result.files.some((file) => file.type.startsWith("video/"))) setType("video");
      else if (result.files.some((file) => !file.type.startsWith("image/") && !file.type.startsWith("audio/"))) setType("document");
      else setType("text");
    } catch {
      setSelectedFiles(picked);
      setMessage("Une image n’a pas pu être optimisée ; le fichier original sera utilisé.");
    }
  }
  function removeFile(index: number) { setSelectedFiles((files) => files.filter((_, fileIndex) => fileIndex !== index)); }
  async function startWabSubscription() { sessionStorage.setItem("wab-publish-draft", JSON.stringify({ content, type })); setWabSubscriptionLoading(true); setWabSubscriptionMessage(""); try { const response = await fetch("/api/wab/subscription", { method: "POST" }); const data = await response.json(); if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; } if (!response.ok || !data.checkout_url) throw new Error(data.error || "Le paiement WAB est indisponible."); window.location.assign(data.checkout_url); } catch (error) { setWabSubscriptionMessage(error instanceof Error ? error.message : "Activation du compte Entreprise WAB impossible."); } finally { setWabSubscriptionLoading(false); } }

  async function publish() {
    if (!content.trim()) return;
    if (!accountLoaded) { setMessage("Vérification de votre compte WAB en cours…"); return; }
    const hasVideo = selectedFiles.some((file) => file.type.startsWith("video/"));
    const hasLargeMedia = selectedFiles.some((file) => file.size > 10 * 1024 * 1024);
    if (!isBusiness && (hasVideo || hasLargeMedia)) { setUpgradeRequired(hasVideo ? "video" : "large"); return; }
    setBusy(true); setMessage("");
    try {
      let media: unknown[] = [];
      for (const file of selectedFiles) {
        const upload = new FormData(); upload.set("file", file);
        const uploadResponse = await fetch("/api/wab/upload", { method: "POST", body: upload });
        const uploadData = await readJsonResponse<{ error?: string; path?: string; mimeType?: string; name?: string }>(uploadResponse);
        if (!uploadResponse.ok) throw new Error(uploadData.error); media.push(uploadData);
      }
      const response = await fetch("/api/wab/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, type, tags: [], media, pageId: publishTarget === "page" ? selectedPageId : undefined, groupId: publishTarget === "group" ? selectedGroupId : undefined }) });
      const data = await readJsonResponse<{ error?: string; upgradeUrl?: string; post?: Post }>(response);
      if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
      if (response.status === 403 && data.upgradeUrl) { setUpgradeRequired(hasVideo ? "video" : "large"); return; }
      if (!response.ok) throw new Error(data.error);
      if (!data.post) throw new Error("La publication n’a pas été renvoyée par le serveur.");
      setPosts((items) => [data.post!, ...items]); setContent(""); setSelectedFiles([]); setPublishOpen(false); setUpgradeRequired(null); sessionStorage.removeItem("wab-publish-draft");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Publication impossible."); }
    finally { setBusy(false); }
  }

  return (
    <><main className="min-h-screen bg-[#e9f7f5] pb-20 font-body text-[#111e1d] md:pb-0">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-3 md:flex-row md:gap-6 md:px-10 md:py-6">
        <ModelSidebar user={currentUser} />
        <section className="flex w-full max-w-[800px] flex-1 flex-col gap-6">
          <StoriesReelsCarousel />
          <div id="publier" className="flex items-center gap-3 rounded-3xl border border-[#d1e9e6] bg-white p-4 shadow-[0_2px_8px_rgba(8,40,67,0.08)]"><div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#d7e5e3]">{currentUser?.avatar ? <img src={currentUser.avatar} alt="Votre photo de profil" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-sm font-bold text-[#006874]">{[currentUser?.prenom, currentUser?.nom].filter(Boolean).map((part) => part![0]).join("").slice(0, 2).toUpperCase() || "W"}</span>}</div><button type="button" onClick={() => setPublishOpen(true)} className="min-w-0 flex-1 rounded-full bg-[#eefcfa] px-4 py-3 text-left text-sm text-[#43474d] hover:border-[#006874]">What’s on your mind?</button></div>
          {publishOpen && <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#001325]/60 p-3 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Créer une publication"><div className="my-2 max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:my-4 sm:max-h-[calc(100dvh-2rem)] sm:p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-xl font-extrabold text-[#082843]">Créer une publication</h2><p className="mt-1 text-xs text-[#43474d]">Partagez un texte, un document, une image, un audio ou une vidéo.</p></div><button type="button" onClick={() => setPublishOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eefcfa] text-[#006874]" aria-label="Fermer"><span className="material-symbols-outlined">close</span></button></div><textarea autoFocus value={content} onChange={(event) => setContent(event.target.value)} rows={5} placeholder="Que souhaitez-vous partager ?" className="mt-4 min-h-32 w-full resize-y rounded-2xl border border-[#d1e9e6] bg-[#eefcfa] p-4 text-sm leading-6 outline-none focus:border-[#006874]" /><div className="mt-4 rounded-2xl border border-[#d1e9e6] bg-white p-3"><div className="grid gap-3 sm:grid-cols-[180px_1fr]"><label className="text-xs font-bold text-[#43474d]">Publier dans<select value={publishTarget} onChange={(event) => { const value = event.target.value as "profile" | "page" | "group"; setPublishTarget(value); setSelectedPageId(""); setSelectedGroupId(""); }} className="mt-1 w-full rounded-xl border border-[#d1e9e6] bg-[#eefcfa] px-3 py-3 text-sm text-[#082843]"><option value="profile">Mon profil</option><option value="page" disabled={!pages.length}>Une page</option><option value="group" disabled={!groups.length}>Un groupe</option></select></label>{publishTarget === "page" && <label className="text-xs font-bold text-[#43474d]">Choisir la page<select value={selectedPageId} onChange={(event) => setSelectedPageId(event.target.value)} required className="mt-1 w-full rounded-xl border border-[#d1e9e6] bg-[#eefcfa] px-3 py-3 text-sm text-[#082843]"><option value="">Sélectionner…</option>{pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}</select></label>}{publishTarget === "group" && <label className="text-xs font-bold text-[#43474d]">Choisir le groupe<select value={selectedGroupId} onChange={(event) => setSelectedGroupId(event.target.value)} required className="mt-1 w-full rounded-xl border border-[#d1e9e6] bg-[#eefcfa] px-3 py-3 text-sm text-[#082843]"><option value="">Sélectionner…</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}{group.privacy === "private" ? " · privé" : ""}</option>)}</select></label>}</div><p className="mt-2 text-[11px] leading-5 text-[#687274]">Les comptes Premium publient publiquement. Les comptes ordinaires restent visibles à leur communauté. Dans un groupe, les membres actifs peuvent publier.</p></div><div className="mt-4 rounded-2xl border border-[#d1e9e6] bg-[#f7fcfb] p-3"><div className="flex flex-wrap items-center gap-3"><label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#e9f7f5] px-4 text-xs font-bold text-[#006874] transition hover:bg-[#d7f2ee]" aria-label="Ajouter des pièces jointes"><span className="material-symbols-outlined text-[20px]">attach_file</span><span>Ajouter un fichier</span><input type="file" multiple className="hidden" accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv" onChange={(event) => chooseFiles(event.target.files)} /></label><span className="text-xs text-[#43474d]">Image, document, audio ou vidéo</span><span className="ml-auto text-[11px] text-[#687274]">10 Mo inclus · 50 Mo maximum</span></div>{selectedFiles.length > 0 && <div className="mt-3 space-y-2">{selectedFiles.map((file, index) => <div key={`${file.name}-${file.lastModified}`} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs"><LocalAttachmentPreview file={file} /><span className="min-w-0 flex-1 truncate text-[#111e1d]">{file.name}</span><span className="shrink-0 text-[10px] text-[#687274]">{(file.size / 1024 / 1024).toFixed(1)} Mo</span><button type="button" onClick={() => removeFile(index)} className="grid h-8 w-8 place-items-center rounded-full text-[#687274] hover:bg-[#eefcfa] hover:text-[#9e001f]" aria-label={`Retirer ${file.name}`}><span className="material-symbols-outlined text-[17px]">close</span></button></div>)}</div>}</div><div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end"><button type="button" onClick={() => setPublishOpen(false)} className="min-h-11 rounded-xl border border-[#c3c6ce] px-4 py-3 text-xs font-bold text-[#43474d]">Annuler</button><button type="button" disabled={busy || !content.trim() || (publishTarget === "page" && !selectedPageId) || (publishTarget === "group" && !selectedGroupId)} onClick={publish} className="min-h-11 rounded-xl bg-[#006874] px-5 py-3 text-xs font-bold text-white disabled:opacity-40">{busy ? "Publication…" : "Publier"}</button></div>{message && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{message}</p>}</div></div>}
          {upgradeRequired && <div className="fixed inset-0 z-[80] grid place-items-center bg-[#001325]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="wab-upgrade-title"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff3dc] text-[#a36300]"><span className="material-symbols-outlined">workspace_premium</span></div><h2 id="wab-upgrade-title" className="mt-4 font-display text-xl font-extrabold text-[#082843]">Compte Entreprise WAB requis</h2><p className="mt-3 text-sm leading-6 text-[#43474d]">{upgradeRequired === "video" ? "Pour publier une vidéo, vous devez avoir un compte Entreprise WAB actif." : "Pour publier un média de plus de 10 Mo, vous devez avoir un compte Entreprise WAB actif."}</p><p className="mt-3 rounded-xl bg-[#eefcfa] p-3 text-xs leading-5 text-[#006874]">L’abonnement Entreprise coûte {WAB_BUSINESS_MONTHLY_PRICE.toLocaleString("fr-FR")} XOF par mois. Après le paiement, revenez dans WAB pour finaliser votre publication.</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setUpgradeRequired(null)} className="min-h-11 rounded-xl border border-[#c3c6ce] px-4 py-3 text-xs font-bold text-[#43474d]">Continuer sans publier</button><button type="button" disabled={wabSubscriptionLoading} onClick={startWabSubscription} className="min-h-11 rounded-xl bg-[#006874] px-4 py-3 text-xs font-bold text-white disabled:opacity-50">{wabSubscriptionLoading ? "Ouverture du paiement…" : "Créer mon compte Entreprise"}</button></div></div></div>}

          <div className="flex flex-col gap-6">
            {posts.map((post, index) => <><article key={post.id} className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-[#d1e9e6] bg-white p-5 shadow-[0_2px_8px_rgba(8,40,67,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(8,40,67,0.12)]">
                {index === 0 || post.isBoosted ? <div className="premium-gradient absolute inset-x-0 top-0 h-1" /> : null}
                {post.isBoosted && <span className="absolute right-5 top-5 rounded-full bg-[#fff0c7] px-2 py-1 text-[10px] font-bold text-[#875600]">Sponsored</span>}
                {post.id === "model-sponsored" ? null : <PostViewTracker postId={post.id} />}
                <div className="flex items-start justify-between gap-3 pt-1"><div className="flex min-w-0 items-center gap-3"><a href={post.pageId ? `/wab/pages/${post.pageId}` : `/wab/profil?author=${encodeURIComponent(post.author)}`} aria-label={post.pageName ? `Ouvrir la page ${post.pageName}` : `Ouvrir le profil de ${post.author}`} className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#d1e9e6] bg-[#eefcfa] transition hover:scale-105">{post.pageLogoUrl ? <img src={post.pageLogoUrl} alt={post.pageName || "Page WAB"} className="h-full w-full object-contain p-1" /> : <ModelAvatar src={post.authorAvatarUrl || (index === 0 ? MODEL_COMPANY : MODEL_AUTHOR)} alt={`Photo de ${post.author}`} className="h-full w-full object-cover" />}</a><div className="min-w-0"><div className="flex items-center truncate"><a href={post.pageId ? `/wab/pages/${post.pageId}` : `/wab/profil?author=${encodeURIComponent(post.author)}`} className="truncate text-sm font-bold text-[#001325] hover:text-[#006874]">{post.pageName || post.author}</a>{post.pageId && <span className="ml-2 text-[10px] font-semibold text-[#006874]">Page</span>}{!post.pageId && post.authorUserId && post.authorUserId !== currentUser?.id && <FollowButton userId={post.authorUserId} />}</div><p className="truncate text-xs text-[#43474d]">{post.pageId ? (post.publisherName || "Propriétaire de la page") : `${post.headline} · ${post.location}`}</p></div></div><button type="button" aria-label="Plus d’options" className="text-[#43474d]"><span className="material-symbols-outlined">more_horiz</span></button></div>
                <div className="text-sm leading-6 text-[#111e1d]"><p className="mb-3 whitespace-pre-line">{post.content}</p>{post.sourceUrl && <a href={post.sourceUrl} className="mb-3 flex items-center gap-2 rounded-xl bg-[#eefcfa] px-4 py-3 text-xs font-extrabold text-[#006874] transition hover:bg-[#d7f2ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006874]"><span className="material-symbols-outlined text-[18px]">open_in_new</span><span>{post.sourceTitle ? `Lire : ${post.sourceTitle}` : "Lire l’article complet"}</span></a>}<div className="mb-3 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-[#e6f2f3] px-3 py-1 text-[11px] font-semibold text-[#006874]">#{tag}</span>)}</div>{post.media && <PostMedia postId={post.id} media={post.media} />}</div><PostActions postId={post.id} initialLikes={post.likes} initialComments={post.comments} initialShares={post.shares} views={post.views} onComment={() => openComments(post.id)} /><CommentsPanel postId={post.id} openSignal={commentSignals[post.id] ?? 0} onCountChange={(count) => setPosts((items) => items.map((item) => item.id === post.id ? { ...item, comments: count } : item))} /></article>{(index + 1) % 5 === 0 && reels.length > 0 && <article key={`${reels[Math.floor(index / 5) % reels.length].id}-${index}`} className="overflow-hidden rounded-3xl border border-[#d1e9e6] bg-[#082843] text-white shadow-sm"><div className="flex items-center justify-between px-5 pt-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8ee0c0]">Reel recommandé</p><h3 className="mt-1 text-sm font-extrabold">À découvrir dans le fil</h3></div><span className="material-symbols-outlined text-[#8ee0c0]">play_circle</span></div><video src={reels[Math.floor(index / 5) % reels.length].mediaUrl} controls playsInline preload="metadata" className="mt-3 max-h-[520px] w-full bg-black object-cover" /><div className="px-5 py-4"><p className="text-sm font-bold">{reels[Math.floor(index / 5) % reels.length].author}</p><p className="mt-1 text-sm text-slate-200">{reels[Math.floor(index / 5) % reels.length].caption}</p><div className="relative mt-3 min-h-32 overflow-hidden rounded-2xl"><MediaInteractions mediaType="reel" mediaId={reels[Math.floor(index / 5) % reels.length].id} /></div></div></article>}</>)}
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
