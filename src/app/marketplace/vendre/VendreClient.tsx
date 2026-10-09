"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { generateStoreSlug } from "@/lib/marketplace-slug";

type CurrentUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  country?: string | null;
} | null;

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
  { code: "FR", label: "France (Diaspora)" },
  { code: "BE", label: "Belgique (Diaspora)" },
  { code: "US", label: "États-Unis (Diaspora)" },
  { code: "CA", label: "Canada (Diaspora)" },
];

const categories = [
  "Mode & textile",
  "Beauté & bien-être",
  "Alimentation",
  "Énergie & Solaire",
  "Maison & artisanat",
  "Technologie",
  "Formations & Numérique",
  "Services aux entreprises",
];

const entityTypes = [
  { id: "individual", label: "Particulier / Créateur indépendant" },
  { id: "sole_proprietor", label: "Entreprise individuelle / Ets" },
  { id: "company", label: "Société (SARL, SAS, SA)" },
  { id: "cooperative", label: "Coopérative ou Association" },
];

export default function VendreClient({ currentUser }: { currentUser: CurrentUser }) {
  const { formatPrice } = useLocale();

  // Étape courante (1 à 4) ou 5 (succès)
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    storeSlug: string;
    vendorSlug: string;
    storeName: string;
    productTitle: string;
  } | null>(null);

  // Étape 1 : Profil boutique
  const [businessName, setBusinessName] = useState("");
  const [mainCategory, setMainCategory] = useState(categories[0]);
  const [countryCode, setCountryCode] = useState(currentUser?.country || "BJ");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

  // Étape 2 : Vérification légale & coordonnées
  const [entityType, setEntityType] = useState("individual");
  const [legalName, setLegalName] = useState(currentUser?.name || "");
  const [taxIdOrIdNumber, setTaxIdOrIdNumber] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Étape 3 : Encaissement & reversement
  const [payoutMethod, setPayoutMethod] = useState<"mobile_money" | "chariow_bank">("mobile_money");
  const [payoutProvider, setPayoutProvider] = useState("MTN Mobile Money");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutAccountName, setPayoutAccountName] = useState("");
  const [payoutFrequency, setPayoutFrequency] = useState("order");

  // Étape 4 : Premier produit
  const [productTitle, setProductTitle] = useState("");
  const [productType, setProductType] = useState<"physical" | "digital" | "service">("physical");
  const [productPriceXof, setProductPriceXof] = useState<number>(5000);
  const [productStock, setProductStock] = useState<number>(10);
  const [productImageUrl, setProductImageUrl] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [digitalUrl, setDigitalUrl] = useState("");

  // Restauration de session en cas de rechargement
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("eam_onboarding_vendor_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.businessName) setBusinessName(parsed.businessName);
        if (parsed.mainCategory) setMainCategory(parsed.mainCategory);
        if (parsed.countryCode) setCountryCode(parsed.countryCode);
        if (parsed.city) setCity(parsed.city);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.whatsappPhone) setWhatsappPhone(parsed.whatsappPhone);
        if (parsed.taxIdOrIdNumber) setTaxIdOrIdNumber(parsed.taxIdOrIdNumber);
        if (parsed.payoutAccountNumber) setPayoutAccountNumber(parsed.payoutAccountNumber);
        if (parsed.payoutAccountName) setPayoutAccountName(parsed.payoutAccountName);
        if (parsed.productTitle) setProductTitle(parsed.productTitle);
        if (parsed.productPriceXof) setProductPriceXof(Number(parsed.productPriceXof) || 5000);
      }
    } catch {}
  }, []);

  // Sauvegarde continue de la saisie
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "eam_onboarding_vendor_draft",
        JSON.stringify({
          businessName,
          mainCategory,
          countryCode,
          city,
          description,
          whatsappPhone,
          taxIdOrIdNumber,
          payoutAccountNumber,
          payoutAccountName,
          productTitle,
          productPriceXof,
        })
      );
    } catch {}
  }, [
    businessName,
    mainCategory,
    countryCode,
    city,
    description,
    whatsappPhone,
    taxIdOrIdNumber,
    payoutAccountNumber,
    payoutAccountName,
    productTitle,
    productPriceXof,
  ]);

  const previewSlug = generateStoreSlug(businessName || "ma-super-boutique");

  const validateStep1 = () => {
    if (businessName.trim().length < 2) {
      setError("Veuillez renseigner un nom commercial valide (au moins 2 caractères).");
      return false;
    }
    if (!city.trim()) {
      setError("Veuillez indiquer la ville principale de votre boutique.");
      return false;
    }
    setError("");
    return true;
  };

  const validateStep2 = () => {
    if (!legalName.trim()) {
      setError("Veuillez indiquer le nom du responsable légal de la boutique.");
      return false;
    }
    if (!whatsappPhone.trim() || whatsappPhone.trim().length < 6) {
      setError("Veuillez fournir un numéro WhatsApp professionnel valide.");
      return false;
    }
    if (!termsAccepted) {
      setError("Vous devez accepter la Charte Vendeur & Qualité Envol Africa.");
      return false;
    }
    setError("");
    return true;
  };

  const validateStep3 = () => {
    if (!payoutAccountNumber.trim()) {
      setError("Veuillez préciser le numéro de compte ou téléphone de reversement.");
      return false;
    }
    if (!payoutAccountName.trim()) {
      setError("Veuillez préciser le nom exact du titulaire du compte bénéficiaire.");
      return false;
    }
    setError("");
    return true;
  };

  const validateStep4 = () => {
    if (productTitle.trim().length < 3) {
      setError("Le titre du premier produit doit comporter au moins 3 caractères.");
      return false;
    }
    if (!productPriceXof || Number(productPriceXof) < 100) {
      setError("Le prix minimum d'un produit sur la marketplace est de 100 XOF.");
      return false;
    }
    if (productType === "digital" && !digitalUrl.trim()) {
      setError("Pour un produit digital, veuillez fournir le lien d'accès ou de téléchargement.");
      return false;
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handlePrev = () => {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmitAll = async () => {
    if (!validateStep4()) return;
    if (!currentUser) {
      setError("Veuillez vous connecter pour valider la création de votre boutique.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      // 1. Création de la boutique vendeur via API
      const supplierRes = await fetch("/api/marketplace/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          businessName: businessName.trim(),
          description: description.trim() || `Boutique officielle ${businessName.trim()}`,
          countryCode,
          city: city.trim(),
        }),
      });

      const supplierJson = await supplierRes.json();
      if (!supplierRes.ok) {
        throw new Error(supplierJson.error || "Échec de création de la boutique.");
      }

      const createdStore = supplierJson.supplier;
      const storeId = createdStore.id;
      const storeSlug = createdStore.slug || generateStoreSlug(businessName);
      const vendorSlug = createdStore.vendor_slug || "vendeur";

      // 2. Publication du premier produit
      const productRes = await fetch("/api/marketplace/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          supplierId: storeId,
          title: productTitle.trim(),
          description: productDescription.trim() || `Produit original de la boutique ${businessName}`,
          category: mainCategory,
          countryCode,
          city: city.trim(),
          priceXof: Math.round(Number(productPriceXof)),
          stockQuantity: productType === "physical" ? Math.max(1, Number(productStock) || 1) : 999,
          productType,
          deliveryType: productType === "physical" ? "shipping" : productType === "digital" ? "download" : "online",
          digitalExternalUrl: productType === "digital" ? digitalUrl.trim() : undefined,
          media: productImageUrl.trim() ? [{ url: productImageUrl.trim(), mimeType: "image/jpeg" }] : [],
          status: "published",
        }),
      });

      const productJson = await productRes.json();
      if (!productRes.ok) {
        console.warn("Avertissement produit:", productJson.error);
      }

      // Nettoyage de la sauvegarde temporaire
      try {
        sessionStorage.removeItem("eam_onboarding_vendor_draft");
      } catch {}

      setSuccessData({
        storeSlug,
        vendorSlug,
        storeName: businessName,
        productTitle: productTitle.trim(),
      });
      setStep(5);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#2a211a]">
      {/* Header Héro de Présentation Vendeur */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#2a211a] via-[#3a1d1d] to-[#1c120c] px-5 py-14 text-white md:px-10 lg:px-16 lg:py-20">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, #ffca63 0 2px, transparent 3px), radial-gradient(circle at 85% 75%, #ffffff 0 1px, transparent 2px)",
            backgroundSize: "36px 36px",
          }}
        />

        <div className="relative mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ffca63]/30 bg-[#ffca63]/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffca63]">
            <span className="material-symbols-outlined text-[15px]">storefront</span>
            Marketplace Panafricaine & Diaspora
          </div>

          <h1 className="mt-4 font-display text-3xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Vendez vos créations et produits{" "}
            <span className="bg-gradient-to-r from-[#ffca63] via-[#ffdf9e] to-white bg-clip-text text-transparent">
              dans toute l&apos;Afrique
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            Rejoignez l&apos;écosystème Envol Africa. Ouvrez votre boutique officielle en 4 étapes
            rapides et bénéficiez de paiements sécurisés sous séquestre via Mobile Money et Chariow
            dans plus de 150 pays.
          </p>

          {/* Grille de Réassurance & Avantages */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <span className="material-symbols-outlined text-2xl text-[#ffca63]">verified_user</span>
              <p className="mt-2 text-xs font-black uppercase tracking-wider text-white">0 Frais d&apos;inscription</p>
              <p className="mt-1 text-[11px] text-white/60">Gratuit et sans abonnement obligatoire.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <span className="material-symbols-outlined text-2xl text-[#ffca63]">payments</span>
              <p className="mt-2 text-xs font-black uppercase tracking-wider text-white">Paiement Garanti</p>
              <p className="mt-1 text-[11px] text-white/60">Fonds sous séquestre libérés à la livraison.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <span className="material-symbols-outlined text-2xl text-[#ffca63]">public</span>
              <p className="mt-2 text-xs font-black uppercase tracking-wider text-white">150+ Pays</p>
              <p className="mt-1 text-[11px] text-white/60">Mobile Money et cartes internationales.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <span className="material-symbols-outlined text-2xl text-[#ffca63]">hub</span>
              <p className="mt-2 text-xs font-black uppercase tracking-wider text-white">Réseau WAB Inclus</p>
              <p className="mt-1 text-[11px] text-white/60">Diffusion auprès de millions de décideurs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteneur du Tunnel d'Onboarding */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
        {step < 5 ? (
          <div className="rounded-3xl border border-[#eadfce] bg-white p-6 shadow-xl sm:p-10">
            {/* Barre de Progression 4 Étapes */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-bold text-[#806c58]">
                <span>Étape {step} sur 4</span>
                <span className="text-[#9e001f] font-black">
                  {step === 1 && "Profil de votre boutique"}
                  {step === 2 && "Vérification légale & Contact"}
                  {step === 3 && "Encaissement & Reversement"}
                  {step === 4 && "Votre premier produit"}
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i < step
                        ? "bg-emerald-500"
                        : i === step
                        ? "bg-[#9e001f]"
                        : "bg-[#eadfce]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Message d'Avertissement Connexion si Visiteur Anonyme */}
            {!currentUser && (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#ffca63] bg-[#fffaf0] p-4 text-xs text-[#704d00] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-[#b77900]">info</span>
                  <span>
                    Vous n&apos;êtes pas connecté. Vous pouvez pré-remplir votre boutique, puis vous
                    connecter en 1 clic pour finaliser.
                  </span>
                </div>
                <Link
                  href="/auth/login?next=/marketplace/vendre"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#9e001f] px-3.5 py-2 font-black text-white hover:bg-[#800019]"
                >
                  Se connecter
                </Link>
              </div>
            )}

            {/* Affichage d'Erreur */}
            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* ================= ÉTAPE 1 : PROFIL BOUTIQUE ================= */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-black text-[#2a211a]">
                    1. Identité et vitrine de votre boutique
                  </h2>
                  <p className="mt-1 text-xs text-[#806c58]">
                    Choisissez le nom commercial qui apparaîtra sur vos produits et votre adresse web
                    dédiée.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                    Nom commercial de la boutique *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex: Naya Naturals, Maison Kora, Sahel Solaire..."
                    className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f] focus:ring-2 focus:ring-[#9e001f]/10"
                  />
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#806c58]">
                    <span className="material-symbols-outlined text-[14px] text-[#087e8b]">link</span>
                    <span>Lien public réservé : </span>
                    <code className="rounded bg-[#f5eee5] px-1.5 py-0.5 font-bold text-[#9e001f]">
                      envolafrica.site/marketplace/boutique/.../{previewSlug}
                    </code>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                      Catégorie principale *
                    </label>
                    <select
                      value={mainCategory}
                      onChange={(e) => setMainCategory(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                      Pays d&apos;opération *
                    </label>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                    >
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                    Ville principale d&apos;expédition ou siège *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Cotonou, Abidjan, Dakar, Douala, Lomé, Paris..."
                    className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                    Présentation de la boutique / Histoire de marque
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Présentez votre savoir-faire, vos engagements qualité et ce qui rend vos produits uniques..."
                    className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4 text-sm font-medium text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                  />
                </div>
              </div>
            )}

            {/* ================= ÉTAPE 2 : VÉRIFICATION LÉGALE ================= */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-black text-[#2a211a]">
                    2. Coordonnées professionnelles & Conformité
                  </h2>
                  <p className="mt-1 text-xs text-[#806c58]">
                    Ces informations permettent de sécuriser les acheteurs et d&apos;activer votre
                    séquestre financier.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                    Structure juridique *
                  </label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {entityTypes.map((et) => (
                      <button
                        type="button"
                        key={et.id}
                        onClick={() => setEntityType(et.id)}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left text-xs font-bold transition ${
                          entityType === et.id
                            ? "border-[#9e001f] bg-[#fff5f5] text-[#9e001f]"
                            : "border-[#eadfce] bg-white text-[#5c3d19] hover:bg-[#fffdfa]"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-lg ${
                            entityType === et.id ? "text-[#9e001f]" : "text-[#806c58]"
                          }`}
                        >
                          {entityType === et.id ? "radio_button_checked" : "radio_button_unchecked"}
                        </span>
                        {et.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                      Nom et prénom du responsable légal *
                    </label>
                    <input
                      type="text"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      placeholder="Ex: Amadou Diallo"
                      className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                      Numéro WhatsApp professionnel *
                    </label>
                    <input
                      type="tel"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="Ex: +229 97 00 00 00"
                      className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                    />
                    <p className="mt-1 text-[11px] text-[#806c58]">
                      Utilisé pour vous notifier instantanément des commandes reçues.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                    N° IFU, RCCM, NINEA ou N° de Pièce d&apos;identité
                  </label>
                  <input
                    type="text"
                    value={taxIdOrIdNumber}
                    onChange={(e) => setTaxIdOrIdNumber(e.target.value)}
                    placeholder="Ex: IFU 0202... ou CNI 1029..."
                    className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                  />
                  <p className="mt-1 text-[11px] text-[#806c58]">
                    Optionnel au départ, recommandé pour débloquer le badge Vendeur Officiel.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf5] p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#cdbb9f] text-[#9e001f] focus:ring-[#9e001f]"
                    />
                    <span className="text-xs leading-relaxed text-[#5c3d19]">
                      Je certifie sur l&apos;honneur l&apos;authenticité de mes produits et j&apos;accepte
                      la <strong>Charte de Vente & Protection Acheteur Envol Africa</strong>.
                      J&apos;accepte que les fonds soient placés sous séquestre jusqu&apos;à la
                      réception conforme par l&apos;acheteur.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* ================= ÉTAPE 3 : ENCAISSEMENT & REVERSEMENT ================= */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-black text-[#2a211a]">
                    3. Mode de reversement de vos gains
                  </h2>
                  <p className="mt-1 text-xs text-[#806c58]">
                    Configurez le moyen par lequel vous souhaitez recevoir vos reversements après
                    chaque commande.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                    Canal de versement préféré *
                  </label>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod("mobile_money")}
                      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                        payoutMethod === "mobile_money"
                          ? "border-[#9e001f] bg-[#fff5f5]"
                          : "border-[#eadfce] bg-white hover:bg-[#fffdfa]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl text-[#9e001f]">
                        smartphone
                      </span>
                      <div>
                        <p className="text-xs font-black text-[#2a211a]">Mobile Money (Afrique)</p>
                        <p className="mt-0.5 text-[11px] text-[#806c58]">
                          MTN, Moov, Wave, Orange Money. Virement instantané.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayoutMethod("chariow_bank")}
                      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                        payoutMethod === "chariow_bank"
                          ? "border-[#9e001f] bg-[#fff5f5]"
                          : "border-[#eadfce] bg-white hover:bg-[#fffdfa]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl text-[#087e8b]">
                        account_balance
                      </span>
                      <div>
                        <p className="text-xs font-black text-[#2a211a]">
                          Virement Bancaire / Chariow Payout
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#806c58]">
                          Comptes bancaires UEMOA, CEMAC et international (Diaspora).
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                      Opérateur ou Banque *
                    </label>
                    <input
                      type="text"
                      value={payoutProvider}
                      onChange={(e) => setPayoutProvider(e.target.value)}
                      placeholder="Ex: MTN Mobile Money, Moov Money, Ecobank, BOA..."
                      className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                      Numéro de compte / Téléphone bénéficiaire *
                    </label>
                    <input
                      type="text"
                      value={payoutAccountNumber}
                      onChange={(e) => setPayoutAccountNumber(e.target.value)}
                      placeholder="Ex: +229 97 00 00 00 ou IBAN BJ..."
                      className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                    Nom officiel du titulaire du compte *
                  </label>
                  <input
                    type="text"
                    value={payoutAccountName}
                    onChange={(e) => setPayoutAccountName(e.target.value)}
                    placeholder="Ex: Diallo Amadou ou Coopérative Naya"
                    className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                  />
                  <p className="mt-1 text-[11px] text-[#806c58]">
                    Le nom doit correspondre exactement aux données de votre opérateur/banque.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                    Fréquence de reversement
                  </label>
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPayoutFrequency("order")}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                        payoutFrequency === "order"
                          ? "border-[#9e001f] bg-[#9e001f] text-white"
                          : "border-[#eadfce] bg-white text-[#5c3d19]"
                      }`}
                    >
                      À chaque commande validée
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutFrequency("weekly")}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                        payoutFrequency === "weekly"
                          ? "border-[#9e001f] bg-[#9e001f] text-white"
                          : "border-[#eadfce] bg-white text-[#5c3d19]"
                      }`}
                    >
                      Hebdomadaire (Chaque lundi)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= ÉTAPE 4 : PREMIER PRODUIT ================= */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-black text-[#2a211a]">
                    4. Votre premier produit en vitrine
                  </h2>
                  <p className="mt-1 text-xs text-[#806c58]">
                    Publiez immédiatement votre première offre pour ouvrir votre catalogue. Vous
                    pourrez en ajouter d&apos;autres librement ensuite.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                    Titre du produit ou de la création *
                  </label>
                  <input
                    type="text"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    placeholder="Ex: Sac en cuir artisanal Harmattan, Beurre de Karité 5kg, Formation E-commerce..."
                    className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                    Type d&apos;offre *
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { id: "physical", label: "Produit physique", icon: "inventory_2" },
                      { id: "digital", label: "Produit digital", icon: "download" },
                      { id: "service", label: "Service / Formation", icon: "school" },
                    ].map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setProductType(t.id as any)}
                        className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition ${
                          productType === t.id
                            ? "border-[#9e001f] bg-[#fff5f5] text-[#9e001f]"
                            : "border-[#eadfce] bg-white text-[#5c3d19] hover:bg-[#fffdfa]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">{t.icon}</span>
                        <span className="text-xs font-black">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                      Prix de vente (en XOF) *
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={productPriceXof}
                      onChange={(e) => setProductPriceXof(Number(e.target.value) || 0)}
                      className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                    />
                    <p className="mt-1 text-[11px] text-[#806c58]">
                      Affichage converti :{" "}
                      <strong className="text-[#9e001f]">{formatPrice(productPriceXof)}</strong>
                    </p>
                  </div>

                  {productType === "physical" ? (
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                        Stock disponible initial
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={productStock}
                        onChange={(e) => setProductStock(Number(e.target.value) || 1)}
                        className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                        Lien d&apos;accès ou téléchargement *
                      </label>
                      <input
                        type="url"
                        value={digitalUrl}
                        onChange={(e) => setDigitalUrl(e.target.value)}
                        placeholder="https://mon-drive.com/formation.pdf"
                        className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                    Image principale (URL de l&apos;image)
                  </label>
                  <input
                    type="url"
                    value={productImageUrl}
                    onChange={(e) => setProductImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... ou lien de votre photo"
                    className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                  />
                  {productImageUrl && (
                    <div className="mt-2 h-28 w-28 overflow-hidden rounded-xl border border-[#eadfce]">
                      <img
                        src={productImageUrl}
                        alt="Aperçu produit"
                        className="h-full w-full object-cover"
                        onError={() => setError("L'URL d'image fournie n'est pas accessible.")}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#5c3d19]">
                    Description du produit
                  </label>
                  <textarea
                    rows={3}
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Décrivez les caractéristiques techniques, matières, conseils d'utilisation..."
                    className="mt-1.5 w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4 text-sm font-medium text-[#2a211a] outline-none transition focus:border-[#9e001f]"
                  />
                </div>
              </div>
            )}

            {/* Boutons d'Action Suivant / Précédent */}
            <div className="mt-10 flex items-center justify-between border-t border-[#eadfce] pt-6">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={busy}
                  className="rounded-full border border-[#eadfce] bg-white px-6 py-3 text-xs font-black text-[#5c3d19] transition hover:bg-[#f8f3ed]"
                >
                  ← Étape précédente
                </button>
              ) : (
                <Link
                  href="/marketplace"
                  className="text-xs font-bold text-[#806c58] hover:text-[#9e001f]"
                >
                  Retour au catalogue
                </Link>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-full bg-[#9e001f] px-8 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:bg-[#800019]"
                >
                  Continuer →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitAll}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                      Lancer ma boutique en ligne
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ================= ÉTAPE 5 : SUCCÈS & FÉLICITATIONS ================= */
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-2xl sm:p-14">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>

            <div className="mt-5 inline-block rounded-full bg-emerald-50 px-3.5 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-700">
              Boutique Officielle Activée
            </div>

            <h2 className="mt-3 font-display text-3xl font-black text-[#2a211a] sm:text-4xl">
              Félicitations, votre boutique est en ligne !
            </h2>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#725f4d]">
              Votre boutique <strong>{successData?.storeName}</strong> est prête à recevoir ses
              premières commandes. Votre premier produit <strong>&quot;{successData?.productTitle}&quot;</strong> est
              visible dès maintenant sur la Marketplace Envol Africa.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={`/marketplace/boutique/${encodeURIComponent(
                  successData?.vendorSlug || "vendeur"
                )}/${encodeURIComponent(successData?.storeSlug || "")}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#9e001f] px-8 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:bg-[#800019]"
              >
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                Accéder à ma boutique
              </Link>

              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 rounded-full border border-[#eadfce] bg-white px-7 py-3.5 text-xs font-black text-[#5c3d19] transition hover:bg-[#f8f3ed]"
              >
                Voir le catalogue global
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
