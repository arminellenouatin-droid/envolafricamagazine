"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import CommentsPanel from "./CommentsPanel";
import PostActions from "./PostActions";
import PostMedia from "./PostMedia";
import PostViewTracker from "./PostViewTracker";
import StoriesReelsCarousel from "./StoriesReelsCarousel";
import FollowButton from "./FollowButton";
import DiscoveryCarousel from "./DiscoveryCarousel";
import { hasWabUnlimitedRole, WAB_BUSINESS_MONTHLY_PRICE } from "@/lib/wab-access";
import { optimizeSelectedImages } from "@/lib/client-image-optimizer";
import RichTextEditor from "@/components/RichTextEditor";
import ExpandablePostText from "@/components/wab/ExpandablePostText";
import WabSidebarCards from "@/components/wab/WabSidebarCards";
import { useLocale } from "@/components/LocaleProvider";
import { uploadWabMedia, readJsonResponse } from "@/lib/wab-upload-client";

type PublishPage = { id: string; name: string; logoUrl?: string; logo_url?: string };
type PublishGroup = { id: string; name: string; privacy: "community" | "private" };

type DiscoveryType = "people" | "reels" | "pages" | "groups";

function discoveryTypeForInsertion(publicationCount: number): DiscoveryType | null {
  if (publicationCount === 3) return "people";
  if (publicationCount === 6) return "reels";
  if (publicationCount === 9) return "pages";
  if (publicationCount === 13) return "groups";
  if (publicationCount > 13 && (publicationCount - 13) % 8 === 0) {
    const slot = Math.floor((publicationCount - 13) / 8);
    return (["people", "reels", "pages", "groups"] as DiscoveryType[])[slot % 4];
  }
  return null;
}

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
const MODEL_AUTHOR = "https://lh3.googleusercontent.com/aida-public/AB6AXuASGW7AYP7OUO_aiISVovBkZr-NKHgbZ9NN6Jk3AtudgDFjT6VAYsgos5mEsmqh-PT7G7ousOkRy8-SyKusZmEYRY0PcYTjH0KHfPohNYuasShz-NdTEi92eLCzFTxFP3t9xC0s9wFETOa770YLPLPktuFaumrWRBdyBCH2ZJe-yXw895vJPLOeLwdXRC32x_Ivr6NXFk-AkzzIYknqsS70S143rioteLMU2tR1JUw7312ye7KyXJiVlg";
const MODEL_COMPANY = "https://lh3.googleusercontent.com/aida-public/AB6AXuCXrXAZUl47x4By1KHD8eBuS7xN_j03DfFIQOeKFbC9hpiYX_WvE808iYSDcLcvENaQ8vCpj3deim5_0dJb3StEv8TznpY5Pd4aNwSXQAGX5s_0Uqzkw2kPzvMrs842AqSybybG1dzfxpmRcfXPUJSY_dNjYcMiUqm6mKaUXYm5GayopwpKrWdj0xXwFBDdLhsFJK3pDPkGS7NVgdc19vqGzEdXX9nA0yktK9FXN6LL6mgB-QYb8p4eyw";

