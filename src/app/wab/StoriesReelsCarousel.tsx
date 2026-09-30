"use client";

import { useEffect, useRef, useState } from "react";
import MediaInteractions from "./MediaInteractions";
import { uploadWabMedia } from "@/lib/wab-upload-client";
import { WAB_BACKGROUND_PRESETS, getWabBackground, WabBackgroundPreset } from "@/lib/wab-backgrounds";

type Story = {
  id: string;
  author: string;
  avatarUrl?: string;
  mediaUrl: string;
  mimeType: string;
  caption?: string;
  views: number;
  likes: number;
  storyType?: "media" | "text";
  textContent?: string;
  background?: string;
};

function Avatar({ src, name, className = "" }: { src?: string; name: string; className?: string }) {
  return src ? (
    <img src={src} alt="" className={`object-cover ${className}`} />
  ) : (
    <span className={`grid place-items-center bg-[#8ee0c0] font-display font-black text-[#082843] ${className}`}>
      {name.slice(0, 1)}
    </span>
  );
}

function formatCompactCount(val?: number): string {
  return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(Math.max(0, Number(val) || 0));
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      resolve(29);
    }, 5000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      const duration = video.duration;
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };

    video.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossible de lire la durée de cette vidéo. Vérifiez le format."));
    };

    video.src = objectUrl;
  });
}

