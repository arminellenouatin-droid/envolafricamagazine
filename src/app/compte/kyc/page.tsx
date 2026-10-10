"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { KYCProfile, KYCStatus } from "@/lib/kyc/types";

export default function CompteKYCPage() {
  const [profile, setProfile] = useState<KYCProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [profileType, setProfileType] = useState<"particulier" | "entreprise">("particulier");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [nationalite, setNationalite] = useState("Béninoise");
  const [paysResidence, setPaysResidence] = useState("BJ");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [pieceIdentiteType, setPieceIdentiteType] = useState<"cni" | "passeport" | "permis">("cni");
  const [pieceIdentiteNumero, setPieceIdentiteNumero] = useState("");
  const [pieceIdentiteUrl, setPieceIdentiteUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");

  // Entreprise
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [numeroRccm, setNumeroRccm] = useState("");
  const [numeroIfu, setNumeroIfu] = useState("");
  const [adresseSiege, setAdresseSiege] = useState("");
  const [piecesEntrepriseUrl, setPiecesEntrepriseUrl] = useState("");

  const [uploadingPiece, setUploadingPiece] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [uploadingEntreprise, setUploadingEntreprise] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/kyc");
      const data = await res.json();
      if (data?.profile) {
        setProfile(data.profile);
        if (data.profile.statut !== "non_soumis") {
          setProfileType(data.profile.profileType || "particulier");
          setNom(data.profile.nom || "");
          setPrenom(data.profile.prenom || "");
          setDateNaissance(data.profile.dateNaissance || "");
          setNationalite(data.profile.nationalite || "Béninoise");
          setPaysResidence(data.profile.paysResidence || "BJ");
          setAdresse(data.profile.adresse || "");
          setTelephone(data.profile.telephone || "");
          setPieceIdentiteType(data.profile.pieceIdentiteType || "cni");
          setPieceIdentiteNumero(data.profile.pieceIdentiteNumero || "");
          setPieceIdentiteUrl(data.profile.pieceIdentiteUrl || "");
          setSelfieUrl(data.profile.selfieUrl || "");
          setNomEntreprise(data.profile.nomEntreprise || "");
          setNumeroRccm(data.profile.numeroRccm || "");
          setNumeroIfu(data.profile.numeroIfu || "");
          setAdresseSiege(data.profile.adresseSiege || "");
          if (data.profile.piecesEntrepriseUrls?.length) {
            setPiecesEntrepriseUrl(data.profile.piecesEntrepriseUrls[0]);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileUpload = async (file: File, target: "piece" | "selfie" | "entreprise") => {
    if (target === "piece") setUploadingPiece(true);
    if (target === "selfie") setUploadingSelfie(true);
    if (target === "entreprise") setUploadingEntreprise(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", target === "selfie" ? "avatar" : "document");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Échec de l'upload du document");
      }

      if (target === "piece") setPieceIdentiteUrl(data.url);
      if (target === "selfie") setSelfieUrl(data.url);
      if (target === "entreprise") setPiecesEntrepriseUrl(data.url);

      setMessage({ type: "success", text: "Fichier téléchargé avec succès." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Erreur de téléchargement" });
    } finally {
      if (target === "piece") setUploadingPiece(false);
      if (target === "selfie") setUploadingSelfie(false);
      if (target === "entreprise") setUploadingEntreprise(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        profileType,
        nom,
        prenom,
        dateNaissance: dateNaissance || undefined,
        nationalite,
        paysResidence,
        adresse,
        telephone,
        pieceIdentiteType,
        pieceIdentiteNumero,
        pieceIdentiteUrl,
        selfieUrl,
        nomEntreprise: profileType === "entreprise" ? nomEntreprise : undefined,
        numeroRccm: profileType === "entreprise" ? numeroRccm : undefined,
        numeroIfu: profileType === "entreprise" ? numeroIfu : undefined,
        adresseSiege: profileType === "entreprise" ? adresseSiege : undefined,
        piecesEntrepriseUrls: profileType === "entreprise" && piecesEntrepriseUrl ? [piecesEntrepriseUrl] : [],
      };

      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la soumission");

      setMessage({ type: "success", text: data.message || "Dossier KYC transmis avec succès !" });
      await fetchProfile();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Erreur lors de la validation" });
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (statut?: KYCStatus) => {
    switch (statut) {
      case "approuve":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Vérifié & Approuvé (Retraits activés)
          </span>
        );
      case "en_attente":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800 border border-amber-200 animate-pulse">
            <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
            Dossier en cours d'examen (24h - 48h)
          </span>
        );
      case "rejete":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 border border-red-200">
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            Dossier rejeté (Mise à jour requise)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 border border-zinc-200">
            <span className="material-symbols-outlined text-[16px]">pending_actions</span>
            Non soumis
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[24px] border border-zinc-200 bg-white p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#e5bdbb] border-t-[#9e001f]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-[24px] border border-[#e5bdbb] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#9e001f] text-[24px]">verified_user</span>
              <h1 className="text-xl font-black text-[#0A1931]">Conformité KYC & AML (Anti-Blanchiment)</h1>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Obligatoire pour les retraits de gains, l'affiliation, les prix Africa Awards, la monétisation WAB et les vendeurs Marketplace.
            </p>
          </div>
          <div>{statusBadge(profile?.statut)}</div>
        </div>

        {profile?.statut === "rejete" && profile.motifRejet && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
            <strong>Motif du rejet par le service conformité :</strong> {profile.motifRejet}
          </div>
        )}

        {profile?.statut === "approuve" && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs font-medium text-emerald-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>Votre identité a été authentifiée. Vos demandes de retraits et de remboursements sont 100% opérationnelles.</span>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`rounded-2xl border p-4 text-xs font-bold ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Formulaire KYC */}
      <form onSubmit={handleSubmit} className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-sm font-black text-[#0A1931] uppercase tracking-wider">1. Type de profil</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setProfileType("particulier")}
              className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition ${
                profileType === "particulier"
                  ? "border-[#9e001f] bg-[#f8efee] text-[#9e001f]"
                  : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span>Particulier (Affilié / Créateur)</span>
            </button>
            <button
              type="button"
              onClick={() => setProfileType("entreprise")}
              className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition ${
                profileType === "entreprise"
                  ? "border-[#9e001f] bg-[#f8efee] text-[#9e001f]"
                  : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">domain</span>
              <span>Entreprise / Société</span>
            </button>
          </div>
        </div>

        {/* Coordonnées personnelles */}
        <div className="border-t border-zinc-100 pt-5">
          <h2 className="text-sm font-black text-[#0A1931] uppercase tracking-wider">2. Données personnelles</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-[11px] font-bold text-zinc-600 uppercase">Nom de famille *</label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: KODJO"
                className="mt-1 h-11 w-full rounded-xl border bg-zinc-50 px-3 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-600 uppercase">Prénom(s) *</label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex: Rodrigue"
                className="mt-1 h-11 w-full rounded-xl border bg-zinc-50 px-3 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-600 uppercase">Date de naissance</label>
              <input
                type="date"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border bg-zinc-50 px-3 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-600 uppercase">Nationalité</label>
              <input
                type="text"
                value={nationalite}
                onChange={(e) => setNationalite(e.target.value)}
                placeholder="Ex: Béninoise, Ivoirienne, Sénégalaise..."
                className="mt-1 h-11 w-full rounded-xl border bg-zinc-50 px-3 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-600 uppercase">Adresse résidentielle *</label>
              <input
                type="text"
                required
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex: Quartier Haie Vive, Cotonou"
                className="mt-1 h-11 w-full rounded-xl border bg-zinc-50 px-3 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-600 uppercase">Téléphone de contact *</label>
              <input
                type="tel"
                required
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: +229 97 00 00 00"
                className="mt-1 h-11 w-full rounded-xl border bg-zinc-50 px-3 text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Section Entreprise conditionnelle */}
        {profileType === "entreprise" && (
          <div className="border-t border-zinc-100 pt-5 bg-amber-50/40 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">business_center</span>
              <span>Pièces et Données de la Société (Requis pour Marketplace vendeurs sociétés)</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Dénomination sociale *</label>
                <input
                  type="text"
                  required={profileType === "entreprise"}
                  value={nomEntreprise}
                  onChange={(e) => setNomEntreprise(e.target.value)}
                  placeholder="Ex: Africa Tech SARL"
                  className="mt-1 h-11 w-full rounded-xl border bg-white px-3 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Numéro RCCM *</label>
                <input
                  type="text"
                  required={profileType === "entreprise"}
                  value={numeroRccm}
                  onChange={(e) => setNumeroRccm(e.target.value)}
                  placeholder="Ex: RB/COT/2024/B/1234"
                  className="mt-1 h-11 w-full rounded-xl border bg-white px-3 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Numéro IFU (Identifiant Fiscal)</label>
                <input
                  type="text"
                  value={numeroIfu}
                  onChange={(e) => setNumeroIfu(e.target.value)}
                  placeholder="Ex: 3201912345678"
                  className="mt-1 h-11 w-full rounded-xl border bg-white px-3 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-600 uppercase">Adresse du Siège Social</label>
                <input
                  type="text"
                  value={adresseSiege}
                  onChange={(e) => setAdresseSiege(e.target.value)}
                  placeholder="Ex: Boulevard de la Marina, Cotonou"
                  className="mt-1 h-11 w-full rounded-xl border bg-white px-3 text-xs font-semibold"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-zinc-600 uppercase">
                  Statuts ou Registre de Commerce (PDF ou Photo) *
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#0A1931] px-4 text-xs font-bold text-white hover:bg-[#162744]">
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>{uploadingEntreprise ? "Téléchargement…" : "Joindre le document"}</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      disabled={uploadingEntreprise}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleFileUpload(file, "entreprise");
                      }}
                    />
                  </label>
                  {piecesEntrepriseUrl && (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Document joint avec succès
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents d'identité et Selfie */}
        <div className="border-t border-zinc-100 pt-5">
          <h2 className="text-sm font-black text-[#0A1931] uppercase tracking-wider">
            3. Justificatif d'identité & Selfie de contrôle
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Conformément aux normes AML, votre pièce d'identité et un selfie avec la pièce en main sont strictement requis pour valider les flux financiers.
          </p>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {/* Pièce d'identité */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <label className="text-[11px] font-bold text-zinc-700 uppercase">Type de document *</label>
              <select
                value={pieceIdentiteType}
                onChange={(e) => setPieceIdentiteType(e.target.value as any)}
                className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-xs font-bold"
              >
                <option value="cni">Carte Nationale d'Identité (CNI / CIP)</option>
                <option value="passeport">Passeport biométrique</option>
                <option value="permis">Permis de conduire officiel</option>
              </select>

              <label className="mt-3 block text-[11px] font-bold text-zinc-700 uppercase">
                Numéro du document *
              </label>
              <input
                type="text"
                required
                value={pieceIdentiteNumero}
                onChange={(e) => setPieceIdentiteNumero(e.target.value)}
                placeholder="Ex: N° 123456789"
                className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-xs font-semibold"
              />

              <div className="mt-4">
                <span className="text-[11px] font-bold text-zinc-700 uppercase block">Photo recto/verso de la pièce *</span>
                <div className="mt-2 flex items-center gap-3">
                  <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-[#0A1931] px-4 text-xs font-bold text-white hover:bg-[#162744]">
                    <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                    <span>{uploadingPiece ? "Téléchargement…" : "Charger la pièce"}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      disabled={uploadingPiece}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleFileUpload(file, "piece");
                      }}
                    />
                  </label>
                  {pieceIdentiteUrl && (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Pièce chargée
                    </span>
                  )}
                </div>
                {pieceIdentiteUrl && (
                  <img src={pieceIdentiteUrl} alt="Pièce d'identité" className="mt-3 h-28 w-auto rounded-lg object-contain border" />
                )}
              </div>
            </div>

            {/* Selfie de contrôle */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <label className="text-[11px] font-bold text-zinc-700 uppercase">Selfie avec votre pièce en main *</label>
              <p className="mt-1 text-[11px] text-zinc-500">
                Prenez une photo claire de votre visage tenant votre pièce d'identité visible afin de garantir que vous êtes le titulaire légitime.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-[#9e001f] px-4 text-xs font-bold text-white hover:bg-[#7d0019]">
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  <span>{uploadingSelfie ? "Téléchargement…" : "Charger le selfie"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    disabled={uploadingSelfie}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFileUpload(file, "selfie");
                    }}
                  />
                </label>
                {selfieUrl && (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Selfie chargé
                  </span>
                )}
              </div>

              {selfieUrl && (
                <img src={selfieUrl} alt="Selfie de vérification" className="mt-3 h-28 w-auto rounded-lg object-contain border" />
              )}
            </div>
          </div>
        </div>

        {/* Bouton de soumission */}
        <div className="border-t border-zinc-100 pt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[11px] text-zinc-500 max-w-md">
            En soumettant ces informations, vous certifiez sur l'honneur l'exactitude des pièces fournies. Elles sont protégées et cryptées conformément aux exigences de confidentialité bancaire.
          </p>
          <button
            type="submit"
            disabled={submitting || !pieceIdentiteUrl || !selfieUrl}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#9e001f] px-8 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-black transition disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{submitting ? "Transmission en cours…" : "Soumettre mon dossier KYC"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
