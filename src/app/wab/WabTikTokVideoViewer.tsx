"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import CommentsPanel from "./CommentsPanel";
import RichTextContent from "@/components/RichTextContent";

export type VideoPostItem = {
  id: string;
  author: string;
  authorAvatarUrl?: string;
  authorUserId?: string;
  pageId?: string;
  pageName?: string;
  headline?: string;
  content: string;
  videoUrl: string;
  videoName?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
};

interface WabTikTokVideoViewerProps {
  initialPostId: string;
  posts: VideoPostItem[];
  onClose: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.max(0, Number(value) || 0));
}

export default function WabTikTokVideoViewer({
  initialPostId,
  posts,
  onClose,
  onLoadMore,
  hasMore = false,
}: WabTikTokVideoViewerProps) {
  // Trouver l'index de départ
  const startIndex = Math.max(0, posts.findIndex((p) => p.id === initialPostId));
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("wab_video_muted") === "true";
    }
    return false;
  });
  const [pausedMap, setPausedMap] = useState<Record<string, boolean>>({});
  const [likesMap, setLikesMap] = useState<Record<string, { count: number; liked: boolean }>>(() => {
    const map: Record<string, { count: number; liked: boolean }> = {};
    posts.forEach((p) => {
      map[p.id] = { count: p.likes, liked: false };
    });
    return map;
  });
  const [sharesMap, setSharesMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    posts.forEach((p) => {
      map[p.id] = p.shares;
    });
    return map;
  });
  const [commentsMap, setCommentsMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    posts.forEach((p) => {
      map[p.id] = p.comments;
    });
    return map;
  });
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [shareModalPostId, setShareModalPostId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const watchTimers = useRef<Map<string, number>>(new Map());
  const sentViews = useRef<Set<string>>(new Set());

  // Sauvegarder la position de défilement de la page mère lors de l'ouverture
  const initialScrollY = useRef(0);
  useEffect(() => {
    if (typeof window !== "undefined") {
      initialScrollY.current = window.scrollY;
    }
  }, []);

  // Fermeture propre avec restauration du défilement
  const handleClose = useCallback(() => {
    // Mettre toutes les vidéos en pause
    videoRefs.current.forEach((vid) => {
      if (vid && !vid.paused) vid.pause();
    });
    onClose();
    // Restaurer le défilement
    if (typeof window !== "undefined") {
      window.scrollTo({ top: initialScrollY.current, behavior: "instant" });
    }
  }, [onClose]);

  // Faire défiler vers un index spécifique
  const scrollToIndex = useCallback((index: number) => {
    if (index < 0 || index >= posts.length) return;
    const targetEl = document.getElementById(`tiktok-item-${posts[index].id}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [posts]);

  // Envoi du tracking de vue sécurisé
  const sendView = useCallback((postId: string, seconds: number) => {
    if (sentViews.current.has(postId)) return;
    sentViews.current.add(postId);
    const visitorId = localStorage.getItem("ea_visitor_id") || crypto.randomUUID();
    localStorage.setItem("ea_visitor_id", visitorId);
    fetch(`/api/wab/posts/${postId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, watchSeconds: Math.round(seconds) }),
    }).catch(() => undefined);
  }, []);

  // Enchaînement automatique : quand la vidéo se termine, passer à la suivante
  const handleVideoEnded = useCallback((postId: string) => {
    const startTime = watchTimers.current.get(postId);
    if (startTime) {
      const nowMs = Date.now();
      const elapsed = (nowMs - startTime) / 1000;
      sendView(postId, elapsed);
      watchTimers.current.delete(postId);
    }
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next < posts.length) {
        const targetEl = document.getElementById(`tiktok-item-${posts[next].id}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return next;
      }
      return prev;
    });
  }, [posts, sendView]);

  // Gestion des touches clavier (Échap pour fermer, Flèches Haut/Bas pour naviguer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeCommentsPostId) {
          setActiveCommentsPostId(null);
        } else if (shareModalPostId) {
          setShareModalPostId(null);
        } else {
          handleClose();
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollToIndex(currentIndex + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollToIndex(currentIndex - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, activeCommentsPostId, shareModalPostId, handleClose, scrollToIndex]);

  // Gestion du retour arrière navigateur (bouton retour Android / Safari)
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.pushState({ wabVideoModal: true }, "");

    const handlePopState = () => {
      handleClose();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [handleClose]);

  // Suivi de la vidéo active par IntersectionObserver dans le container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const postId = entry.target.getAttribute("data-post-id");
            if (!postId) return;
            const newIndex = posts.findIndex((p) => p.id === postId);
            if (newIndex !== -1) {
              setCurrentIndex(newIndex);
            }
          }
        });
      },
      {
        root: container,
        threshold: [0.6],
      }
    );

    const items = container.querySelectorAll(".tiktok-post-slide");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [posts]);

  // Jouer la vidéo active et mettre les autres en pause
  useEffect(() => {
    const currentPost = posts[currentIndex];
    if (!currentPost) return;

    // Déclencher le chargement de la page suivante si on approche de la fin
    if (currentIndex >= posts.length - 2 && hasMore && onLoadMore) {
      onLoadMore();
    }

    videoRefs.current.forEach((vid, id) => {
      if (id === currentPost.id) {
        vid.muted = isMuted;
        vid.play().catch(() => {
          // Autoplay avec son rejeté par le navigateur : fallback muet
          vid.muted = true;
          vid.play().catch(() => {});
        });
        setPausedMap((prev) => ({ ...prev, [id]: false }));
        // Démarrer chrono de vue
        watchTimers.current.set(id, Date.now());
      } else {
        if (!vid.paused) vid.pause();
        setPausedMap((prev) => ({ ...prev, [id]: true }));
        // Enregistrer les secondes regardées
        const startTime = watchTimers.current.get(id);
        if (startTime && !sentViews.current.has(id)) {
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed >= 3) {
            sendView(id, elapsed);
          }
          watchTimers.current.delete(id);
        }
      }
    });
  }, [currentIndex, isMuted, posts, hasMore, onLoadMore, sendView]);

  // Clic sur l'écran vidéo pour Pause / Play
  const togglePlayPause = (postId: string) => {
    const vid = videoRefs.current.get(postId);
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
      setPausedMap((prev) => ({ ...prev, [postId]: false }));
    } else {
      vid.pause();
      setPausedMap((prev) => ({ ...prev, [postId]: true }));
    }
  };

  // Bascule du son global
  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      sessionStorage.setItem("wab_video_muted", String(nextMuted));
    } catch {}
    videoRefs.current.forEach((vid) => {
      if (vid) vid.muted = nextMuted;
    });
  };

  // Réaction J'aime
  const handleReaction = async (postId: string) => {
    try {
      const current = likesMap[postId] || { count: 0, liked: false };
      const nextLiked = !current.liked;
      const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);
      setLikesMap((prev) => ({ ...prev, [postId]: { count: nextCount, liked: nextLiked } }));

      const res = await fetch(`/api/wab/posts/${postId}/reaction`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (typeof data.likes === "number") {
        setLikesMap((prev) => ({
          ...prev,
          [postId]: { count: data.likes, liked: Boolean(data.liked) },
        }));
      }
    } catch {}
  };

  // Partage
  const handleShareTo = async (destination: string, postId: string) => {
    const canonicalBase =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || "https://envolafrica.vercel.app";
    const url = `${canonicalBase}/wab/posts/${postId}`;
    const shareText = "Découvrez cette vidéo sur World Africa Business (WAB)";

    if (destination === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} : ${url}`)}`, "_blank");
    } else if (destination === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    } else if (destination === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
    } else if (destination === "twitter") {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`, "_blank");
    } else if (destination === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`, "_blank");
    } else if (destination === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        setNotice("Lien de la vidéo copié !");
        setTimeout(() => setNotice(""), 2500);
      } catch {
        window.prompt("Copiez le lien de la vidéo :", url);
      }
    }

    try {
      const res = await fetch(`/api/wab/posts/${postId}/share`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (typeof data.shares === "number") {
        setSharesMap((prev) => ({ ...prev, [postId]: data.shares }));
      }
    } catch {}
    setShareModalPostId(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lecteur vidéo plein écran style TikTok"
      className="fixed inset-0 z-[9999] flex flex-col bg-black text-white select-none overflow-hidden"
    >
      {/* Barre supérieure discrète avec bouton Fermer & Audio */}
      <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between p-4 sm:p-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer le plein écran"
            className="flex items-center justify-center h-10 w-10 rounded-full bg-black/50 text-white backdrop-blur-md border border-white/20 transition-all hover:bg-black/80 hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow hidden sm:inline">
            Vidéos WAB • {currentIndex + 1} / {posts.length}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? "Activer le son" : "Couper le son"}
            className="flex items-center gap-1.5 rounded-full bg-black/50 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md border border-white/20 transition-all hover:bg-black/80 hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isMuted ? "volume_off" : "volume_up"}
            </span>
            <span className="hidden sm:inline">
              {isMuted ? "Son coupé" : "Son actif"}
            </span>
          </button>
        </div>
      </div>

      {/* Message toast temporaire */}
      {notice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#006874] px-4 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md animate-fade-in">
          {notice}
        </div>
      )}

      {/* Conteneur principal avec Défilement vertical et Scroll Snap */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((post, idx) => {
          const isCurrent = idx === currentIndex;
          const isNext = idx === currentIndex + 1;
          const isPaused = pausedMap[post.id] ?? false;
          const likeState = likesMap[post.id] || { count: post.likes, liked: false };
          const shareCount = sharesMap[post.id] ?? post.shares;
          const commentCount = commentsMap[post.id] ?? post.comments;
          const isBookmarked = bookmarkedMap[post.id] ?? false;
          const isExpanded = expandedCaptions[post.id] ?? false;

          return (
            <div
              key={post.id}
              id={`tiktok-item-${post.id}`}
              data-post-id={post.id}
              className="tiktok-post-slide relative w-full h-full snap-start snap-always flex items-center justify-center bg-black overflow-hidden"
            >
              {/* Lecteur Vidéo */}
              <div
                className="relative w-full h-full flex items-center justify-center cursor-pointer"
                onClick={() => togglePlayPause(post.id)}
              >
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(post.id, el);
                    else videoRefs.current.delete(post.id);
                  }}
                  src={post.videoUrl}
                  loop={false}
                  playsInline
                  preload={isCurrent || isNext ? "auto" : "metadata"}
                  muted={isMuted}
                  className="w-full h-full object-contain mx-auto"
                  onEnded={() => handleVideoEnded(post.id)}
                />

                {/* Dégradés pour lisibilité du texte par-dessus */}
                <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                {/* Icône Play centrale si la vidéo est en pause */}
                {isPaused && (
                  <div className="absolute inset-0 grid place-items-center bg-black/25 pointer-events-none">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-2xl">
                      <span
                        className="material-symbols-outlined text-[42px] ml-1"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        play_arrow
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 1. Bas à gauche : Nom, Avatar, Badge, Description */}
              <div className="absolute left-4 bottom-6 sm:bottom-8 z-30 max-w-[calc(100%-80px)] sm:max-w-md pb-[env(safe-area-inset-bottom)] pointer-events-auto">
                {/* Ligne créateur */}
                <div className="flex items-center gap-2.5 mb-2">
                  <Link
                    href={post.pageId ? `/wab/pages/${post.pageId}` : `/wab/profil?author=${encodeURIComponent(post.author)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="group flex items-center gap-2"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#006874] shadow-md">
                      {post.authorAvatarUrl ? (
                        <img
                          src={post.authorAvatarUrl}
                          alt={post.author}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-sm font-black text-white">
                          {post.author.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-sm sm:text-base font-bold text-white drop-shadow-md group-hover:underline">
                          {post.pageName || post.author}
                        </strong>
                        <span className="material-symbols-outlined text-[16px] text-teal-300 drop-shadow">
                          verified
                        </span>
                      </div>
                      {post.headline && (
                        <p className="text-[11px] text-white/80 line-clamp-1 drop-shadow-sm">
                          {post.headline}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Légende tronquée / dépliable */}
                {post.content && (
                  <div className="text-xs sm:text-sm text-white/95 leading-relaxed drop-shadow-md">
                    {isExpanded ? (
                      <div>
                        <RichTextContent
                          value={post.content}
                          className="text-white text-xs sm:text-sm"
                          linkClassName="text-teal-200 underline"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCaptions((prev) => ({ ...prev, [post.id]: false }));
                          }}
                          className="mt-1 block text-xs font-bold text-teal-300 hover:underline"
                        >
                          Moins
                        </button>
                      </div>
                    ) : (
                      <p className="line-clamp-2">
                        {post.content.replace(/<[^>]*>?/gm, "")}
                        {post.content.length > 90 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedCaptions((prev) => ({ ...prev, [post.id]: true }));
                            }}
                            className="ml-1.5 font-bold text-teal-300 hover:underline"
                          >
                            plus
                          </button>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Colonne d'actions en bas à droite empilée verticalement */}
              <div className="absolute right-3 sm:right-4 bottom-6 sm:bottom-8 z-30 flex flex-col items-center gap-4 pb-[env(safe-area-inset-bottom)] pointer-events-auto">
                {/* J'aime */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReaction(post.id);
                  }}
                  aria-label="J'aime cette vidéo"
                  className="flex flex-col items-center gap-1 group transition active:scale-90"
                >
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-full backdrop-blur-md border border-white/20 shadow-lg transition-colors ${
                      likeState.liked
                        ? "bg-rose-600 text-white"
                        : "bg-black/50 text-white hover:bg-black/70"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[26px]"
                      style={{ fontVariationSettings: likeState.liked ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      favorite
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-white drop-shadow">
                    {formatCount(likeState.count)}
                  </span>
                </button>

                {/* Commentaires */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCommentsPostId(post.id);
                  }}
                  aria-label="Voir les commentaires"
                  className="flex flex-col items-center gap-1 group transition active:scale-90"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/20 shadow-lg hover:bg-black/70">
                    <span className="material-symbols-outlined text-[26px]">chat_bubble</span>
                  </div>
                  <span className="text-[11px] font-bold text-white drop-shadow">
                    {formatCount(commentCount)}
                  </span>
                </button>

                {/* Partage */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareModalPostId(post.id);
                  }}
                  aria-label="Partager cette vidéo"
                  className="flex flex-col items-center gap-1 group transition active:scale-90"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/20 shadow-lg hover:bg-black/70">
                    <span className="material-symbols-outlined text-[26px]">share</span>
                  </div>
                  <span className="text-[11px] font-bold text-white drop-shadow">
                    {formatCount(shareCount)}
                  </span>
                </button>

                {/* Favoris / Enregistrer */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBookmarkedMap((prev) => {
                      const next = !isBookmarked;
                      setNotice(next ? "Vidéo enregistrée dans vos favoris !" : "Retirée des favoris");
                      setTimeout(() => setNotice(""), 2000);
                      return { ...prev, [post.id]: next };
                    });
                  }}
                  aria-label="Enregistrer dans les favoris"
                  className="flex flex-col items-center gap-1 group transition active:scale-90"
                >
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-full backdrop-blur-md border border-white/20 shadow-lg transition-colors ${
                      isBookmarked
                        ? "bg-amber-500 text-white"
                        : "bg-black/50 text-white hover:bg-black/70"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[26px]"
                      style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      bookmark
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-white drop-shadow">
                    {formatCount(post.views)}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PANNEAU DE COMMENTAIRES (Bottom Sheet) SANS QUITTER LE PLEIN ÉCRAN */}
      {activeCommentsPostId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Commentaires de la publication"
          className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setActiveCommentsPostId(null)}
        >
          <div
            className="relative w-full max-h-[70vh] sm:max-h-[600px] overflow-hidden rounded-t-3xl bg-white text-gray-900 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du drawer */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-700">chat_bubble</span>
                <h3 className="font-display text-sm font-bold text-[#001325]">Commentaires</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCommentsPostId(null)}
                aria-label="Fermer les commentaires"
                className="grid h-8 w-8 place-items-center rounded-full text-gray-500 hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Contenu CommentsPanel */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <CommentsPanel
                postId={activeCommentsPostId}
                openSignal={1}
                onCountChange={(newCount) => {
                  setCommentsMap((prev) => ({ ...prev, [activeCommentsPostId]: newCount }));
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE PARTAGE MULTI-RÉSEAUX */}
      {shareModalPostId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Partager la vidéo"
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          onClick={() => setShareModalPostId(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white p-5 text-gray-900 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-700">share</span>
                <h3 className="font-display text-sm font-bold text-[#001325]">Partager la vidéo</h3>
              </div>
              <button
                type="button"
                onClick={() => setShareModalPostId(null)}
                className="grid h-7 w-7 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => handleShareTo("whatsapp", shareModalPostId)}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.072-1.803-.414-1.275-.53-2.115-1.785-2.18-1.872-.064-.087-.514-.684-.514-1.304 0-.62.324-.925.44-.1.047.116.144.116.216.216.072.072.072.116.108.188.036.072.018.144-.009.216-.027.072-.116.188-.171.252-.054.063-.116.135-.054.243.063.108.279.46.603.747.414.37.765.486.873.54.108.054.171.045.234-.027.063-.072.27-.315.342-.423.072-.108.144-.09.243-.054.099.036.63.297.738.351.108.054.18.081.207.126.027.045.027.261-.117.666z"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.95.56 3.77 1.53 5.31L2 22l4.82-1.5C8.31 21.46 10.1 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.25c-1.77 0-3.41-.55-4.78-1.48l-.34-.23-2.85.89.9-2.77-.25-.37A8.21 8.21 0 0 1 3.75 12c0-4.55 3.7-8.25 8.25-8.25 4.55 0 8.25 3.7 8.25 8.25 0 4.55-3.7 8.25-8.25 8.25z"/>
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-gray-700">WhatsApp</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={() => handleShareTo("linkedin", shareModalPostId)}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.77v8.37H6.46v-8.37M7.85 6.7a1.63 1.63 0 1 0 1.63 1.63c0-.9-.73-1.63-1.63-1.63z"/>
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-gray-700">LinkedIn</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={() => handleShareTo("facebook", shareModalPostId)}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-gray-700">Facebook</span>
              </button>

              {/* Copier le lien */}
              <button
                type="button"
                onClick={() => handleShareTo("copy", shareModalPostId)}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-[#082843] text-white flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-lg">link</span>
                </div>
                <span className="text-[10px] font-bold text-gray-700">Copier</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
