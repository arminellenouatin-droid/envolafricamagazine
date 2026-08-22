"use client";

import { useEffect, useMemo, useState } from "react";

type CommentItem = { id: string; userId?: string; content: string; createdAt: string };

type ArticleActionsProps = {
  articleId: string;
  slug: string;
  initialLikes: number;
  initialViews: number;
};

export default function ArticleActions({ articleId, slug, initialLikes, initialViews }: ArticleActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [views, setViews] = useState(initialViews);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const articleUrl = useMemo(() => typeof window === "undefined" ? `/article/${slug}` : `${window.location.origin}/article/${slug}`, [slug]);

  useEffect(() => {
    void fetch(`/api/articles/${encodeURIComponent(slug)}/engagement`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "view" }) })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data?.views) setViews(Number(data.views)); })
      .catch(() => undefined);
    void fetch(`/api/favorites`, { credentials: "include" }).then((response) => response.json()).then((data) => { if (data.favorites?.includes(articleId)) setFavorited(true); }).catch(() => undefined);
    void fetch(`/api/comments?articleId=${encodeURIComponent(articleId)}`).then((response) => response.json()).then((data) => setComments(Array.isArray(data.comments) ? data.comments : [])).catch(() => undefined);
  }, [articleId, slug]);

  const handleLike = async () => {
    if (liked || busy) return;
    setBusy(true);
    const response = await fetch(`/api/articles/${encodeURIComponent(slug)}/engagement`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "like" }), credentials: "include" }).catch(() => null);
    const data = response ? await response.json().catch(() => ({})) : {};
    if (response?.ok) { setLikes(Number(data.likes ?? likes + 1)); setLiked(true); setMessage("Article aimé."); }
    else setMessage(data.error || "Connectez-vous pour aimer cet article.");
    setBusy(false);
  };

  const handleFavorite = async () => {
    const method = favorited ? "DELETE" : "POST";
    const url = favorited ? `/api/favorites?articleId=${encodeURIComponent(articleId)}` : "/api/favorites";
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: method === "POST" ? JSON.stringify({ articleId }) : undefined, credentials: "include" }).catch(() => null);
    if (response?.ok) setFavorited((value) => !value);
    else setMessage("Connectez-vous pour sauvegarder cet article.");
  };

  const handleComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newComment.trim()) return;
    const response = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId, content: newComment.trim() }), credentials: "include" }).catch(() => null);
    const data = response ? await response.json().catch(() => ({})) : {};
    if (response?.ok && data.comment) { setComments((current) => [data.comment, ...current]); setNewComment(""); setMessage("Commentaire publié."); }
    else setMessage(data.error || "Connectez-vous pour commenter.");
  };

  const share = async (target: "whatsapp" | "native" | "copy" | "x" | "facebook" | "linkedin") => {
    const text = `À lire sur Envol Africa : ${document.title}`;
    if (target === "copy") {
      await navigator.clipboard?.writeText(articleUrl);
      setMessage("Lien de l’article copié.");
    } else if (target === "native" && navigator.share) {
      await navigator.share({ title: document.title, text, url: articleUrl }).catch(() => undefined);
    } else if (target === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${articleUrl}`)}`, "_blank", "noopener,noreferrer");
    } else {
      const urls: Record<"x" | "facebook" | "linkedin", string> = { x: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(articleUrl)}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`, linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}` };
      if (target !== "native") window.open(urls[target], "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="mt-8 border-y border-[#e5bdbb] py-5" aria-label="Actions de l’article">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={handleLike} disabled={liked || busy} className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition ${liked ? "bg-[#9e001f] text-white" : "bg-[#2b2525] text-white hover:bg-[#9e001f]"}`} aria-pressed={liked}>♥ {likes} J’aime</button>
        <button type="button" onClick={() => setShowComments((value) => !value)} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d8c3c1] px-4 text-[13px] font-medium text-[#2b2525]">◌ {comments.length} Commentaires</button>
        <span className="inline-flex h-10 items-center gap-2 rounded-full bg-[#f0e8e6] px-4 text-[13px] text-[#5f5352]" aria-label={`${views} vues`}>◉ {views.toLocaleString("fr-FR")} vues</span>
        <button type="button" onClick={handleFavorite} className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-medium ${favorited ? "border-amber-200 bg-amber-50 text-amber-900" : "border-[#d8c3c1] text-[#2b2525]"}`}>{favorited ? "✓ Sauvegardé" : "☆ Sauvegarder"}</button>
        <div className="relative ml-auto">
          <button type="button" onClick={() => setShareOpen((value) => !value)} aria-expanded={shareOpen} aria-haspopup="menu" className="inline-flex h-10 items-center gap-2 rounded-full border border-[#9e001f] px-4 text-[13px] font-bold text-[#9e001f]">Partager</button>
          {shareOpen && <div role="menu" className="absolute right-0 top-12 z-20 flex min-w-[190px] flex-col gap-1 rounded-xl border border-[#e5bdbb] bg-white p-2 text-[#2b2525] shadow-xl">
            <button type="button" role="menuitem" onClick={() => void share("whatsapp")} className="rounded-lg px-3 py-2 text-left text-[12px] font-semibold hover:bg-[#f6f3f2]">WhatsApp</button>
            <button type="button" role="menuitem" onClick={() => void share("copy")} className="rounded-lg px-3 py-2 text-left text-[12px] font-semibold hover:bg-[#f6f3f2]">Copier le lien exact</button>
            {typeof navigator !== "undefined" && "share" in navigator && <button type="button" role="menuitem" onClick={() => void share("native")} className="rounded-lg px-3 py-2 text-left text-[12px] font-semibold hover:bg-[#f6f3f2]">Partager avec l’appareil</button>}
            <button type="button" role="menuitem" onClick={() => void share("x")} className="rounded-lg px-3 py-2 text-left text-[12px] hover:bg-[#f6f3f2]">X</button>
            <button type="button" role="menuitem" onClick={() => void share("facebook")} className="rounded-lg px-3 py-2 text-left text-[12px] hover:bg-[#f6f3f2]">Facebook</button>
            <button type="button" role="menuitem" onClick={() => void share("linkedin")} className="rounded-lg px-3 py-2 text-left text-[12px] hover:bg-[#f6f3f2]">LinkedIn</button>
          </div>}
        </div>
      </div>
      {message && <p role="status" className="mt-3 text-[12px] font-semibold text-[#9e001f]">{message}</p>}
      {showComments && <div className="mt-6 rounded-xl border border-[#e5bdbb] bg-white p-5"><h4 className="font-bold text-[14px] text-[#2b2525]">Commentaires ({comments.length})</h4><form onSubmit={handleComment} className="mt-4 flex gap-2"><label htmlFor={`comment-${articleId}`} className="sr-only">Votre commentaire</label><input id={`comment-${articleId}`} value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Votre commentaire..." className="h-11 min-w-0 flex-1 rounded-full border border-[#d8c3c1] bg-[#fcf9f8] px-5 text-[13px]" /><button type="submit" className="h-11 rounded-full bg-[#2b2525] px-5 text-[13px] font-bold text-white">Envoyer</button></form><div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto">{comments.filter((comment) => comment.content !== "LIKE_PLACEHOLDER").map((comment) => <div key={comment.id} className="rounded-lg border border-[#eee3e1] bg-[#fcf9f8] p-3"><div className="text-[12px] font-bold">{comment.userId?.slice(0, 8) || "Lecteur"} · {new Date(comment.createdAt).toLocaleDateString("fr-FR")}</div><div className="mt-1 text-[13px]">{comment.content}</div></div>)}{comments.length === 0 && <div className="py-6 text-center text-[13px] text-[#746665]">Aucun commentaire. Soyez le premier.</div>}</div></div>}
    </div>
  );
}
