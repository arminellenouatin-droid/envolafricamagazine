import { useEffect, useState } from "react";
import MediaInteractions from "./MediaInteractions";

type Story = { id: string; author: string; avatarUrl?: string; mediaUrl: string; mimeType: string; caption?: string; views: number; likes: number };

function Avatar({ src, name, className = "" }: { src?: string; name: string; className?: string }) {
  return src ? <img src={src} alt="" className={`object-cover ${className}`} /> : <span className={`grid place-items-center bg-[#8ee0c0] font-display font-black text-[#082843] ${className}`}>{name.slice(0, 1)}</span>;
}

function StoryMedia({ story, className }: { story: Pick<Story, "mediaUrl" | "mimeType" | "caption" | "author">; className: string }) {
  if (story.mimeType.startsWith("video/")) return <video src={story.mediaUrl} aria-label={story.caption || `Story vidéo de ${story.author}`} className={className} muted playsInline preload="metadata" />;
  return <img src={story.mediaUrl} alt={story.caption || story.author} className={className} />;
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => { const duration = video.duration; URL.revokeObjectURL(objectUrl); resolve(duration); };
    video.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Impossible de lire la durée de cette vidéo.")); };
    video.src = objectUrl;
  });
}

export default function StoriesReelsCarousel() {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetch("/api/wab/stories").then((response) => response.json()).then((data) => setStories(data.stories ?? [])).finally(() => setLoading(false)); }, []);

  async function handleStoryFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      let durationSeconds: number | undefined;
      if (file.type.startsWith("video/")) {
        durationSeconds = await readVideoDuration(file);
        if (!Number.isFinite(durationSeconds) || durationSeconds > 30.5) throw new Error("Une vidéo de Story ne peut pas dépasser 30 secondes.");
      }
      const form = new FormData(); form.set("file", file);
      const uploadResponse = await fetch("/api/wab/upload", { method: "POST", body: form });
      const uploadData = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok || typeof uploadData.mediaUrl !== "string") throw new Error(uploadData.error || "Téléversement impossible.");
      const storyResponse = await fetch("/api/wab/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaUrl: uploadData.mediaUrl, mimeType: file.type, durationSeconds }) });
      const storyData = await storyResponse.json().catch(() => ({}));
      if (storyResponse.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
      if (!storyResponse.ok || !storyData.story) throw new Error(storyData.error || "Création de la Story impossible.");
      setStories((items) => [storyData.story, ...items]);
    } catch (error) { window.alert(error instanceof Error ? error.message : "Création de la Story impossible."); }
    finally { setUploading(false); }
  }

  function openStory(story: Story) { setActiveStory(story); fetch(`/api/wab/stories/${story.id}/view`, { method: "POST" }).catch(() => undefined); }
  if (loading) return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="h-40 animate-pulse rounded-xl bg-slate-100" /></section>;

  return <section aria-label="Stories des comptes suivis" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}><label className="relative flex h-44 w-32 shrink-0 cursor-pointer flex-col justify-end overflow-hidden rounded-2xl border-2 border-dashed border-[#087e8b] bg-[#e9f7f5] p-3 text-[#087e8b]"><span className="absolute inset-0 grid place-items-center"><span className="material-symbols-outlined text-[32px]">{uploading ? "progress_activity" : "add"}</span></span><span className="relative truncate text-xs font-bold">Votre Story</span><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" className="hidden" disabled={uploading} onChange={(event) => { void handleStoryFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>{stories.map((story) => <button key={story.id} type="button" onClick={() => openStory(story)} className="relative h-44 w-32 shrink-0 overflow-hidden rounded-2xl bg-[#082843] text-left shadow-sm"><StoryMedia story={story} className="h-full w-full object-cover" /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 text-xs font-bold text-white"><span className="flex items-center gap-2"><Avatar src={story.avatarUrl} name={story.author} className="h-7 w-7 rounded-full border border-white" /><span className="truncate">{story.author}</span></span></span></button>)}{!stories.length && <p className="py-12 text-sm text-slate-500">Aucune Story active des comptes suivis.</p>}</div>{activeStory && <div role="dialog" aria-modal="true" className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4" onClick={() => setActiveStory(null)}><div className="relative h-[min(78vh,680px)] w-[min(92vw,390px)] overflow-hidden rounded-3xl bg-black shadow-2xl" onClick={(event) => event.stopPropagation()}><StoryMedia story={activeStory} className="h-full w-full object-cover" /><div className="absolute inset-x-0 top-4 flex items-center gap-2 px-4 text-white"><Avatar src={activeStory.avatarUrl} name={activeStory.author} className="h-9 w-9 rounded-full border border-white" /><span className="text-sm font-bold">{activeStory.author}</span><button type="button" onClick={() => setActiveStory(null)} className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-black/30" aria-label="Fermer"><span className="material-symbols-outlined">close</span></button></div><MediaInteractions mediaType="story" mediaId={activeStory.id} caption={activeStory.caption} /></div></div>}</section>;
}
