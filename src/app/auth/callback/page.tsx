"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const [statusMessage, setStatusMessage] = useState("Nous sécurisons votre accès à l’écosystème Envol Africa...");

  useEffect(() => {
    let mounted = true;

    async function handleAuthCallback() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const error = searchParams.get("error_description") || searchParams.get("error");
        const rawNext = searchParams.get("next") || "/";
        const safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

        if (error) {
          window.location.replace(`/auth/login?oauthError=${encodeURIComponent(error)}`);
          return;
        }

        // 1. Cas classique PKCE : code dans les searchParams
        const code = searchParams.get("code");
        if (code) {
          window.location.replace(
            `/api/auth/oauth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(safeNext)}`
          );
          return;
        }

        // 2. Cas flux implicit / fragment de hachage (#access_token=...)
        const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const hashAccessToken = hashParams.get("access_token");

        if (hashAccessToken) {
          if (mounted) setStatusMessage("Validation de votre profil Google...");
          const res = await fetch("/api/auth/oauth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: hashAccessToken }),
          });

          if (res.ok) {
            window.location.replace(safeNext);
            return;
          }
        }

        // 3. Cas détection de session par le client Supabase Browser
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (!sessionError && data?.session?.access_token) {
            if (mounted) setStatusMessage("Finalisation de votre session sécurisée...");
            const res = await fetch("/api/auth/oauth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken: data.session.access_token }),
            });

            if (res.ok) {
              window.location.replace(safeNext);
              return;
            }
          }
        }

        // 4. Si aucun token n'a pu être résolu
        window.location.replace("/auth/login?oauthError=missing_code");
      } catch {
        window.location.replace("/auth/login?oauthError=oauth_failure");
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
