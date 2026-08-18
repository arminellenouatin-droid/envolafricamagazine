"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const finish = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (active) setError("La connexion sociale n’est pas configurée sur cet environnement.");
        return;
      }
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href.split("?")[1] ? new URLSearchParams(window.location.search).get("code") || "" : "");
      if (exchangeError || !data.session?.access_token) {
        if (active) setError(exchangeError?.message || "La session sociale n’a pas pu être confirmée.");
        return;
      }
      const response = await fetch("/api/auth/oauth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: data.session.access_token }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (active) setError(payload.error || "Impossible de finaliser la connexion.");
        return;
      }
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    };
    finish().catch(() => { if (active) setError("Une erreur inattendue est survenue pendant la connexion."); });
    return () => { active = false; };
  }, [router]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <section className="w-full max-w-md rounded-3xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-[#0A1931] text-xl font-black text-[#D4AF37]">EA</div>
        <h1 className="font-display text-xl font-extrabold text-[var(--on-surface)]">Connexion en cours</h1>
        {!error ? <p className="mt-3 text-sm text-[var(--on-surface-variant)]">Nous sécurisons votre accès à l’écosystème Envol Africa.</p> : <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        {error && <button type="button" onClick={() => router.replace("/auth/login")} className="mt-6 rounded-full bg-[#0A1931] px-5 py-3 text-sm font-bold text-white">Retour à la connexion</button>}
      </section>
    </main>
  );
}
