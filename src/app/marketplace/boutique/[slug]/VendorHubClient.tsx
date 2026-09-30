"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { SupplierRecord } from "@/lib/marketplace-slug";
import { generateStoreSlug } from "@/lib/marketplace-slug";

type Props = {
  vendor: {
    id: string;
    name: string;
    slug: string;
    email?: string;
  };
  initialStores: SupplierRecord[];
  isOwner: boolean;
  canManage: boolean;
  currentUser: {
    id: string;
    email?: string | null;
    name?: string | null;
    role?: string | null;
  } | null;
};

const countries = [
  { code: "BJ", label: "Bénin" },
  { code: "CI", label: "Côte d’Ivoire" },
  { code: "SN", label: "Sénégal" },
  { code: "TG", label: "Togo" },
  { code: "CM", label: "Cameroun" },
  { code: "BF", label: "Burkina Faso" },
  { code: "ML", label: "Mali" },
  { code: "NG", label: "Nigeria" },
  { code: "GH", label: "Ghana" },
];

export default function VendorHubClient({
  vendor,
  initialStores,
  isOwner,
  canManage,
  currentUser,
}: Props) {
  const [stores, setStores] = useState<SupplierRecord[]>(initialStores);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [countryCode, setCountryCode] = useState("BJ");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      if ((action === "create-store" || action === "new-store") && canManage) {
        setShowCreateModal(true);
      }
    }
  }, [canManage]);

  const totalProducts = stores.reduce((acc, s) => acc + (s.products_count || 0), 0);

  const handleOpenCreateModal = () => {
    setBusinessName("");
    setDescription("");
    setCountryCode("BJ");
    setCity("");
    setStep(1);
    setError("");
    setMessage("");
    setShowCreateModal(true);
  };

  const handleCreateStore = async () => {
    if (businessName.trim().length < 2) {
      setError("Veuillez saisir le nom de votre boutique (au moins 2 caractères).");
      setStep(1);
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/marketplace/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          businessName: businessName.trim(),
          description: description.trim(),
          countryCode,
          city: city.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de créer la boutique.");

      const newStore = data.supplier;
      setStores((prev) => [newStore, ...prev]);
      setShowCreateModal(false);

      // Redirection directe vers la page de contrôle de la boutique créée
      const newStoreSlug = newStore.slug || generateStoreSlug(newStore.business_name);
      window.location.assign(`/marketplace/boutique/${encodeURIComponent(vendor.slug)}/${encodeURIComponent(newStoreSlug)}`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de la boutique.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1a130f]">
      {/* Top Banner Contextuelle pour le Propriétaire */}
      {canManage && (
        <div className="bg-[#2a211a] border-b border-[#3d3127] px-4 py-2.5 text-xs text-white">
          <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-[#ffca63]">
                {isOwner ? "Espace Vendeur Propriétaire" : "Espace Gestionnaire / Modérateur"} :
              </span>
              <span className="font-semibold text-white/90">{vendor.name}</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <Link href="/marketplace/commandes" className="text-white/80 hover:text-white transition">
                📦 Mes commandes
              </Link>
              <Link href="/marketplace/messages" className="text-white/80 hover:text-white transition">
                💬 Messages clients
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Barre de navigation supérieure */}
      <header className="border-b border-[#eadfce] bg-white sticky top-0 z-30 shadow-xs">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9e001f] hover:text-[#800019] transition"
            >
              <span>←</span>
              <span>Catalogue Marketplace</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-medium text-[#5c493a]">
              {canManage ? "Gérer mes boutiques" : `Boutiques de ${vendor.name}`}
            </span>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 rounded-full bg-[#9e001f] hover:bg-[#800019] text-white px-5 py-2 text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
            >
              <span className="text-sm leading-none font-bold">+</span>
              <span>Créer une boutique</span>
            </button>
          )}
        </div>
      </header>

      {/* Contenu principal */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-10">
        {/* Messages d'information */}
        {message && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800">
            <span>✓ {message}</span>
            <button type="button" onClick={() => setMessage("")} className="hover:underline cursor-pointer">
              ✕
            </button>
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800">
            <span>⚠️ {error}</span>
            <button type="button" onClick={() => setError("")} className="hover:underline cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Hero Card Vendeur */}
        <div className="rounded-[28px] bg-[#2a211a] p-6 text-white md:p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffca63] to-[#e69b00] text-2xl font-black text-[#2a211a] shadow-md shrink-0">
                🏪
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ffca63]/20 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#ffca63]">
                    {canManage ? "Espace Multi-Boutiques Vendeur" : "Vendeur Officiel"}
                  </span>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold">
                    ✓ Profil Vérifié
                  </span>
                </div>

                <h1 className="mt-2 font-display text-2xl font-black md:text-3xl text-white">
                  {canManage ? "Mes Boutiques Envol Africa" : `Boutiques de ${vendor.name}`}
                </h1>

                <p className="mt-1 text-xs text-white/70 max-w-2xl leading-5">
                  {canManage
                    ? "Gérez l'ensemble de vos enseignes commerciales. Cliquez sur une boutique pour accéder à sa page de contrôle (catalogue, ajout de produits, affiliation, statistiques et coordonnées)."
                    : `Découvrez les enseignes officielles gérées par ${vendor.name} sur la Marketplace Envol Africa. Commandes directes et protection par paiement sécurisé.`}
                </p>
              </div>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="rounded-full bg-[#ffca63] hover:bg-[#ffe082] text-[#2a211a] px-6 py-3 text-xs font-black transition shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <span className="text-base leading-none font-bold">+</span>
                <span>Créer une boutique</span>
              </button>
            )}
          </div>

          {/* Statistiques rapides */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 pt-6 border-t border-white/10">
            <div className="rounded-2xl bg-white/10 p-3.5">
              <strong className="block text-2xl font-black text-white">{stores.length}</strong>
              <span className="text-xs text-white/70">
                Boutique{stores.length > 1 ? "s" : ""} active{stores.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 p-3.5">
              <strong className="block text-2xl font-black text-white">{totalProducts}</strong>
              <span className="text-xs text-white/70">Produits au catalogue</span>
            </div>
            <div className="rounded-2xl bg-white/10 p-3.5 col-span-2 sm:col-span-1">
              <strong className="block text-2xl font-black text-[#ffca63]">Indépendant</strong>
              <span className="text-xs text-white/70">Gestion et contrôle par enseigne</span>
            </div>
          </div>
        </div>

        {/* Section Grille des Boutiques */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-black text-[#1a130f]">
                {canManage ? "Vos enseignes commerciales" : "Enseignes disponibles"}
              </h2>
              <p className="text-xs text-[#5c493a] mt-0.5">
                {stores.length} boutique{stores.length > 1 ? "s" : ""} répertoriée{stores.length > 1 ? "s" : ""} pour ce vendeur
              </p>
            </div>

            {canManage && stores.length > 0 && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="text-xs font-bold text-[#9e001f] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>+</span> Ajouter une autre boutique
              </button>
            )}
          </div>

          {stores.length === 0 ? (
            <div className="rounded-[28px] border-2 border-dashed border-[#eadfce] bg-white p-10 text-center shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff5f2] border border-[#f5d5d3] text-3xl">
                🏪
              </div>
              <h3 className="mt-4 font-display text-xl font-black text-[#1a130f]">
                {canManage ? "Vous n'avez pas encore de boutique" : "Aucune boutique disponible pour le moment"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#5c493a]">
                {canManage
                  ? "Créez votre première vitrine marchande Envol Africa pour vendre vos produits physiques, créations, articles digitaux ou formations partout en Afrique."
                  : "Ce vendeur n'a pas encore mis de boutique en ligne. Revenez très bientôt."}
              </p>
              {canManage && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="rounded-full bg-[#9e001f] hover:bg-[#800019] px-6 py-3 text-xs font-black text-white shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <span>+</span>
                    <span>Créer ma première boutique</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {stores.map((s) => {
                const sSlug = s.slug || generateStoreSlug(s.business_name);
                const storeControlPath = `/marketplace/boutique/${encodeURIComponent(vendor.slug)}/${encodeURIComponent(sSlug)}`;
                const publicStorePath = `${storeControlPath}?view=public`;

                return (
                  <div
                    key={s.id}
                    className="group flex flex-col justify-between rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-sm hover:border-[#9e001f] hover:shadow-md transition"
                  >
                    <div>
                      {/* Top ligne carte */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff5f2] border border-[#f5d5d3] text-xl font-black text-[#9e001f]">
                          🏪
                        </div>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          {s.certification_status === "certified" ? "✓ Certifiée" : "Active"}
                        </span>
                      </div>

                      {/* Nom de la boutique */}
                      <h3 className="mt-4 font-display text-lg font-black text-[#1a130f] group-hover:text-[#9e001f] transition">
                        {s.business_name}
                      </h3>

                      {/* Localisation et avis */}
                      <p className="mt-1 text-xs text-[#5c493a]">
                        📍 {s.city ? `${s.city}, ` : ""}{s.country_code || "Afrique"} · {s.rating ? `⭐ ${s.rating}` : "Nouveau vendeur"}
                      </p>

                      {/* URL canonique */}
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#9e001f] bg-[#fff5f2] px-2.5 py-1 rounded-lg border border-[#f5d5d3] font-mono">
                        <span className="truncate">{storeControlPath}</span>
                      </div>

                      {/* Description */}
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#5c493a]">
                        {s.description || "Boutique officielle sur Envol Africa Marketplace."}
                      </p>

                      {/* Compteur de produits */}
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#fffdfb] border border-[#eadfce] p-2.5 text-xs text-[#1a130f]">
                        <span className="font-black text-[#9e001f]">{s.products_count ?? 0}</span>
                        <span className="text-[#5c493a]">produit(s) actuellement en rayon</span>
                      </div>
                    </div>

                    {/* Actions de la boutique */}
                    <div className="mt-6 space-y-2 pt-4 border-t border-[#f2e7d8]">
                      {canManage ? (
                        <>
                          <Link
                            href={storeControlPath}
                            className="block w-full text-center rounded-full bg-[#9e001f] hover:bg-[#800019] py-2.5 text-xs font-black text-white shadow-xs transition active:scale-95"
                          >
                            ⚙️ Accéder au panneau de contrôle →
                          </Link>
                          <Link
                            href={publicStorePath}
                            className="block w-full text-center rounded-full border border-[#eadfce] bg-[#fffdfb] hover:bg-white py-2 text-xs font-bold text-[#5c493a] transition"
                          >
                            👁️ Voir la vitrine publique
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={storeControlPath}
                          className="block w-full text-center rounded-full bg-[#9e001f] hover:bg-[#800019] py-2.5 text-xs font-black text-white shadow-xs transition active:scale-95"
                        >
                          Visiter la boutique →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Modal Créer une boutique */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-[28px] border border-[#eadfce] bg-white p-6 sm:p-8 shadow-2xl text-[#1a130f] animate-in fade-in zoom-in-95 duration-200">
            {/* Header du modal */}
            <div className="flex items-center justify-between border-b border-[#f0e6d8] pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#a36300]">
                  {stores.length > 0 ? "Nouvelle Enseigne" : "Première Boutique"}
                </p>
                <h3 className="font-display text-xl font-black text-[#1a130f] mt-0.5">
                  Créer une boutique
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#f8f3ed] text-[#9e001f] hover:bg-[#eee3d7] transition font-bold cursor-pointer"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Stepper indicateur */}
            <div className="mt-4 flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i <= step ? "bg-[#9e001f]" : "bg-[#f0e6d8]"
                  }`}
                />
              ))}
            </div>

            {/* Contenu des étapes */}
            <div className="mt-5">
              {step === 1 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#a36300]">
                    Étape 1 sur 3
                  </p>
                  <h4 className="mt-1 font-display text-lg font-black text-[#1a130f]">
                    Quel est le nom de votre boutique ?
                  </h4>
                  <p className="mt-1 text-xs text-[#5c493a]">
                    Ce nom sera affiché sur vos fiches produits, votre vitrine publique et dans le répertoire vendeur.
                  </p>

                  <div className="mt-5">
                    <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
                      Nom commercial de l’enseigne *
                    </label>
                    <input
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Ex: Les Délices Royaux, Wax Couture, AfroTech..."
                      className="h-12 w-full rounded-xl border border-[#eadfce] bg-white px-4 text-sm text-[#1a130f] placeholder:text-[#8c7764] focus:border-[#9e001f] focus:outline-none focus:ring-1 focus:ring-[#9e001f]"
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="rounded-full border border-[#eadfce] px-5 py-2.5 text-xs font-bold text-[#5c493a] hover:bg-zinc-50 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (businessName.trim().length >= 2) {
                          setError("");
                          setStep(2);
                        } else {
                          setError("Veuillez saisir un nom de boutique d'au moins 2 caractères.");
                        }
                      }}
                      className="rounded-full bg-[#9e001f] hover:bg-[#800019] text-white px-6 py-2.5 text-xs font-black transition shadow-sm cursor-pointer"
                    >
                      Continuer vers la localisation →
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#a36300]">
                    Étape 2 sur 3
                  </p>
                  <h4 className="mt-1 font-display text-lg font-black text-[#1a130f]">
                    Présentation & Localisation
                  </h4>
                  <p className="mt-1 text-xs text-[#5c493a]">
                    Indiquez votre description d’activité et votre zone géographique principale.
                  </p>

                  <div className="mt-4">
                    <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
                      Description de la boutique
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Présentez les articles vendus, vos garanties de livraison ou votre savoir-faire..."
                      className="min-h-24 w-full rounded-xl border border-[#eadfce] bg-white p-3.5 text-xs text-[#1a130f] placeholder:text-[#8c7764] focus:border-[#9e001f] focus:outline-none"
                    />
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
                        Pays d’exploitation
                      </label>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-xs text-[#1a130f] font-semibold focus:outline-none"
                      >
                        {countries.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
                        Ville
                      </label>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ex: Cotonou, Abidjan, Dakar..."
                        className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-xs text-[#1a130f] placeholder:text-[#8c7764] focus:border-[#9e001f] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-full border border-[#eadfce] px-5 py-2.5 text-xs font-bold text-[#5c493a] hover:bg-zinc-50 cursor-pointer"
                    >
                      ← Étape précédente
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="rounded-full bg-[#9e001f] hover:bg-[#800019] text-white px-6 py-2.5 text-xs font-black transition shadow-sm cursor-pointer"
                    >
                      Vérifier et créer →
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#a36300]">
                    Étape 3 sur 3
                  </p>
                  <h4 className="mt-1 font-display text-lg font-black text-[#1a130f]">
                    Confirmation de l’enseigne
                  </h4>

                  <div className="mt-4 rounded-2xl bg-[#fff8f6] border border-[#f5d5d3] p-4 text-[#1a130f]">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-lg font-black text-[#9e001f]">
                        🏪 {businessName}
                      </span>
                      <span className="rounded-full bg-white border border-[#f5d5d3] px-2.5 py-0.5 text-xs font-bold text-[#5c493a]">
                        {countryCode} · {city || "Afrique"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#5c493a] leading-5">
                      {description || "Aucune description fournie."}
                    </p>
                    <p className="mt-3 text-[11px] font-mono text-[#9e001f]">
                      URL finale : /marketplace/boutique/{vendor.slug}/{generateStoreSlug(businessName)}
                    </p>
                  </div>

                  <div className="mt-6 flex justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-full border border-[#eadfce] px-5 py-2.5 text-xs font-bold text-[#5c493a] hover:bg-zinc-50 cursor-pointer"
                    >
                      ← Modifier
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateStore}
                      disabled={busy}
                      className="rounded-full bg-[#9e001f] hover:bg-[#800019] text-white px-7 py-3 text-xs font-black transition shadow-md disabled:opacity-60 cursor-pointer active:scale-95"
                    >
                      {busy ? "Création de la boutique…" : "Confirmer & Créer ma boutique"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-800">
                ⚠️ {error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
