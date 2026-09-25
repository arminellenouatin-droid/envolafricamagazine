"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function GoogleGLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

interface GoogleOneTapPromptProps {
  user?: { id: string } | null;
}

export default function GoogleOneTapPrompt({ user }: GoogleOneTapPromptProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si l'utilisateur est déjà connecté, ne rien afficher
    if (user) return;

    // Ne pas afficher si l'utilisateur a fermé l'invitation durant cette session
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("eam_google_prompt_dismissed");
      if (dismissed) return;
    }

    // Afficher après un léger délai agréable (1.5s)
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1500);

    // Initialiser également Google Identity Services si le client ID est présent
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (googleClientId && typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const google = (window as unknown as { google?: { accounts?: { id?: { initialize: (config: unknown) => void; prompt: (cb?: unknown) => void } } } }).google;
        if (google?.accounts?.id) {
          google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: { credential?: string }) => {
              if (response.credential) {
                try {
                  const supabase = getSupabaseBrowserClient();
                  if (supabase) {
                    await supabase.auth.signInWithIdToken({
                      provider: "google",
                      token: response.credential,
                    });
                  }
                  window.location.reload();
                } catch {
                  // Fallback
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          google.accounts.id.prompt();
        }
      };
      document.head.appendChild(script);
    }

    return () => clearTimeout(timer);
  }, [user]);

  if (!visible || user) return null;

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("eam_google_prompt_dismissed", "true");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        // Redirection directe vers /auth/login si Supabase client n'est pas initialisé
        window.location.assign("/auth/login?provider=google");
        return;
      }
      const currentUrl = typeof window !== "undefined" ? window.location.href : "/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(currentUrl)}`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) {
        window.location.assign("/auth/login");
      }
    } catch {
      window.location.assign("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Connexion rapide avec Google"
      className="fixed bottom-4 left-1/2 z-[110] w-[min(94vw,420px)] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-5 duration-300 md:bottom-6 md:left-auto md:right-6 md:translate-x-0"
    >
      <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
        {/* En-tête de la notification */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f8f9fa] shadow-2xs border border-[#e8eaed]">
              <GoogleGLogo className="h-5 w-5" />
            </div>
            <div>
              <p className="font-sans text-xs font-bold text-[#202124]">
                Connexion à Envol Africa
              </p>
              <p className="text-[11px] text-[#5f6368] line-clamp-1">
                Accédez à vos articles, kiosque et services
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fermer l'invitation"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#5f6368] transition hover:bg-[#f1f3f4] hover:text-[#202124]"
          >
            ✕
          </button>
        </div>

        {/* Bouton de connexion Google direct 1-clic */}
        <div className="mt-3.5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#dadce0] bg-white px-4 text-xs font-bold text-[#3c4043] transition-all hover:bg-[#f8f9fa] hover:border-[#c6c9cc] hover:shadow-xs active:bg-[#f1f3f4] disabled:opacity-60"
          >
            <GoogleGLogo className="h-4 w-4" />
            <span>{loading ? "Connexion en cours…" : "Continuer avec Google"}</span>
          </button>

          <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-[#70757a]">
            <span>1 clic • Sans mot de passe</span>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[#1a73e8] hover:underline"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
