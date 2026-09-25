"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AdFormat {
  id: string;
  category: "magazine" | "web";
  name: string;
  dimension: string;
  description: string;
  priceXof: number;
  priceEur: number;
  featured?: boolean;
}

interface PubliciteClientProps {
  isAdmin: boolean;
  user: { email: string; nom: string; prenom: string } | null;
}

export default function PubliciteClient({ isAdmin, user }: PubliciteClientProps) {
  const [formats, setFormats] = useState<AdFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "magazine" | "web">("all");
  
  // Modal de devis
  const [selectedFormat, setSelectedFormat] = useState<AdFormat | null>(null);
  const [company, setCompany] = useState("");
  const [fullName, setFullName] = useState(user ? `${user.prenom} ${user.nom}` : "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Administration : Edition des tarifs
  const [editingFormat, setEditingFormat] = useState<AdFormat | null>(null);
  const [editPriceXof, setEditPriceXof] = useState(0);
  const [editPriceEur, setEditPriceEur] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);

  // Administration : Upload Kit Média
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/publicite")
      .then((res) => res.json())
      .then((data) => {
        if (data.formats) setFormats(data.formats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredFormats = formats.filter((f) => {
    if (filter === "all") return true;
    return f.category === filter;
  });

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFormat) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/publicite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formatId: selectedFormat.id,
          formatName: selectedFormat.name,
          company,
          fullName,
          email,
          phone,
          notes,
        }),
      });
      if (res.ok) {
        setSubmitSuccess(true);
      }
    } catch {
      alert("Une erreur est survenue lors de l'envoi de votre demande.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFormat) return;
    setSavingEdit(true);

    const updatedFormats = formats.map((f) => {
      if (f.id === editingFormat.id) {
        return { ...f, priceXof: editPriceXof, priceEur: editPriceEur };
      }
      return f;
    });

    try {
      const res = await fetch("/api/publicite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formats: updatedFormats }),
      });
      if (res.ok) {
        setFormats(updatedFormats);
        setEditingFormat(null);
      } else {
        alert("Erreur lors de la mise à jour du tarif.");
      }
    } catch {
      alert("Erreur de communication avec le serveur.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleUploadKitMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch("/api/kit-media", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadSuccess(true);
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadSuccess(false);
          setUploadFile(null);
        }, 2000);
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors du téléversement du fichier.");
      }
    } catch {
      alert("Erreur réseau lors du téléversement.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1b1c1c] pb-24">
      {/* Hero Header */}
      <section className="bg-[#1b1c1c] text-white py-16 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#9e001f]/20 blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9e001f]/20 border border-[#9e001f]/40 text-[#ffdad8] text-xs font-bold uppercase tracking-wider mb-4">
            Régie Commerciale & Publicité
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-white mb-4">
            Donnez une envergure panafricaine à votre communication
          </h1>
          <p className="max-w-2xl text-base md:text-lg text-[#e4e2e1] leading-relaxed mb-8">
            Touchez chaque mois plus de 150 000 décideurs, entrepreneurs, investisseurs et cadres dirigeants à travers l'Afrique et sa diaspora.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/api/kit-media"
              download
              className="inline-flex items-center gap-2 bg-[#9e001f] hover:bg-[#c8102e] text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-lg hover:shadow-xl transition-all"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Télécharger le Kit Média 2026 (PDF)
            </a>
            <a
              href="#tarifs"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3.5 rounded-full font-bold text-sm transition-all"
            >
              <span className="material-symbols-outlined text-lg">payments</span>
              Consulter la grille tarifaire
            </a>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-3.5 rounded-full font-bold text-sm shadow-md transition-all ml-auto"
              >
                <span className="material-symbols-outlined text-lg">cloud_upload</span>
                Admin : Téléverser nouveau Kit Média
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="border-b border-[#e5bdbb]/40 bg-white py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-black text-[#9e001f]">150 000+</div>
            <div className="text-xs uppercase font-bold text-[#6b5353] mt-1">Lecteurs mensuels</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black text-[#9e001f]">25 000</div>
            <div className="text-xs uppercase font-bold text-[#6b5353] mt-1">Tirage papier certifié</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black text-[#9e001f]">18</div>
            <div className="text-xs uppercase font-bold text-[#6b5353] mt-1">Pays de diffusion en Afrique</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black text-[#9e001f]">84%</div>
            <div className="text-xs uppercase font-bold text-[#6b5353] mt-1">Cadres & Décideurs d'entreprises</div>
          </div>
        </div>
      </section>

      {/* Grille Tarifaire */}
      <section id="tarifs" className="max-w-6xl mx-auto px-6 pt-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl md:text-4xl font-black font-display text-[#1b1c1c]">
            Nos Formats Publicitaires & Tarifs
          </h2>
          <p className="text-sm md:text-base text-[#6b5353] mt-2">
            Des solutions flexibles adaptées à vos objectifs : visibilité print dans le magazine ou digitale sur notre écosystème web.
          </p>

          {/* Filtres de catégorie */}
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === "all"
                  ? "bg-[#9e001f] text-white"
                  : "bg-white border border-[#e5bdbb] text-[#6b5353] hover:bg-[#fff5f3]"
              }`}
            >
              Tous les formats ({formats.length})
            </button>
            <button
              onClick={() => setFilter("magazine")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === "magazine"
                  ? "bg-[#9e001f] text-white"
                  : "bg-white border border-[#e5bdbb] text-[#6b5353] hover:bg-[#fff5f3]"
              }`}
            >
              Magazine Papier & Numérique
            </button>
            <button
              onClick={() => setFilter("web")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === "web"
                  ? "bg-[#9e001f] text-white"
                  : "bg-white border border-[#e5bdbb] text-[#6b5353] hover:bg-[#fff5f3]"
              }`}
            >
              Web & Réseau WAB
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#6b5353]">Chargement des tarifs...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFormats.map((item) => (
              <div
                key={item.id}
                className={`relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-200 bg-white border ${
                  item.featured
                    ? "border-[#9e001f] shadow-md ring-2 ring-[#9e001f]/20"
                    : "border-[#e5bdbb]/60 hover:shadow-lg"
                }`}
              >
                {item.featured && (
                  <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[#9e001f] text-white text-[10px] font-extrabold uppercase tracking-wider">
                    Emplacement Recommandé
                  </span>
                )}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#f2e8e6] text-[#9e001f]">
                      {item.category === "magazine" ? "Magazine Print" : "Digital & Web"}
                    </span>
                    <span className="text-xs text-[#6b5353] font-medium">{item.dimension}</span>
                  </div>
                  <h3 className="text-lg font-bold font-display text-[#1b1c1c] mb-2">{item.name}</h3>
                  <p className="text-xs text-[#6b5353] leading-relaxed mb-6">{item.description}</p>
                </div>

                <div className="border-t border-[#f2e8e6] pt-4 mt-auto">
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <div className="text-2xl font-black text-[#9e001f]">
                        {item.priceXof.toLocaleString("fr-FR")} <span className="text-xs font-bold">FCFA</span>
                      </div>
                      <div className="text-xs text-[#6b5353]">
                        soit environ {item.priceEur.toLocaleString("fr-FR")} € HT
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFormat(item);
                        setSubmitSuccess(false);
                      }}
                      className="flex-1 bg-[#1b1c1c] hover:bg-[#9e001f] text-white text-xs font-bold py-2.5 rounded-xl text-center transition-colors"
                    >
                      Commander / Devis
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFormat(item);
                          setEditPriceXof(item.priceXof);
                          setEditPriceEur(item.priceEur);
                        }}
                        className="px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl"
                        title="Modifier le prix (Admin)"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal Devis / Commande */}
      {selectedFormat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedFormat(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <h3 className="text-xl font-bold font-display text-[#1b1c1c] mb-2">Demande envoyée avec succès</h3>
                <p className="text-sm text-[#6b5353] leading-relaxed mb-6">
                  Notre régie publicitaire a bien reçu votre demande pour le format{" "}
                  <strong>{selectedFormat.name}</strong>. Un chargé de compte prendra contact avec vous dans un délai de 24 heures.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedFormat(null)}
                  className="bg-[#9e001f] text-white px-6 py-2.5 rounded-full font-bold text-xs"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit}>
                <div className="mb-6">
                  <span className="px-2.5 py-1 rounded bg-[#f2e8e6] text-[#9e001f] text-[10px] font-bold uppercase tracking-wider">
                    Demande de devis & réservation
                  </span>
                  <h3 className="text-xl font-black font-display text-[#1b1c1c] mt-2">{selectedFormat.name}</h3>
                  <p className="text-xs text-[#6b5353] mt-1">
                    Tarif officiel : {selectedFormat.priceXof.toLocaleString("fr-FR")} FCFA ({selectedFormat.priceEur} € HT)
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#1b1c1c] mb-1">Nom de l'entreprise ou marque *</label>
                    <input
                      type="text"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Ex: Groupe Panafricain SA"
                      className="w-full rounded-xl border border-[#e5bdbb] px-3 py-2.5 focus:border-[#9e001f] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#1b1c1c] mb-1">Nom & Prénom du contact *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ex: Jean Dupont"
                        className="w-full rounded-xl border border-[#e5bdbb] px-3 py-2.5 focus:border-[#9e001f] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#1b1c1c] mb-1">Téléphone / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: +229 01 23 45 67"
                        className="w-full rounded-xl border border-[#e5bdbb] px-3 py-2.5 focus:border-[#9e001f] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1b1c1c] mb-1">Email professionnel *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@entreprise.com"
                      className="w-full rounded-xl border border-[#e5bdbb] px-3 py-2.5 focus:border-[#9e001f] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1b1c1c] mb-1">Objectifs ou instructions pour l'insertion</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Précisez le mois souhaité pour la parution, vos dates de campagne..."
                      className="w-full rounded-xl border border-[#e5bdbb] px-3 py-2 focus:border-[#9e001f] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat(null)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-bold text-xs hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#9e001f] hover:bg-[#c8102e] text-white py-3 rounded-xl font-bold text-xs disabled:opacity-50"
                  >
                    {submitting ? "Transmission..." : "Envoyer ma demande"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Admin Modification de Prix */}
      {isAdmin && editingFormat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-black font-display text-[#1b1c1c] mb-2">
              Modifier le tarif (Admin)
            </h3>
            <p className="text-xs text-[#6b5353] mb-4">
              Format : <strong>{editingFormat.name}</strong>
            </p>

            <form onSubmit={handleSavePrice} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Prix en FCFA (XOF)</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={editPriceXof}
                  onChange={(e) => setEditPriceXof(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Prix indicatif en Euros (€)</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={editPriceEur}
                  onChange={(e) => setEditPriceEur(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFormat(null)}
                  className="flex-1 border py-2.5 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-bold"
                >
                  {savingEdit ? "Sauvegarde..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Admin Upload Kit Media */}
      {isAdmin && showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-black font-display text-[#1b1c1c] mb-2">
              Téléverser un nouveau Kit Média (PDF)
            </h3>
            <p className="text-xs text-[#6b5353] mb-4">
              Ce fichier PDF sera automatiquement téléchargé par les visiteurs lorsqu'ils cliquent sur "Kit Média" dans le pied de page ou sur cette page.
            </p>

            {uploadSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center">
                Kit Média mis à jour avec succès !
              </div>
            ) : (
              <form onSubmit={handleUploadKitMedia} className="space-y-4">
                <div className="border-2 border-dashed border-[#e5bdbb] rounded-2xl p-6 text-center hover:bg-[#fff8f6] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-xs"
                  />
                  <p className="text-[11px] text-gray-500 mt-2">Format PDF uniquement (Max 25 Mo)</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 border py-2.5 rounded-xl font-bold text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uploadFile}
                    className="flex-1 bg-[#9e001f] hover:bg-[#c8102e] text-white py-2.5 rounded-xl font-bold text-xs disabled:opacity-50"
                  >
                    {uploading ? "Téléversement..." : "Publier le Kit Média"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
