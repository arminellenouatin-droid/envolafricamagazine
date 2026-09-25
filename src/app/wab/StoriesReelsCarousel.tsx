"use client";

import { useEffect, useRef, useState } from "react";
import MediaInteractions from "./MediaInteractions";
import { uploadWabMedia } from "@/lib/wab-upload-client";

type Story = {
  id: string;
  author: string;
  avatarUrl?: string;
  mediaUrl: string;
  mimeType: string;
  caption?: string;
  views: number;
  likes: number;
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

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      // Fallback: Si les métadonnées ne répondent pas sous 5s, on accepte le fichier
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
          // NE PLUS BLOQUER : accepter et récupérer automatiquement les 30 premières secondes
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

  function openStory(story: Story) {
    setActiveStory(story);
    setVideoProgress(0);
    setVideoPaused(false);
    fetch(`/api/wab/stories/${story.id}/view`, { method: "POST" }).catch(() => undefined);
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
        
        {/* Create Story Tile */}
        <label className="group relative flex h-48 w-32 shrink-0 cursor-pointer flex-col justify-end overflow-hidden rounded-2xl border-2 border-dashed border-[#006874] bg-[#eefcfa] p-3 text-[#006874] transition hover:bg-[#dff7f4]">
          <div className="absolute inset-0 grid place-items-center">
            <span className="material-symbols-outlined text-[36px] transition group-hover:scale-110">
              {uploading ? "progress_activity" : "add_circle"}
            </span>
          </div>
          <div className="relative z-10 text-center">
            <span className="block truncate text-xs font-bold text-[#001325]">
              {uploading ? "Envoi…" : "Créer Story"}
            </span>
            <span className="block text-[10px] text-[#5f6368]">Photo ou Vidéo 30s</span>
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

        {/* Stories List */}
        {stories.map((story) => {
          const isVideo = story.mimeType.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(story.mediaUrl);
          return (
            <button
              key={story.id}
              type="button"
              onClick={() => openStory(story)}
              className="group relative h-48 w-32 shrink-0 overflow-hidden rounded-2xl bg-[#082843] text-left shadow-sm transition hover:scale-[1.02] hover:shadow-md"
            >
              {isVideo ? (
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
            Soyez le premier à publier une Story photo ou une vidéo de 30s !
          </div>
        )}
      </div>

      {uploadStatus && (
        <p className="mt-2 text-center text-xs font-semibold text-[#006874] animate-pulse">
          {uploadStatus}
        </p>
      )}

      {/* Fullscreen Story Viewer Modal */}
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
            {/* Top Progress Bar */}
            <div className="absolute left-3 right-3 top-3 z-30 flex gap-1">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full bg-white transition-all duration-150"
                  style={{
                    width: activeStory.mimeType.startsWith("video/")
                      ? `${videoProgress}%`
                      : undefined,
                    animation: activeStory.mimeType.startsWith("video/")
                      ? "none"
                      : "storyProgress 7s linear forwards",
                  }}
                  onAnimationEnd={() => {
                    if (!activeStory.mimeType.startsWith("video/")) {
                      setActiveStory(null);
                    }
                  }}
                />
              </div>
            </div>

            {/* Author bar & Controls */}
            <div className="absolute inset-x-0 top-5 z-30 flex items-center justify-between px-4 text-white">
              <div className="flex items-center gap-2">
                <Avatar src={activeStory.avatarUrl} name={activeStory.author} className="h-8 w-8 rounded-full border border-white" />
                <div>
                  <p className="text-xs font-bold leading-none">{activeStory.author}</p>
                  <p className="text-[10px] text-white/70 mt-0.5">Story WAB</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeStory.mimeType.startsWith("video/") && (
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

            {/* Media Content (Image or Video) */}
            <div className="relative h-full w-full" onClick={togglePlayPause}>
              {activeStory.mimeType.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(activeStory.mediaUrl) ? (
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

            {/* Interaction drawer */}
            <div className="absolute bottom-0 inset-x-0 z-30">
              <MediaInteractions mediaType="story" mediaId={activeStory.id} caption={activeStory.caption} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
