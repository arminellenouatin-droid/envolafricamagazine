"use client";

import React, { useEffect, useRef } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  asBottomSheetOnMobile?: boolean;
  closeOnBackdropClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  asBottomSheetOnMobile = true,
  closeOnBackdropClick = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Verrouillage du scroll d'arrière-plan + Gestion d'Échap + Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Focus sur le conteneur ou le premier élément interactif
    const timer = window.setTimeout(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea'
        );
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(timer);
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[96vw]",
  };

  const mobileClasses = asBottomSheetOnMobile
    ? "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-[24px] max-sm:max-h-[92vh]"
    : "max-sm:m-3";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => closeOnBackdropClick && onClose()}
        aria-hidden="true"
      />

      {/* Surface de la Modale */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative z-10 w-full overflow-hidden rounded-[20px] bg-white dark:bg-zinc-900 border border-[#ead8d5] dark:border-zinc-800 shadow-[0_24px_64px_rgba(43,37,37,0.20)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200 focus:outline-none flex flex-col max-h-[90vh] ${sizeClasses[size]} ${mobileClasses}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poignée de tirage mobile pour Bottom Sheet */}
        {asBottomSheetOnMobile && (
          <div className="sm:hidden flex justify-center pt-2.5 pb-1">
            <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>
        )}

        {/* En-tête */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-[#f0dedd] dark:border-zinc-800 px-6 py-4.5 bg-[#fcf9f8] dark:bg-zinc-900/60">
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="font-serif text-xl sm:text-2xl font-black text-[#2b2525] dark:text-zinc-100 leading-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-xs sm:text-sm text-[#594c4a] dark:text-zinc-400">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la boîte de dialogue"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white dark:bg-zinc-800 text-[#594c4a] dark:text-zinc-300 hover:text-[#9e001f] dark:hover:text-red-400 border border-[#ead8d5] dark:border-zinc-700 shadow-2xs transition hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e001f]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Corps défilable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-[#2b2525] dark:text-zinc-200">
          {children}
        </div>

        {/* Pied d'actions optionnel */}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#f0dedd] dark:border-zinc-800 bg-[#fcf9f8] dark:bg-zinc-900/60 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
