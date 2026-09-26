"use client";

import { useState } from "react";
import Link from "next/link";
import PostActions from "../../PostActions";
import RichTextContent from "@/components/RichTextContent";

export interface SinglePostData {
  id: string;
  author: string;
  authorAvatarUrl?: string;
  authorUserId?: string;
  headline: string;
  location: string;
  content: string;
  type: string;
  media: Array<{ path: string; mimeType: string; name: string; size?: number; mediaUrl?: string }>;
  videoUrl?: string;
  imageUrl?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  isBoosted: boolean;
  pageName?: string;
  pageLogoUrl?: string;
}

export default function WabSinglePostView({ post }: { post: SinglePostData }) {
  const [comments, setComments] = useState<Array<{ id: string; author: string; content: string; createdAt: string }>>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [commentCount, setCommentCount] = useState(post.comments);

  // Charger les commentaires
  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/wab/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {}
    setLoadingComments(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);

    try {
      const res = await fetch(`/api/wab/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setCommentText("");
        setCommentCount((c) => c + 1);
      } else {
        alert(data.error || "Impossible d'ajouter le commentaire.");
      }
    } catch {
      alert("Erreur réseau.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const formattedDate = (() => {
    try {
      const d = new Date(post.createdAt);
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  })();

  const isVideo = post.type === "video" || post.media.some((m) => m.mimeType?.startsWith("video/"));

  return (
    <main className="min-h-screen bg-[#f0f2f5] py-6 sm:py-10">
      {/* Balise image prioritaire pour les robots des réseaux sociaux (WhatsApp, etc.) */}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={post.author}
          width={1200}
          height={630}
          className="sr-only pointer-events-none absolute -top-96 left-0 h-1 w-1 opacity-0"
          aria-hidden="true"
        />
      )}
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Navigation Bar Retour */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/wab"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#006874] shadow-sm border border-gray-200 hover:bg-[#e6f4f2] transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Retour au fil d’actualité WAB</span>
          </Link>

          <Link
            href={`/wab#post-${post.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#9e001f] transition-colors"
          >
            <span>Voir dans le fil complet</span>
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </Link>
        </div>

        {/* Carte de la publication */}
        <article className="overflow-hidden rounded-3xl border border-[#d8e2e6] bg-white p-5 sm:p-7 shadow-md">
          {/* Header Auteur */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Link
                href={`/wab/profil?author=${encodeURIComponent(post.author)}`}
                className="relative h-13 w-13 shrink-0 rounded-full overflow-hidden bg-gray-100 ring-2 ring-[#006874]/30 hover:ring-[#006874] transition-all"
              >
                {post.authorAvatarUrl ? (
                  <img src={post.authorAvatarUrl} alt={post.author} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-gray-700 bg-emerald-100 text-base">
                    {post.author.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </Link>

              <div>
                <Link
                  href={`/wab/profil?author=${encodeURIComponent(post.author)}`}
                  className="font-display font-black text-base text-[#082843] hover:text-[#006874] transition-colors"
                >
                  {post.author}
                </Link>
                <p className="text-xs text-gray-500 leading-tight">{post.headline}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                  <span>{formattedDate}</span>
                  {post.location && (
                    <>
                      <span>·</span>
                      <span>{post.location}</span>
                    </>
                  )}
                  {isVideo && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5 font-bold text-[#9e001f]">
                        <span className="material-symbols-outlined text-xs">videocam</span>
                        Vidéo
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {post.isBoosted && (
              <span className="rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-[10px] font-black text-amber-900 shrink-0">
                Sponsorisé
              </span>
            )}
          </div>

          {/* Contenu textuel */}
          <div className="mt-5 text-sm sm:text-[15px] leading-relaxed text-[#111e1d]">
            <RichTextContent value={post.content} />
          </div>

          {/* Lecteur Vidéo Natif */}
          {post.videoUrl && (
            <div className="mt-5 overflow-hidden rounded-2xl bg-black shadow-lg">
              <video
                src={post.videoUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-[500px] object-contain mx-auto"
              />
            </div>
          )}

          {/* Image de la publication (si présente et non vidéo) */}
          {post.imageUrl && !post.videoUrl && !post.imageUrl.includes("/api/og/") && (
            <div className="mt-5 overflow-hidden rounded-2xl shadow-sm">
              <img
                src={post.imageUrl}
                alt={post.author}
                className="w-full max-h-[600px] object-cover rounded-2xl"
              />
            </div>
          )}

          {/* Autres documents ou médias */}
          {post.media.filter((m) => !m.mimeType?.startsWith("video/") && !m.mimeType?.startsWith("image/")).map((doc, idx) => (
            <div key={idx} className="mt-4 flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-2xl text-[#9e001f]">description</span>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-gray-900 truncate">{doc.name}</p>
                  {doc.size && <p className="text-[10px] text-gray-500">{(doc.size / 1024).toFixed(0)} Ko</p>}
                </div>
              </div>
              {doc.mediaUrl && (
                <a
                  href={doc.mediaUrl}
                  download={doc.name}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-full bg-[#006874] text-white text-xs font-bold hover:bg-[#004f58] transition-colors"
                >
                  Télécharger
                </a>
              )}
            </div>
          ))}

          {/* Barre d'actions sociales (Likes, Commentaires, Partages, Vues) */}
          <div className="mt-6 border-t border-gray-100 pt-3">
            <PostActions
              postId={post.id}
              initialLikes={post.likes}
              initialComments={commentCount}
              initialShares={post.shares}
              views={post.views}
              onComment={() => {
                setShowComments(true);
                loadComments();
              }}
            />
          </div>

          {/* Espace Commentaires */}
          {showComments && (
            <section className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="font-display font-black text-sm text-[#082843] mb-4">
                Commentaires ({commentCount})
              </h3>

              {/* Formulaire d'ajout de commentaire */}
              <form onSubmit={handleAddComment} className="flex gap-2 mb-5">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  className="flex-1 rounded-full bg-[#f0f2f5] px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#006874]"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="rounded-full bg-[#006874] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#004f58] transition-colors disabled:opacity-50"
                >
                  {submittingComment ? "Envoi..." : "Publier"}
                </button>
              </form>

              {/* Liste des commentaires */}
              {loadingComments ? (
                <p className="text-xs text-gray-400 py-3 text-center">Chargement des commentaires...</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">Soyez le premier à commenter cette publication.</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="rounded-2xl bg-[#f8f9fa] p-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900">{c.author}</span>
                        <span className="text-[10px] text-gray-400">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : ""}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </article>

        {/* Bannière d'invitation au fil d'actualité WAB */}
        <div className="mt-8 rounded-3xl bg-gradient-to-r from-[#082843] to-[#001325] p-6 text-white text-center shadow-lg">
          <h2 className="font-display font-black text-base sm:text-lg mb-2">
            Rejoignez World Africa Business
          </h2>
          <p className="text-xs text-gray-300 max-w-md mx-auto mb-5 leading-relaxed">
            Échangez avec des milliers d'entrepreneurs, investisseurs et professionnels à travers toute l'Afrique.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/wab"
              className="rounded-full bg-[#f0b27e] px-5 py-2.5 text-xs font-black text-[#082843] hover:bg-[#e5a26a] transition-all shadow-md"
            >
              Découvrir le fil d'actualité WAB
            </Link>
            <Link
              href={`/wab#post-${post.id}`}
              className="rounded-full bg-white/10 border border-white/20 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
            >
              Ouvrir dans le fil
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
