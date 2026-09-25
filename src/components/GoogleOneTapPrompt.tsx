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

    // Afficher après un léger délai agréable (1.2s)
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1200);

    // Initialiser également Google Identity Services pour le One Tap natif Google si disponible
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
                setLoading(true);
                try {
                  const currentPath = window.location.pathname + window.location.search;
                  const res = await fetch("/api/auth/google-one-tap", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ credential: response.credential, next: currentPath }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok && data.success) {
                    window.location.assign(data.redirectUrl || window.location.href);
                    return;
                  }
                } catch {
                  // Fallback OAuth standard
                } finally {
                  setLoading(false);
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
    if (loading) return;
    setLoading(true);
    try {
      const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        window.location.assign(`/auth/login?provider=google&next=${encodeURIComponent(currentUrl)}`);
        return;
      }

      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(currentUrl)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) {
        window.location.assign(`/auth/login?provider=google&next=${encodeURIComponent(currentUrl)}`);
      }
    } catch {
      window.location.assign("/auth/login?provider=google");
    }
  };

  return (
    <>
      {/* Scrim / Fond sombre cliquable pour refermer le tiroir sur mobile */}
      <div
        aria-hidden="true"
        onClick={handleDismiss}
        className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-300 md:hidden"
      />

      {/* Tiroir Dark sortant du bas de l'écran sur mobile / Carte d'angle sur desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Connexion rapide avec Google"
        className="fixed inset-x-0 bottom-0 z-[1001] w-full rounded-t-3xl border-t border-white/15 bg-[#091522] p-5 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom)+0.75rem)] text-white shadow-[0_-12px_45px_rgba(0,0,0,0.7)] animate-in slide-in-from-bottom duration-300 ease-out md:bottom-6 md:right-6 md:left-auto md:w-96 md:rounded-2xl md:border md:border-white/15 md:pb-5 md:pt-4 md:shadow-2xl"
      >
        {/* Poignée du tiroir (mobile drawer drag indicator) */}
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/25 md:hidden" />

        <div className="overflow-hidden">
          {/* En-tête du tiroir avec logo et bouton fermer */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 p-2 border border-white/10 shadow-inner">
                <GoogleGLogo className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-sm font-black text-white">
                  Connexion à Envol Africa
                </p>
                <p className="text-[12px] text-slate-300 line-clamp-1">
                  Accédez à vos articles, kiosque et services
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Fermer l'invitation"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Bouton de connexion Google 1-clic direct */}
          <div className="mt-4 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white px-5 text-xs font-black text-[#1f1f1f] shadow-lg transition-all hover:bg-slate-100 hover:shadow-xl active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-transparent" />
                  <span>Connexion à Google en cours…</span>
                </div>
              ) : (
                <>
                  <GoogleGLogo className="h-5 w-5" />
                  <span className="text-[13px] tracking-wide">Continuer avec Google</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                1 clic • Sans mot de passe
              </span>
              <button
                type="button"
                onClick={handleDismiss}
                className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
