"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TrackedVideo from "./TrackedVideo";
import { internalDocumentHref } from "@/lib/internal-browser";

type Media = { path: string; mimeType: string; name: string; size?: number };
type ResolvedMedia = { url: string; mimeType: string; name: string; size?: number };

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function fileKind(mimeType: string, name: string) {
  const lowerName = (name || "").toLowerCase();
  const lowerMime = (mimeType || "").toLowerCase();

  if (lowerMime === "application/pdf" || lowerName.endsWith(".pdf")) {
    return {
      icon: "picture_as_pdf",
      label: "Document PDF",
      badge: "PDF",
      textColor: "text-[#b3261e]",
      bgColor: "bg-[#fdf2f2]",
      borderColor: "border-[#f9d2ce]",
      accentColor: "#b3261e",
    };
  }
  if (lowerMime.includes("word") || /\.(doc|docx)$/.test(lowerName)) {
    return {
      icon: "description",
      label: "Document Word",
      badge: "DOCX",
      textColor: "text-[#185abd]",
      bgColor: "bg-[#eff6ff]",
      borderColor: "border-[#bfdbfe]",
      accentColor: "#185abd",
    };
  }
  if (lowerMime.includes("excel") || /\.(xls|xlsx|csv)$/.test(lowerName)) {
    return {
      icon: "table_chart",
      label: "Feuille de calcul Excel",
      badge: "XLS",
      textColor: "text-[#137333]",
      bgColor: "bg-[#f0fdf4]",
      borderColor: "border-[#bbf7d0]",
      accentColor: "#137333",
    };
  }
  if (lowerMime.includes("powerpoint") || /\.(ppt|pptx)$/.test(lowerName)) {
    return {
      icon: "slideshow",
      label: "Présentation PowerPoint",
      badge: "PPT",
      textColor: "text-[#c2410c]",
      bgColor: "bg-[#fff7ed]",
      borderColor: "border-[#fed7aa]",
      accentColor: "#c2410c",
    };
  }
  if (lowerMime.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(lowerName)) {
    return {
      icon: "image",
      label: "Photo / Image",
      badge: "IMG",
      textColor: "text-[#006874]",
      bgColor: "bg-[#eefcfa]",
      borderColor: "border-[#b9ebe6]",
      accentColor: "#006874",
    };
  }
  if (lowerMime.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(lowerName)) {
    return {
      icon: "videocam",
      label: "Vidéo",
      badge: "VID",
      textColor: "text-[#6b21a8]",
      bgColor: "bg-[#faf5ff]",
      borderColor: "border-[#e9d5ff]",
      accentColor: "#6b21a8",
    };
  }
  if (lowerMime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/i.test(lowerName)) {
    return {
      icon: "audio_file",
      label: "Audio",
      badge: "AUDIO",
      textColor: "text-[#a36300]",
      bgColor: "bg-[#fffbeb]",
      borderColor: "border-[#fde68a]",
      accentColor: "#a36300",
    };
  }
  return {
    icon: "insert_drive_file",
    label: "Document",
    badge: "DOC",
    textColor: "text-[#082843]",
    bgColor: "bg-[#f1f5f9]",
    borderColor: "border-[#cbd5e1]",
    accentColor: "#082843",
  };
}

