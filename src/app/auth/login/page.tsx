"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type SocialProvider = "google";
const socialProviders: Array<{ id: SocialProvider; label: string; className: string }> = [
  { id: "google", label: "Google", className: "border-[#c63d32] bg-[#ea4335] text-white hover:bg-[#c63d32]" },
];

function SocialLogo() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 rounded-full bg-white p-0.5"><path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.41h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z"/><path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.35l-3.14-2.41c-.87.58-1.98.93-3.31.93-2.54 0-4.7-1.72-5.47-4.03H3.28v2.49A9.74 9.74 0 0 0 12 21.7Z"/><path fill="#FBBC05" d="M6.53 13.84A5.84 5.84 0 0 1 6.22 12c0-.64.11-1.27.31-1.84V7.67H3.28A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.05 1.03 4.33l3.25-2.49Z"/><path fill="#EA4335" d="M12 6.13c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.2 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.72 5.37l3.25 2.49C7.3 7.85 9.46 6.13 12 6.13Z"/></svg>;
}

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
    if (provider !== "google") {
      setError(`Connexion ${provider} indisponible : ce fournisseur n’est pas encore configuré.`);
      setSocialLoading(null);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("La connexion sociale n’est pas encore configurée sur cet environnement.");
      setSocialLoading(null);
      return;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: "select_account" } },
    });
    if (oauthError) {
      setError(`Connexion ${provider} indisponible : ${oauthError.message}`);
      setSocialLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7fbfa] px-4 py-10 text-[#082843] md:px-8 md:py-14">
      <div className="mx-auto w-full max-w-[980px]">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/wab" className="flex items-center gap-3" aria-label="Retour à World Africa Business">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#006874] text-sm font-black text-white shadow-sm">WAB</span>
            <span className="hidden text-sm font-black tracking-[0.16em] text-[#082843] sm:inline">WORLD AFRICA BUSINESS</span>
          </Link>
          <Link href="/contact" className="text-xs font-bold text-[#4b6267] transition hover:text-[#006874]">Besoin d’aide ?</Link>
        </div>
        <div className="mx-auto w-full max-w-[460px]">
          <section className="rounded-[28px] border border-[#d4e5e2] bg-white p-7 shadow-[0_20px_60px_rgba(8,40,67,0.10)] md:p-10">
          <div className="mb-8 text-center">
            <img src="/logo-couleur-entete-new.png" alt="Envol Africa Magazine" className="mx-auto mb-6 h-auto w-[min(100%,290px)] object-contain" />
            <h1 className="font-display text-[28px] font-black tracking-tight text-[#082843]">Bon retour</h1>
            <p className="mx-auto mt-2 max-w-[34ch] text-[14px] leading-6 text-[#5b6e72]">Connectez-vous pour retrouver votre réseau, vos publications et vos espaces WAB.</p>
          </div>
          {error && <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] text-red-700">{error}</div>}
          {twoFactorChallenge ? <form onSubmit={handleTwoFactorSubmit} className="space-y-5"><div className="rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-4 text-center"><span className="material-symbols-outlined text-3xl text-[#0A1931]">shield_lock</span><h2 className="mt-2 font-display text-lg font-black text-[var(--on-surface)]">Vérification en deux étapes</h2><p className="mt-1 text-xs text-[var(--on-surface-variant)]">Saisissez le code à 6 chiffres de votre application d’authentification ou un code de récupération.</p></div><div><label htmlFor="two-factor-code" className="text-[12px] font-semibold uppercase tracking-wide text-[var(--on-surface-variant)]">Code de sécurité</label><input id="two-factor-code" inputMode="numeric" autoComplete="one-time-code" pattern="[A-Za-z0-9]{6,}" minLength={6} maxLength={12} required autoFocus value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())} className="mt-1.5 h-12 w-full rounded-full border border-[#cbdedb] bg-[#f6fbfa] px-5 text-center text-[18px] tracking-[0.3em] text-[#082843] focus:border-[#006874] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#006874]/10" /></div><button disabled={loading} className="h-12 w-full rounded-full bg-[#0A1931] text-[14px] font-bold text-white transition-colors hover:bg-black disabled:opacity-60">{loading ? "Vérification…" : "Valider la connexion →"}</button><button type="button" onClick={() => { setTwoFactorChallenge(null); setTwoFactorCode(""); setError(""); }} className="w-full text-center text-xs text-[var(--on-surface-variant)] hover:underline">Revenir à la connexion</button></form> : <><div className="grid gap-2.5 sm:grid-cols-3">
            {socialProviders.map((provider) => (
              <button key={provider.id} type="button" onClick={() => handleSocialLogin(provider.id)} disabled={loading || socialLoading !== null} className={`flex h-11 items-center justify-center gap-2 rounded-full border px-3 text-[13px] font-bold transition disabled:cursor-wait disabled:opacity-60 ${provider.className}`}>
                <SocialLogo /><span>{socialLoading === provider.id ? "Connexion…" : provider.label}</span>
              </button>
            ))}
          </div></>}
          {!twoFactorChallenge && <><div className="my-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400"><span className="h-px flex-1 bg-[var(--outline-variant)]" />ou avec votre email<span className="h-px flex-1 bg-[var(--outline-variant)]" /></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label htmlFor="email" className="text-[12px] font-semibold uppercase tracking-wide text-[var(--on-surface-variant)]">Email professionnel</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="quentin@envolafrica.com" className="mt-1.5 h-12 w-full rounded-full border border-[#cbdedb] bg-[#f6fbfa] px-5 text-[14px] text-[#082843] transition-colors focus:border-[#006874] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#006874]/10" /></div>
            <div><div className="flex items-center justify-between"><label htmlFor="password" className="text-[12px] font-semibold uppercase tracking-wide text-[var(--on-surface-variant)]">Mot de passe</label><Link href="#" className="text-[11px] text-[var(--on-surface-variant)] hover:text-[#0A1931]">Oublié ?</Link></div><input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5 h-12 w-full rounded-full border border-[#cbdedb] bg-[#f6fbfa] px-5 text-[14px] text-[#082843] transition-colors focus:border-[#006874] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#006874]/10" /></div>
            <button disabled={loading || socialLoading !== null} className="h-12 w-full rounded-full bg-[#0A1931] text-[14px] font-bold text-white transition-colors hover:bg-black disabled:opacity-60">{loading ? "Connexion…" : "Se connecter →"}</button>
          </form>
          </>} {!twoFactorChallenge && <div className="mt-6 text-center text-[13px] text-[var(--on-surface-variant)]">Pas encore de compte ? <Link href="/auth/register" className="font-semibold text-[#0A1931] hover:underline">Créer un compte</Link></div>}
        </section>
          <div className="mt-6 text-center text-[11px] text-[#718184]">Accès sécurisé • Paiements protégés par Moneroo • Aucune donnée bancaire stockée</div>
        </div>
      </div>
    </main>
  );
}
