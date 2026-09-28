"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useLocale } from "@/components/LocaleProvider";
import MarketplaceProductForm from "@/components/marketplace/MarketplaceProductForm";
import { generateStoreSlug } from "@/lib/marketplace-slug";

type Supplier = {
  id: string;
  business_name: string;
  slug?: string;
  description?: string | null;
  country_code?: string | null;
  city?: string | null;
  certification_status?: string | null;
  rating?: number | null;
  products_count?: number;
  created_at?: string;
};

type ProductAffiliation = {
  id: string;
  commission_rate: number;
  is_active: boolean;
};

type Product = {
  id: string;
  title: string;
  price_xof?: number;
  stock_quantity?: number;
  category?: string;
  country_code?: string;
  city?: string;
  image?: string;
  media?: unknown;
  status?: string;
  is_boosted?: boolean;
  boost_ends_at?: string | null;
  product_type?: string;
  delivery_type?: string;
  product_video_url?: string | null;
  supplier_id?: string;
  supplier?: string;
  product_affiliations?: ProductAffiliation[];
};

type AnalyticsStats = {
  totalRevenueXof: number;
  pendingRevenueXof: number;
  totalOrders: number;
  completedOrdersCount: number;
  pendingOrdersCount: number;
  averageBasketXof: number;
  totalProductsCount: number;
  publishedProductsCount: number;
  boostedProductsCount: number;
  recentSales: Array<{
    id: string;
    total_xof: number;
    payment_mode: string;
    status: string;
    created_at: string;
    marketplace_products?: { title?: string; price_xof?: number } | null;
  }>;
};

type Section = "dashboard" | "product" | "products" | "boost" | "affiliate" | "analytics" | "video";
type ViewMode = "stores-list" | "store-detail" | "new-store";

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

