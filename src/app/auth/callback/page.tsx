"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const [statusMessage, setStatusMessage] = useState("Nous sécurisons votre accès à l’écosystème Envol Africa...");

  useEffect(() => {
    let mounted = true;

    async function handleAuthCallback() {
      let safeNext = "/";
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const error = searchParams.get("error_description") || searchParams.get("error");
        const rawNext = searchParams.get("next") || "/";
        safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
        const originParam = searchParams.get("origin") || searchParams.get("returnOrigin");

        if (error) {
          const cleanError = error.toLowerCase().includes("pkce") || error.toLowerCase().includes("verifier")
            ? "oauth_failure"
            : error;
          window.location.replace(`/auth/login?oauthError=${encodeURIComponent(cleanError)}&next=${encodeURIComponent(safeNext)}`);
          return;
        }

        // 1. Cas transfert inter-domaines sécurisé (#session_token=...)
        const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const hashSessionToken = hashParams.get("session_token");
        const hashNext = hashParams.get("next");
        const finalNext = (hashNext && hashNext.startsWith("/") && !hashNext.startsWith("//")) ? hashNext : safeNext;

        if (hashSessionToken) {
          if (mounted) setStatusMessage("Validation de votre session sécurisée...");
          const res = await fetch("/api/auth/oauth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionToken: hashSessionToken }),
          });

          if (res.ok) {
            window.location.replace(finalNext);
            return;
          }
        }

        // 2. Cas flux implicit universel (#access_token=...)
        const hashAccessToken = hashParams.get("access_token");
        if (hashAccessToken) {
          if (mounted) setStatusMessage("Validation de votre profil Google...");
          const res = await fetch("/api/auth/oauth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: hashAccessToken }),
          });

          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            // Si l'utilisateur s'était connecté depuis envolafrica.site, transférer la session
            if (originParam && data?.sessionToken) {
              try {
                const parsedOrigin = new URL(originParam);
                if (
                  parsedOrigin.hostname.includes("envolafrica.site") &&
                  window.location.hostname !== parsedOrigin.hostname
                ) {
                  window.location.replace(
                    `${parsedOrigin.origin}/auth/callback#session_token=${encodeURIComponent(data.sessionToken)}&next=${encodeURIComponent(finalNext)}`
                  );
                  return;
                }
              } catch {}
            }
            window.location.replace(finalNext);
            return;
          }
        }

        // 3. Cas classique code avec double résolution sécurisée
        const code = searchParams.get("code");
        if (code) {
          if (mounted) setStatusMessage("Validation de votre autorisation Google...");
          try {
            const originQuery = originParam ? `&origin=${encodeURIComponent(originParam)}` : "";
            const testRes = await fetch(
              `/api/auth/oauth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(safeNext)}${originQuery}`,
              { method: "GET", redirect: "manual" }
            );

            if (testRes.status >= 300 && testRes.status < 400) {
              const locationHeader = testRes.headers.get("location");
              if (locationHeader && !locationHeader.includes("oauthError")) {
                window.location.replace(locationHeader);
                return;
              }
            }
          } catch {
            // Continuer vers la résolution locale
          }

          // Fallback : échange via le client navigateur Supabase
          const supabase = getSupabaseBrowserClient();
          if (supabase) {
            try {
              const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              if (!exchangeError && exchangeData?.session?.access_token) {
                if (mounted) setStatusMessage("Finalisation de votre session sécurisée...");
                const res = await fetch("/api/auth/oauth/session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ accessToken: exchangeData.session.access_token }),
                });

                if (res.ok) {
                  window.location.replace(finalNext);
                  return;
                }
              }
            } catch {}
          }

          // Vérifier si une session active est déjà établie
          try {
            const meRes = await fetch("/api/auth/me", { cache: "no-store" });
            if (meRes.ok) {
              const meData = await meRes.json();
              if (meData?.user) {
                window.location.replace(finalNext);
                return;
              }
            }
          } catch {}

          // Retour propre vers le login en cas d'expiration sans message cryptique
          window.location.replace(`/auth/login?oauthError=oauth_failure&next=${encodeURIComponent(finalNext)}`);
          return;
        }

        // 4. Cas détection de session par le client Supabase Browser
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          try {
            const { data, error: sessionError } = await supabase.auth.getSession();
            if (!sessionError && data?.session?.access_token) {
              if (mounted) setStatusMessage("Finalisation de votre session sécurisée...");
              const res = await fetch("/api/auth/oauth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessToken: data.session.access_token }),
              });

              if (res.ok) {
                window.location.replace(finalNext);
                return;
              }
            }
          } catch {}
        }

        // 5. Si aucun token n'a pu être résolu
        window.location.replace(`/auth/login?oauthError=missing_code&next=${encodeURIComponent(safeNext)}`);
      } catch {
        window.location.replace(`/auth/login?oauthError=oauth_failure&next=${encodeURIComponent(safeNext)}`);
      }
    }

    handleAuthCallback();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <section className="w-full max-w-md rounded-3xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-[#9e001f] text-xl font-black text-[#d4af37]">
          EA
        </div>
        <h1 className="font-display text-xl font-extrabold text-[var(--on-surface)]">Connexion en cours</h1>
        <p className="mt-3 text-sm text-[var(--on-surface-variant)]">{statusMessage}</p>
        <div className="mt-6 flex justify-center">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#9e001f] border-t-transparent" />
        </div>
      </section>
    </main>
  );
}
