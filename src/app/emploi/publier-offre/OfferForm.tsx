"use client";
import Link from "next/link";
import { useState } from "react";
import { AFRICA_COUNTRIES } from "@/lib/africa-context";
const countries = AFRICA_COUNTRIES.map((country) => country.name);

export default function OfferForm() {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);

    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(form.entries());
    payload.skills = String(form.get("skills") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.assign(`/auth/login?next=${encodeURIComponent("/emploi/publier-offre")}`);
        return;
      }

      if (response.status === 402) {
        setFeedback(null);
        window.location.assign("/emploi/abonnements");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de la publication.");
      }

      setFeedback({
        type: "success",
        text: "Votre offre a été publiée avec succès. Les coordonnées de votre structure sont protégées jusqu’au décryptage par les candidats.",
      });
      event.currentTarget.reset();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Une erreur inattendue est survenue.",
      });
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none transition focus:border-[#087e8b] focus:ring-1 focus:ring-[#087e8b]";

  return (
    <main className="min-h-screen bg-[#f7f8fa] py-10">
      <div className="mx-auto max-w-3xl px-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#a36300]">Entreprise · deux offres offertes</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-[#071b36]">Publiez une offre d’emploi</h1>
        <p className="mt-3 text-slate-600">
          Les deux premières publications sont offertes. Les coordonnées directes de votre structure restent protégées jusqu’au décryptage par un candidat qualifié.
        </p>

        <form onSubmit={submit} className="mt-7 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Intitulé du poste
              <input name="title" required className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Secteur
              <input name="sector" required placeholder="Tech, Finance, Agro…" className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Type de contrat
              <select name="contractType" required className={field}>
                <option>CDI</option>
                <option>CDD</option>
                <option>Stage</option>
                <option>Freelance</option>
                <option>Remote</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Rémunération
              <input name="salary" placeholder="Ex. Selon profil" className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Nom de l’entreprise
              <input name="companyName" required className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              E-mail de contact
              <input name="contactEmail" required type="email" className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Téléphone
              <input name="contactPhone" type="tel" className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Adresse
              <input name="address" className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Pays
              <select name="country" required className={field}>
                <option value="">Choisir un pays</option>
                {countries.map((country) => (
                  <option key={country}>{country}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Ville
              <input name="city" required className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Date d'expiration
              <input name="expiresAt" type="date" required className={field} />
            </label>
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Compétences <span className="text-xs font-normal text-slate-400">(séparées par des virgules)</span>
            <input name="skills" placeholder="Vente, Négociation, Anglais" className={field} />
          </label>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Description détaillée du poste
            <textarea name="description" required rows={7} className={field} />
          </label>

          {feedback && (
            <div
              className={`mt-5 rounded-xl p-4 text-sm font-semibold ${
                feedback.type === "success"
                  ? "bg-[#e9f7f5] text-[#087e8b] border border-[#087e8b]/20"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              disabled={busy}
              className="rounded-xl bg-[#087e8b] px-6 py-3 font-bold text-white transition hover:bg-[#066570] disabled:opacity-60"
            >
              {busy ? "Publication en cours…" : "Publier l’offre"}
            </button>
            <Link
              href="/emploi/abonnements"
              className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Voir les accès entreprise
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
