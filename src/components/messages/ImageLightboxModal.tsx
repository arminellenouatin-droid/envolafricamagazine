"use client";

import { useEffect } from "react";

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string;
  imageName?: string;
  onClose: () => void;
}

export default function ImageLightboxModal({
  isOpen,
  imageUrl,
  imageName = "Photo",
  onClose,
}: ImageLightboxModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div
        className="absolute top-4 inset-x-4 flex items-center justify-between z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white text-xs font-semibold truncate max-w-[200px] sm:max-w-md bg-black/50 px-3 py-1.5 rounded-full border border-white/10">
          {imageName}
        </span>

        <div className="flex items-center gap-2">
          <a
            href={imageUrl}
            download={imageName}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition flex items-center justify-center"
            title="Télécharger l'image"
          >
            <span className="material-symbols-outlined text-lg">download</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la photo"
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        className="relative max-w-4xl max-h-[85vh] overflow-hidden flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={imageName}
          className="max-h-[85vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl select-none"
        />
      </div>
    </div>
  );
}
