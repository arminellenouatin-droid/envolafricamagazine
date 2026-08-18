"use client";
import { useEffect, useState } from "react";
import TrackedVideo from "./TrackedVideo";
import Link from "next/link";
import { internalDocumentHref } from "@/lib/internal-browser";
type Media = { path: string; mimeType: string; name: string };
type ResolvedMedia = { url: string; mimeType: string; name: string };
function iconFor(mimeType: string) { if (mimeType.startsWith("image/")) return "image"; if (mimeType.startsWith("video/")) return "videocam"; if (mimeType.startsWith("audio/")) return "audio_file"; return "description"; }
export default function PostMedia({ postId, media }: { postId: string; media: Media[] }) {
  const [urls, setUrls] = useState<ResolvedMedia[]>([]);
  useEffect(() => { Promise.all(media.map((_, index) => fetch(`/api/wab/media?postId=${postId}&index=${index}`).then((response) => response.ok ? response.json() : null))).then((values) => setUrls(values.filter(Boolean))); }, [media, postId]);
  if (!urls.length) return null;
  const first = urls[0];
  const preview = first.mimeType.startsWith("image/") ? <img src={first.url} alt={first.name} className="max-h-[520px] w-full rounded-xl object-cover" /> : first.mimeType.startsWith("video/") ? <TrackedVideo postId={postId} src={first.url} name={first.name} /> : first.mimeType.startsWith("audio/") ? <audio controls src={first.url} className="w-full" /> : (() => { const internalHref = internalDocumentHref(first.url, first.name, first.mimeType); return internalHref ? <Link href={internalHref} className="block rounded-xl bg-[#e9f7f5] p-4 text-sm font-bold text-[#087e8b]">Lire le document dans EAM : {first.name} ↗</Link> : <a href={first.url} target="_blank" rel="noreferrer" className="block rounded-xl bg-[#e9f7f5] p-4 text-sm font-bold text-[#087e8b]">Ouvrir le document : {first.name} ↗</a>; })();
  return <div className="mt-5 space-y-2"><div>{preview}</div><div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#f5fbfa] px-3 py-2 text-xs font-bold text-[#006874]"><span className="material-symbols-outlined text-[18px]">attach_file</span><span>{media.length} pièce{media.length > 1 ? "s" : ""} jointe{media.length > 1 ? "s" : ""}</span>{media.map((item, index) => <span key={`${item.path}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1" title={item.name}><span className="material-symbols-outlined text-[15px]">{iconFor(item.mimeType)}</span>{index === 0 ? "Aperçu" : ""}</span>)}</div></div>;
}
