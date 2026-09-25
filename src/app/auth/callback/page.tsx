"use client";

import { useEffect } from "react";

export default function AuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error_description") || params.get("error");
    if (error) {
      window.location.replace(`/auth/login?oauthError=${encodeURIComponent(error)}`);
      return;
    }
    if (!code) {
      window.location.replace("/auth/login?oauthError=missing_code");
      return;
    }
    const next = params.get("next") || "/";
    window.location.replace(`/api/auth/oauth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`);
  }, []);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <section className="w-full max-w-md rounded-3xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-[#0A1931] text-xl font-black text-[#D4AF37]">EA</div>
        <h1 className="font-display text-xl font-extrabold text-[var(--on-surface)]">Connexion en cours</h1>
        <p className="mt-3 text-sm text-[var(--on-surface-variant)]">Nous sécurisons votre accès à l’écosystème Envol Africa.</p>
      </section>
    </main>
  );
}
