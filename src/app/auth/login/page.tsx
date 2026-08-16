"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="bg-white rounded-[28px] border border-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#0A1931] rounded-[14px] flex items-center justify-center mx-auto mb-4">
              <span className="text-[#D4AF37] font-serif font-black text-xl">E</span><span className="text-white font-serif font-black text-xl -ml-0.5">A</span>
            </div>
            <h1 className="font-serif font-black text-[26px] text-[#0A1931]">Bon retour</h1>
            <p className="text-[14px] text-zinc-500 mt-2">Connectez-vous pour accéder à vos abonnements et articles illimités</p>
          </div>

          {error && <div className="bg-red-50 border border-red-100 text-red-700 text-[13px] rounded-full px-4 py-2.5 mb-6 text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wide text-zinc-600">Email professionnel</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="quentin@envolafrica.com" className="mt-1.5 w-full h-12 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-[14px] focus:outline-none focus:border-[#0A1931] focus:bg-white transition-colors" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold uppercase tracking-wide text-zinc-600">Mot de passe</label>
                <Link href="#" className="text-[11px] text-zinc-500 hover:text-[#0A1931]">Oublié ?</Link>
              </div>
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5 w-full h-12 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-[14px] focus:outline-none focus:border-[#0A1931] focus:bg-white transition-colors" />
            </div>
            <button disabled={loading} className="w-full h-12 rounded-full bg-[#0A1931] text-white font-bold text-[14px] hover:bg-black transition-colors disabled:opacity-60">
              {loading ? "Connexion..." : "Se connecter →"}
            </button>
          </form>

          <div className="mt-6 text-center text-[13px] text-zinc-500">
            Pas encore de compte ? <Link href="/auth/register" className="font-semibold text-[#0A1931] hover:underline">Créer un compte</Link>
          </div>

        </div>
        <div className="mt-6 text-center text-[11px] text-zinc-400">
          Paiement sécurisé par Moneroo • Aucune donnée bancaire stockée
        </div>
      </div>
    </div>
  );
}