export default function MarketplaceBoutiquePage() {
  const [stores, setStores] = useState<Supplier[]>([]);
  const [selectedStore, setSelectedStore] = useState<Supplier | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("stores-list");
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1);
  const [section, setSection] = useState<Section>("dashboard");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [countryCode, setCountryCode] = useState("BJ");
  const [city, setCity] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);

  // Boost form state
  const [selectedBoostProductId, setSelectedBoostProductId] = useState("");
  const [boostPlanDays, setBoostPlanDays] = useState(7);
  const [boostAmountXof, setBoostAmountXof] = useState(2500);

  // Affiliate form state
  const [selectedAffiliateProductId, setSelectedAffiliateProductId] = useState("");
  const [affiliateRate, setAffiliateRate] = useState(0.10);
  const [affiliateEnabled, setAffiliateEnabled] = useState(true);

  // Video state
  const [videoActive, setVideoActive] = useState(false);
  const [remaining, setRemaining] = useState(10);
  const [videoProductId, setVideoProductId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Global UX state
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();
  const { formatPrice } = useLocale();

  const loadProductsForStore = async (storeId: string) => {
    try {
      const pRes = await fetch(`/api/marketplace/products?supplierId=${encodeURIComponent(storeId)}`, { cache: "no-store" });
      if (pRes.ok) {
        const pData = await pRes.json();
        const loadedProducts: Product[] = pData.products || [];
        setProducts(loadedProducts);
        if (loadedProducts.length > 0) {
          setSelectedBoostProductId((prev) => loadedProducts.some((p) => p.id === prev) ? prev : loadedProducts[0].id);
          setSelectedAffiliateProductId((prev) => loadedProducts.some((p) => p.id === prev) ? prev : loadedProducts[0].id);
        }
      }
    } catch {
      // Non-critical
    }
  };

  const loadAnalyticsForStore = async (storeId: string) => {
    try {
      const aRes = await fetch(`/api/marketplace/analytics?storeId=${encodeURIComponent(storeId)}`, { cache: "no-store" });
      if (aRes.ok) {
        const aData = await aRes.json();
        if (aData?.stats) setAnalytics(aData.stats);
      }
    } catch {
      // Non-critical
    }
  };

  const selectStore = async (store: Supplier) => {
    const sSlug = store.slug || generateStoreSlug(store.business_name);
    const vSlug = (store as any).vendor_slug || "vendeur";
    window.location.assign(`/marketplace/boutique/${vSlug}/${sSlug}`);
  };

  const goToStoresList = async () => {
    setViewMode("stores-list");
    setSelectedStore(null);
    setMessage("");
    setError("");
    const url = new URL(window.location.href);
    url.searchParams.delete("storeId");
    url.searchParams.delete("action");
    window.history.replaceState(null, "", url.toString());

    // Refresh suppliers list to have up-to-date product counts
    try {
      const response = await fetch("/api/marketplace/suppliers", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        const fetchedStores: Supplier[] = data.suppliers || (data.supplier ? [data.supplier] : []);
        setStores(fetchedStores);
      }
    } catch {
      // Non-critical
    }
  };

  const openNewStoreForm = () => {
    setBusinessName("");
    setDescription("");
    setCountryCode("BJ");
    setCity("");
    setStep(1);
    setViewMode("new-store");
    setMessage("");
    setError("");
    const url = new URL(window.location.href);
    url.searchParams.set("action", "new-store");
    url.searchParams.delete("storeId");
    window.history.replaceState(null, "", url.toString());
  };

  const loadStoresAndSupplier = async (preferredStoreId?: string) => {
    try {
      const response = await fetch("/api/marketplace/suppliers", { cache: "no-store" });
      if (response.status === 401) {
        window.location.assign("/auth/login?next=/marketplace/boutique");
        return;
      }
      const data = await response.json();
      const fetchedStores: Supplier[] = data.suppliers || (data.supplier ? [data.supplier] : []);
      setStores(fetchedStores);

      const params = new URLSearchParams(window.location.search);
      const actionParam = params.get("action");
      const targetStoreId = preferredStoreId || params.get("storeId");

      if (fetchedStores.length === 0 || actionParam === "create-store" || actionParam === "new-store") {
        setViewMode("new-store");
        setSelectedStore(null);
      } else if (targetStoreId) {
        const match = fetchedStores.find((s) => s.id === targetStoreId);
        if (match) {
          await selectStore(match);
        } else {
          setViewMode("stores-list");
        }
      } else {
        setViewMode("stores-list");
      }
    } catch {
      setError("Impossible de vérifier vos boutiques.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSection = params.get("section") as Section | null;
    const action = params.get("action");

    if (requestedSection && ["dashboard", "product", "products", "boost", "affiliate", "analytics", "video"].includes(requestedSection)) {
      setSection(requestedSection);
    } else if (window.location.hash === "#publier") {
      setSection("product");
    }

    if (action === "create-store") {
      setMessage("Bienvenue dans l'espace vendeur Envol Africa. Finalisez la configuration de votre vitrine ci-dessous.");
    }

    void loadStoresAndSupplier();
  }, []);

  useEffect(() => {
    if (section !== "video" || !selectedStore) return;
    fetch("/api/marketplace/video-subscription", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setVideoActive(Boolean(data.active));
        setRemaining(Number(data.remaining ?? 10));
      })
      .catch(() => {});
  }, [section, selectedStore]);

  const switchSection = (newSec: Section) => {
    startTransition(() => {
      setSection(newSec);
      setMessage("");
      setError("");
      const url = new URL(window.location.href);
      url.searchParams.set("section", newSec);
      url.searchParams.delete("action");
      window.history.replaceState(null, "", url.toString());
    });
  };

  const createStore = async () => {
    if (businessName.trim().length < 2) {
      setError("Saisissez le nom de votre boutique.");
      setStep(1);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/marketplace/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, description, countryCode, city }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Création impossible.");
      const newStore = data.supplier;
      setStores((prev) => [newStore, ...prev]);
      const sSlug = newStore.slug || generateStoreSlug(newStore.business_name);
      const vSlug = newStore.vendor_slug || "vendeur";
      window.location.assign(`/marketplace/boutique/${vSlug}/${sSlug}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  };

  const updateProductStock = async (productId: string, stockQuantity: number) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/marketplace/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, stockQuantity }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Mise à jour impossible.");
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock_quantity: stockQuantity } : p)));
      setMessage("Stock mis à jour avec succès.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Mise à jour impossible.");
    } finally {
      setBusy(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/marketplace/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Mise à jour impossible.");
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p)));
      setMessage(`Produit ${newStatus === "published" ? "mis en ligne" : "placé en brouillon"}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Mise à jour impossible.");
    } finally {
      setBusy(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Voulez-vous vraiment retirer ce produit du catalogue ?")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/marketplace/products?id=${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Suppression impossible.");
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setMessage(data.message || "Produit supprimé.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Suppression impossible.");
    } finally {
      setBusy(false);
    }
  };

  const launchBoost = async () => {
    if (!selectedBoostProductId) {
      setError("Veuillez sélectionner un produit à booster.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/marketplace/boosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedBoostProductId,
          durationDays: boostPlanDays,
          amountXof: boostAmountXof,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d'initialiser le boost.");
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      } else {
        setMessage("Demande de boost prise en compte.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur de boost.");
    } finally {
      setBusy(false);
    }
  };

  const saveProductAffiliation = async () => {
    if (!selectedAffiliateProductId) {
      setError("Sélectionnez un produit pour configurer l'affiliation.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/marketplace/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedAffiliateProductId,
          enableAffiliation: affiliateEnabled,
          affiliationRate: affiliateRate,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Configuration impossible.");
      setMessage("Paramètres d'affiliation enregistrés avec succès.");
      if (selectedStore) void loadProductsForStore(selectedStore.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur d'affiliation.");
    } finally {
      setBusy(false);
    }
  };

  const activateVideo = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/marketplace/video-subscription", { method: "POST" });
      const data = await response.json();
      if (response.status === 401) {
        window.location.assign("/auth/login?next=/marketplace/boutique?section=video");
        return;
      }
      if (!response.ok || !data.checkout_url) throw new Error(data.error || "Paiement indisponible.");
      window.location.assign(data.checkout_url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’activer l’option vidéo.");
    } finally {
      setBusy(false);
    }
  };

  const uploadVideo = async () => {
    if (!videoProductId || !file) {
      setError("Sélectionnez un produit et une vidéo.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("La vidéo doit peser au maximum 3 Mo.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.append("productId", videoProductId);
      form.append("file", file);
      const response = await fetch("/api/marketplace/products/video/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload impossible.");
      setMessage(`Vidéo associée au produit. Il vous reste ${data.remaining} emplacement(s).`);
      setRemaining(Number(data.remaining));
      setFile(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fcf9f8] p-6 text-sm text-[#725f4d]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9e001f] border-t-transparent"></div>
          <p className="font-bold text-[#2a211a]">Vérification de vos boutiques vendeur…</p>
        </div>
      </main>
    );
  }

  // VUE 1 : WIZARD CREATION BOUTIQUE (nouvelle boutique ou première boutique)
  if (viewMode === "new-store") {
    return (
      <main className="min-h-screen bg-[#fcf9f8] px-5 py-10 text-[#2a211a] md:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            {stores.length > 0 ? (
              <button
                type="button"
                onClick={goToStoresList}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9e001f] hover:underline cursor-pointer"
              >
                ← Annuler et revenir à mes boutiques ({stores.length})
              </button>
            ) : (
              <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9e001f] hover:underline">
                ← Retour au Marketplace
              </Link>
            )}
          </div>

          <div className="mt-6 rounded-[28px] bg-[#2a211a] p-7 text-white md:p-10 shadow-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffca63]/20 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#ffca63]">
              ✨ {stores.length > 0 ? "Ajouter une nouvelle boutique" : "Espace Vendeur Envol Africa"}
            </span>
            <h1 className="mt-3 font-display text-3xl font-black md:text-4xl">
              {stores.length > 0 ? "Créer une nouvelle enseigne" : "Créons votre boutique africaine"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              {stores.length > 0
                ? "Vous pouvez posséder plusieurs boutiques spécialisées (mode, tech, alimentation, services). Configurez votre nouvelle vitrine ci-dessous."
                : "Votre compte est identifié. Renseignez les informations de votre enseigne pour commencer à vendre des produits physiques, digitaux et formations à l'échelle du continent."}
            </p>
            <div className="mt-7 flex gap-2">
              {[1, 2, 3].map((item) => (
                <span
                  key={item}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    item <= step ? "bg-[#ffca63]" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>

          <section className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-sm md:p-8">
            {step === 1 && (
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a36300]">Étape 1 sur 3</p>
                <h2 className="mt-2 font-display text-2xl font-black">Nom commercial de votre boutique</h2>
                <p className="mt-1 text-xs text-[#806c58]">Ce nom sera affiché sur toutes vos fiches produits et dans le répertoire des boutiques officielles.</p>
                <label className="mt-5 block text-sm font-bold">
                  Nom commercial
                  <input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex. Yekpon Digit Store, Wax & Délices, AfroTech..."
                    className="mt-2 h-12 w-full rounded-xl border border-[#eadfce] px-4 text-sm outline-none focus:border-[#9e001f]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => (businessName.trim().length >= 2 ? setStep(2) : setError("Saisissez le nom de votre boutique."))}
                  className="mt-6 rounded-full bg-[#9e001f] px-6 py-3 text-sm font-black text-white hover:bg-[#80001a] transition"
                >
                  Continuer vers les coordonnées →
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a36300]">Étape 2 sur 3</p>
                <h2 className="mt-2 font-display text-2xl font-black">Présentation & Localisation</h2>
                <p className="mt-1 text-xs text-[#806c58]">Présentez votre savoir-faire et indiquez votre pays d&apos;expédition ou d&apos;exercice principal.</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre activité, la qualité de vos produits et vos engagements de livraison…"
                  className="mt-5 min-h-32 w-full rounded-xl border border-[#eadfce] p-4 text-sm outline-none focus:border-[#9e001f]"
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#2a211a] mb-1">Pays principal</label>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="h-12 w-full rounded-xl border border-[#eadfce] px-3 text-sm"
                    >
                      {countries.map((item) => (
                        <option key={item.code} value={item.code}>{item.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2a211a] mb-1">Ville</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Cotonou, Abidjan, Dakar..."
                      className="h-12 w-full rounded-xl border border-[#eadfce] px-4 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-full border border-[#eadfce] px-6 py-3 text-sm font-black"
                  >
                    ← Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="rounded-full bg-[#9e001f] px-6 py-3 text-sm font-black text-white hover:bg-[#80001a] transition"
                  >
                    Vérifier et créer →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a36300]">Étape 3 sur 3</p>
                <h2 className="mt-2 font-display text-2xl font-black">Vérification de votre enseigne</h2>
                <div className="mt-5 rounded-2xl bg-[#fff8f6] border border-[#f5d5d3] p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-xl font-black text-[#9e001f]">{businessName}</p>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                      {countryCode} · {city || "Afrique"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#725f4d]">
                    {description || "Aucune description renseignée pour le moment."}
                  </p>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-full border border-[#eadfce] px-6 py-3 text-sm font-black"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => void createStore()}
                    disabled={busy}
                    className="rounded-full bg-[#9e001f] px-6 py-3 text-sm font-black text-white hover:bg-[#80001a] transition disabled:opacity-60"
                  >
                    {busy ? "Création en cours…" : "Créer ma boutique & commencer à vendre"}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800">{error}</p>}
          </section>
        </div>
      </main>
    );
  }

  // VUE 2 : LE HUB MULTI-BOUTIQUES (Liste de toutes les boutiques du vendeur)
  if (viewMode === "stores-list") {
    const totalProductsAcrossStores = stores.reduce((acc, s) => acc + (s.products_count || 0), 0);

    return (
      <main className="min-h-screen bg-[#fcf9f8] px-4 py-8 text-[#2a211a] sm:px-6 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          {/* Navigation vers le catalogue */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9e001f] hover:underline">
              ← Retour au Catalogue Marketplace
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/marketplace/commandes"
                className="rounded-full border border-[#eadfce] bg-white px-4 py-1.5 text-xs font-bold text-[#2a211a] hover:bg-zinc-50"
              >
                Mes Commandes & Expéditions →
              </Link>
            </div>
          </div>

          {/* Message d'état */}
          {message && (
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#e9f7f5] border border-[#a6dfd5] p-4 text-xs font-semibold text-[#087e8b]">
              <span>{message}</span>
              <button onClick={() => setMessage("")} className="font-bold hover:underline">✕</button>
            </div>
          )}
          {error && (
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-800">
              <span>{error}</span>
              <button onClick={() => setError("")} className="font-bold hover:underline">✕</button>
            </div>
          )}

          {/* Hero Card Hub Multi-Boutiques */}
          <div className="mt-6 rounded-[28px] bg-[#2a211a] p-6 text-white md:p-8 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffca63]/20 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#ffca63]">
                  🏪 Espace Multi-Boutiques Vendeur
                </span>
                <h1 className="mt-3 font-display text-2xl font-black md:text-3xl">
                  Mes Boutiques Envol Africa
                </h1>
                <p className="mt-1 text-xs text-white/70 max-w-xl leading-5">
                  Gérez vos enseignes commerciales, paramétrez vos vitrines, ajoutez de nouveaux produits et suivez les ventes de chacune de vos boutiques africaines.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewStoreForm}
                className="rounded-full bg-[#ffca63] text-[#2a211a] px-5 py-2.5 text-xs font-black hover:bg-[#ffe082] transition shadow-md flex items-center gap-1.5"
              >
                <span className="text-base leading-none font-bold">+</span> Créer une nouvelle boutique
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <strong className="block text-2xl font-black">{stores.length}</strong>
                <span className="text-xs text-white/65">Boutique{stores.length > 1 ? "s" : ""} active{stores.length > 1 ? "s" : ""}</span>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <strong className="block text-2xl font-black">{totalProductsAcrossStores}</strong>
                <span className="text-xs text-white/65">Produits au catalogue</span>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 col-span-2 sm:col-span-1">
                <strong className="block text-2xl font-black text-[#ffca63]">Multi-Vendeur</strong>
                <span className="text-xs text-white/65">Gestion autonome par boutique</span>
              </div>
            </div>
          </div>

          {/* Grille des boutiques */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-black text-[#2a211a]">
                Vos enseignes commerciales
              </h2>
              <span className="text-xs text-[#806c58]">
                {stores.length} boutique{stores.length > 1 ? "s" : ""} enregistrée{stores.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {stores.map((s) => {
                const sSlug = s.slug || generateStoreSlug(s.business_name);
                const vSlug = (s as any).vendor_slug || "vendeur";
                const fullStorePath = `/marketplace/boutique/${vSlug}/${sSlug}`;

                return (
                  <div
                    key={s.id}
                    className="group flex flex-col justify-between rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-sm hover:border-[#9e001f] hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff5f2] border border-[#f5d5d3] text-xl font-black text-[#9e001f]">
                          🏪
                        </div>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          {s.certification_status === "certified" ? "✓ Certifiée" : "Active"}
                        </span>
                      </div>

                      <h3 className="mt-4 font-display text-lg font-black text-[#2a211a] group-hover:text-[#9e001f] transition">
                        {s.business_name}
                      </h3>

                      <p className="mt-1 text-xs text-[#806c58]">
                        📍 {s.city ? `${s.city}, ` : ""}{s.country_code || "Afrique"} · {s.rating ? `⭐ ${s.rating}` : "Nouveau vendeur"}
                      </p>

                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#9e001f] bg-[#fff5f2] px-2.5 py-1 rounded-lg border border-[#f5d5d3] font-mono">
                        <span className="truncate">{fullStorePath}</span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#725f4d]">
                        {s.description || "Boutique officielle sur Envol Africa Marketplace."}
                      </p>

                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#fffdfb] border border-[#eadfce] p-2.5 text-xs text-[#2a211a]">
                        <span className="font-black text-[#9e001f]">{s.products_count ?? 0}</span>
                        <span className="text-[#806c58]">produit(s) actuellement au catalogue</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2 pt-4 border-t border-[#f2e7d8]">
                      <Link
                        href={fullStorePath}
                        className="block w-full text-center rounded-full bg-[#9e001f] py-2.5 text-xs font-black text-white hover:bg-[#80001a] transition shadow-xs"
                      >
                        Gérer cette boutique →
                      </Link>

                      <div className="flex items-center justify-between text-[11px] px-1">
                        <Link
                          href={`${fullStorePath}`}
                          className="font-bold text-[#a36300] hover:underline"
                        >
                          + Publier un produit
                        </Link>
                        <Link
                          href={`${fullStorePath}?view=public`}
                          className="font-bold text-[#806c58] hover:text-[#9e001f] hover:underline"
                        >
                          Vitrine client ↗
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Carte Ajouter une boutique */}
              <div
                onClick={openNewStoreForm}
                className="cursor-pointer flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#eadfce] bg-[#fffdfb] p-8 text-center hover:border-[#9e001f] hover:bg-[#fff8f6] transition group min-h-[260px]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0ed] text-[#9e001f] text-2xl font-black group-hover:scale-110 transition">
                  +
                </div>
                <strong className="mt-4 block font-display text-base font-black text-[#2a211a] group-hover:text-[#9e001f]">
                  Créer une nouvelle boutique
                </strong>
                <p className="mt-1 text-xs text-[#806c58] max-w-xs leading-5">
                  Vous vendez une autre marque, une autre gamme de produits ou opérez dans un autre pays ? Ouvrez une nouvelle enseigne en 3 étapes.
                </p>
                <span className="mt-4 rounded-full bg-[#2a211a] text-white px-4 py-2 text-xs font-black group-hover:bg-[#9e001f] transition">
                  Nouvelle vitrine →
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // VUE 3 : BOUTIQUE ACTIVE — TABLEAU DE BORD VENDEUR COMPLET DE LA BOUTIQUE SÉLECTIONNÉE
  if (!selectedStore) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fcf9f8] p-6 text-sm text-[#725f4d]">
        <div className="flex flex-col items-center gap-3">
          <p className="font-bold text-[#2a211a]">Aucune boutique sélectionnée.</p>
          <button
            type="button"
            onClick={goToStoresList}
            className="rounded-full bg-[#9e001f] px-5 py-2.5 text-xs font-black text-white"
          >
            Voir mes boutiques →
          </button>
        </div>
      </main>
    );
  }

  const filteredProducts = products.filter((p) =>
    searchQuery ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <main className="min-h-screen bg-[#fcf9f8] px-4 py-8 text-[#2a211a] sm:px-6 md:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        {/* En-tête de navigation boutique */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={goToStoresList}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9e001f] hover:underline cursor-pointer"
          >
            ← Revenir à toutes mes boutiques ({stores.length})
          </button>

          <div className="flex flex-wrap items-center gap-3">
            {stores.length > 1 && (
              <div className="flex items-center gap-2 rounded-full border border-[#eadfce] bg-white px-3 py-1 shadow-xs">
                <span className="text-[11px] font-bold text-[#806c58]">Changer de boutique :</span>
                <select
                  value={selectedStore.id}
                  onChange={(e) => {
                    const target = stores.find((s) => s.id === e.target.value);
                    if (target) void selectStore(target);
                  }}
                  className="bg-transparent text-xs font-black text-[#2a211a] outline-none cursor-pointer"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      🏪 {s.business_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={openNewStoreForm}
              className="rounded-full bg-[#2a211a] text-white px-3.5 py-1.5 text-xs font-black hover:bg-zinc-800 transition"
            >
              + Créer une autre boutique
            </button>
            <Link
              href="/marketplace/commandes"
              className="rounded-full border border-[#eadfce] bg-white px-4 py-1.5 text-xs font-bold text-[#2a211a] hover:bg-zinc-50"
            >
              Mes Commandes & Expéditions →
            </Link>
          </div>
        </div>

        {/* Message de succès ou d'erreur */}
        {message && (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#e9f7f5] border border-[#a6dfd5] p-4 text-xs font-semibold text-[#087e8b]">
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="font-bold hover:underline">✕</button>
          </div>
        )}
        {error && (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-800">
            <span>{error}</span>
            <button onClick={() => setError("")} className="font-bold hover:underline">✕</button>
          </div>
        )}

        {/* Carte Vitrine Vendeur Active */}
        <div className="mt-6 rounded-[28px] bg-[#2a211a] p-6 text-white md:p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#ffca63]">
                  Boutique Active
                </span>
                {stores.length > 1 && (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white/80">
                    {stores.findIndex((s) => s.id === selectedStore.id) + 1} sur {stores.length}
                  </span>
                )}
              </div>
              <h1 className="mt-2 font-display text-2xl font-black md:text-3xl">
                {selectedStore.business_name}
              </h1>
              <p className="mt-1 text-xs text-white/70">
                {selectedStore.city ? `${selectedStore.city}, ` : ""}{selectedStore.country_code || "Afrique"} · Note vendeur : {selectedStore.rating ? `⭐ ${selectedStore.rating}` : "Nouveau vendeur"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => switchSection("product")}
                className="rounded-full bg-[#ffca63] text-[#2a211a] px-4 py-2 text-xs font-black hover:bg-[#ffe082] transition"
              >
                + Publier un produit
              </button>
              <button
                type="button"
                onClick={() => switchSection("boost")}
                className="rounded-full bg-white/10 text-white border border-white/20 px-4 py-2 text-xs font-black hover:bg-white/20 transition"
              >
                🚀 Booster
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/10 p-4">
              <strong className="block text-2xl font-black">{products.length}</strong>
              <span className="text-xs text-white/65">Produits de cette boutique</span>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <strong className="block text-2xl font-black">
                {products.filter((p) => p.is_boosted).length}
              </strong>
              <span className="text-xs text-white/65">Produits boostés</span>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <strong className="block text-2xl font-black">
                {analytics?.completedOrdersCount ?? 0}
              </strong>
              <span className="text-xs text-white/65">Ventes confirmées</span>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <strong className="block text-2xl font-black">
                {analytics?.totalRevenueXof ? formatPrice(analytics.totalRevenueXof) : "0 XOF"}
              </strong>
              <span className="text-xs text-white/65">Chiffre d&apos;affaires</span>
            </div>
          </div>
        </div>

        {/* Barre d'onglets / Raccourcis navigation */}
        <div className="mt-6 flex overflow-x-auto gap-2 border-b border-[#eadfce] pb-3 no-scrollbar">
          {[
            { id: "dashboard", label: "Tableau de bord", icon: "dashboard" },
            { id: "products", label: "Gérer mes stocks", icon: "inventory_2" },
            { id: "product", label: "Publier un produit", icon: "add_box" },
            { id: "boost", label: "Booster mes produits", icon: "rocket_launch" },
            { id: "affiliate", label: "Mettre en affiliation", icon: "group_add" },
            { id: "analytics", label: "Statistiques & CA", icon: "monitoring" },
            { id: "video", label: "Option Vidéo", icon: "movie" },
          ].map((tab) => {
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchSection(tab.id as Section)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  active
                    ? "bg-[#9e001f] text-white shadow-sm"
                    : "bg-white text-[#725f4d] border border-[#eadfce] hover:bg-[#fff5f2]"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* CONTENU SELON SECTION */}

        {/* 1. TABLEAU DE BORD */}
        {section === "dashboard" && (
          <section className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                onClick={() => switchSection("products")}
                className="cursor-pointer rounded-2xl border border-[#eadfce] bg-white p-5 shadow-sm hover:border-[#9e001f] transition"
              >
                <span className="material-symbols-outlined text-[#9e001f] text-3xl">inventory_2</span>
                <strong className="mt-3 block text-base font-black">Gérer mes produits & stocks</strong>
                <p className="mt-1 text-xs text-[#806c58]">
                  Consultez vos {products.length} articles, ajustez les stocks en temps réel et basculez en brouillon.
                </p>
                <span className="mt-4 inline-block text-xs font-bold text-[#9e001f]">Ouvrir le catalogue →</span>
              </div>

              <div
                onClick={() => switchSection("boost")}
                className="cursor-pointer rounded-2xl border border-[#eadfce] bg-white p-5 shadow-sm hover:border-[#a36300] transition"
              >
                <span className="material-symbols-outlined text-[#a36300] text-3xl">rocket_launch</span>
                <strong className="mt-3 block text-base font-black">Booster mes produits</strong>
                <p className="mt-1 text-xs text-[#806c58]">
                  Mettez vos produits en avant dans les rayons pour démultiplier vos ventes dès 2 500 XOF.
                </p>
                <span className="mt-4 inline-block text-xs font-bold text-[#a36300]">Lancer un boost →</span>
              </div>

              <div
                onClick={() => switchSection("affiliate")}
                className="cursor-pointer rounded-2xl border border-[#eadfce] bg-white p-5 shadow-sm hover:border-[#087e8b] transition"
              >
                <span className="material-symbols-outlined text-[#087e8b] text-3xl">group_add</span>
                <strong className="mt-3 block text-base font-black">Mettre en affiliation</strong>
                <p className="mt-1 text-xs text-[#806c58]">
                  Mobilisez des ambassadeurs pour recommander vos produits avec commission au résultat.
                </p>
                <span className="mt-4 inline-block text-xs font-bold text-[#087e8b]">Configurer l&apos;affiliation →</span>
              </div>
            </div>

            {/* Aperçu rapide des produits récents */}
            <div className="rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a36300]">Catalogue de {selectedStore.business_name}</p>
                  <h2 className="mt-1 font-display text-xl font-black">Vos derniers articles</h2>
                </div>
                <button
                  type="button"
                  onClick={() => switchSection("product")}
                  className="rounded-full bg-[#9e001f] px-4 py-2 text-xs font-black text-white hover:bg-[#80001a]"
                >
                  + Ajouter un produit
                </button>
              </div>

              {products.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-[#fff8f6] p-8 text-center">
                  <p className="text-sm font-bold text-[#2a211a]">Vous n&apos;avez encore publié aucun produit dans cette boutique.</p>
                  <p className="mt-1 text-xs text-[#806c58]">Ajoutez des articles physiques, digitaux, formations ou services pour démarrer vos ventes.</p>
                  <button
                    type="button"
                    onClick={() => switchSection("product")}
                    className="mt-4 rounded-full bg-[#9e001f] px-5 py-2.5 text-xs font-black text-white"
                  >
                    Publier un produit dans cette boutique →
                  </button>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {products.slice(0, 6).map((product) => {
                    const img = product.image || (Array.isArray(product.media) && typeof product.media[0] === "string" ? product.media[0] : ((product.media as any)?.[0]?.url || ""));
                    return (
                      <article key={product.id} className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f5eee5]">
                            {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-3xl">✦</div>}
                            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${product.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                {product.status === "published" ? "En ligne" : "Brouillon"}
                              </span>
                              {product.is_boosted && (
                                <span className="rounded-full bg-amber-400 text-zinc-900 px-2 py-0.5 text-[10px] font-black">
                                  ⚡ Boosté
                                </span>
                              )}
                            </div>
                          </div>
                          <h3 className="mt-3 line-clamp-2 text-sm font-black">{product.title}</h3>
                          <p className="mt-1 text-sm font-bold text-[#9e001f]">{product.price_xof ? formatPrice(product.price_xof) : "Prix à définir"}</p>
                          <p className="text-[11px] text-[#806c58]">Stock : {product.stock_quantity ?? "Non défini"}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-[#f2e7d8] pt-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBoostProductId(product.id);
                              switchSection("boost");
                            }}
                            className="font-bold text-[#a36300] hover:underline"
                          >
                            Booster
                          </button>
                          <Link href={`/marketplace/produits/${product.id}`} className="font-bold text-[#9e001f] hover:underline">
                            Voir fiche →
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 2. PUBLIER UN PRODUIT */}
        {section === "product" && (
          <section className="mt-6">
            <MarketplaceProductForm
              supplierId={selectedStore.id}
              stores={stores}
              onCreated={() => {
                void loadProductsForStore(selectedStore.id);
                setMessage(`Votre produit a été publié avec succès dans la boutique "${selectedStore.business_name}" !`);
                switchSection("products");
              }}
            />
          </section>
        )}

        {/* 3. GÉRER MES PRODUITS & STOCKS */}
        {section === "products" && (
          <section className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a36300]">Inventaire · {selectedStore.business_name}</p>
                <h2 className="mt-1 font-display text-2xl font-black">Gérer mes produits & stocks</h2>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-full border border-[#eadfce] px-4 text-xs outline-none focus:border-[#9e001f]"
                />
                <button
                  type="button"
                  onClick={() => switchSection("product")}
                  className="rounded-full bg-[#9e001f] px-4 py-2 text-xs font-black text-white hover:bg-[#80001a]"
                >
                  + Ajouter
                </button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <p className="mt-6 text-sm text-[#806c58]">Aucun produit trouvé dans cette boutique.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {filteredProducts.map((p) => {
                  const img = p.image || (Array.isArray(p.media) && typeof p.media[0] === "string" ? p.media[0] : ((p.media as any)?.[0]?.url || ""));
                  return (
                    <article
                      key={p.id}
                      className="flex flex-col gap-4 rounded-2xl border border-[#eadfce] bg-[#fffdfb] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[#f5eee5]">
                          {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xl">✦</div>}
                        </div>
                        <div>
                          <strong className="block text-sm font-black">{p.title}</strong>
                          <span className="text-xs text-[#9e001f] font-bold">{p.price_xof ? formatPrice(p.price_xof) : "Prix non fixé"}</span>
                          <span className="text-[11px] text-[#806c58] ml-2">({p.category || "Catalogue"})</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Contrôle de stock */}
                        <div className="flex items-center gap-1.5 bg-white border border-[#eadfce] rounded-xl px-2.5 py-1">
                          <span className="text-[11px] font-bold text-[#725f4d]">Stock :</span>
                          <input
                            type="number"
                            min="0"
                            defaultValue={p.stock_quantity ?? 0}
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              if (!isNaN(val) && val >= 0 && val !== p.stock_quantity) {
                                void updateProductStock(p.id, val);
                              }
                            }}
                            className="w-14 text-xs font-bold text-center border-b border-[#9e001f] focus:outline-none"
                          />
                        </div>

                        {/* Statut En ligne / Brouillon */}
                        <button
                          type="button"
                          onClick={() => void toggleProductStatus(p.id, p.status || "draft")}
                          disabled={busy}
                          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                            p.status === "published"
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          }`}
                        >
                          {p.status === "published" ? "✓ En ligne" : "⏸ Brouillon"}
                        </button>

                        {/* Raccourci Booster */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBoostProductId(p.id);
                            switchSection("boost");
                          }}
                          className="rounded-full border border-[#a36300] bg-amber-50 px-3 py-1.5 text-xs font-bold text-[#a36300] hover:bg-amber-100"
                        >
                          🚀 Booster
                        </button>

                        {/* Raccourci Affiliation */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAffiliateProductId(p.id);
                            switchSection("affiliate");
                          }}
                          className="rounded-full border border-[#087e8b] bg-[#e9f7f5] px-3 py-1.5 text-xs font-bold text-[#087e8b] hover:bg-[#d8f2ee]"
                        >
                          🤝 Affiliation
                        </button>

                        {/* Supprimer */}
                        <button
                          type="button"
                          onClick={() => void deleteProduct(p.id)}
                          className="text-xs font-bold text-zinc-400 hover:text-red-700 p-1"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 4. BOOSTER MES PRODUITS */}
        {section === "boost" && (
          <section className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a36300]">Visibilité Prioritaire</p>
            <h2 className="mt-1 font-display text-2xl font-black">Booster mes produits dans les rayons</h2>
            <p className="mt-2 text-sm text-[#725f4d]">
              Le boost positionne votre produit en tête des résultats de recherche, avec le badge officiel &quot;Produit en Vedette&quot;, multipliant son audience et vos commandes.
            </p>

            <div className="mt-6">
              <label className="block text-xs font-bold text-[#2a211a] mb-2">Sélectionnez le produit à booster :</label>
              <select
                value={selectedBoostProductId}
                onChange={(e) => setSelectedBoostProductId(e.target.value)}
                className="h-12 w-full max-w-xl rounded-xl border border-[#eadfce] bg-white px-4 text-sm"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.price_xof ? formatPrice(p.price_xof) : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { days: 7, amount: 2500, label: "Pack Flash 7 Jours", desc: "Idéal pour lancer une offre ou tester un nouveau produit." },
                { days: 14, amount: 4500, label: "Pack Pro 14 Jours", desc: "Recommandé : 2 semaines en haut du rayon avec visibilité doublée.", popular: true },
                { days: 30, amount: 8000, label: "Pack Prestige 30 Jours", desc: "Mise en avant mensuelle maximale pour générer des ventes en continu." },
              ].map((plan) => {
                const selected = boostPlanDays === plan.days;
                return (
                  <div
                    key={plan.days}
                    onClick={() => {
                      setBoostPlanDays(plan.days);
                      setBoostAmountXof(plan.amount);
                    }}
                    className={`cursor-pointer rounded-2xl border p-5 transition relative flex flex-col justify-between ${
                      selected ? "border-[#9e001f] bg-[#fff5f2] shadow-sm" : "border-[#eadfce] bg-white hover:border-[#a36300]"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 right-4 rounded-full bg-[#ffca63] text-[#2a211a] px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        Recommandé
                      </span>
                    )}
                    <div>
                      <strong className="block text-base font-black text-[#2a211a]">{plan.label}</strong>
                      <p className="mt-2 text-2xl font-black text-[#9e001f]">{formatPrice(plan.amount)}</p>
                      <p className="mt-2 text-xs text-[#806c58] leading-5">{plan.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#eadfce]/40 flex items-center gap-2">
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${selected ? "border-[#9e001f] bg-[#9e001f]" : "border-zinc-300"}`}>
                        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white"></span>}
                      </span>
                      <span className="text-xs font-bold text-[#2a211a]">{selected ? "Sélectionné" : "Choisir"}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#fff8f6] p-5 border border-[#eadfce]">
              <div>
                <strong className="block text-sm font-black">Total : {formatPrice(boostAmountXof)} pour {boostPlanDays} jours de boost</strong>
                <span className="text-xs text-[#806c58]">Paiement sécurisé via Moneroo (Mobile Money Bénin, Côte d’Ivoire, Sénégal, Togo, Carte bancaire).</span>
              </div>
              <button
                type="button"
                onClick={() => void launchBoost()}
                disabled={busy || !selectedBoostProductId}
                className="rounded-full bg-[#9e001f] px-6 py-3 text-xs font-black text-white hover:bg-[#80001a] transition disabled:opacity-60"
              >
                {busy ? "Initialisation…" : `Activer le boost (${formatPrice(boostAmountXof)}) →`}
              </button>
            </div>
          </section>
        )}

        {/* 5. METTRE EN AFFILIATION */}
        {section === "affiliate" && (
          <section className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#087e8b]">Réseau d&apos;Ambassadeurs</p>
            <h2 className="mt-1 font-display text-2xl font-black">Mettre vos produits en affiliation</h2>
            <p className="mt-2 text-sm text-[#725f4d]">
              Proposez une commission sur vente aux ambassadeurs Envol Africa. Ils partagent vos produits sur WhatsApp, Facebook, LinkedIn et TikTok, et vous ne payez la commission que lorsqu&apos;une commande est validée.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2a211a] mb-2">Choisir le produit :</label>
                  <select
                    value={selectedAffiliateProductId}
                    onChange={(e) => {
                      setSelectedAffiliateProductId(e.target.value);
                      const prod = products.find((p) => p.id === e.target.value);
                      const existingAff = prod?.product_affiliations?.[0];
                      if (existingAff) {
                        setAffiliateEnabled(existingAff.is_active);
                        setAffiliateRate(existingAff.commission_rate);
                      }
                    }}
                    className="h-12 w-full rounded-xl border border-[#eadfce] bg-white px-4 text-sm"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — {p.price_xof ? formatPrice(p.price_xof) : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-[#eadfce] p-4 bg-[#fffdfb]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={affiliateEnabled}
                      onChange={(e) => setAffiliateEnabled(e.target.checked)}
                      className="h-5 w-5 rounded accent-[#087e8b]"
                    />
                    <span className="text-sm font-bold text-[#2a211a]">Activer l&apos;affiliation sur ce produit</span>
                  </label>

                  {affiliateEnabled && (
                    <div className="mt-4 pt-4 border-t border-[#eadfce]">
                      <label className="block text-xs font-bold text-[#2a211a] mb-2">Taux de commission offert :</label>
                      <select
                        value={affiliateRate}
                        onChange={(e) => setAffiliateRate(Number(e.target.value))}
                        className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-xs"
                      >
                        <option value={0.05}>5 % du prix de vente</option>
                        <option value={0.10}>10 % (Recommandé)</option>
                        <option value={0.15}>15 % du prix de vente</option>
                        <option value={0.20}>20 % du prix de vente</option>
                        <option value={0.25}>25 % du prix de vente</option>
                      </select>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void saveProductAffiliation()}
                  disabled={busy || !selectedAffiliateProductId}
                  className="rounded-full bg-[#087e8b] px-6 py-3 text-xs font-black text-white hover:bg-[#066570] transition disabled:opacity-60"
                >
                  {busy ? "Enregistrement…" : "Enregistrer les paramètres d'affiliation"}
                </button>
              </div>

              {/* Simulation des gains ambassadeur */}
              <div className="rounded-2xl border border-[#a6dfd5] bg-[#e9f7f5]/40 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#087e8b]">Simulation d&apos;impact</span>
                  <h3 className="mt-2 font-display text-lg font-black text-[#2a211a]">Comment fonctionne la commission ?</h3>
                  {(() => {
                    const currentProd = products.find((p) => p.id === selectedAffiliateProductId);
                    const price = currentProd?.price_xof || 25000;
                    const commission = Math.round(price * affiliateRate);
                    const netAffiliate = Math.round(commission * 0.9);
                    return (
                      <div className="mt-4 space-y-2 text-xs text-[#2a211a]">
                        <div className="flex justify-between py-1 border-b border-[#a6dfd5]/40">
                          <span>Prix de vente du produit :</span>
                          <strong>{formatPrice(price)}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#a6dfd5]/40">
                          <span>Taux de commission fixé :</span>
                          <strong>{Math.round(affiliateRate * 100)} %</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#a6dfd5]/40 text-[#087e8b]">
                          <span>Gain reversé à l&apos;ambassadeur :</span>
                          <strong className="text-sm">~{formatPrice(netAffiliate)}</strong>
                        </div>
                        <div className="flex justify-between py-1 font-bold text-[#9e001f]">
                          <span>Revenu net perçu par vous :</span>
                          <strong>{formatPrice(price - commission)}</strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-6 rounded-xl bg-white p-3 text-[11px] text-[#725f4d]">
                  💡 <strong>Astuce :</strong> Un taux de 10% à 15% est particulièrement attractif pour inciter les influenceurs et ambassadeurs à partager activement vos offres sur leurs réseaux.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6. STATISTIQUES & CHIFFRE D'AFFAIRES */}
        {section === "analytics" && (
          <section className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a36300]">Performance commerciale · {selectedStore.business_name}</p>
            <h2 className="mt-1 font-display text-2xl font-black">Statistiques & Chiffre d&apos;affaires</h2>
            <p className="mt-2 text-sm text-[#725f4d]">
              Suivez l&apos;évolution de vos revenus, vos commandes et la dynamique des ventes de cette boutique en temps réel.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfb] p-5">
                <span className="text-xs font-bold text-[#806c58]">Chiffre d&apos;affaires encaissé</span>
                <strong className="mt-2 block text-2xl font-black text-[#9e001f]">
                  {formatPrice(analytics?.totalRevenueXof || 0)}
                </strong>
                <span className="mt-1 block text-[11px] text-emerald-700">Fonds libérés après confirmation</span>
              </div>
              <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfb] p-5">
                <span className="text-xs font-bold text-[#806c58]">Revenus en attente / Séquestre</span>
                <strong className="mt-2 block text-2xl font-black text-[#a36300]">
                  {formatPrice(analytics?.pendingRevenueXof || 0)}
                </strong>
                <span className="mt-1 block text-[11px] text-[#806c58]">En cours d&apos;expédition / paiement</span>
              </div>
              <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfb] p-5">
                <span className="text-xs font-bold text-[#806c58]">Commandes validées</span>
                <strong className="mt-2 block text-2xl font-black text-[#087e8b]">
                  {analytics?.completedOrdersCount || 0}
                </strong>
                <span className="mt-1 block text-[11px] text-[#806c58]">Sur {analytics?.totalOrders || 0} initiées</span>
              </div>
              <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfb] p-5">
                <span className="text-xs font-bold text-[#806c58]">Panier moyen</span>
                <strong className="mt-2 block text-2xl font-black text-[#2a211a]">
                  {formatPrice(analytics?.averageBasketXof || 0)}
                </strong>
                <span className="mt-1 block text-[11px] text-[#806c58]">Par commande validée</span>
              </div>
            </div>

            {/* Dernières ventes */}
            <div className="mt-8">
              <h3 className="text-base font-black text-[#2a211a]">Dernières transactions de la boutique</h3>
              {(!analytics?.recentSales || analytics.recentSales.length === 0) ? (
                <p className="mt-3 text-xs text-[#806c58] rounded-xl bg-[#fff8f6] p-4">
                  Aucune vente enregistrée pour le moment. Dès que vos clients commandent, les transactions apparaissent ici.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {analytics.recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eadfce] p-3 text-xs"
                    >
                      <div>
                        <strong className="block text-[#2a211a]">{sale.marketplace_products?.title || "Article Marketplace"}</strong>
                        <span className="text-[#806c58]">
                          {new Date(sale.created_at).toLocaleDateString("fr-FR")} · {sale.payment_mode === "installment" ? "Échelonné" : "Comptant"}
                        </span>
                      </div>
                      <div className="text-right">
                        <strong className="text-[#9e001f]">{formatPrice(sale.total_xof)}</strong>
                        <span className="block text-[11px] text-emerald-700 font-bold">{sale.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 7. OPTION VIDÉO */}
        {section === "video" && (
          <section className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a36300]">Administration Vendeur</p>
            <h2 className="mt-1 font-display text-2xl font-black">Option vidéo produit</h2>
            <p className="mt-2 text-sm leading-6 text-[#725f4d]">
              Cette option permet d&apos;illustrer vos produits avec de courtes vidéos de démonstration (MP4, WebM, 3 Mo max). Elle coûte {formatPrice(5000)} par mois et autorise jusqu&apos;à 10 produits vidéo.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#fff8f6] p-4 border border-[#eadfce]">
              <div>
                <strong className="block text-sm">
                  {videoActive ? `Option active · ${remaining} emplacement(s) restant(s)` : "Option inactive"}
                </strong>
                <span className="text-xs text-[#806c58]">Fichiers MP4, WebM ou MOV jusqu&apos;à 3 Mo</span>
              </div>
              {!videoActive && (
                <button
                  type="button"
                  onClick={() => void activateVideo()}
                  disabled={busy}
                  className="rounded-full bg-[#9e001f] px-5 py-3 text-xs font-black text-white hover:bg-[#80001a]"
                >
                  Activer l’option · {formatPrice(5000)} / mois
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <label className="text-xs font-bold">
                Produit concerné
                <select
                  value={videoProductId}
                  onChange={(e) => setVideoProductId(e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[#eadfce] px-3 text-sm bg-white"
                >
                  <option value="">Sélectionnez un produit</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                Fichier vidéo (3 Mo max)
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-2 block w-full text-xs"
                />
              </label>
              <button
                type="button"
                onClick={() => void uploadVideo()}
                disabled={!videoActive || busy || remaining <= 0}
                className="h-11 rounded-full bg-[#087e8b] px-5 text-xs font-black text-white disabled:opacity-50 hover:bg-[#066570]"
              >
                {busy ? "Envoi…" : "Associer la vidéo"}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