export default function PostMedia({ postId, media }: { postId: string; media: Media[] }) {
  const [resolvedItems, setResolvedItems] = useState<ResolvedMedia[]>([]);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  useEffect(() => {
    if (!media || !media.length) return;

    // Resolve media paths
    Promise.all(
      media.map(async (item, index): Promise<ResolvedMedia | null> => {
        let directUrl = item.path || "";
        // If it's a relative path like /covers/...
        if (directUrl.includes("/covers/")) {
          const match = directUrl.match(/\/covers\/[^?#\s]+/);
          if (match) directUrl = match[0];
          return {
            url: directUrl,
            mimeType: item.mimeType || "image/jpeg",
            name: item.name,
            size: item.size,
          };
        }

        // If direct HTTP URL (not pointing to old 404 domain)
        if (/^https?:\/\//i.test(directUrl) && !directUrl.includes("envolafricamagazinegildas.vercel.app")) {
          return {
            url: directUrl,
            mimeType: item.mimeType,
            name: item.name,
            size: item.size,
          };
        }

        try {
          const res = await fetch(`/api/wab/media?postId=${encodeURIComponent(postId)}&index=${index}`);
          if (!res.ok) return null;
          const data = await res.json();
          return {
            url: data.url,
            mimeType: data.mimeType || item.mimeType,
            name: data.name || item.name,
            size: item.size,
          };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      const validItems: ResolvedMedia[] = [];
      for (const item of results) {
        if (item && item.url) {
          validItems.push(item);
        }
      }
      setResolvedItems(validItems);
    });
  }, [media, postId]);

  if (!resolvedItems.length) return null;

  // Categorize media
  const images = resolvedItems.filter(
    (item) => item.mimeType.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(item.name || item.url)
  );
  const videos = resolvedItems.filter(
    (item) => item.mimeType.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(item.name || item.url)
  );
  const audios = resolvedItems.filter(
    (item) => item.mimeType.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/i.test(item.name || item.url)
  );
  const documents = resolvedItems.filter(
    (item) =>
      !item.mimeType.startsWith("image/") &&
      !item.mimeType.startsWith("video/") &&
      !item.mimeType.startsWith("audio/")
  );

  // Check if primary image is a magazine cover
  const isMagazineCover = images.some((img) => img.url.includes("/covers/") || /cover/i.test(img.name || ""));

  return (
    <div className="mt-4 space-y-4">
      {/* 1. Magazine Cover Special Presentation */}
      {isMagazineCover && images.length === 1 && (
        <div className="relative overflow-hidden rounded-2xl border border-[#d1e9e6] bg-gradient-to-b from-[#f7fcfb] to-[#eefcfa] p-4 text-center">
          <div className="mx-auto max-w-[320px] overflow-hidden rounded-xl shadow-[0_12px_32px_rgba(8,40,67,0.18)] transition hover:scale-[1.02]">
            <img
              src={images[0].url}
              alt={images[0].name || "Couverture Envol Africa Magazine"}
              className="w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#082843] px-3.5 py-1 text-xs font-bold text-white shadow-sm">
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              <span>Envol Africa Magazine • Édition Officielle</span>
            </span>
            <Link
              href="/kiosque"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#006874] px-4 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#004f58]"
            >
              <span>Feuilleter le numéro</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Photos / Images Grid (LinkedIn Style) */}
      {!isMagazineCover && images.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#d1e9e6] bg-[#f8fafc]">
          {images.length === 1 && (
            <div
              className="relative max-h-[520px] w-full cursor-pointer overflow-hidden bg-black/5"
              onClick={() => setSelectedImageModal(images[0].url)}
            >
              <img
                src={images[0].url}
                alt={images[0].name || "Image de la publication"}
                className="w-full max-h-[520px] object-cover transition hover:opacity-95"
                loading="lazy"
              />
            </div>
          )}

          {images.length === 2 && (
            <div className="grid grid-cols-2 gap-1 bg-[#d1e9e6]/50">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative h-64 cursor-pointer overflow-hidden bg-black/5"
                  onClick={() => setSelectedImageModal(img.url)}
                >
                  <img src={img.url} alt={img.name} className="h-full w-full object-cover transition hover:opacity-95" loading="lazy" />
                </div>
              ))}
            </div>
          )}

          {images.length === 3 && (
            <div className="grid grid-cols-3 gap-1 bg-[#d1e9e6]/50">
              <div
                className="col-span-2 relative h-72 cursor-pointer overflow-hidden bg-black/5"
                onClick={() => setSelectedImageModal(images[0].url)}
              >
                <img src={images[0].url} alt={images[0].name} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="flex flex-col gap-1">
                {images.slice(1).map((img, idx) => (
                  <div
                    key={idx}
                    className="relative h-[142px] cursor-pointer overflow-hidden bg-black/5"
                    onClick={() => setSelectedImageModal(img.url)}
                  >
                    <img src={img.url} alt={img.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {images.length >= 4 && (
            <div className="grid grid-cols-2 gap-1 bg-[#d1e9e6]/50">
              {images.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="relative h-48 cursor-pointer overflow-hidden bg-black/5"
                  onClick={() => setSelectedImageModal(img.url)}
                >
                  <img src={img.url} alt={img.name} className="h-full w-full object-cover" loading="lazy" />
                  {idx === 3 && images.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#082843]/70 text-2xl font-black text-white backdrop-blur-[2px]">
                      +{images.length - 3}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Videos */}
      {videos.map((vid, idx) => (
        <div key={idx} className="overflow-hidden rounded-2xl border border-[#d1e9e6] bg-black">
          <TrackedVideo postId={postId} src={vid.url} name={vid.name} />
        </div>
      ))}

      {/* 4. Audios */}
      {audios.map((aud, idx) => (
        <div key={idx} className="rounded-2xl border border-[#d1e9e6] bg-[#f8fafc] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#a36300]">
            <span className="material-symbols-outlined text-[18px]">audio_file</span>
            <span>{aud.name || "Extrait audio"}</span>
          </div>
          <audio controls src={aud.url} className="w-full" />
        </div>
      ))}

      {/* 5. Documents (PDF, Word, Excel, PowerPoint) - High Fidelity LinkedIn Cards */}
      {documents.map((doc, idx) => {
        const kind = fileKind(doc.mimeType, doc.name);
        const internalHref = internalDocumentHref(doc.url, doc.name, doc.mimeType);
        const readerHref = internalHref || `/lecteur-document?url=${encodeURIComponent(doc.url)}&title=${encodeURIComponent(doc.name)}`;
        const sizeStr = formatFileSize(doc.size);

        return (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-2xl border border-[#d1e9e6] bg-white shadow-[0_2px_12px_rgba(8,40,67,0.06)] transition hover:border-[#006874] hover:shadow-[0_6px_20px_rgba(8,40,67,0.1)]"
          >
            {/* Header with badge */}
            <div className={`flex items-center justify-between border-b px-4 py-2.5 ${kind.bgColor} ${kind.borderColor}`}>
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[20px] ${kind.textColor}`}>
                  {kind.icon}
                </span>
                <span className={`text-xs font-extrabold ${kind.textColor}`}>{kind.label}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#687274]">
                {sizeStr && <span>{sizeStr}</span>}
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${kind.bgColor} ${kind.textColor} border ${kind.borderColor}`}>
                  {kind.badge}
                </span>
              </div>
            </div>

            {/* Document Body & Visual Preview */}
            <div className="flex items-center gap-4 p-4">
              {/* Document Graphic Icon */}
              <div className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border ${kind.borderColor} ${kind.bgColor} shadow-sm`}>
                <span className={`material-symbols-outlined text-[28px] ${kind.textColor}`}>
                  {kind.icon}
                </span>
                <span className={`text-[9px] font-black uppercase ${kind.textColor}`}>{kind.badge}</span>
              </div>

              {/* Title and metadata */}
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-[#082843] group-hover:text-[#006874]">
                  {doc.name || "Document attaché"}
                </h4>
                <p className="mt-1 text-xs text-[#687274]">
                  Cliquez ci-dessous pour prévisualiser ou télécharger ce fichier.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 border-t border-[#d1e9e6]/60 bg-[#f8fafc] px-4 py-2.5">
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                download={doc.name}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs font-bold text-[#43474d] transition hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Télécharger</span>
              </a>
              <Link
                href={readerHref}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#006874] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#004f58]"
              >
                <span>Feuilleter / Lire</span>
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </Link>
            </div>
          </div>
        );
      })}

      {/* Lightbox / Fullscreen Image Modal */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001325]/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImageModal(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white hover:bg-white/40"
            onClick={() => setSelectedImageModal(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img
            src={selectedImageModal}
            alt="Plein écran"
            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
