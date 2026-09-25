"use client";

import { useState } from "react";

export type SocialNetwork = "whatsapp" | "facebook" | "linkedin" | "x" | "telegram" | "copy" | "native";

interface SocialShareModalProps {
  url: string;
  title: string;
  summary?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.98-.14.17-.29.19-.54.07-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.06 0 1.21.89 2.39 1.01 2.55.12.17 1.74 2.66 4.22 3.73.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.22-.19-.47-.31z" />
    </svg>
  );
}

export function FacebookIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function LinkedInIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

export function XTwitterIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function TelegramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

export function CopyLinkIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export default function SocialShareModal({ url, title, summary, isOpen, onClose }: SocialShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullUrl = typeof window !== "undefined" && !url.startsWith("http") ? `${window.location.origin}${url}` : url;
  const shareText = `${title} — ${summary || "À lire sur Envol Africa Magazine"}`;

  const handleShare = async (network: SocialNetwork) => {
    switch (network) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`, "_blank", "noopener,noreferrer");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, "_blank", "noopener,noreferrer");
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`, "_blank", "noopener,noreferrer");
        break;
      case "x":
        window.open(`https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`, "_blank", "noopener,noreferrer");
        break;
      case "telegram":
        window.open(`https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
        break;
      case "native":
        if (typeof navigator !== "undefined" && "share" in navigator) {
          try {
            await navigator.share({ title, text: shareText, url: fullUrl });
          } catch {
            // User cancelled share
          }
        }
        break;
      case "copy":
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(fullUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#ead8d5] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-[#f0dedd] pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9e001f]">Partager l’article</span>
            <h3 className="font-serif text-lg font-black text-[#2b2525]">Faire rayonner ce contenu</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-8 w-8 place-items-center rounded-full bg-[#f6f3f2] text-[#746665] hover:text-[#9e001f] transition">
            ×
          </button>
        </div>

        {/* Aperçu du titre */}
        <p className="mt-3 line-clamp-2 text-xs font-semibold text-[#5c403f] bg-[#faf6f5] p-3 rounded-xl border border-[#f0dedd]">
          {title}
        </p>

        {/* Grille des réseaux avec leurs vrais logos officiels */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {/* WhatsApp */}
          <button
            type="button"
            onClick={() => handleShare("whatsapp")}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#e2f4ea] bg-[#f4fbf7] p-3.5 text-[#1e7e34] transition hover:-translate-y-1 hover:shadow-md hover:border-[#25D366]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#25D366] text-white shadow-xs">
              <WhatsAppIcon className="h-6 w-6" />
            </span>
            <span className="text-[11px] font-bold text-slate-800">WhatsApp</span>
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={() => handleShare("facebook")}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#e4ecfb] bg-[#f4f7fd] p-3.5 text-[#1877F2] transition hover:-translate-y-1 hover:shadow-md hover:border-[#1877F2]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#1877F2] text-white shadow-xs">
              <FacebookIcon className="h-6 w-6" />
            </span>
            <span className="text-[11px] font-bold text-slate-800">Facebook</span>
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={() => handleShare("linkedin")}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#e3effa] bg-[#f3f8fd] p-3.5 text-[#0A66C2] transition hover:-translate-y-1 hover:shadow-md hover:border-[#0A66C2]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#0A66C2] text-white shadow-xs">
              <LinkedInIcon className="h-6 w-6" />
            </span>
            <span className="text-[11px] font-bold text-slate-800">LinkedIn</span>
          </button>

          {/* X / Twitter */}
          <button
            type="button"
            onClick={() => handleShare("x")}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-black transition hover:-translate-y-1 hover:shadow-md hover:border-black"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-black text-white shadow-xs">
              <XTwitterIcon className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold text-slate-800">X (Twitter)</span>
          </button>

          {/* Telegram */}
          <button
            type="button"
            onClick={() => handleShare("telegram")}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#e4f3fa] bg-[#f4fafe] p-3.5 text-[#229ED9] transition hover:-translate-y-1 hover:shadow-md hover:border-[#229ED9]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#229ED9] text-white shadow-xs">
              <TelegramIcon className="h-6 w-6" />
            </span>
            <span className="text-[11px] font-bold text-slate-800">Telegram</span>
          </button>

          {/* Copier le lien */}
          <button
            type="button"
            onClick={() => handleShare("copy")}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-3.5 transition hover:-translate-y-1 hover:shadow-md ${
              copied
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-[#ead8d5] bg-[#fffaf9] text-[#9e001f] hover:border-[#9e001f]"
            }`}
          >
            <span className={`grid h-11 w-11 place-items-center rounded-full text-white shadow-xs ${copied ? "bg-green-600" : "bg-[#9e001f]"}`}>
              <CopyLinkIcon className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold text-slate-800">
              {copied ? "Lien copié !" : "Copier le lien"}
            </span>
          </button>
        </div>

        {/* Partager via le système natif mobile si dispo */}
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            type="button"
            onClick={() => handleShare("native")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#d8c3c1] bg-white py-2.5 text-xs font-bold text-[#5c403f] hover:bg-[#faf6f5] transition"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            Plus d’options (applications du téléphone)
          </button>
        )}
      </div>
    </div>
  );
}
