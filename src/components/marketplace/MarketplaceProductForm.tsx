"use client";

import { useEffect, useState } from "react";
import { marketplaceCategories } from "@/lib/marketplace-seed";

const productTypes = [
  ["physical", "Produit physique", "Motos, voitures, vêtements, électroménager et tout produit livré."],
  ["service", "Service", "Prestations, conseil, maintenance ou accompagnement."],
  ["training", "Formation", "Cours, programme ou accompagnement pédagogique en ligne."],
  ["digital", "Produit digital", "Ressource numérique accessible après confirmation du paiement."],
  ["downloadable", "Fichier téléchargeable", "PDF, document, audio, vidéo ou archive protégée après paiement."],
] as const;

export default function MarketplaceProductForm({
  onCreated,
  supplierId,
  stores,
}: {
  onCreated?: () => void;
  supplierId?: string;
  stores?: Array<{ id: string; business_name: string; city?: string | null; country_code?: string | null }>;
}) {
  const [selectedStoreId, setSelectedStoreId] = useState(supplierId || stores?.[0]?.id || "");
  const [productType, setProductType] = useState("physical");
  const [deliveryType, setDeliveryType] = useState("shipping");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(marketplaceCategories[1] || "Autres produits");
  const [priceXof, setPriceXof] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [countryCode, setCountryCode] = useState("BJ");
  const [city, setCity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [digitalExternalUrl, setDigitalExternalUrl] = useState("");
  const [digitalAccessInstructions, setDigitalAccessInstructions] = useState("");
  const [digitalDownloadLimit, setDigitalDownloadLimit] = useState("5");
  const [serviceDurationMinutes, setServiceDurationMinutes] = useState("60");
  const [trainingAccessDays, setTrainingAccessDays] = useState("30");
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [enableAffiliation, setEnableAffiliation] = useState(false);
  const [affiliationRate, setAffiliationRate] = useState(0.10);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const digital = productType === "digital" || productType === "downloadable";

  useEffect(() => {
    if (supplierId) {
      setSelectedStoreId(supplierId);
    } else if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [supplierId, stores, selectedStoreId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (Number(priceXof) < 100) throw new Error("Le prix minimum est de 100 XOF.");
      if (digital && !digitalFile && !digitalExternalUrl.trim()) {
        throw new Error("Ajoutez un fichier ou un lien de livraison pour ce produit numérique.");
      }
      const response = await fetch("/api/marketplace/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          supplierId: selectedStoreId || supplierId || undefined,
          title,
          description,
          category,
          countryCode,
          city,
          priceXof: Number(priceXof),
          stockQuantity: productType === "physical" ? Number(stockQuantity) : 999,
          productType,
          deliveryType: digitalFile ? "download" : deliveryType,
          digitalExternalUrl: digitalExternalUrl.trim() || undefined,
          digitalAccessInstructions,
          digitalDownloadLimit: Number(digitalDownloadLimit),
          serviceDurationMinutes: productType === "service" ? Number(serviceDurationMinutes) : undefined,
          trainingAccessDays: productType === "training" ? Number(trainingAccessDays) : undefined,
          enableAffiliation,
          affiliationRate,
          media: imageUrl.trim() ? [{ url: imageUrl.trim(), mimeType: "image/*" }] : []
        })
      });
      if (response.status === 401) {
        window.location.assign("/auth/login?next=/marketplace/boutique#publier");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Publication impossible.");
      if (digitalFile && data.product?.id) {
        const form = new FormData();
        form.append("file", digitalFile);
        form.append("productId", data.product.id);
        const uploadResponse = await fetch("/api/marketplace/products/digital/upload", {
          method: "POST",
          body: form,
          credentials: "include"
        });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || "Le produit a été créé mais le fichier n’a pas pu être chargé.");
        }
      }
      setMessage("Produit mis en ligne avec succès dans le catalogue !");
      setTitle("");
      setDescription("");
      setPriceXof("");
      setDigitalFile(null);
      onCreated?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Publication impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      id="publier"
      onSubmit={submit}
      className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-6 sm:p-8 shadow-sm text-[#1a130f]"
    >
      {/* En-tête de l'offre */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0e6d8] pb-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a36300]">
            Nouvelle offre
          </p>
          <h2 className="mt-1 font-display text-2xl font-black text-[#1a130f]">
            Publier un produit
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5c493a]">
            Choisissez le type d’offre. Les produits numériques restent protégés et ne sont accessibles à l’acheteur qu’après confirmation du paiement.
          </p>
        </div>
        <span className="rounded-full bg-[#e9f7f5] border border-[#087e8b]/20 px-3 py-1.5 text-xs font-black text-[#087e8b]">
          Minimum 100 XOF
        </span>
      </div>

      {/* Sélecteur de boutique (si vendeur multi-boutiques) */}
      {stores && stores.length > 1 && (
        <div className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fffdfb] p-4 text-[#1a130f]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#a36300]">
                Boutique de destination
              </label>
              <p className="mt-0.5 text-xs text-[#5c493a]">
                Choisissez dans quelle boutique mettre en vente cet article :
              </p>
            </div>
            <span className="rounded-full bg-[#ffca63]/20 text-[#a36300] px-2.5 py-1 text-[11px] font-bold">
              {stores.length} boutiques disponibles
            </span>
          </div>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="mt-3 h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm font-bold text-[#1a130f] focus:border-[#9e001f] focus:outline-none"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id} className="text-[#1a130f]">
                🏪 {s.business_name} {s.city ? `(${s.city}, ${s.country_code || ""})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Choix du type de produit */}
      <div className="mt-6">
        <label className="block text-xs font-black uppercase tracking-wider text-[#1a130f] mb-3">
          Type de produit ou prestation
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {productTypes.map(([value, label, detail]) => (
            <button
              type="button"
              key={value}
              onClick={() => {
                setProductType(value);
                setDeliveryType(
                  value === "physical"
                    ? "shipping"
                    : value === "service" || value === "training"
                    ? "online"
                    : "download"
                );
              }}
              className={`rounded-2xl border p-4 text-left transition ${
                productType === value
                  ? "border-[#9e001f] bg-[#fff3f2] shadow-sm ring-1 ring-[#9e001f]/30"
                  : "border-[#eadfce] bg-[#fffdfb] hover:border-[#caa885] hover:bg-white"
              }`}
            >
              <strong className={`block text-sm font-bold ${productType === value ? "text-[#9e001f]" : "text-[#1a130f]"}`}>
                {label}
              </strong>
              <span className="mt-1 block text-[11px] leading-4 text-[#5c493a]">
                {detail}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Informations générales */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
            Nom du produit ou de l’offre *
          </label>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex: Robe de soirée brodée, Consultation juridique..."
            className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-4 text-sm text-[#1a130f] placeholder:text-[#8c7764] focus:border-[#9e001f] focus:outline-none focus:ring-1 focus:ring-[#9e001f]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
            Catégorie du catalogue *
          </label>
          <select
            required
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#1a130f] font-medium focus:border-[#9e001f] focus:outline-none focus:ring-1 focus:ring-[#9e001f]"
          >
            {marketplaceCategories
              .filter((item) => item !== "Toutes les catégories")
              .map((item) => (
                <option key={item} value={item} className="text-[#1a130f]">
                  {item}
                </option>
              ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
            Description détaillée *
          </label>
          <textarea
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Présentez les caractéristiques, bienfaits, dimensions, conditions et garanties..."
            className="min-h-28 w-full rounded-xl border border-[#eadfce] bg-white p-4 text-sm text-[#1a130f] placeholder:text-[#8c7764] focus:border-[#9e001f] focus:outline-none focus:ring-1 focus:ring-[#9e001f]"
          />
        </div>
      </div>

      {/* Prix, Stock, Pays et Ville */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
            Prix en FCFA (XOF) *
          </label>
          <input
            required
            min="100"
            type="number"
            value={priceXof}
            onChange={(event) => setPriceXof(event.target.value)}
            placeholder="Ex: 15000"
            className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#1a130f] placeholder:text-[#8c7764] focus:border-[#9e001f] focus:outline-none focus:ring-1 focus:ring-[#9e001f]"
          />
        </div>

        {productType === "physical" ? (
          <div>
            <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
              Stock disponible *
            </label>
            <input
              required
              min="1"
              type="number"
              value={stockQuantity}
              onChange={(event) => setStockQuantity(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#1a130f] placeholder:text-[#8c7764] focus:border-[#9e001f] focus:outline-none focus:ring-1 focus:ring-[#9e001f]"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
              Disponibilité
            </label>
            <div className="flex h-11 items-center rounded-xl bg-[#fff8f6] border border-[#eadfce] px-3 text-xs font-medium text-[#5c493a]">
              ⚡ Illimité (produit digital)
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
            Pays d’origine / stockage
          </label>
          <select
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#1a130f] font-medium focus:border-[#9e001f] focus:outline-none focus:ring-1 focus:ring-[#9e001f]"
          >
            <option value="BJ">Bénin</option>
            <option value="CI">Côte d’Ivoire</option>
            <option value="SN">Sénégal</option>
            <option value="TG">Togo</option>
            <option value="CM">Cameroun</option>
            <option value="NG">Nigeria</option>
            <option value="GH">Ghana</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
            Ville
          </label>
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Ex: Cotonou, Abidjan..."
            className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#1a130f] placeholder:text-[#8c7764] focus:border-[#9e001f] focus:outline-none focus:ring-1 focus:ring-[#9e001f]"
          />
        </div>
      </div>

      {/* Image & Délivrance */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
            URL de l’image principale (facultatif)
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://exemple.com/image.jpg"
            className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#1a130f] placeholder:text-[#8c7764] focus:border-[#9e001f] focus:outline-none focus:ring-1 focus:ring-[#9e001f]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
            Mode de délivrance
          </label>
          {productType === "physical" ? (
            <select
              value={deliveryType}
              onChange={(event) => setDeliveryType(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#1a130f] font-medium focus:border-[#9e001f] focus:outline-none focus:ring-1 focus:ring-[#9e001f]"
            >
              <option value="shipping">Livraison / remise physique</option>
            </select>
          ) : (
            <select
              value={deliveryType}
              onChange={(event) => setDeliveryType(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#1a130f] font-medium focus:border-[#9e001f] focus:outline-none focus:ring-1 focus:ring-[#9e001f]"
            >
              <option value="online">Accès en ligne</option>
              <option value="download">Téléchargement protégé</option>
              <option value="external_link">Lien externe après paiement</option>
            </select>
          )}
        </div>
      </div>

      {/* Bloc Produit Digital / Téléchargeable */}
      {digital && (
        <div className="mt-5 rounded-2xl border border-[#e5bdbb] bg-[#fff8f6] p-5 text-[#1a130f]">
          <p className="text-xs font-black uppercase tracking-wider text-[#9e001f]">
            Livraison numérique sécurisée
          </p>
          <p className="mt-1 text-xs text-[#5c493a]">
            Ce contenu ne sera débloqué à l’acheteur qu’une fois son paiement confirmé par Moneroo ou Mobile Money.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
                Fichier privé (PDF, zip, docx...)
              </label>
              <input
                type="file"
                onChange={(event) => setDigitalFile(event.target.files?.[0] || null)}
                className="mt-1 block w-full text-xs text-[#1a130f] file:mr-3 file:rounded-xl file:border-0 file:bg-[#9e001f] file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-white hover:file:bg-[#800019]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
                Ou lien externe sécurisé HTTPS
              </label>
              <input
                type="url"
                value={digitalExternalUrl}
                onChange={(event) => setDigitalExternalUrl(event.target.value)}
                placeholder="https://drive.google.com/... ou Notion, Loom"
                className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-xs text-[#1a130f] placeholder:text-[#8c7764] focus:border-[#9e001f] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
                Instructions de déblocage (visibles uniquement après paiement)
              </label>
              <textarea
                value={digitalAccessInstructions}
                onChange={(event) => setDigitalAccessInstructions(event.target.value)}
                placeholder="Ex: Merci pour votre commande ! Voici votre lien d'accès, votre mot de passe temporaire ou vos coordonnées de contact..."
                className="min-h-20 w-full rounded-xl border border-[#eadfce] bg-white p-3 text-xs text-[#1a130f] placeholder:text-[#8c7764] focus:border-[#9e001f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
                Nombre maximal de téléchargements autorisés
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={digitalDownloadLimit}
                onChange={(event) => setDigitalDownloadLimit(event.target.value)}
                className="h-10 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-xs text-[#1a130f] font-semibold focus:border-[#9e001f] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Durée du service */}
      {productType === "service" && (
        <div className="mt-4">
          <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
            Durée de la prestation (en minutes)
          </label>
          <input
            type="number"
            min="15"
            value={serviceDurationMinutes}
            onChange={(event) => setServiceDurationMinutes(event.target.value)}
            className="h-11 w-full max-w-xs rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#1a130f] focus:border-[#9e001f] focus:outline-none"
          />
        </div>
      )}

      {/* Durée de formation */}
      {productType === "training" && (
        <div className="mt-4">
          <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
            Durée d’accès à la formation (en jours)
          </label>
          <input
            type="number"
            min="1"
            value={trainingAccessDays}
            onChange={(event) => setTrainingAccessDays(event.target.value)}
            className="h-11 w-full max-w-xs rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#1a130f] focus:border-[#9e001f] focus:outline-none"
          />
        </div>
      )}

      {/* Programme d'Affiliation */}
      <div className="mt-5 rounded-2xl border border-[#c3e6cb] bg-[#f8fcfa] p-5 text-[#1a130f]">
        <label className="flex items-start gap-3.5 cursor-pointer">
          <input
            type="checkbox"
            checked={enableAffiliation}
            onChange={(e) => setEnableAffiliation(e.target.checked)}
            className="mt-1 h-5 w-5 rounded accent-[#087e8b] cursor-pointer"
          />
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-[#087e8b]">
              Programme d’affiliation Ambassadeurs
            </span>
            <p className="mt-1 text-xs text-[#3d4d42] leading-5">
              Permettez aux ambassadeurs Envol Africa de promouvoir votre produit avec un lien unique et touchez davantage de clients à travers l’Afrique.
            </p>
          </div>
        </label>

        {enableAffiliation && (
          <div className="mt-4 grid gap-4 pt-4 border-t border-[#d4edda] sm:grid-cols-2 sm:items-center">
            <div>
              <label className="block text-xs font-bold text-[#1a130f] mb-1.5">
                Commission offerte à l’ambassadeur
              </label>
              <select
                value={affiliationRate}
                onChange={(e) => setAffiliationRate(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-[#b2ddbe] bg-white px-3 text-xs text-[#1a130f] font-bold focus:outline-none"
              >
                <option value={0.05}>5 % du prix de vente</option>
                <option value={0.10}>10 % (Recommandé)</option>
                <option value={0.15}>15 % du prix de vente</option>
                <option value={0.20}>20 % du prix de vente</option>
                <option value={0.25}>25 % du prix de vente</option>
              </select>
            </div>
            <div className="rounded-xl bg-white border border-[#b2ddbe] p-3 text-xs text-[#065b65] font-semibold shadow-sm">
              Pour une vente à {priceXof ? Number(priceXof).toLocaleString() : "100 000"} XOF, l’ambassadeur reçoit ~{Math.round((Number(priceXof) || 100000) * affiliationRate * 0.9).toLocaleString()} XOF net.
            </div>
          </div>
        )}
      </div>

      {/* Bouton de soumission */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#f0e6d8] pt-5">
        <span className="text-xs font-medium text-[#5c493a]">
          Le produit sera immédiatement consultable dans le catalogue.
        </span>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-[#9e001f] hover:bg-[#800019] px-7 py-3 text-xs font-black text-white shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {busy ? "Publication en cours…" : "Mettre en ligne mon produit"}
        </button>
      </div>

      {/* Messages de retour */}
      {message && (
        <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800">
          ✓ {message}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-800">
          ⚠️ {error}
        </div>
      )}
    </form>
  );
}
