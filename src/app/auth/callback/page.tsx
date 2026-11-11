"use client";

import { useEffect, useState } from "react";

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

        // 1. Cas transfert de session inter-domaines (#session_token=...)
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

        // 2. Cas standard PKCE : navigation directe vers l'endpoint serveur qui échange le code et pose le cookie
        const code = searchParams.get("code");
        if (code) {
          if (mounted) setStatusMessage("Validation de votre autorisation Google...");
          const originQuery = originParam ? `&origin=${encodeURIComponent(originParam)}` : "";
          window.location.replace(
            `/api/auth/oauth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(safeNext)}${originQuery}`
          );
          return;
        }

        // 3. Si aucun code ni session
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
