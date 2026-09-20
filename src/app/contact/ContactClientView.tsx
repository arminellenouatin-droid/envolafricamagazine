"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactClientView() {
  const [form, setForm] = useState({
    nom: "",
    email: "",
    service: "redaction",
    sujet: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          email: form.email,
          service: form.service,
          message: `${form.sujet ? `[Sujet: ${form.sujet}] ` : ""}${form.message}`,
        }),
      });
      if (res.ok) {
        setSent(true);
        setForm({ nom: "", email: "", service: "redaction", sujet: "", message: "" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-24 text-[#2a211a]">
      {/* Header Banner */}
      <section className="bg-[#242020] text-white py-14 px-5 md:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#d8c3c1]">
            <Link href="/" className="hover:text-white transition">Accueil</Link>
            <span>›</span>
            <span className="text-[#ffdad8]">Contact</span>
          </div>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl font-bold leading-tight">
            Contactez la rédaction & nos équipes
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d8c3c1]">
            Vous souhaitez proposer un sujet, diffuser une campagne publicitaire, solliciter notre service abonnés ou devenir partenaire ? Nos équipes basées à Cotonou et sur le continent vous répondent sous 24h ouvrées.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <div className="mx-auto max-w-5xl px-5 md:px-10 lg:px-16 -mt-6">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Form */}
          <div className="rounded-[24px] border border-[#eadfce] bg-white p-6 md:p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-[#2a211a]">Envoyer un message</h2>
            <p className="mt-1 text-xs text-[#725f4d]">Remplissez le formulaire ci-dessous, notre équipe vous orientera vers le bon interlocuteur.</p>

            {sent ? (
              <div className="mt-6 rounded-2xl bg-green-50 border border-green-200 p-6 text-green-900">
                <div className="font-bold text-base">✓ Message bien reçu !</div>
                <p className="mt-2 text-xs leading-5 text-green-800">
                  Merci de nous avoir contactés. Un membre de la rédaction ou du service concerné traitera votre demande sous 24 heures ouvrées.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-4 rounded-full bg-green-700 px-5 py-2 text-xs font-bold text-white transition hover:bg-green-800"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-nom" className="text-[11px] font-bold uppercase tracking-wider text-[#725f4d]">
                      Nom complet
                    </label>
                    <input
                      id="contact-nom"
                      required
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      placeholder="Ex : Koffi Jean-Baptiste"
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#eadfce] bg-[#fcf9f8] px-4 text-xs text-[#2a211a] focus:border-[#9e001f] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="text-[11px] font-bold uppercase tracking-wider text-[#725f4d]">
                      Adresse e-mail
                    </label>
                    <input
                      id="contact-email"
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="votre-email@domaine.com"
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#eadfce] bg-[#fcf9f8] px-4 text-xs text-[#2a211a] focus:border-[#9e001f] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-service" className="text-[11px] font-bold uppercase tracking-wider text-[#725f4d]">
                      Département concerné
                    </label>
                    <select
                      id="contact-service"
                      value={form.service}
                      onChange={(e) => setForm({ ...form, service: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#eadfce] bg-[#fcf9f8] px-3 text-xs text-[#2a211a] focus:border-[#9e001f] focus:bg-white focus:outline-none"
                    >
                      <option value="redaction">Rédaction & Proposition d&apos;article</option>
                      <option value="pub">Régie Publicitaire & Kit Média</option>
                      <option value="abonnement">Abonnements & Kiosque Numérique</option>
                      <option value="recuperation">Récupération de mot de passe / Compte</option>
                      <option value="partenariat">Partenariat Institutionnel / Salons</option>
                      <option value="autre">Autre demande</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="contact-sujet" className="text-[11px] font-bold uppercase tracking-wider text-[#725f4d]">
                      Objet de votre message
                    </label>
                    <input
                      id="contact-sujet"
                      value={form.sujet}
                      onChange={(e) => setForm({ ...form, sujet: e.target.value })}
                      placeholder="Ex : Demande de devis régie publicitaire"
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#eadfce] bg-[#fcf9f8] px-4 text-xs text-[#2a211a] focus:border-[#9e001f] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="text-[11px] font-bold uppercase tracking-wider text-[#725f4d]">
                    Votre message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Précisez votre demande, vos coordonnées professionnelles ou votre proposition..."
                    className="mt-1.5 w-full rounded-xl border border-[#eadfce] bg-[#fcf9f8] p-4 text-xs text-[#2a211a] focus:border-[#9e001f] focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#9e001f] py-3 text-xs font-bold text-white shadow-md transition hover:bg-black disabled:opacity-60"
                >
                  {loading ? "Envoi en cours…" : "Envoyer le message →"}
                </button>
              </form>
            )}
          </div>

          {/* Contact Details Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-[22px] border border-[#eadfce] bg-white p-6 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9e001f]">Pôles Dédiés</span>
              <div className="mt-4 space-y-4 text-xs">
                <div className="border-b border-[#f0e7dc] pb-3">
                  <div className="font-bold text-[#2a211a]">Rédaction Centrale</div>
                  <a href="mailto:redaction@envolafrica.site" className="text-[#9e001f] hover:underline">
                    redaction@envolafrica.site
                  </a>
                </div>
                <div className="border-b border-[#f0e7dc] pb-3">
                  <div className="font-bold text-[#2a211a]">Régie Publicitaire & Annonces</div>
                  <a href="mailto:regie@envolafrica.site" className="text-[#9e001f] hover:underline">
                    regie@envolafrica.site
                  </a>
                </div>
                <div className="border-b border-[#f0e7dc] pb-3">
                  <div className="font-bold text-[#2a211a]">Support Abonnements & Kiosque</div>
                  <a href="mailto:support@envolafrica.site" className="text-[#9e001f] hover:underline">
                    support@envolafrica.site
                  </a>
                </div>
                <div>
                  <div className="font-bold text-[#2a211a]">Direction Générale</div>
                  <a href="mailto:contact@envolafrica.site" className="text-[#9e001f] hover:underline">
                    contact@envolafrica.site
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#eadfce] bg-[#fffaf3] p-6 text-xs text-[#725f4d]">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a36300]">Implantation</span>
              <p className="mt-3 font-bold text-[#2a211a]">Siège Panafricain</p>
              <p className="mt-1">Cotonou, République du Bénin</p>
              <p className="mt-3 font-bold text-[#2a211a]">Bureaux régionaux</p>
              <p className="mt-1">Abidjan (Côte d&apos;Ivoire) · Dakar (Sénégal)</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
