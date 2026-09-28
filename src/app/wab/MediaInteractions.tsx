"use client";

import { useEffect, useMemo, useState } from "react";

type MediaType = "story" | "reel";
type Reaction = "love" | "like" | "laugh" | "sad" | "cry" | "wow";
type Comment = { id: string; author: string; content: string; createdAt: string };

const reactions: Array<{ key: Reaction; icon: string; label: string }> = [
  { key: "love", icon: "❤️", label: "J'adore" },
  { key: "like", icon: "👍", label: "J'aime" },
  { key: "laugh", icon: "😂", label: "Rire" },
  { key: "wow", icon: "😮", label: "Wouah" },
  { key: "sad", icon: "😢", label: "Triste" },
  { key: "cry", icon: "😭", label: "Pleurs" },
];

export default function MediaInteractions({
  mediaType,
  mediaId,
  caption,
  onCommentCountChange,
  onLikesCountChange,
}: {
  mediaType: MediaType;
  mediaId: string;
  caption?: string;
  onCommentCountChange?: (count: number) => void;
  onLikesCountChange?: (count: number) => void;
}) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myReaction, setMyReaction] = useState<Reaction | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const total = useMemo(
    () => Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0),
    [counts]
  );

  useEffect(() => {
    fetch(`/api/wab/media-interactions?mediaType=${mediaType}&mediaId=${encodeURIComponent(mediaId)}`)
      .then((response) => response.json())
      .then((data) => {
        setCounts(data.counts ?? {});
        setMyReaction(data.myReaction ?? null);
        setComments(data.comments ?? []);
        onCommentCountChange?.((data.comments ?? []).length);
        if (data.totalLikes !== undefined) {
          onLikesCountChange?.(data.totalLikes);
        } else if (data.total !== undefined) {
          onLikesCountChange?.(data.total);
        }
      })
      .catch(() => setNotice("Interactions indisponibles pour le moment."));
  }, [mediaId, mediaType, onCommentCountChange, onLikesCountChange]);

  async function react(reaction: Reaction) {
    setNotice("");
    try {
      const response = await fetch("/api/wab/media-interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType, mediaId, reaction }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`);
        return;
      }
      if (!response.ok) {
        setNotice(data.error || "Connexion requise pour réagir.");
        return;
      }
      setMyReaction(data.reaction ?? null);
      setCounts((current) => {
        const next = {
          ...current,
          [reaction]: Math.max(0, Number(current[reaction] ?? 0) + (data.reaction ? 1 : -1)),
        };
        const newTotal = Object.values(next).reduce((s, v) => s + Number(v || 0), 0);
        onLikesCountChange?.(newTotal);
        return next;
      });
      if (data.totalLikes !== undefined) {
        onLikesCountChange?.(data.totalLikes);
      }
    } catch {
      setNotice("Erreur de connexion.");
    }
  }

  async function comment(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim() || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/wab/media-interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType, mediaId, content }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`);
        return;
      }
      if (!response.ok) {
        setNotice(data.error || "Commentaire impossible.");
      } else {
        setComments((current) => [...current, data.comment]);
        setContent("");
        onCommentCountChange?.(comments.length + 1);
      }
    } catch {
      setNotice("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="absolute inset-x-0 bottom-0 max-h-[58%] overflow-y-auto bg-gradient-to-t from-black via-black/90 to-black/20 px-4 pb-4 pt-16 text-white [scrollbar-width:thin]">
      {caption && <p className="mb-3 text-xs sm:text-sm font-semibold text-white drop-shadow">{caption}</p>}
      
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-white/90">
          {total} mention{total > 1 ? "s" : ""} j&apos;aime · {comments.length} commentaire{comments.length > 1 ? "s" : ""}
        </span>
        <div className="flex gap-1">
          {reactions.map((item) => (
            <button
              key={item.key}
              type="button"
              title={item.label}
              aria-label={item.label}
              aria-pressed={myReaction === item.key}
              onClick={() => void react(item.key)}
              className={`grid h-8 w-8 place-items-center rounded-full text-base transition hover:scale-110 active:scale-95 ${
                myReaction === item.key
                  ? "bg-[#8ee0c0] text-[#082843] ring-2 ring-white shadow-lg"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {comments.slice(-4).map((item) => (
          <div key={item.id} className="rounded-xl bg-white/10 px-3 py-2 text-xs backdrop-blur-xs">
            <strong className="text-[#8ee0c0]">{item.author}</strong>
            <p className="mt-0.5 text-white/95">{item.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={comment} className="mt-3 flex gap-2">
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Écrire un commentaire…"
          className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white outline-none placeholder:text-white/60 focus:border-[#8ee0c0]"
        />
        <button
          type="submit"
          disabled={busy || !content.trim()}
          className="rounded-xl bg-[#8ee0c0] px-3 py-2 text-xs font-bold text-[#082843] transition hover:bg-[#72d4b1] disabled:opacity-50"
        >
          {busy ? "…" : "Envoyer"}
        </button>
      </form>

      {notice && <p className="mt-2 text-[11px] font-semibold text-[#ffdca8]">{notice}</p>}
    </div>
  );
}