export default function StoriesReelsCarousel() {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Modal Statut Texte
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [selectedBgId, setSelectedBgId] = useState("noir");
  const [publishingText, setPublishingText] = useState(false);

  useEffect(() => {
    fetch("/api/wab/stories")
      .then((response) => response.json())
      .then((data) => setStories(data.stories ?? []))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleStoryFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadStatus("Préparation du média…");
    try {
      let durationSeconds: number | undefined;
      const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm|3gp)$/i.test(file.name);

      if (isVideo) {
        setUploadStatus("Vérification de la durée de la vidéo…");
        try {
          durationSeconds = await readVideoDuration(file);
        } catch {
          durationSeconds = 30;
        }
        if (Number.isFinite(durationSeconds) && durationSeconds > 30.5) {
          durationSeconds = 30;
          setUploadStatus("Vidéo supérieure à 30s : les 30 premières secondes ont été automatiquement sélectionnées…");
        } else {
          durationSeconds = Math.min(30, Math.round(durationSeconds || 30));
        }
      }

      setUploadStatus("Téléversement sécurisé de la Story…");
      const uploadData = await uploadWabMedia(file, (st) => setUploadStatus(st));
      let mediaUrl = uploadData.mediaUrl;
      if (!mediaUrl && uploadData.path) {
        mediaUrl = `/api/wab/media?path=${encodeURIComponent(uploadData.path)}`;
      }
      if (!mediaUrl) {
        throw new Error("Téléversement impossible : URL du média introuvable.");
      }

      setUploadStatus("Publication de la Story…");
      const storyResponse = await fetch("/api/wab/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyType: "media",
          mediaUrl,
          mimeType: isVideo ? "video/mp4" : file.type || "image/jpeg",
          durationSeconds: durationSeconds ? Math.min(30, Math.round(durationSeconds)) : undefined,
        }),
      });

      const storyData = await storyResponse.json().catch(() => ({}));
      if (storyResponse.status === 401) {
        window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`);
        return;
      }
      if (!storyResponse.ok || !storyData.story) {
        throw new Error(storyData.error || "Création de la Story impossible.");
      }

      setStories((items) => [storyData.story, ...items]);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Création de la Story impossible.");
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  }

  async function handlePublishTextStory(e: React.FormEvent) {
    e.preventDefault();
    const cleanText = textContent.trim();
    if (!cleanText) return;
    setPublishingText(true);
    try {
      const res = await fetch("/api/wab/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyType: "text",
          textContent: cleanText,
          background: selectedBgId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`);
        return;
      }
      if (!res.ok || !data.story) {
        throw new Error(data.error || "Impossible de publier ce statut texte.");
      }

      setStories((prev) => [data.story, ...prev]);
      setTextModalOpen(false);
      setTextContent("");
      setSelectedBgId("noir");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erreur lors de la publication.");
    } finally {
      setPublishingText(false);
    }
  }

  function openStory(story: Story) {
    const nextViews = (story.views || 0) + 1;
    setStories((items) => items.map((item) => (item.id === story.id ? { ...item, views: nextViews } : item)));
    setActiveStory({ ...story, views: nextViews });
    setVideoProgress(0);
    setVideoPaused(false);
    fetch(`/api/wab/stories/${story.id}/view`, { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { views?: number } | null) => {
        if (data && typeof data.views === "number") {
          const newViews: number = data.views;
          setStories((items) => items.map((item) => (item.id === story.id ? { ...item, views: newViews } : item)));
          setActiveStory((cur) => (cur && cur.id === story.id ? { ...cur, views: newViews } : cur));
        }
      })
      .catch(() => undefined);
  }

  function togglePlayPause() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setVideoPaused(false);
    } else {
      videoRef.current.pause();
      setVideoPaused(true);
    }
  }

  const currentPreset: WabBackgroundPreset =
    getWabBackground(selectedBgId) || WAB_BACKGROUND_PRESETS[0];

  if (loading) {
    return (
      <section className="rounded-2xl border border-[#d8e2e6] bg-white p-4 shadow-sm">
        <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
      </section>
    );
  }

  return (
    <section aria-label="Stories WAB" className="rounded-2xl border border-[#d8e2e6] bg-white p-3.5 sm:p-4 shadow-sm">
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
        
        {/* Tuile 1: Créer Story (Photo / Vidéo) */}
        <label className="group relative flex h-48 w-32 shrink-0 cursor-pointer flex-col justify-end overflow-hidden rounded-2xl border-2 border-dashed border-[#006874] bg-[#eefcfa] p-3 text-[#006874] transition hover:bg-[#dff7f4]">
          <div className="absolute inset-0 grid place-items-center">
            <span className="material-symbols-outlined text-[36px] transition group-hover:scale-110">
              {uploading ? "progress_activity" : "add_a_photo"}
            </span>
          </div>
          <div className="relative z-10 text-center">
            <span className="block truncate text-xs font-bold text-[#001325]">
              {uploading ? "Envoi…" : "Photo / Vidéo"}
            </span>
            <span className="block text-[10px] text-[#5f6368]">Story 30s</span>
          </div>
          <input
            type="file"
            accept="image/*,video/*,video/mp4,video/quicktime,video/webm"
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              void handleStoryFile(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>

        {/* Tuile 2: Statut Texte avec Fond de Couleur */}
        <button
          type="button"
          onClick={() => setTextModalOpen(true)}
          className="group relative flex h-48 w-32 shrink-0 flex-col justify-end overflow-hidden rounded-2xl border border-[#b9ebe6] bg-gradient-to-br from-[#00373e] via-[#006874] to-[#0a9396] p-3 text-white shadow-sm transition hover:scale-[1.02] hover:shadow-md"
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white transition group-hover:scale-110">
              <span className="material-symbols-outlined text-[26px]">format_color_text</span>
            </div>
          </div>
          <div className="relative z-10 text-center">
            <span className="block truncate text-xs font-bold text-white drop-shadow">
              Statut Texte
            </span>
            <span className="block text-[10px] text-teal-100">Fonds colorés 24h</span>
          </div>
        </button>

        {/* Liste des Stories */}
        {stories.map((story) => {
          const isText = story.storyType === "text";
          const isVideo = !isText && (story.mimeType?.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(story.mediaUrl));
          const textPreset = isText ? (getWabBackground(story.background) || WAB_BACKGROUND_PRESETS[0]) : null;

          return (
            <button
              key={story.id}
              type="button"
              onClick={() => openStory(story)}
              className="group relative h-48 w-32 shrink-0 overflow-hidden rounded-2xl bg-[#082843] text-left shadow-sm transition hover:scale-[1.02] hover:shadow-md"
              style={isText && textPreset ? { background: textPreset.gradient, color: textPreset.textColor } : undefined}
            >
              {isText && textPreset ? (
                <div className="relative h-full w-full flex flex-col justify-center items-center p-3 text-center">
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />
                  <span className="material-symbols-outlined text-[20px] mb-1.5 opacity-60">format_quote</span>
                  <p
                    className="font-['Arial_Black',sans-serif] text-xs font-bold line-clamp-4 leading-tight drop-shadow-md z-10"
                    style={{ fontFamily: "'Arial Black', 'Arial Bold', Gadget, sans-serif" }}
                  >
                    {story.textContent || story.caption}
                  </p>
                </div>
              ) : isVideo ? (
                <>
                  <video
                    src={story.mediaUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover opacity-90"
                  />
                  <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white backdrop-blur">
                    <span className="material-symbols-outlined text-[15px]">videocam</span>
                  </span>
                </>
              ) : (
                <img src={story.mediaUrl} alt={story.caption || story.author} className="h-full w-full object-cover" />
              )}

              {/* Badges de Vues et Likes */}
              <div className="absolute left-1.5 top-1.5 z-10 flex flex-col gap-1 pointer-events-none">
                <span className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm" title="Vues">
                  <span className="material-symbols-outlined text-[11px] text-teal-300">visibility</span>
                  <span>{formatCompactCount(story.views)}</span>
                </span>
                <span className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold text-rose-300 shadow-sm" title="J'aime">
                  <span className="material-symbols-outlined text-[11px] text-rose-400">favorite</span>
                  <span>{formatCompactCount(story.likes)}</span>
                </span>
              </div>

              {/* Gradient overlay & Author info */}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2.5 pb-2.5 pt-8 text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Avatar src={story.avatarUrl} name={story.author} className="h-6 w-6 rounded-full border border-white" />
                  <span className="truncate text-[11px]">{story.author}</span>
                </span>
              </span>
            </button>
          );
        })}

        {!stories.length && !uploading && (
          <div className="flex h-48 items-center px-6 text-xs text-[#5f6368]">
            Soyez le premier à publier une Story photo, vidéo ou un statut texte coloré !
          </div>
        )}
      </div>

      {uploadStatus && (
        <p className="mt-2 text-center text-xs font-semibold text-[#006874] animate-pulse">
          {uploadStatus}
        </p>
      )}

      {/* MODALE DE CRÉATION DE STATUT TEXTE COLORÉ */}
      {textModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Créer un statut texte"
          className="fixed inset-0 z-[120] grid place-items-center bg-black/80 p-3 sm:p-5 backdrop-blur-md animate-in fade-in"
          onClick={() => !publishingText && setTextModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 text-gray-900 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006874]">format_color_text</span>
                <h3 className="font-display text-base font-bold text-[#001325]">
                  Nouveau statut texte WAB
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTextModalOpen(false)}
                disabled={publishingText}
                className="grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handlePublishTextStory} className="space-y-4">
              {/* Prévisualisation en direct */}
              <div
                className="relative flex min-h-[190px] sm:min-h-[220px] w-full items-center justify-center rounded-2xl p-6 text-center shadow-inner transition-all duration-300"
                style={{
                  background: currentPreset.gradient,
                  color: currentPreset.textColor,
                }}
              >
                <p
                  className="font-['Arial_Black',sans-serif] text-base sm:text-lg font-black leading-snug tracking-tight drop-shadow-md max-w-sm break-words"
                  style={{ fontFamily: "'Arial Black', 'Arial Bold', Gadget, sans-serif" }}
                >
                  {textContent.trim() || "Saisissez votre statut ci-dessous…"}
                </p>
                <span className="absolute bottom-2.5 right-3 text-[10px] font-bold opacity-75">
                  Aperçu Story (24h)
                </span>
              </div>

              {/* Nuancier de sélection des fonds de couleur */}
              <div>
                <label className="block text-xs font-bold text-[#5f6368] mb-1.5 uppercase tracking-wider">
                  Fond coloré : {currentPreset.name}
                </label>
                <div className="flex flex-wrap gap-2 py-1">
                  {WAB_BACKGROUND_PRESETS.map((preset) => {
                    const isSelected = preset.id === selectedBgId;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedBgId(preset.id)}
                        className={`group relative h-9 w-9 rounded-full shadow-sm transition-all duration-150 hover:scale-110 active:scale-95 ${
                          isSelected ? "ring-2 ring-[#006874] ring-offset-2 scale-105" : ""
                        }`}
                        style={{ background: preset.gradient }}
                        title={preset.name}
                        aria-label={`Fond ${preset.name}`}
                      >
                        {isSelected && (
                          <span className="material-symbols-outlined text-white text-[18px] drop-shadow-md">
                            check
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zone de saisie du texte */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="text-status-input" className="text-xs font-bold text-[#001325]">
                    Votre message
                  </label>
                  <span className={`text-[11px] font-semibold ${textContent.length > 450 ? "text-amber-600" : "text-gray-400"}`}>
                    {textContent.length} / 500
                  </span>
                </div>
                <textarea
                  id="text-status-input"
                  rows={3}
                  maxLength={500}
                  required
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Que souhaitez-vous partager aujourd'hui ? Une annonce, une offre, un mot d'inspiration..."
                  className="w-full rounded-xl border border-[#cbdedb] bg-[#f6fbfa] p-3 text-sm text-[#082843] focus:border-[#006874] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006874]/20 resize-none"
                />
              </div>

              {/* Bouton d'action */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setTextModalOpen(false)}
                  disabled={publishingText}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={publishingText || !textContent.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#006874] px-5 py-2 text-xs font-extrabold text-white transition hover:bg-[#004d56] disabled:opacity-50 shadow-md"
                >
                  {publishingText ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Publication…</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>Publier mon statut (24h)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE FULLSCREEN STORY VIEWER */}
      {activeStory && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-2 sm:p-4 backdrop-blur-sm"
          onClick={() => setActiveStory(null)}
        >
          <div
            className="relative h-[min(84vh,700px)] w-[min(94vw,400px)] overflow-hidden rounded-3xl bg-black shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barre de progression supérieure */}
            <div className="absolute left-3 right-3 top-3 z-30 flex gap-1">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full bg-white transition-all duration-150"
                  style={{
                    width: activeStory.mimeType?.startsWith("video/")
                      ? `${videoProgress}%`
                      : undefined,
                    animation: activeStory.mimeType?.startsWith("video/")
                      ? "none"
                      : "storyProgress 7s linear forwards",
                  }}
                  onAnimationEnd={() => {
                    if (!activeStory.mimeType?.startsWith("video/")) {
                      setActiveStory(null);
                    }
                  }}
                />
              </div>
            </div>

            {/* Auteur et Contrôles */}
            <div className="absolute inset-x-0 top-5 z-30 flex items-center justify-between px-4 text-white">
              <div className="flex items-center gap-2">
                <Avatar src={activeStory.avatarUrl} name={activeStory.author} className="h-8 w-8 rounded-full border border-white" />
                <div>
                  <p className="text-xs font-bold leading-none drop-shadow">{activeStory.author}</p>
                  <div className="flex items-center gap-2 text-[10px] text-white/80 mt-1">
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px] text-teal-300">visibility</span>
                      <span>{formatCompactCount(activeStory.views)}</span>
                    </span>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const res = await fetch("/api/wab/media-interactions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ mediaType: "story", mediaId: activeStory.id, reaction: "love" }),
                          });
                          const data = await res.json().catch(() => ({}));
                          if (typeof data.totalLikes === "number") {
                            setStories((items) => items.map((item) => (item.id === activeStory.id ? { ...item, likes: data.totalLikes } : item)));
                            setActiveStory((cur) => (cur ? { ...cur, likes: data.totalLikes } : null));
                          }
                        } catch {}
                      }}
                      className="flex items-center gap-0.5 rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] text-rose-300 hover:bg-black/60 transition active:scale-95"
                      title="J'aime"
                    >
                      <span className="material-symbols-outlined text-[12px] text-rose-400">favorite</span>
                      <span>{formatCompactCount(activeStory.likes)}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeStory.mimeType?.startsWith("video/") && (
                  <button
                    type="button"
                    onClick={() => setVideoMuted((m) => !m)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {videoMuted ? "volume_off" : "volume_up"}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveStory(null)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
                  aria-label="Fermer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Contenu de la Story (Média OU Statut Texte) */}
            {activeStory.storyType === "text" ? (
              (() => {
                const preset = getWabBackground(activeStory.background) || WAB_BACKGROUND_PRESETS[0];
                return (
                  <div
                    className="relative h-full w-full flex items-center justify-center p-8 text-center select-none"
                    style={{ background: preset.gradient, color: preset.textColor }}
                  >
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                    <p
                      className="font-['Arial_Black',sans-serif] text-xl sm:text-2xl font-black leading-snug drop-shadow-xl z-10 max-w-xs break-words"
                      style={{ fontFamily: "'Arial Black', 'Arial Bold', Gadget, sans-serif" }}
                    >
                      {activeStory.textContent || activeStory.caption}
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className="relative h-full w-full" onClick={togglePlayPause}>
                {activeStory.mimeType?.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(activeStory.mediaUrl) ? (
                  <>
                    <video
                      ref={videoRef}
                      src={activeStory.mediaUrl}
                      autoPlay
                      playsInline
                      muted={videoMuted}
                      className="h-full w-full object-contain bg-black"
                      onTimeUpdate={(e) => {
                        const cur = e.currentTarget.currentTime;
                        if (cur >= 30) {
                          setActiveStory(null);
                        } else {
                          setVideoProgress((cur / 30) * 100);
                        }
                      }}
                      onEnded={() => setActiveStory(null)}
                    />
                    {videoPaused && (
                      <div className="absolute inset-0 grid place-items-center bg-black/30 pointer-events-none">
                        <span className="material-symbols-outlined text-6xl text-white/80">play_circle</span>
                      </div>
                    )}
                  </>
                ) : (
                  <img
                    src={activeStory.mediaUrl}
                    alt={activeStory.caption || activeStory.author}
                    className="h-full w-full object-contain bg-black"
                  />
                )}
              </div>
            )}

            {/* Interaction drawer */}
            <div className="absolute bottom-0 inset-x-0 z-30">
              <MediaInteractions
                mediaType="story"
                mediaId={activeStory.id}
                caption={activeStory.caption || activeStory.textContent}
                onLikesCountChange={(newLikes) => {
                  setStories((items) => items.map((item) => (item.id === activeStory.id ? { ...item, likes: newLikes } : item)));
                  setActiveStory((cur) => (cur ? { ...cur, likes: newLikes } : null));
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
