"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Détecter si l'utilisateur arrive via un lien de récupération avec token ou hash
    const hash = window.location.hash;
    const search = new URLSearchParams(window.location.search);
    const type = search.get("type");

    if (type === "recovery" || hash.includes("type=recovery") || hash.includes("access_token")) {
      setIsRecoverySession(true);
    }

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      supabase.auth.onAuthStateChange(async (event: any) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsRecoverySession(true);
        }
      });
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Service d'authentification temporairement indisponible.");
      setLoading(false);
      return;
    }

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://www.envolafrica.site";
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/reset?type=recovery`,
      });

      if (resetError) {
        setError(resetError.message || "Impossible d'envoyer le lien de réinitialisation.");
      } else {
        setMessage(
          "Si un compte correspond à cette adresse e-mail, vous recevrez un lien sécurisé dans quelques instants. Pensez à vérifier vos courriers indésirables (spams)."
        );
      }
    } catch {
      setError("Une erreur inattendue est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Service d'authentification temporairement indisponible.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || "Erreur lors de la mise à jour du mot de passe.");
      } else {
        setMessage("Votre mot de passe a été réinitialisé avec succès ! Redirection en cours vers la connexion…");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch {
      setError("Une erreur inattendue est survenue lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-[#fcf9f8] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-[#e5bdbb] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <Link href="/" className="inline-block font-display text-2xl font-black text-[#9e001f]">
              ENVOL AFRICA
            </Link>
            <h1 className="mt-3 text-xl font-bold text-[#1c1b1b]">
              {isRecoverySession ? "Nouveau mot de passe" : "Mot de passe oublié"}
            </h1>
            <p className="mt-1 text-xs text-[#5c403f]">
              {isRecoverySession
                ? "Choisissez un mot de passe sécurisé pour votre compte."
                : "Recevez un lien par email pour réinitialiser votre accès."}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              {message}
            </div>
          )}

          {!isRecoverySession ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5c403f]"
                >
                  Adresse email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre-email@domaine.com"
                  className="mt-1.5 h-11 w-full rounded-full border border-[#cbdedb] bg-[#f6fbfa] px-4 text-[14px] text-[#082843] transition-colors focus:border-[#9e001f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9e001f]/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 h-11 w-full rounded-full bg-[#9e001f] text-[13px] font-bold text-white transition-colors hover:bg-[#7d0018] disabled:opacity-60"
              >
                {loading ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5c403f]"
                >
                  Nouveau mot de passe
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Au moins 8 caractères"
                    className="h-11 w-full rounded-full border border-[#cbdedb] bg-[#f6fbfa] px-4 pr-10 text-[14px] text-[#082843] transition-colors focus:border-[#9e001f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9e001f]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-800"
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? "Cacher" : "Voir"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5c403f]"
                >
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="mt-1.5 h-11 w-full rounded-full border border-[#cbdedb] bg-[#f6fbfa] px-4 text-[14px] text-[#082843] transition-colors focus:border-[#9e001f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9e001f]/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 h-11 w-full rounded-full bg-[#9e001f] text-[13px] font-bold text-white transition-colors hover:bg-[#7d0018] disabled:opacity-60"
              >
                {loading ? "Mise à jour…" : "Enregistrer le mot de passe"}
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-zinc-100 pt-4 text-center text-xs text-[#5c403f]">
            Vous vous souvenez de votre mot de passe ?{" "}
            <Link href="/auth/login" className="font-bold text-[#9e001f] hover:underline">
              Se connecter
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-[#718184]">
          Accès sécurisé et chiffré • Envol Africa
        </div>
      </div>
    </div>
  );
}
