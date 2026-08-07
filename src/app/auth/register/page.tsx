"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterForm() {
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  useEffect(()=>{
    if (ref) localStorage.setItem("eam_affiliate", ref);
  },[ref]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, affiliateRef: localStorage.getItem("eam_affiliate") || ref }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push("/");
      router.refresh();
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px]">
        <div className="bg-white rounded-[28px] border border-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="font-serif font-black text-[26px] text-[#0A1931]">Rejoignez Envol Africa</h1>
            <p className="text-[14px] text-zinc-500 mt-2">12 000 décideurs nous lisent déjà. 12 langues. 1 ambition : l'Afrique.</p>
          </div>

          {error && <div className="bg-red-50 border border-red-100 text-red-700 text-[13px] rounded-full px-4 py-2.5 mb-6 text-center">{error}</div>}
          {ref && <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[13px] rounded-full px-4 py-2.5 mb-6 text-center">🎁 Vous avez été parrainé • Code: {ref} • -10% sur votre premier achat</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">Prénom</label>
                <input required value={form.prenom} onChange={e=>setForm({...form, prenom:e.target.value})} placeholder="Quentin" className="mt-1.5 w-full h-12 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-[14px] focus:outline-none focus:border-[#0A1931] focus:bg-white" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">Nom</label>
                <input required value={form.nom} onChange={e=>setForm({...form, nom:e.target.value})} placeholder="DAVAKAN" className="mt-1.5 w-full h-12 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-[14px] focus:outline-none focus:border-[#0A1931] focus:bg-white" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">Email</label>
              <input type="email" required value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="quentin@envolafrica.com" className="mt-1.5 w-full h-12 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-[14px] focus:outline-none focus:border-[#0A1931] focus:bg-white" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">Mot de passe</label>
              <input type="password" required value={form.password} onChange={e=>setForm({...form, password:e.target.value})} placeholder="Minimum 8 caractères" className="mt-1.5 w-full h-12 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-[14px] focus:outline-none focus:border-[#0A1931] focus:bg-white" />
              <div className="text-[11px] text-zinc-500 mt-2">En créant un compte, vous acceptez nos CGU et notre politique de confidentialité.</div>
            </div>
            <button disabled={loading} className="w-full h-12 rounded-full bg-[#0A1931] text-white font-bold text-[14px] hover:bg-black transition-colors disabled:opacity-60">
              {loading ? "Création..." : "Créer mon compte →"}
            </button>
          </form>

          <div className="mt-6 text-center text-[13px] text-zinc-500">
            Déjà membre ? <Link href="/auth/login" className="font-semibold text-[#0A1931] hover:underline">Se connecter</Link>
          </div>
        </div>
      </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-center text-zinc-500">Chargement...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