const leftNavLinks = [
  { label: "Fil d'actualité", href: "/wab", icon: "newspaper", active: true },
  { label: "Mon Réseau", href: "/wab/profil", icon: "group" },
  { label: "Salons & Événements", href: "/salons", icon: "forum" },
  { label: "Offres d'emploi", href: "/emploi", icon: "work" },
  { label: "Kiosque & Magazines", href: "/kiosque", icon: "menu_book" },
  { label: "Marketplace B2B", href: "/marketplace", icon: "storefront" },
  { label: "Programme d'affiliation", href: "/affiliation", icon: "handshake" },
  { label: "Espace Créateurs", href: "/wab/createur", icon: "workspace_premium" },
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

function SubscriptionMessage({ message }: { message: string }) {
  if (!message) return null;
  return <div role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700">{message}</div>;
}

function formatPostTime(isoDate?: string): string {
  if (!isoDate) return "récemment";
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "À l'instant";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `il y a ${diffDays} j`;
    return new Date(isoDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return "récemment";
  }
}

export default function WabClient({ targetPostId }: { targetPostId?: string } = {}) {
  const { formatPrice } = useLocale();
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
  const [currentUser, setCurrentUser] = useState<{ id: string; nom?: string; prenom?: string; avatar?: string; role?: string } | null>(null);
  const [pages, setPages] = useState<PublishPage[]>([]);
  const [groups, setGroups] = useState<PublishGroup[]>([]);
  const [publishTarget, setPublishTarget] = useState<"profile" | "page" | "group">("profile");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [wabSubscriptionLoading, setWabSubscriptionLoading] = useState(false);
  const [wabSubscriptionMessage, setWabSubscriptionMessage] = useState("");
  const [upgradeRequired, setUpgradeRequired] = useState<"video" | "large" | null>(null);
  const [commentSignals, setCommentSignals] = useState<Record<string, number>>({});
  const [postMenuId, setPostMenuId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [postActionBusy, setPostActionBusy] = useState(false);
  const [postActionMessage, setPostActionMessage] = useState("");
  const [newPostCount, setNewPostCount] = useState(0);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [suggestedFollows, setSuggestedFollows] = useState<Record<string, boolean>>({});
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const marker = useRef<HTMLDivElement>(null);
  const feedTopRef = useRef<HTMLDivElement>(null);
  const postsRef = useRef<Post[]>([]);
  const pendingNewPostsRef = useRef<Post[]>([]);
  const sharedPostRef = useRef<Post | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission("unsupported");
    }
  }, []);

  const enableBrowserNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === "granted") {
        new Notification("Envol Africa - WAB", {
          body: "Notifications activées ! Vous serez alerté des nouvelles publications et actions de vos amis.",
          icon: "/favicon.ico",
        });
      }
    } catch {}
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => setCurrentUser(data.user ?? null))
      .catch(() => setCurrentUser(null));
    fetch("/api/wab/pages")
      .then((response) => response.json())
      .then((data) => setPages(data.pages ?? []))
      .catch(() => setPages([]));
    fetch("/api/wab/groups")
      .then((response) => response.json())
      .then((data) => setGroups(data.groups ?? []))
      .catch(() => setGroups([]));
    const draft = sessionStorage.getItem("wab-publish-draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as { content?: string; type?: string };
        setContent(parsed.content || "");
        setType(parsed.type || "text");
        setPublishOpen(true);
      } catch {
        sessionStorage.removeItem("wab-publish-draft");
      }
    }
  }, []);

  useEffect(() => {
    fetch("/api/geo")
      .then((response) => readJsonResponse<{ country?: string }>(response))
      .then((data) => setVisitorCountry(data.country ?? ""))
      .catch(() => undefined);
    fetch("/api/wab/subscription")
      .then((response) => response.json())
      .then((data) => setIsBusiness(Boolean(data.subscription)))
      .catch(() => setIsBusiness(false))
      .finally(() => setAccountLoaded(true));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionId = params.get("wab_subscription_id");
    const paymentId = params.get("paymentId") || params.get("payment_id");
    if (!subscriptionId || !paymentId || (!params.get("verify") && !params.get("mock_success"))) return;
    fetch("/api/wab/subscription", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId, paymentId })
    })
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(data.error || "Paiement WAB non confirmé.");
        setIsBusiness(true);
        setWabSubscriptionMessage("Votre compte Entreprise WAB est actif. Vous pouvez publier des vidéos et accéder aux fonctions avancées.");
        window.history.replaceState({}, "", "/wab");
      })
      .catch((error) => setWabSubscriptionMessage(error instanceof Error ? error.message : "Vérification du paiement WAB impossible."));
  }, []);

  const loadFeed = useCallback(async (nextPage: number, reset = false) => {
    setLoadingFeed(true);
    try {
      const params = new URLSearchParams({ page: String(nextPage) });
      const response = await fetch(`/api/wab/posts?${params}`);
      const data = await readJsonResponse<{ posts?: Post[]; pagination?: { hasMore?: boolean } }>(response);
      if (!response.ok) throw new Error((data as { error?: string }).error || `Impossible de charger le fil (HTTP ${response.status}).`);
      setPosts((items) => {
        const fetchedPosts = data.posts ?? [];
        const sharedPost = sharedPostRef.current;
        const withSharedPost = sharedPost && !fetchedPosts.some((post) => post.id === sharedPost.id) ? [sharedPost, ...fetchedPosts] : fetchedPosts;
        const nextPosts = reset ? withSharedPost : [...items, ...fetchedPosts.filter((post) => !items.some((item) => item.id === post.id))];
        postsRef.current = nextPosts;
        if (reset) { pendingNewPostsRef.current = []; setNewPostCount(0); }
        return nextPosts;
      });
      setPage(nextPage);
      setHasMore(Boolean(data.pagination?.hasMore));
    } finally { setLoadingFeed(false); }
  }, []);

  useEffect(() => { loadFeed(1, true); }, [loadFeed]);

  const [activeTargetId, setActiveTargetId] = useState<string | null>(targetPostId || null);
  const hasScrolledRef = useRef(false);

  // 1. Détection de l'ID cible (prop, hash #post-[id], ou param ?postId=)
  useEffect(() => {
    if (targetPostId) {
      setActiveTargetId(targetPostId);
      return;
    }
    if (typeof window !== "undefined") {
      const hashId = window.location.hash.match(/^#post-(.+)$/)?.[1];
      const queryId = new URLSearchParams(window.location.search).get("postId") || new URLSearchParams(window.location.search).get("post");
      if (hashId) setActiveTargetId(hashId);
      else if (queryId) setActiveTargetId(queryId);
    }
  }, [targetPostId]);

  // 2. Écouter les changements de hash
  useEffect(() => {
    const onHashChange = () => {
      const hashId = window.location.hash.match(/^#post-(.+)$/)?.[1];
      if (hashId) {
        hasScrolledRef.current = false;
        setActiveTargetId(hashId);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // 3. Charger le post ciblé s'il n'est pas déjà dans le fil
  useEffect(() => {
    if (!activeTargetId) return;

    let cancelled = false;
    if (!postsRef.current.some((p) => p.id === activeTargetId)) {
      fetch(`/api/wab/posts/${encodeURIComponent(activeTargetId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled || !data?.post) return;
          sharedPostRef.current = data.post as Post;
          setPosts((prev) => {
            if (prev.some((p) => p.id === activeTargetId)) return prev;
            const next = [data.post as Post, ...prev];
            postsRef.current = next;
            return next;
          });
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [activeTargetId]);

  // 4. Fonction de défilement précis vers la publication
  const scrollToTargetPost = useCallback((postId: string) => {
    const el = document.getElementById(`post-${postId}`);
    if (!el) return false;

    const rect = el.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetY = rect.top + scrollTop - 85;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: "smooth",
    });

    setHighlightedPostId(postId);
    hasScrolledRef.current = true;

    setTimeout(() => {
      setHighlightedPostId((curr) => (curr === postId ? null : curr));
    }, 4500);

    return true;
  }, []);

  // 5. Scrutation active jusqu'à ce que le post soit rendu et scrollé
  useEffect(() => {
    if (!activeTargetId || hasScrolledRef.current) return;

    let attempts = 0;
    const maxAttempts = 35; // 35 * 100ms = 3.5s

    const timer = setInterval(() => {
      attempts++;
      const done = scrollToTargetPost(activeTargetId);
      if (done || attempts >= maxAttempts) {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [activeTargetId, posts, scrollToTargetPost]);

  // 6. Aligner l'URL sur /wab#post-[id] de manière transparente
  useEffect(() => {
    if (targetPostId && typeof window !== "undefined") {
      try {
        window.history.replaceState(null, "", `/wab#post-${targetPostId}`);
      } catch {}
    }
  }, [targetPostId]);

  useEffect(() => {
    const node = marker.current;
    if (!node || !hasMore || loadingFeed) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadFeed(page + 1); }, { rootMargin: "350px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingFeed, loadFeed, page]);

  useEffect(() => {
    const poll = async () => {
      try {
        const params = new URLSearchParams({ page: "1" });
        const response = await fetch(`/api/wab/posts?${params}`, { cache: "no-store" });
        const data = await readJsonResponse<{ posts?: Post[] }>(response);
        if (!response.ok || !Array.isArray(data.posts) || !data.posts.length) return;
        const knownIds = new Set(postsRef.current.map((post) => post.id));
        const pendingIds = new Set(pendingNewPostsRef.current.map((post) => post.id));
        const incoming = data.posts.filter((post) => !knownIds.has(post.id) && !pendingIds.has(post.id));
        if (!incoming.length) return;

        // Notification Chrome / Navigateur native pour les nouvelles publications d'amis et abonnements
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          const latest = incoming[0];
          const authorName = latest.author || "Un membre du réseau";
          const snippet = latest.content ? latest.content.replace(/<[^>]+>/g, "").slice(0, 100) : "Nouvelle publication sur WAB";
          try {
            const notif = new Notification(`📢 ${authorName} sur WAB`, {
              body: snippet,
              icon: latest.authorAvatarUrl || "/favicon.ico",
              tag: `wab-post-${latest.id}`,
            });
            notif.onclick = () => {
              window.focus();
              const el = document.getElementById(`post-${latest.id}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            };
          } catch {}
        }

        if (window.scrollY < 220) {
          const nextPosts = [...incoming, ...postsRef.current];
          postsRef.current = nextPosts;
          setPosts(nextPosts);
        } else {
          pendingNewPostsRef.current = [...incoming, ...pendingNewPostsRef.current];
          setNewPostCount((count) => count + incoming.length);
        }
      } catch { /* Un rafraîchissement silencieux ne doit pas interrompre le fil. */ }
    };
    const timer = window.setInterval(poll, 30000);
    return () => window.clearInterval(timer);
  }, []);

  function revealNewPosts() {
    const pending = pendingNewPostsRef.current;
    if (pending.length) {
      const knownIds = new Set(postsRef.current.map((post) => post.id));
      const nextPosts = [...pending.filter((post) => !knownIds.has(post.id)), ...postsRef.current];
      postsRef.current = nextPosts;
      setPosts(nextPosts);
    }
    pendingNewPostsRef.current = [];
    setNewPostCount(0);
    feedTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openComments(postId: string) {
    setCommentSignals((signals) => ({ ...signals, [postId]: (signals[postId] ?? 0) + 1 }));
  }

  function triggerComposerWithKind(kind: "photo" | "video" | "document" | "article") {
    if (kind === "video" && !isBusiness && !hasWabUnlimitedRole(currentUser?.role)) {
      setUpgradeRequired("video");
      return;
    }
    setType(kind === "photo" ? "image" : kind === "document" ? "document" : kind === "video" ? "video" : "text");
    setPublishOpen(true);
    if (kind !== "article") {
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 150);
    }
  }

  async function chooseFiles(files: FileList | null) {
    const picked = Array.from(files ?? []).slice(0, 10);
    if (!picked.length) return;
    setMessage("Optimisation des fichiers en cours…");
    try {
      const result = await optimizeSelectedImages(picked);
      setSelectedFiles(result.files);
      if (result.savedBytes > 0) setMessage(`Médias optimisés avant publication : ${(result.savedBytes / 1024 / 1024).toFixed(1)} Mo économisés.`);
      else setMessage("");
      if (result.files.some((file) => file.type.startsWith("video/"))) setType("video");
      else if (result.files.some((file) => !file.type.startsWith("image/") && !file.type.startsWith("audio/"))) setType("document");
      else setType("text");
    } catch {
      setSelectedFiles(picked);
      setMessage("Un fichier n’a pas pu être optimisé ; le fichier original sera utilisé.");
    }
  }

  function removeFile(index: number) {
    setSelectedFiles((files) => files.filter((_, fileIndex) => fileIndex !== index));
  }

  async function startWabSubscription() {
    sessionStorage.setItem("wab-publish-draft", JSON.stringify({ content, type }));
    setWabSubscriptionLoading(true);
    setWabSubscriptionMessage("");
    try {
      const response = await fetch("/api/wab/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      const raw = await response.text();
      let data: { checkout_url?: string; error?: string; active?: boolean } = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { throw new Error("Réponse invalide du serveur de paiement WAB."); }
      if (response.status === 401) {
        window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`);
        return;
      }
      if (!response.ok) throw new Error(data.error || `Le paiement WAB est indisponible (erreur ${response.status}).`);
      if (data.active) {
        setIsBusiness(true);
        setUpgradeRequired(null);
        setWabSubscriptionMessage("Votre compte Entreprise WAB est déjà actif. Vous pouvez publier cette vidéo.");
        return;
      }
      if (!data.checkout_url) throw new Error(data.error || "Aucun lien de paiement n’a été fourni par Moneroo.");
      window.location.assign(data.checkout_url);
    } catch (error) {
      setWabSubscriptionMessage(error instanceof Error ? error.message : "Activation du compte Entreprise WAB impossible.");
    } finally {
      setWabSubscriptionLoading(false);
    }
  }

  async function administerPost(action: "edit" | "delete", post: Post) {
    setPostMenuId(null);
    if (action === "delete") {
      if (!window.confirm("Supprimer définitivement cette publication ?")) return;
      setPostActionBusy(true); setPostActionMessage("");
      try {
        const response = await fetch(`/api/wab/posts/${encodeURIComponent(post.id)}`, { method: "DELETE" });
        const data = await readJsonResponse<{ error?: string }>(response);
        if (!response.ok) throw new Error(data.error || "Suppression impossible.");
        setPosts((items) => items.filter((item) => item.id !== post.id));
        postsRef.current = postsRef.current.filter((item) => item.id !== post.id);
      } catch (error) {
        setPostActionMessage(error instanceof Error ? error.message : "Suppression impossible.");
      } finally {
        setPostActionBusy(false);
      }
      return;
    }
    setEditingPost(post);
    setEditContent(post.content);
    setPostActionMessage("");
  }

  async function saveEditedPost() {
    if (!editingPost || editContent.trim().length < 2) return;
    setPostActionBusy(true); setPostActionMessage("");
    try {
      const response = await fetch(`/api/wab/posts/${encodeURIComponent(editingPost.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent })
      });
      const data = await readJsonResponse<{ error?: string; post?: { content?: string } }>(response);
      if (!response.ok) throw new Error(data.error || "Modification impossible.");
      const nextContent = data.post?.content || editContent;
      setPosts((items) => items.map((item) => item.id === editingPost.id ? { ...item, content: nextContent } : item));
      postsRef.current = postsRef.current.map((item) => item.id === editingPost.id ? { ...item, content: nextContent } : item);
      setEditingPost(null);
    } catch (error) {
      setPostActionMessage(error instanceof Error ? error.message : "Modification impossible.");
    } finally {
      setPostActionBusy(false);
    }
  }

  async function publish() {
    if (!content.trim()) return;
    if (!accountLoaded) { setMessage("Vérification de votre compte WAB en cours…"); return; }
    const hasVideo = selectedFiles.some((file) => file.type.startsWith("video/"));
    const hasLargeMedia = selectedFiles.some((file) => file.size > 10 * 1024 * 1024);
    if (!isBusiness && !hasWabUnlimitedRole(currentUser?.role) && (hasVideo || hasLargeMedia)) {
      setUpgradeRequired(hasVideo ? "video" : "large");
      return;
    }
    setBusy(true); setMessage("");
    try {
      let media: unknown[] = [];
      for (const file of selectedFiles) {
        const uploadData = await uploadWabMedia(file, (status) => setMessage(status));
        media.push(uploadData);
      }
      const response = await fetch("/api/wab/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          type,
          tags: [],
          media,
          pageId: publishTarget === "page" ? selectedPageId : undefined,
          groupId: publishTarget === "group" ? selectedGroupId : undefined
        })
      });
      const data = await readJsonResponse<{ error?: string; upgradeUrl?: string; post?: Post }>(response);
      if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
      if (response.status === 403 && data.upgradeUrl) { setUpgradeRequired(hasVideo ? "video" : "large"); return; }
      if (!response.ok) throw new Error(data.error);
      if (!data.post) throw new Error("La publication n’a pas été renvoyée par le serveur.");
      postsRef.current = [data.post, ...postsRef.current];
      setPosts((items) => [data.post!, ...items]);
      setContent("");
      setSelectedFiles([]);
      setPublishOpen(false);
      setUpgradeRequired(null);
      sessionStorage.removeItem("wab-publish-draft");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publication impossible.");
    } finally {
      setBusy(false);
    }
  }

  const userDisplayName = [currentUser?.prenom, currentUser?.nom].filter(Boolean).join(" ") || "Mon compte";
  const userInitials = userDisplayName.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "W";

  return (
    <main className="min-h-screen bg-[#f3f6f8] pb-20 font-body text-[#111e1d] md:pb-10">
      <div ref={feedTopRef} className="mx-auto max-w-[1240px] px-3 py-4 sm:px-6 lg:px-8">
        
        {/* Toast notifications for new posts */}
        {newPostCount > 0 && (
          <button
            type="button"
            onClick={revealNewPosts}
            aria-live="polite"
            className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-full border border-[#006874] bg-[#006874] px-4 py-2 text-xs font-bold text-white shadow-xl transition hover:bg-[#004e58] focus-visible:outline focus-visible:outline-2"
          >
            ↑ {newPostCount} nouvelle{newPostCount > 1 ? "s" : ""} publication{newPostCount > 1 ? "s" : ""}
          </button>
        )}

        {/* LinkedIn 3-Column Grid */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[250px_1fr] xl:grid-cols-[270px_1fr_310px]">
          
          {/* ========================================================
              LEFT COLUMN: Profile Card & Quick Navigation
              ======================================================== */}
          <aside className="hidden lg:flex flex-col gap-4">
            <WabSidebarCards
              user={currentUser}
              isBusiness={isBusiness}
              onUpgradeClick={() => setUpgradeRequired("large")}
              activeHref="/wab"
            />
          </aside>

          {/* ========================================================
              CENTER COLUMN: LinkedIn Post Composer & Feed
              ======================================================== */}
          <section className="flex min-w-0 flex-1 flex-col gap-4">
            
            {/* Bannière d'activation des notifications Chrome / WAB */}
            {notificationPermission === "default" && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-2.5 text-xs text-emerald-950 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-emerald-700 text-xl shrink-0">notifications_active</span>
                  <p className="truncate font-medium">
                    Soyez alerté en direct des nouvelles publications et actions de vos amis.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={enableBrowserNotifications}
                    className="rounded-full bg-emerald-700 px-3 py-1 font-bold text-white transition hover:bg-emerald-800 text-[11px]"
                  >
                    Activer
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationPermission("denied")}
                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
                    title="Masquer"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              </div>
            )}

            {/* Stories & Reels Carousel */}
            <StoriesReelsCarousel />

            {/* LinkedIn Post Composer Box */}
            <div id="publier" className="rounded-2xl border border-[#d8e2e6] bg-white p-4 shadow-sm">
              {/* Row 1: Avatar + Pill input trigger */}
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#d1e9e6] bg-[#d7e5e3]">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Votre photo de profil" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-sm font-bold text-[#006874]">{userInitials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPublishOpen(true)}
                  className="min-w-0 flex-1 rounded-full border border-[#c5d0d4] bg-[#f8fafb] px-5 py-3 text-left text-xs sm:text-sm font-medium text-[#5f6368] transition hover:border-[#006874] hover:bg-[#eefcfa]"
                >
                  Commencer un post, partager une opportunité...
                </button>
              </div>

              {/* Row 2: 4 LinkedIn Quick Action Buttons */}
              <div className="mt-3 flex items-center justify-between border-t border-[#edf2f4] pt-2">
                <button
                  type="button"
                  onClick={() => triggerComposerWithKind("photo")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-[#43474d] transition hover:bg-[#f3f7f6]"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#0284c7]">photo_library</span>
                  <span className="hidden sm:inline">Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerComposerWithKind("video")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-[#43474d] transition hover:bg-[#f3f7f6]"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#16a34a]">smart_display</span>
                  <span className="hidden sm:inline">Vidéo</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerComposerWithKind("document")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-[#43474d] transition hover:bg-[#f3f7f6]"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#d97706]">description</span>
                  <span className="hidden sm:inline">Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerComposerWithKind("article")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-[#43474d] transition hover:bg-[#f3f7f6]"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#9333ea]">article</span>
                  <span className="hidden sm:inline">Rédiger un article</span>
                </button>
              </div>
            </div>

            {/* Hidden File Picker used by quick action buttons */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv"
              onChange={(event) => {
                chooseFiles(event.target.files);
                setPublishOpen(true);
              }}
            />

            {/* Post Modal Dialog */}
            {publishOpen && (
              <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#001325]/60 p-3 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Créer une publication">
                <div className="my-2 max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:my-4 sm:max-h-[calc(100dvh-2rem)]">
                  
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-[#edf2f4] pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-[#d1e9e6] bg-[#d7e5e3]">
                        {currentUser?.avatar ? (
                          <img src={currentUser.avatar} alt="Profil" className="h-full w-full object-cover" />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-xs font-bold text-[#006874]">{userInitials}</span>
                        )}
                      </div>
                      <div>
                        <h2 className="font-display text-base font-bold text-[#082843]">{userDisplayName}</h2>
                        <div className="flex items-center gap-1.5 text-xs text-[#5f6368]">
                          <span className="material-symbols-outlined text-[14px]">public</span>
                          <span>Publier sur WAB</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPublishOpen(false)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-[#f3f7f6] text-[#43474d] hover:bg-[#eefcfa] hover:text-[#006874]"
                      aria-label="Fermer"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  {/* Rich Text Editor */}
                  <div className="mt-3">
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      placeholder="De quoi souhaitez-vous parler ? Partagez vos idées, projets, opportunités d'affaires..."
                      minHeight={150}
                    />
                  </div>

                  {/* Destination (Profile, Page, Group) */}
                  <div className="mt-4 rounded-xl border border-[#d8e2e6] bg-[#fafcfb] p-3 text-xs">
                    <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                      <label className="font-bold text-[#43474d]">
                        Canal de diffusion
                        <select
                          value={publishTarget}
                          onChange={(e) => {
                            setPublishTarget(e.target.value as "profile" | "page" | "group");
                            setSelectedPageId("");
                            setSelectedGroupId("");
                          }}
                          className="mt-1 w-full rounded-lg border border-[#d1e9e6] bg-white px-3 py-2 text-xs text-[#082843]"
                        >
                          <option value="profile">Mon profil personnel</option>
                          <option value="page" disabled={!pages.length}>Une page d'entreprise</option>
                          <option value="group" disabled={!groups.length}>Un groupe d'affaires</option>
                        </select>
                      </label>

                      {publishTarget === "page" && (
                        <label className="font-bold text-[#43474d]">
                          Choisir la page
                          <select
                            value={selectedPageId}
                            onChange={(e) => setSelectedPageId(e.target.value)}
                            required
                            className="mt-1 w-full rounded-lg border border-[#d1e9e6] bg-white px-3 py-2 text-xs text-[#082843]"
                          >
                            <option value="">Sélectionner une page…</option>
                            {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </label>
                      )}

                      {publishTarget === "group" && (
                        <label className="font-bold text-[#43474d]">
                          Choisir le groupe
                          <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            required
                            className="mt-1 w-full rounded-lg border border-[#d1e9e6] bg-white px-3 py-2 text-xs text-[#082843]"
                          >
                            <option value="">Sélectionner un groupe…</option>
                            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}{g.privacy === "private" ? " (privé)" : ""}</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Attachment Manager */}
                  <div className="mt-4 rounded-xl border border-[#d8e2e6] bg-[#f8fafb] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white border border-[#d1e9e6] px-4 py-2 text-xs font-bold text-[#006874] shadow-sm transition hover:bg-[#eefcfa]">
                        <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                        <span>Ajouter des fichiers</span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv"
                          onChange={(e) => chooseFiles(e.target.files)}
                        />
                      </label>
                      <span className="text-[11px] text-[#5f6368]">Photos, PDF, Word, Excel, Vidéos (max 10 Mo)</span>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selectedFiles.map((file, idx) => (
                          <div key={`${file.name}-${file.lastModified}`} className="flex items-center gap-2 rounded-lg bg-white border border-[#edf2f4] p-2 text-xs">
                            <LocalAttachmentPreview file={file} />
                            <span className="min-w-0 flex-1 truncate font-medium text-[#111e1d]">{file.name}</span>
                            <span className="shrink-0 text-[10px] text-[#5f6368]">{(file.size / 1024 / 1024).toFixed(1)} Mo</span>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="grid h-7 w-7 place-items-center rounded-full text-[#5f6368] hover:bg-red-50 hover:text-red-600"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#edf2f4] pt-3">
                    <button
                      type="button"
                      onClick={() => setPublishOpen(false)}
                      className="rounded-xl border border-[#c3c6ce] px-4 py-2.5 text-xs font-bold text-[#43474d] hover:bg-[#f3f7f6]"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={busy || !content.trim() || (publishTarget === "page" && !selectedPageId) || (publishTarget === "group" && !selectedGroupId)}
                      onClick={publish}
                      className="rounded-xl bg-[#006874] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#004e58] disabled:opacity-40"
                    >
                      {busy ? "Publication en cours…" : "Publier"}
                    </button>
                  </div>

                  {message && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{message}</p>}
                </div>
              </div>
            )}

            {/* Edit Post Modal */}
            {editingPost && (
              <div className="fixed inset-0 z-[80] grid place-items-center bg-[#001325]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-wab-post-title">
                <div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-[#edf2f4] pb-3">
                    <h2 id="edit-wab-post-title" className="font-display text-lg font-extrabold text-[#082843]">Modifier la publication</h2>
                    <button type="button" onClick={() => setEditingPost(null)} aria-label="Fermer" className="grid h-8 w-8 place-items-center rounded-full bg-[#f3f7f6] text-[#43474d]">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                  <div className="mt-3">
                    <RichTextEditor value={editContent} onChange={setEditContent} minHeight={160} />
                  </div>
                  <div className="mt-4 flex justify-end gap-2 border-t border-[#edf2f4] pt-3">
                    <button type="button" onClick={() => setEditingPost(null)} className="rounded-xl border border-[#c3c6ce] px-4 py-2 text-xs font-bold text-[#43474d]">Annuler</button>
                    <button type="button" onClick={() => void saveEditedPost()} disabled={postActionBusy || editContent.trim().length < 2} className="rounded-xl bg-[#006874] px-5 py-2 text-xs font-bold text-white disabled:opacity-50">
                      {postActionBusy ? "Enregistrement…" : "Enregistrer"}
                    </button>
                  </div>
                  {postActionMessage && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{postActionMessage}</p>}
                </div>
              </div>
            )}

            {/* Upgrade Required Modal */}
            {upgradeRequired && (
              <div className="fixed inset-0 z-[80] grid place-items-center bg-[#001325]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="wab-upgrade-title">
                <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff3dc] text-[#a36300]">
                    <span className="material-symbols-outlined">workspace_premium</span>
                  </div>
                  <h2 id="wab-upgrade-title" className="mt-4 font-display text-xl font-extrabold text-[#082843]">Compte Entreprise WAB requis</h2>
                  <p className="mt-3 text-sm leading-6 text-[#43474d]">
                    {upgradeRequired === "video"
                      ? "Pour publier une vidéo sur le réseau WAB, activez votre abonnement Entreprise."
                      : "Pour publier un média lourd de plus de 10 Mo, l’abonnement Entreprise WAB est requis."}
                  </p>
                  <p className="mt-3 rounded-xl bg-[#eefcfa] p-3 text-xs leading-5 text-[#006874]">
                    L’abonnement Entreprise coûte {formatPrice(WAB_BUSINESS_MONTHLY_PRICE)} par mois via Mobile Money ou Carte bancaire.
                  </p>
                  <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => setUpgradeRequired(null)} className="rounded-xl border border-[#c3c6ce] px-4 py-2.5 text-xs font-bold text-[#43474d]">Continuer sans publier</button>
                    <button type="button" disabled={wabSubscriptionLoading} onClick={startWabSubscription} className="rounded-xl bg-[#006874] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                      {wabSubscriptionLoading ? "Ouverture du paiement…" : "Activer mon compte Entreprise"}
                    </button>
                  </div>
                  <SubscriptionMessage message={wabSubscriptionMessage} />
                </div>
              </div>
            )}

            {/* Sort & Feed Divider */}
            <div className="flex items-center justify-between px-2 text-xs text-[#5f6368]">
              <div className="h-px flex-1 bg-[#d8e2e6]" />
              <div className="mx-3 flex items-center gap-1 font-medium">
                <span>Trier par :</span>
                <span className="font-bold text-[#001325]">Plus récents</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </div>
              <div className="h-px flex-1 bg-[#d8e2e6]" />
            </div>

            {/* Feed Posts List */}
            <div className="flex flex-col gap-4">
              {posts.map((post, index) => (
                <Fragment key={post.id}>
                  <article
                    id={`post-${post.id}`}
                    className={`relative flex flex-col gap-3.5 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-all duration-500 sm:p-5 ${
                      highlightedPostId === post.id
                        ? "border-[#006874] ring-4 ring-[#006874]/30 shadow-lg scale-[1.01]"
                        : "border-[#d8e2e6] hover:shadow-md"
                    }`}
                  >
                    {/* Boosted badge & tracker */}
                    {post.isBoosted && (
                      <span className="absolute right-4 top-4 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                        Sponsorisé
                      </span>
                    )}
                    {post.id !== "model-sponsored" && <PostViewTracker postId={post.id} />}

                    {/* Post Header: Author Avatar, Name, Headline, Time & Visibility */}
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <a
                          href={post.pageId ? `/wab/pages/${post.pageId}` : `/wab/profil?author=${encodeURIComponent(post.author)}`}
                          className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#d1e9e6] bg-[#eefcfa] transition hover:opacity-90"
                        >
                          {post.pageLogoUrl ? (
                            <img src={post.pageLogoUrl} alt={post.pageName || "Page WAB"} className="h-full w-full object-contain p-1" />
                          ) : (() => {
                            const effectiveAvatar =
                              (currentUser && post.authorUserId === currentUser.id && currentUser.avatar)
                                ? currentUser.avatar
                                : post.authorAvatarUrl;
                            if (effectiveAvatar) {
                              return (
                                <img
                                  src={effectiveAvatar}
                                  alt={`Photo de ${post.author}`}
                                  className="h-full w-full object-cover"
                                />
                              );
                            }
                            const initial = (post.author || "W").trim().charAt(0).toUpperCase();
                            return (
                              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#006874] to-[#0b8790] text-sm font-bold text-white">
                                {initial}
                              </div>
                            );
                          })()}
                        </a>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 truncate">
                            <a
                              href={post.pageId ? `/wab/pages/${post.pageId}` : `/wab/profil?author=${encodeURIComponent(post.author)}`}
                              className="truncate text-sm font-bold text-[#001325] hover:text-[#006874] hover:underline"
                            >
                              {post.pageName || post.author}
                            </a>
                            {post.pageId && (
                              <span className="rounded-full bg-[#eefcfa] px-2 py-0.5 text-[10px] font-bold text-[#006874] border border-[#d1e9e6]">
                                Page
                              </span>
                            )}
                            {!post.pageId && post.authorUserId && post.authorUserId !== currentUser?.id && (
                              <FollowButton userId={post.authorUserId} />
                            )}
                          </div>
                          <p className="truncate text-xs text-[#5f6368]">
                            {post.pageId
                              ? (post.publisherName || "Page d'entreprise")
                              : (post.headline ? `${post.headline}` : "Membre Envol Africa")}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#82888e]">
                            <a
                              href={`#post-${post.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                hasScrolledRef.current = false;
                                setActiveTargetId(post.id);
                                window.history.replaceState(null, "", `#post-${post.id}`);
                                scrollToTargetPost(post.id);
                              }}
                              className="hover:underline hover:text-[#006874] transition-colors"
                              title="Lien direct vers cette publication"
                            >
                              {formatPostTime(post.createdAt)}
                            </a>
                            <span>·</span>
                            <span className="material-symbols-outlined text-[13px]" title="Visible publiquement">public</span>
                            {post.location && (
                              <>
                                <span>·</span>
                                <span>{post.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3 dots menu for author */}
                      {currentUser && post.authorUserId === currentUser.id && (
                        <div className="relative">
                          <button
                            type="button"
                            aria-label="Options de la publication"
                            aria-expanded={postMenuId === post.id}
                            onClick={() => setPostMenuId((curr) => curr === post.id ? null : post.id)}
                            className="grid h-8 w-8 place-items-center rounded-full text-[#5f6368] hover:bg-[#f3f7f6] hover:text-[#001325]"
                          >
                            <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                          </button>
                          {postMenuId === post.id && (
                            <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-[#d8e2e6] bg-white p-1 shadow-xl">
                              <button
                                type="button"
                                onClick={() => administerPost("edit", post)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#43474d] hover:bg-[#f3f7f6]"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>Modifier
                              </button>
                              <button
                                type="button"
                                onClick={() => administerPost("delete", post)}
                                disabled={postActionBusy}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="text-sm leading-relaxed text-[#111e1d]">
                      <ExpandablePostText value={post.content} />

                      {/* Source URL if magazine republication */}
                      {post.sourceUrl && (
                        <a
                          href={post.sourceUrl}
                          className="mt-3 flex items-center justify-between rounded-xl border border-[#d1e9e6] bg-[#f7fcfb] p-3 transition hover:bg-[#eefcfa] group"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-[22px] text-[#006874]">menu_book</span>
                            <div>
                              <p className="text-xs font-bold text-[#006874] group-hover:underline">
                                {post.sourceTitle ? post.sourceTitle : "Lire le numéro dans le Kiosque Envol Africa"}
                              </p>
                              <p className="text-[10px] text-[#5f6368]">Édition officielle Envol Africa Magazine</p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-[18px] text-[#006874] group-hover:translate-x-1 transition-transform">
                            arrow_forward
                          </span>
                        </a>
                      )}

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {post.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-[#f0f4f6] px-2.5 py-0.5 text-[11px] font-semibold text-[#006874]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Media Attachments (Covers, multi-images, documents) */}
                      {post.media && (
                        <div className="mt-3">
                          <PostMedia postId={post.id} media={post.media} />
                        </div>
                      )}
                    </div>

                    {/* LinkedIn Reactions Summary Bar */}
                    <div className="flex items-center justify-between border-t border-[#edf2f4] pt-2 text-[11px] text-[#5f6368]">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center -space-x-1">
                          <span className="grid h-4 w-4 place-items-center rounded-full bg-[#0a66c2] text-[9px] text-white">👍</span>
                          <span className="grid h-4 w-4 place-items-center rounded-full bg-[#df704d] text-[9px] text-white">❤️</span>
                          <span className="grid h-4 w-4 place-items-center rounded-full bg-[#006874] text-[9px] text-white">💡</span>
                        </span>
                        <span>{post.likes || 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => openComments(post.id)} className="hover:underline">
                          {post.comments || 0} commentaire{post.comments > 1 ? "s" : ""}
                        </button>
                        <span>·</span>
                        <span>{post.shares || 0} partage{post.shares > 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Post Action Buttons */}
                    <PostActions
                      postId={post.id}
                      initialLikes={post.likes}
                      initialComments={post.comments}
                      initialShares={post.shares}
                      views={post.views}
                      canBoost={Boolean(currentUser && (post.authorUserId === currentUser.id || (post.pageId && pages.some((p) => p.id === post.pageId))))}
                      onComment={() => openComments(post.id)}
                    />

                    {/* Comments Panel */}
                    <CommentsPanel
                      postId={post.id}
                      openSignal={commentSignals[post.id] ?? 0}
                      onCountChange={(count) => setPosts((items) => items.map((item) => item.id === post.id ? { ...item, comments: count } : item))}
                    />
                  </article>

                  {discoveryTypeForInsertion(index + 1) && (
                    <DiscoveryCarousel type={discoveryTypeForInsertion(index + 1)!} />
                  )}
                </Fragment>
              ))}

              {loadingFeed && (
                <div className="flex items-center justify-center gap-2 py-8 text-xs font-semibold text-[#5f6368]">
                  <span className="material-symbols-outlined animate-spin text-[18px] text-[#006874]">progress_activity</span>
                  <span>Chargement des publications…</span>
                </div>
              )}

              {!loadingFeed && posts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#c3c6ce] bg-white p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-[#006874]">forum</span>
                  <h2 className="mt-2 font-display text-base font-bold text-[#001325]">Aucune publication pour le moment</h2>
                  <p className="mt-1 text-xs text-[#5f6368]">Soyez le premier à partager une opportunité avec la communauté Envol Africa.</p>
                </div>
              )}

              {hasMore ? (
                <div ref={marker} className="flex justify-center py-6">
                  <span className="material-symbols-outlined animate-spin text-2xl text-[#006874]">progress_activity</span>
                </div>
              ) : posts.length > 0 ? (
                <div className="py-6 text-center text-xs font-semibold text-[#82888e]">
                  ✓ Vous êtes à jour dans votre fil d'actualité WAB
                </div>
              ) : null}
            </div>

            {message && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{message}</p>}
            {wabSubscriptionMessage && <p className="rounded-xl bg-[#fff3dc] p-3 text-xs font-semibold text-[#875600]">{wabSubscriptionMessage}</p>}
          </section>

          {/* ========================================================
              RIGHT COLUMN: News & Trends, Network Suggestions, Footer
              ======================================================== */}
          <aside className="hidden xl:flex flex-col gap-4">
            
            {/* WAB News & Tendances (LinkedIn News) */}
            <div className="rounded-2xl border border-[#d8e2e6] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#edf2f4]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#006874]">trending_up</span>
                  <h3 className="font-display text-sm font-bold text-[#001325]">WAB Tendances</h3>
                </div>
                <span className="rounded bg-[#eefcfa] px-1.5 py-0.5 text-[9px] font-bold text-[#006874] uppercase">Live</span>
              </div>

              <div className="mt-3 flex flex-col gap-3 text-xs">
                <a href="/kiosque" className="group block">
                  <p className="font-bold text-[#001325] group-hover:text-[#006874] group-hover:underline">
                    • Tech africaine : levée record de 2,4 Mds $
                  </p>
                  <p className="text-[11px] text-[#82888e] pl-2.5">il y a 2 h · 1 842 lecteurs</p>
                </a>

                <a href="/kiosque" className="group block">
                  <p className="font-bold text-[#001325] group-hover:text-[#006874] group-hover:underline">
                    • ZLECAf : nouveaux corridors logistiques
                  </p>
                  <p className="text-[11px] text-[#82888e] pl-2.5">il y a 4 h · 1 205 lecteurs</p>
                </a>

                <a href="/kiosque" className="group block">
                  <p className="font-bold text-[#001325] group-hover:text-[#006874] group-hover:underline">
                    • Magazine Envol Africa : Édition Spéciale
                  </p>
                  <p className="text-[11px] text-[#82888e] pl-2.5">il y a 6 h · 3 410 lecteurs</p>
                </a>

                <a href="/financement" className="group block">
                  <p className="font-bold text-[#001325] group-hover:text-[#006874] group-hover:underline">
                    • Agrobusiness : 15 pôles régionaux financés
                  </p>
                  <p className="text-[11px] text-[#82888e] pl-2.5">hier · 950 lecteurs</p>
                </a>

                <a href="/emploi" className="group block">
                  <p className="font-bold text-[#001325] group-hover:text-[#006874] group-hover:underline">
                    • Emploi & Cadres : +30% de recrutements
                  </p>
                  <p className="text-[11px] text-[#82888e] pl-2.5">il y a 2 j · 1 540 lecteurs</p>
                </a>
              </div>
            </div>

            {/* Suggestions de connexions (People you may know) */}
            <div className="rounded-2xl border border-[#d8e2e6] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#edf2f4]">
                <h3 className="font-display text-sm font-bold text-[#001325]">Suggestions de relations</h3>
                <a href="/wab/profil" className="text-[11px] font-bold text-[#006874] hover:underline">Voir tout</a>
              </div>

              <div className="mt-3 flex flex-col gap-3.5">
                {[
                  { id: "sug-1", name: "Dr. Amadou Diallo", role: "Directeur Investissement · Dakar", avatar: MODEL_AUTHOR },
                  { id: "sug-2", name: "Aïssatou Traoré", role: "Fondatrice AgriTech · Abidjan", avatar: MODEL_PROFILE },
                  { id: "sug-3", name: "Kwame Mensah", role: "Consultant FinTech · Accra", avatar: MODEL_COMPANY },
                ].map((person) => {
                  const isFollowed = Boolean(suggestedFollows[person.id]);
                  return (
                    <div key={person.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={person.avatar} alt={person.name} className="h-9 w-9 shrink-0 rounded-full object-cover border border-[#d1e9e6]" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[#001325]">{person.name}</p>
                          <p className="truncate text-[10px] text-[#5f6368]">{person.role}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSuggestedFollows((prev) => ({ ...prev, [person.id]: !prev[person.id] }))}
                        className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition ${
                          isFollowed
                            ? "bg-[#edf2f4] text-[#5f6368]"
                            : "border border-[#006874] text-[#006874] hover:bg-[#eefcfa]"
                        }`}
                      >
                        {isFollowed ? "✓ Suivi" : "+ Suivre"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* WAB Entreprise promo card */}
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-[#fffdfa] to-[#fff8ec] p-4 shadow-sm">
              <div className="flex items-center gap-2 text-amber-900">
                <span className="material-symbols-outlined text-[22px] text-amber-700">workspace_premium</span>
                <h4 className="font-display text-xs font-bold uppercase tracking-wider">WAB Entreprise</h4>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-amber-950">
                Développez votre réseau d'affaires auprès de plus de <strong>50 000 décideurs africains</strong>.
              </p>
              <button
                type="button"
                onClick={startWabSubscription}
                disabled={wabSubscriptionLoading}
                className="mt-3 w-full rounded-xl bg-[#a36300] py-2 text-center text-xs font-bold text-white transition hover:bg-[#875600]"
              >
                {wabSubscriptionLoading ? "Ouverture…" : "Découvrir les offres Pro"}
              </button>
            </div>

            {/* LinkedIn Mini Footer */}
            <footer className="px-2 text-center text-[10px] text-[#82888e]">
              <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
                <a href="/a-propos" className="hover:underline">À propos</a>
                <span>·</span>
                <a href="/mentions-legales" className="hover:underline">Conditions</a>
                <span>·</span>
                <a href="/politique-de-confidentialite" className="hover:underline">Confidentialité</a>
                <span>·</span>
                <a href="/contact" className="hover:underline">Assistance</a>
              </div>
              <p className="mt-2 text-[10px] text-[#a0a5aa]">
                Envol Africa Magazine © 2026 · World Africa Business
              </p>
            </footer>
          </aside>

        </div>
      </div>
    </main>
  );
}
