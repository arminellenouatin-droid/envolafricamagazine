"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type SocialProvider = "google" | "facebook" | "tiktok";
const socialProviders: Array<{ id: SocialProvider; label: string; mark: string; className: string }> = [
  { id: "google", label: "Google", mark: "G", className: "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400" },
  { id: "facebook", label: "Facebook", mark: "f", className: "border-[#d9e6ff] bg-[#f5f8ff] text-[#1877f2] hover:border-[#1877f2]" },
  { id: "tiktok", label: "TikTok", mark: "♪", className: "border-zinc-200 bg-zinc-950 text-white hover:bg-zinc-800" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<{ challenge: string; userId: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.twoFactorRequired) {
        setTwoFactorChallenge({ challenge: data.challenge, userId: data.userId });
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorChallenge) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/verify-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...twoFactorChallenge, code: twoFactorCode }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Code 2FA invalide");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Vérification 2FA impossible");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    setSocialLoading(provider);
    setError("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("La connexion sociale n’est pas encore configurée sur cet environnement.");
      setSocialLoading(null);
      return;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: provider as never,
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: "select_account" } },
    });
    if (oauthError) {
      setError(`Connexion ${provider} indisponible : ${oauthError.message}`);
      setSocialLoading(null);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[460px]">
        <section className="rounded-[28px] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:p-10">
          <div className="mb-8 text-center">
            <img src="/logo-couleur-entete-new.png" alt="Envol Africa Magazine" className="mx-auto mb-6 h-auto w-[min(100%,290px)] object-contain" />
            <h1 className="font-display text-[26px] font-black text-[var(--on-surface)]">Bon retour</h1>
            <p className="mt-2 text-[14px] text-[var(--on-surface-variant)]">Connectez-vous pour accéder à vos abonnements et articles illimités</p>
          </div>
          {error && <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] text-red-700">{error}</div>}
          {twoFactorChallenge ? <form onSubmit={handleTwoFactorSubmit} className="space-y-5"><div className="rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-4 text-center"><span className="material-symbols-outlined text-3xl text-[#0A1931]">shield_lock</span><h2 className="mt-2 font-display text-lg font-black text-[var(--on-surface)]">Vérification en deux étapes</h2><p className="mt-1 text-xs text-[var(--on-surface-variant)]">Saisissez le code à 6 chiffres de votre application d’authentification ou un code de récupération.</p></div><div><label htmlFor="two-factor-code" className="text-[12px] font-semibold uppercase tracking-wide text-[var(--on-surface-variant)]">Code de sécurité</label><input id="two-factor-code" inputMode="numeric" autoComplete="one-time-code" pattern="[A-Za-z0-9]{6,}" minLength={6} maxLength={12} required autoFocus value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())} className="mt-1.5 h-12 w-full rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-5 text-center text-[18px] tracking-[0.3em] text-[var(--on-surface)] focus:border-[#0A1931] focus:outline-none" /></div><button disabled={loading} className="h-12 w-full rounded-full bg-[#0A1931] text-[14px] font-bold text-white transition-colors hover:bg-black disabled:opacity-60">{loading ? "Vérification…" : "Valider la connexion →"}</button><button type="button" onClick={() => { setTwoFactorChallenge(null); setTwoFactorCode(""); setError(""); }} className="w-full text-center text-xs text-[var(--on-surface-variant)] hover:underline">Revenir à la connexion</button></form> : <><div className="grid gap-2.5 sm:grid-cols-3">
            {socialProviders.map((provider) => (
              <button key={provider.id} type="button" onClick={() => handleSocialLogin(provider.id)} disabled={loading || socialLoading !== null} className={`flex h-11 items-center justify-center gap-2 rounded-full border px-3 text-[13px] font-bold transition disabled:cursor-wait disabled:opacity-60 ${provider.className}`}>
                <span className="text-lg font-black leading-none">{socialLoading === provider.id ? "…" : provider.mark}</span><span className="hidden md:inline">{provider.label}</span>
              </button>
            ))}
          </div></>}
          {!twoFactorChallenge && <><div className="my-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400"><span className="h-px flex-1 bg-[var(--outline-variant)]" />ou avec votre email<span className="h-px flex-1 bg-[var(--outline-variant)]" /></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label htmlFor="email" className="text-[12px] font-semibold uppercase tracking-wide text-[var(--on-surface-variant)]">Email professionnel</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="quentin@envolafrica.com" className="mt-1.5 h-12 w-full rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-5 text-[14px] text-[var(--on-surface)] transition-colors focus:border-[#0A1931] focus:bg-[var(--surface-container-lowest)] focus:outline-none" /></div>
            <div><div className="flex items-center justify-between"><label htmlFor="password" className="text-[12px] font-semibold uppercase tracking-wide text-[var(--on-surface-variant)]">Mot de passe</label><Link href="#" className="text-[11px] text-[var(--on-surface-variant)] hover:text-[#0A1931]">Oublié ?</Link></div><input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5 h-12 w-full rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-5 text-[14px] text-[var(--on-surface)] transition-colors focus:border-[#0A1931] focus:bg-[var(--surface-container-lowest)] focus:outline-none" /></div>
            <button disabled={loading || socialLoading !== null} className="h-12 w-full rounded-full bg-[#0A1931] text-[14px] font-bold text-white transition-colors hover:bg-black disabled:opacity-60">{loading ? "Connexion…" : "Se connecter →"}</button>
          </form>
          </>} {!twoFactorChallenge && <div className="mt-6 text-center text-[13px] text-[var(--on-surface-variant)]">Pas encore de compte ? <Link href="/auth/register" className="font-semibold text-[#0A1931] hover:underline">Créer un compte</Link></div>}
        </section>
        <div className="mt-6 text-center text-[11px] text-zinc-400">Paiement sécurisé par Moneroo • Aucune donnée bancaire stockée</div>
      </div>
    </main>
  );
}
