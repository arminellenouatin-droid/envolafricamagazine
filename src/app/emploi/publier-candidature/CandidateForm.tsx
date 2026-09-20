"use client";
import { useState } from "react";
import { AFRICA_COUNTRIES } from "@/lib/africa-context";

const countries = AFRICA_COUNTRIES.map((country) => country.name);

export default function CandidateForm() {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);

    const form = new FormData(event.currentTarget);
    const cvFile = form.get("cvFile");
    form.delete("cvFile");

    const payload: Record<string, unknown> = Object.fromEntries(form.entries());
    payload.skills = String(form.get("skills") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      if (cvFile instanceof File && cvFile.size > 0) {
        const upload = new FormData();
        upload.set("file", cvFile);
        const uploadResponse = await fetch("/api/jobs/upload", { method: "POST", body: upload });
        const uploadData = await uploadResponse.json();

        if (uploadResponse.status === 401) {
          window.location.assign(`/auth/login?next=${encodeURIComponent("/emploi/publier-candidature")}`);
          return;
        }

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || "Échec du téléchargement du CV.");
        }
        payload.cvUrl = uploadData.path;
      }

      const response = await fetch("/api/jobs/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.assign(`/auth/login?next=${encodeURIComponent("/emploi/publier-candidature")}`);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de la publication.");
      }

      setFeedback({
        type: "success",
        text: "Votre candidature a été publiée avec succès. Les recruteurs peuvent désormais la découvrir.",
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
        <p className="text-xs font-bold uppercase tracking-widest text-[#087e8b]">Candidat · gratuit</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-[#071b36]">Publiez votre candidature</h1>
        <p className="mt-3 text-slate-600">
          Votre profil sera visible par les employeurs. La publication d’une candidature ne nécessite aucun abonnement.
        </p>

        <form onSubmit={submit} className="mt-7 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Prénom
              <input name="firstName" required className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Nom
              <input name="lastName" required className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              E-mail de contact
              <input name="contactEmail" type="email" required className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Téléphone
              <input name="contactPhone" type="tel" className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Poste recherché
              <input name="desiredRole" required placeholder="Ex. Responsable commercial" className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Disponibilité
              <select name="availability" required className={field}>
                <option value="Immédiate">Immédiate</option>
                <option value="Sous 1 mois">Sous 1 mois</option>
                <option value="Sous 3 mois">Sous 3 mois</option>
              </select>
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
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Compétences <span className="text-xs font-normal text-slate-400">(séparées par des virgules)</span>
            <input name="skills" placeholder="Vente, Excel, Gestion de projet" className={field} />
          </label>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Présentez votre parcours
            <textarea name="description" required rows={6} className={field} />
          </label>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            CV privé <span className="text-xs font-normal text-slate-400">(PDF ou DOCX, 10 Mo maximum)</span>
            <input
              name="cvFile"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className={field}
            />
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

          <button
            disabled={busy}
            className="mt-6 rounded-xl bg-[#087e8b] px-6 py-3 font-bold text-white transition hover:bg-[#066570] disabled:opacity-60"
          >
            {busy ? "Publication en cours…" : "Publier ma candidature"}
          </button>
        </form>
      </div>
    </main>
  );
}
