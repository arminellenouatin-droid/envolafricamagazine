"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import MarketplaceProductForm from "@/components/marketplace/MarketplaceProductForm";
import type { SupplierRecord } from "@/lib/marketplace-slug";
import { generateStoreSlug } from "@/lib/marketplace-slug";

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
  media?: unknown;
  status?: string;
  is_boosted?: boolean;
  boost_ends_at?: string | null;
  product_type?: string;
  delivery_type?: string;
  product_video_url?: string | null;
  supplier_id?: string;
  description?: string | null;
  views_count?: number;
  product_affiliations?: ProductAffiliation[];
};

type Props = {
  supplier: SupplierRecord;
  initialProducts: Product[];
  isOwner: boolean;
  canManage: boolean;
  currentUser: { id: string; email?: string | null; name?: string | null; role?: string | null } | null;
  initialViewMode: "manage" | "public";
  otherStores: Array<{ id: string; business_name: string; slug: string }>;
};

type ManageTab = "catalogue" | "publish" | "affiliation" | "boost" | "analytics" | "settings";

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

export default function BoutiqueDetailClient({
  supplier: initialSupplier,
  initialProducts,
  isOwner,
  canManage,
  currentUser,
  initialViewMode,
  otherStores,
}: Props) {
  const [supplier, setSupplier] = useState<SupplierRecord>(initialSupplier);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [viewMode, setViewMode] = useState<"manage" | "public">(initialViewMode);
  const [tab, setTab] = useState<ManageTab>("catalogue");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");

  // URLs & Short Link
  const origin = typeof window !== "undefined" ? window.location.origin : "https://envolafrica.vercel.app";
  const canonicalSlug = supplier.slug || generateStoreSlug(supplier.business_name);
  const vendorSlug = supplier.vendor_slug || "vendeur";
  const storeUrl = `${origin}/marketplace/boutique/${vendorSlug}/${canonicalSlug}`;
  const shortUrl = `${origin}/b/${canonicalSlug}`;

  const [copied, setCopied] = useState(false);
  const [shortCopied, setShortCopied] = useState(false);
  const [showLinkBuilder, setShowLinkBuilder] = useState(false);
  const [linkBuilderProduct, setLinkBuilderProduct] = useState(products[0]?.id || "");
  const [linkBuilderType, setLinkBuilderType] = useState<"store" | "product" | "affiliate">("store");
  const [builderCopied, setBuilderCopied] = useState(false);

  // Settings form state
  const [businessName, setBusinessName] = useState(supplier.business_name || "");
  const [description, setDescription] = useState(supplier.description || "");
  const [countryCode, setCountryCode] = useState(supplier.country_code || "BJ");
  const [city, setCity] = useState(supplier.city || "");

  // Boost form state
  const [selectedBoostProductId, setSelectedBoostProductId] = useState(products[0]?.id || "");
  const [boostPlanDays, setBoostPlanDays] = useState(7);
  const [boostAmountXof, setBoostAmountXof] = useState(2500);

  // Affiliation tab state
  const [selectedAffiliateProductId, setSelectedAffiliateProductId] = useState(products[0]?.id || "");
  const [affiliateRate, setAffiliateRate] = useState(0.10);
  const [affiliateEnabled, setAffiliateEnabled] = useState(true);
  const [affiliateCopied, setAffiliateCopied] = useState<string | null>(null);

  // Analytics tab state
  const [analyticsData, setAnalyticsData] = useState<{
    totalViews: number;
    totalRevenueXof: number;
    escrowBalanceXof: number;
    pendingRevenueXof: number;
    totalOrders: number;
    completedOrdersCount: number;
    pendingOrdersCount: number;
    cancelledOrdersCount: number;
    cartDropRate: number;
    averageBasketXof: number;
    recentSales: Array<{
      id: string;
      total_xof: number;
      payment_mode: string;
      status: string;
      created_at: string;
      buyer_name: string;
      product_title: string;
      product_price: number;
    }>;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Certification state
  const [certifying, setCertifying] = useState(false);

  const { formatPrice } = useLocale();

  // Active product in Affiliation tab
  const activeAffiliateProduct = products.find((p) => p.id === selectedAffiliateProductId) || products[0] || null;

  useEffect(() => {
    if (activeAffiliateProduct) {
      const aff = activeAffiliateProduct.product_affiliations?.[0];
      if (aff) {
        setAffiliateEnabled(Boolean(aff.is_active));
        setAffiliateRate(aff.commission_rate || 0.10);
      } else {
        setAffiliateEnabled(false);
        setAffiliateRate(0.10);
      }
    }
  }, [selectedAffiliateProductId, products]);

  // Financial simulation for affiliation
  const activeProductPrice = activeAffiliateProduct?.price_xof || 0;
  const simCommission = Math.round(activeProductPrice * affiliateRate);
  const simPlatformFee = Math.round(simCommission * 0.05);
  const simNet = Math.max(0, activeProductPrice - simCommission);

  const shortAffiliateLink = activeAffiliateProduct
    ? `${shortUrl}?p=${activeAffiliateProduct.id}&ref=${supplier.user_id || currentUser?.id || "vendeur"}`
    : shortUrl;

  const activeAffiliatedProducts = products.filter((p) => p.product_affiliations?.[0]?.is_active);

  // Link builder computed URL
  const computedGeneratedLink = () => {
    if (linkBuilderType === "store") {
      return shortUrl;
    }
    const chosenProduct = products.find((p) => p.id === linkBuilderProduct) || products[0];
    if (!chosenProduct) return shortUrl;
    if (linkBuilderType === "product") {
      return `${shortUrl}?p=${chosenProduct.id}`;
    }
    return `${shortUrl}?p=${chosenProduct.id}&ref=${supplier.user_id || currentUser?.id || "vendeur"}`;
  };

  const copyGeneratedLink = async () => {
    try {
      await navigator.clipboard.writeText(computedGeneratedLink());
      setBuilderCopied(true);
      setTimeout(() => setBuilderCopied(false), 2500);
    } catch {}
  };

  const copyStoreLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const copyShortLink = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setShortCopied(true);
      setTimeout(() => setShortCopied(false), 2500);
    } catch {}
  };

  const refreshProducts = async () => {
    try {
      const res = await fetch(`/api/marketplace/products?supplierId=${encodeURIComponent(supplier.id)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      // ignore
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/marketplace/analytics?supplierId=${encodeURIComponent(supplier.id)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.stats) {
          setAnalyticsData(data.stats);
        }
      }
    } catch {
      // ignore
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "analytics" && canManage) {
      void loadAnalytics();
    }
  }, [tab, canManage, supplier.id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const requestedSection = params.get("section") || params.get("tab");
      if (requestedSection === "product" || requestedSection === "publish" || window.location.hash === "#publier") {
        setTab("publish");
      } else if (requestedSection === "affiliate" || requestedSection === "affiliation") {
        setTab("affiliation");
      } else if (requestedSection === "boost") {
        setTab("boost");
      } else if (requestedSection === "analytics") {
        setTab("analytics");
      } else if (requestedSection === "settings") {
        setTab("settings");
      }

      if (params.get("certification") === "success") {
        setMessage("Félicitations ! Votre paiement de 50 000 XOF pour la certification a été reçu avec succès. Votre dossier est en cours de validation finale par l'équipe administrative.");
        setSupplier((prev) => ({ ...prev, certification_status: "pending" }));
      }
    }
  }, []);

  const saveProductAffiliation = async (productId: string, enable: boolean, rate: number) => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/marketplace/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId,
          enableAffiliation: enable,
          affiliationRate: rate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'enregistrer l'affiliation.");

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          const updatedAff: ProductAffiliation = {
            id: p.product_affiliations?.[0]?.id || `aff-${Date.now()}`,
            commission_rate: rate,
            is_active: enable,
          };
          return {
            ...p,
            product_affiliations: [updatedAff],
          };
        })
      );
      setMessage(
        enable
          ? `✓ Affiliation activée à ${Math.round(rate * 100)}% de commission pour cet article.`
          : "✓ Affiliation désactivée pour cet article."
      );
    } catch (err: any) {
      setError(err.message || "Erreur lors de la configuration de l'affiliation.");
    } finally {
      setBusy(false);
    }
  };

  const updateProductStock = async (productId: string, stockQuantity: number) => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/marketplace/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, stockQuantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mise à jour impossible.");
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock_quantity: stockQuantity } : p)));
      setMessage("Stock mis à jour.");
    } catch (e: any) {
      setError(e.message || "Erreur de mise à jour.");
    } finally {
      setBusy(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/marketplace/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mise à jour impossible.");
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p)));
      setMessage(newStatus === "published" ? "Produit mis en ligne." : "Produit retiré (brouillon).");
    } catch (e: any) {
      setError(e.message || "Erreur de mise à jour.");
    } finally {
      setBusy(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet article de votre boutique ?")) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/marketplace/products?id=${encodeURIComponent(productId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Suppression impossible.");
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setMessage("Produit supprimé du catalogue.");
    } catch (e: any) {
      setError(e.message || "Erreur de suppression.");
    } finally {
      setBusy(false);
    }
  };

  const handleBoost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoostProductId) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/marketplace/boosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: selectedBoostProductId,
          supplierId: supplier.id,
          durationDays: boostPlanDays,
          amountXof: boostAmountXof,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'initier le paiement.");
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      } else {
        setMessage("Campagne de boost créée avec succès !");
      }
    } catch (e: any) {
      setError(e.message || "Erreur d'initialisation du boost.");
    } finally {
      setBusy(false);
    }
  };

  const handleRequestCertification = async () => {
    setCertifying(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/marketplace/certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ storeId: supplier.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'initialiser le paiement.");
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la demande de certification.");
      setCertifying(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/marketplace/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          storeId: supplier.id,
          businessName,
          description,
          countryCode,
          city,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'enregistrer.");
      if (data.supplier) {
        setSupplier(data.supplier);
        setMessage("Paramètres de la boutique mis à jour avec succès !");
      }
    } catch (e: any) {
      setError(e.message || "Erreur d'enregistrement.");
    } finally {
      setBusy(false);
    }
  };

  // Filter products in public view
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const filteredProducts = products.filter((p) => {
    if (viewMode === "public" && p.status !== "published") return false;
    const matchCat = catalogCategory === "all" || p.category === catalogCategory;
    const matchSearch =
      !catalogSearch ||
      p.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(catalogSearch.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top Banner for store owner / admin */}
      {canManage && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-amber-300">
              {isOwner ? "Espace Propriétaire de la Boutique" : "Espace Gestionnaire / Modérateur"} :
            </span>
            <span className="font-bold text-white uppercase">{supplier.business_name}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("manage")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  viewMode === "manage"
                    ? "bg-amber-500 text-slate-950 font-bold shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                ⚙️ Gestion Vendeur
              </button>
              <button
                type="button"
                onClick={() => setViewMode("public")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  viewMode === "public"
                    ? "bg-amber-500 text-slate-950 font-bold shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                👁️ Vitrine Publique
              </button>
            </div>

            {/* Other stores switcher */}
            {otherStores.length > 1 && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-slate-400 hidden sm:inline">Changer :</span>
                <select
                  aria-label="Basculer vers une autre de mes boutiques"
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1"
                  value={supplier.id}
                  onChange={(e) => {
                    const match = otherStores.find((s) => s.id === e.target.value);
                    if (match) {
                      window.location.assign(`/marketplace/boutique/${match.slug}`);
                    }
                  }}
                >
                  {otherStores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.business_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Link
              href={`/marketplace/boutique/${vendorSlug}`}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline ml-2"
            >
              ← Toutes mes boutiques
            </Link>
          </div>
        </div>
      )}

      {/* Main Header / Store Identity */}
      <div className="relative bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-extrabold text-2xl sm:text-3xl shadow-lg border-2 border-amber-400/30 shrink-0">
                {supplier.business_name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {supplier.business_name}
                  </h1>

                  {supplier.certification_status === "certified" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      ✓ Boutique Certifiée
                    </span>
                  ) : supplier.certification_status === "pending" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      ⏳ Examen certification en cours
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 border border-slate-600">
                      Boutique vérifiée
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-400">
                  <span>📍 {supplier.city ? `${supplier.city}, ` : ""}{countries.find((c) => c.code === supplier.country_code)?.label || supplier.country_code || "Afrique"}</span>
                  <span>•</span>
                  <span>📦 {products.length} produit{products.length > 1 ? "s" : ""}</span>
                  {Number(supplier.rating || 0) > 0 && (
                    <>
                      <span>•</span>
                      <span>⭐ {supplier.rating}/5</span>
                    </>
                  )}
                </div>

                {supplier.description && (
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl line-clamp-2">
                    {supplier.description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions: Shareable link box, Short link & Generator */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 shrink-0">
              {/* Canonical URL Copy */}
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs">
                <span className="text-slate-400 truncate max-w-[160px] sm:max-w-[190px]">
                  {storeUrl}
                </span>
                <button
                  type="button"
                  onClick={copyStoreLink}
                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold transition shrink-0"
                  title="Copier le lien complet de la boutique"
                >
                  {copied ? "✓ Copié !" : "📋 Copier"}
                </button>
              </div>

              {/* Short URL Box */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/15 to-amber-600/10 border border-amber-500/30 rounded-xl px-3 py-2 text-xs">
                <span className="flex items-center gap-1 font-bold text-amber-400 shrink-0">
                  ⚡ Lien court :
                </span>
                <span className="text-slate-200 font-mono truncate max-w-[140px] sm:max-w-[180px]">
                  {shortUrl}
                </span>
                <button
                  type="button"
                  onClick={copyShortLink}
                  className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shrink-0"
                  title="Copier le lien court universel de la boutique"
                >
                  {shortCopied ? "✓ Copié !" : "Copier"}
                </button>
              </div>

              {/* Toggle Short Link Builder */}
              <button
                type="button"
                onClick={() => setShowLinkBuilder(!showLinkBuilder)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  showLinkBuilder
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/30"
                }`}
              >
                <span>🔗</span>
                <span>Générateur de liens</span>
              </button>

              {!isOwner && (
                <Link
                  href={`/marketplace/messages?recipientId=${encodeURIComponent(supplier.user_id)}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold text-xs transition"
                >
                  💬 Contacter le vendeur
                </Link>
              )}
            </div>
          </div>

          {/* Interactive Short Link Generator Card */}
          {showLinkBuilder && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <h3 className="font-bold text-white text-sm">
                    Générateur Universel de Liens Courts & Affiliation
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLinkBuilder(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕ Fermer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Type de lien */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Type de lien à générer
                  </label>
                  <select
                    value={linkBuilderType}
                    onChange={(e) => setLinkBuilderType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="store">🏪 Boutique complète (/b/...)</option>
                    <option value="product">📦 Fiche Produit directe (?p=...)</option>
                    <option value="affiliate">🤝 Lien Affilié Ambassadeur (?p=...&ref=...)</option>
                  </select>
                </div>

                {/* Choix du produit si nécessaire */}
                {linkBuilderType !== "store" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Sélectionner le produit
                    </label>
                    <select
                      value={linkBuilderProduct}
                      onChange={(e) => setLinkBuilderProduct(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} • {formatPrice(p.price_xof || 0)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Résultat du lien généré */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                <div className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 truncate select-all">
                  {computedGeneratedLink()}
                </div>
                <button
                  type="button"
                  onClick={copyGeneratedLink}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shrink-0"
                >
                  {builderCopied ? "✓ Lien copié !" : "📋 Copier ce lien"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        {message && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
            <span>✓ {message}</span>
            <button onClick={() => setMessage("")} className="text-xs text-slate-400 hover:text-white">✕</button>
          </div>
        )}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")} className="text-xs text-slate-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* VIEW MODE: MANAGE (Vendor Workspace) */}
      {viewMode === "manage" && canManage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Certification Card Banner */}
          {supplier.certification_status !== "certified" && (
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
                  🛡️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-white text-sm">
                      {supplier.certification_status === "pending"
                        ? "Dossier de Certification en cours d'examen administratif"
                        : "Obtenez le Badge Officiel Vendeur Certifié (50 000 XOF / an)"}
                    </strong>
                    {supplier.certification_status === "pending" && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                        Paiement validé
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-5">
                    {supplier.certification_status === "pending"
                      ? "Votre paiement de 50 000 XOF a bien été enregistré. L'équipe d'administration Envol Africa examine actuellement votre dossier pour valider votre badge officiel."
                      : "Rassurez vos acheteurs avec le badge vérifié ✓, profitez d'une priorité d'affichage dans les rayons et débloquez les paiements échelonnés."}
                  </p>
                </div>
              </div>

              {supplier.certification_status !== "pending" && (
                <button
                  type="button"
                  disabled={certifying}
                  onClick={handleRequestCertification}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition shadow-md shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>🛡️</span>
                  {certifying ? "Initialisation..." : "Activer ma Certification • 50 000 XOF"}
                </button>
              )}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-px mb-8 scrollbar-none">
            <button
              onClick={() => setTab("catalogue")}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition whitespace-nowrap border-b-2 ${
                tab === "catalogue"
                  ? "border-amber-400 text-amber-400 bg-slate-800/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              📦 Catalogue ({products.length})
            </button>
            <button
              onClick={() => setTab("publish")}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition whitespace-nowrap border-b-2 ${
                tab === "publish"
                  ? "border-amber-400 text-amber-400 bg-slate-800/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              ➕ Ajouter un produit
            </button>
            <button
              onClick={() => setTab("affiliation")}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition whitespace-nowrap border-b-2 ${
                tab === "affiliation"
                  ? "border-amber-400 text-amber-400 bg-slate-800/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              🤝 Affiliation ({activeAffiliatedProducts.length})
            </button>
            <button
              onClick={() => setTab("boost")}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition whitespace-nowrap border-b-2 ${
                tab === "boost"
                  ? "border-amber-400 text-amber-400 bg-slate-800/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              🚀 Booster la boutique
            </button>
            <button
              onClick={() => setTab("analytics")}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition whitespace-nowrap border-b-2 ${
                tab === "analytics"
                  ? "border-amber-400 text-amber-400 bg-slate-800/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              📊 Statistiques & Ventes
            </button>
            <button
              onClick={() => setTab("settings")}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition whitespace-nowrap border-b-2 ${
                tab === "settings"
                  ? "border-amber-400 text-amber-400 bg-slate-800/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              ⚙️ Paramètres
            </button>
          </div>

          {/* TAB 1: CATALOGUE */}
          {tab === "catalogue" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Articles en vente</h2>
                  <p className="text-xs text-slate-400">
                    Gérez les stocks, le statut de visibilité et les prix de vos articles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab("publish")}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow shrink-0"
                >
                  + Ajouter un nouvel article
                </button>
              </div>

              {products.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-850 border border-slate-800 text-center">
                  <p className="text-sm text-slate-400 mb-3">
                    Vous n&apos;avez encore publié aucun produit dans cette boutique.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("publish")}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    + Créer mon premier produit
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl bg-slate-850 border border-slate-800 shadow">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                      <tr>
                        <th className="p-3">Article</th>
                        <th className="p-3">Catégorie</th>
                        <th className="p-3">Prix</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Affiliation</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {products.map((product) => {
                        const aff = product.product_affiliations?.[0];
                        const isAffActive = Boolean(aff?.is_active);

                        return (
                          <tr key={product.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 font-semibold text-white">
                              <Link
                                href={`/marketplace/produits/${product.id}`}
                                className="hover:text-amber-400 transition"
                                target="_blank"
                              >
                                {product.title} ↗
                              </Link>
                            </td>
                            <td className="p-3 text-slate-400">{product.category || "Général"}</td>
                            <td className="p-3 text-amber-400 font-bold">
                              {formatPrice(product.price_xof || 0)}
                            </td>
                            <td className="p-3">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={busy || (product.stock_quantity || 0) <= 0}
                                  onClick={() => updateProductStock(product.id, Math.max(0, (product.stock_quantity || 0) - 1))}
                                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center disabled:opacity-40"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-bold text-white">
                                  {product.stock_quantity || 0}
                                </span>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => updateProductStock(product.id, (product.stock_quantity || 0) + 1)}
                                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center disabled:opacity-40"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="p-3">
                              {isAffActive ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAffiliateProductId(product.id);
                                    setTab("affiliation");
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                                >
                                  🤝 {Math.round((aff?.commission_rate || 0.1) * 100)}%
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAffiliateProductId(product.id);
                                    setTab("affiliation");
                                  }}
                                  className="text-slate-500 hover:text-amber-400 text-xs underline"
                                >
                                  + Activer
                                </button>
                              )}
                            </td>
                            <td className="p-3">
                              {product.status === "published" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  En ligne
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-700 text-slate-300">
                                  Brouillon
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => toggleProductStatus(product.id, product.status || "draft")}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                                >
                                  {product.status === "published" ? "Mettre en brouillon" : "Publier"}
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => deleteProduct(product.id)}
                                  className="px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 text-xs font-medium transition"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PUBLISH NEW PRODUCT */}
          {tab === "publish" && (
            <div className="max-w-3xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">
                  Ajouter un produit dans {supplier.business_name}
                </h2>
                <p className="text-xs text-slate-400">
                  Ce produit sera automatiquement rattaché à votre boutique <strong>{supplier.business_name}</strong> et isolé des autres enseignes.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 shadow-xl">
                <MarketplaceProductForm
                  supplierId={supplier.id}
                  stores={[{ id: supplier.id, business_name: supplier.business_name }]}
                  onCreated={() => {
                    refreshProducts();
                    setTab("catalogue");
                    setMessage("Produit créé et publié avec succès dans " + supplier.business_name + " !");
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: AFFILIATION */}
          {tab === "affiliation" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    🤝 Programme d&apos;Affiliation de votre Boutique
                  </h2>
                  <p className="text-xs text-slate-400 max-w-2xl mt-1">
                    Rémunérez les ambassadeurs, influenceurs et apporteurs d&apos;affaires pour propulser vos ventes. Définissez librement votre taux de commission produit par produit.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-850 border border-slate-800 text-xs">
                    <span className="text-slate-400">Articles en affiliation : </span>
                    <strong className="text-amber-400">{activeAffiliatedProducts.length} / {products.length}</strong>
                  </div>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-850 border border-slate-800 text-center">
                  <p className="text-sm text-slate-400 mb-3">
                    Vous devez avoir au moins un produit publié dans votre catalogue pour le proposer en affiliation.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("publish")}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    + Ajouter un premier produit
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Formulaire de configuration du produit sélectionné */}
                  <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-6">
                    <h3 className="font-bold text-white text-base border-b border-slate-800 pb-3">
                      Configurer l&apos;affiliation d&apos;un article
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        1. Sélectionner le produit de la boutique
                      </label>
                      <select
                        value={selectedAffiliateProductId}
                        onChange={(e) => setSelectedAffiliateProductId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                      >
                        {products.map((p) => {
                          const isAff = Boolean(p.product_affiliations?.[0]?.is_active);
                          return (
                            <option key={p.id} value={p.id}>
                              {isAff ? "✓ [En affiliation] " : ""}
                              {p.title} • {formatPrice(p.price_xof || 0)}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Fiche récapitulative du produit */}
                    {activeAffiliateProduct && (
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {Array.isArray(activeAffiliateProduct.media) && typeof activeAffiliateProduct.media[0] === "string" ? (
                            <img
                              src={activeAffiliateProduct.media[0]}
                              alt={activeAffiliateProduct.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl">📦</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">
                            {activeAffiliateProduct.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span>Prix : <strong className="text-amber-400">{formatPrice(activeAffiliateProduct.price_xof || 0)}</strong></span>
                            <span>•</span>
                            <span>Stock : {activeAffiliateProduct.stock_quantity ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Toggle Activer / Désactiver */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <div>
                        <strong className="block text-sm text-white">Autoriser l&apos;affiliation sur ce produit</strong>
                        <span className="text-xs text-slate-400">
                          Les ambassadeurs pourront recommander cet article et toucher leur commission.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAffiliateEnabled(!affiliateEnabled)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                          affiliateEnabled ? "bg-amber-500 justify-end" : "bg-slate-700 justify-start"
                        }`}
                      >
                        <span className="bg-slate-950 w-4 h-4 rounded-full shadow-md" />
                      </button>
                    </div>

                    {/* Taux de commission */}
                    {affiliateEnabled && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-semibold text-slate-300">
                              2. Taux de commission ambassadeur
                            </label>
                            <span className="text-sm font-black text-amber-400">
                              {Math.round(affiliateRate * 100)}% du prix de vente
                            </span>
                          </div>

                          {/* Boutons rapides */}
                          <div className="grid grid-cols-5 gap-2 mb-3">
                            {[0.05, 0.10, 0.15, 0.20, 0.25].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setAffiliateRate(rate)}
                                className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                                  Math.abs(affiliateRate - rate) < 0.001
                                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow"
                                    : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600"
                                }`}
                              >
                                {Math.round(rate * 100)}%
                              </button>
                            ))}
                          </div>

                          {/* Slider */}
                          <input
                            type="range"
                            min="0.05"
                            max="0.50"
                            step="0.01"
                            value={affiliateRate}
                            onChange={(e) => setAffiliateRate(parseFloat(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>

                        {/* Simulation financière en direct */}
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Simulation par vente effectuée
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Prix client :</span>
                            <span>{formatPrice(activeProductPrice)}</span>
                          </div>
                          <div className="flex justify-between text-amber-400 font-semibold">
                            <span>Commission ambassadeur ({Math.round(affiliateRate * 100)}%) :</span>
                            <span>- {formatPrice(simCommission)}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Frais de service plateforme (5%) :</span>
                            <span>- {formatPrice(simPlatformFee)}</span>
                          </div>
                          <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-emerald-400 text-sm">
                            <span>Revenu net perçu par vous :</span>
                            <span>{formatPrice(simNet)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bouton d'enregistrement */}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (activeAffiliateProduct) {
                          saveProductAffiliation(activeAffiliateProduct.id, affiliateEnabled, affiliateRate);
                        }
                      }}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow disabled:opacity-50"
                    >
                      {busy ? "Enregistrement en cours..." : "Valider la configuration d'affiliation"}
                    </button>
                  </div>

                  {/* Panneau latéral : Lien court affilié & Partage */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-850 to-slate-900 border border-slate-800 shadow-xl space-y-4">
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        ⚡ Lien court d&apos;affiliation généré
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Ce lien court intègre le code de votre boutique et l&apos;identifiant de ce produit. Partagez-le directement avec vos partenaires.
                      </p>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 break-all select-all">
                        {shortAffiliateLink}
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(shortAffiliateLink);
                          setAffiliateCopied("selected");
                          setTimeout(() => setAffiliateCopied(null), 2500);
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                      >
                        {affiliateCopied === "selected" ? "✓ Lien affilié copié !" : "📋 Copier le lien court affilié"}
                      </button>
                    </div>

                    {/* Liste des produits déjà en affiliation */}
                    <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
                      <h3 className="font-bold text-white text-sm">
                        Articles actifs en affiliation ({activeAffiliatedProducts.length})
                      </h3>

                      {activeAffiliatedProducts.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Aucun produit n&apos;a encore été activé en affiliation. Activez-en un avec le formulaire ci-contre.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {activeAffiliatedProducts.map((p) => {
                            const rate = p.product_affiliations?.[0]?.commission_rate || 0.10;
                            const itemShortLink = `${shortUrl}?p=${p.id}&ref=${supplier.user_id || currentUser?.id || "vendeur"}`;

                            return (
                              <div
                                key={p.id}
                                className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="min-w-0">
                                  <div className="font-bold text-white truncate">{p.title}</div>
                                  <div className="text-slate-400 text-[11px] mt-0.5">
                                    Taux : <strong className="text-amber-400">{Math.round(rate * 100)}%</strong> • {formatPrice(p.price_xof || 0)}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(itemShortLink);
                                    setAffiliateCopied(p.id);
                                    setTimeout(() => setAffiliateCopied(null), 2500);
                                  }}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-[11px] shrink-0 border border-slate-700"
                                >
                                  {affiliateCopied === p.id ? "✓ Copié" : "Copier lien"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BOOST STORE */}
          {tab === "boost" && (
            <div className="max-w-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Mettre en avant un produit</h2>
                <p className="text-xs text-slate-400">
                  Apparaissez en tête du catalogue Marketplace et augmentez vos commandes avec le badge vérifié sponsorisé.
                </p>
              </div>

              {products.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-850 border border-slate-700/60 text-center">
                  <p className="text-sm text-slate-400 mb-4">
                    Vous devez avoir au moins un produit pour activer une campagne de mise en avant.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("publish")}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    + Créer un produit d&apos;abord
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBoost} className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sélectionnez le produit à booster
                    </label>
                    <select
                      value={selectedBoostProductId}
                      onChange={(e) => setSelectedBoostProductId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                      required
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({formatPrice(p.price_xof || 0)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Durée du pack de visibilité
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { days: 7, price: 2500, label: "7 Jours" },
                        { days: 14, price: 4500, label: "14 Jours" },
                        { days: 30, price: 9000, label: "30 Jours" },
                      ].map((plan) => (
                        <button
                          key={plan.days}
                          type="button"
                          onClick={() => {
                            setBoostPlanDays(plan.days);
                            setBoostAmountXof(plan.price);
                          }}
                          className={`p-3 rounded-xl border text-center transition ${
                            boostPlanDays === plan.days
                              ? "bg-amber-500/10 border-amber-400 text-amber-300 font-bold"
                              : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <div className="text-sm font-bold">{plan.label}</div>
                          <div className="text-xs text-amber-400 mt-1">{formatPrice(plan.price)}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg mt-4 disabled:opacity-50"
                  >
                    {busy ? "Préparation du paiement..." : `Activer le boost • ${formatPrice(boostAmountXof)}`}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 5: ANALYTICS & ORDERS */}
          {tab === "analytics" && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    📊 Tableau de Bord Statistiques & Ventes
                  </h2>
                  <p className="text-xs text-slate-400">
                    Suivi en temps réel des consultations, abandons de paniers, chiffre d&apos;affaires et commandes sous séquestre.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={analyticsLoading}
                  onClick={loadAnalytics}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition shrink-0 flex items-center gap-1.5"
                >
                  <span>🔄</span> {analyticsLoading ? "Actualisation..." : "Actualiser les données"}
                </button>
              </div>

              {/* Cartes KPI Principales */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">👁️ Visites & Vues</span>
                  <strong className="text-2xl font-black text-white block">
                    {analyticsData?.totalViews ?? 0}
                  </strong>
                  <span className="text-[11px] text-slate-500">Consultations boutique & produits</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">🛒 Abandons de Panier</span>
                  <strong className={`text-2xl font-black block ${
                    (analyticsData?.cartDropRate ?? 0) > 50 ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {analyticsData?.cartDropRate ?? 0}%
                  </strong>
                  <span className="text-[11px] text-slate-500">{analyticsData?.pendingOrdersCount ?? 0} panier(s) en suspens</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">💰 Chiffre d&apos;affaires</span>
                  <strong className="text-2xl font-black text-amber-400 block">
                    {formatPrice(analyticsData?.totalRevenueXof ?? 0)}
                  </strong>
                  <span className="text-[11px] text-slate-500">{analyticsData?.completedOrdersCount ?? 0} commande(s) réglée(s)</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">🔒 Sous Séquestre</span>
                  <strong className="text-2xl font-black text-emerald-400 block">
                    {formatPrice(analyticsData?.escrowBalanceXof ?? 0)}
                  </strong>
                  <span className="text-[11px] text-slate-500">Sécurisé jusqu&apos;à livraison</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 col-span-2 md:col-span-1">
                  <span className="text-xs text-slate-400 block mb-1">📦 Commandes</span>
                  <strong className="text-2xl font-black text-white block">
                    {analyticsData?.totalOrders ?? 0}
                  </strong>
                  <span className="text-[11px] text-slate-500">Panier moyen : {formatPrice(analyticsData?.averageBasketXof ?? 0)}</span>
                </div>
              </div>

              {/* Historique des Commandes */}
              <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">
                    Commandes récentes de la boutique
                  </h3>
                  <Link
                    href="/marketplace/commandes"
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline"
                  >
                    Toutes les expéditions →
                  </Link>
                </div>

                {(!analyticsData?.recentSales || analyticsData.recentSales.length === 0) ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <span className="text-3xl block mb-2">📦</span>
                    Aucune commande enregistrée pour l&apos;instant dans cette boutique.<br />
                    Partagez votre lien court et mettez des articles en affiliation pour générer vos premières ventes !
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-700/60 text-slate-400">
                          <th className="p-3">Réf / Date</th>
                          <th className="p-3">Produit</th>
                          <th className="p-3">Acheteur</th>
                          <th className="p-3">Montant</th>
                          <th className="p-3">Mode</th>
                          <th className="p-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {analyticsData.recentSales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-slate-800/40">
                            <td className="p-3 font-mono">
                              <span className="text-amber-400">{sale.id.slice(0, 8)}...</span>
                              <span className="block text-[11px] text-slate-500">
                                {new Date(sale.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-white max-w-[180px] truncate">
                              {sale.product_title}
                            </td>
                            <td className="p-3 text-slate-400">
                              {sale.buyer_name}
                            </td>
                            <td className="p-3 font-bold text-amber-400">
                              {formatPrice(sale.total_xof)}
                            </td>
                            <td className="p-3">
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-[11px]">
                                {sale.payment_mode === "installment" ? "Échelonné" : "Comptant"}
                              </span>
                            </td>
                            <td className="p-3">
                              {["paid", "received", "completed"].includes(sale.status) ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  ✓ {sale.status === "received" ? "Livré & Encaissé" : "Payé"}
                                </span>
                              ) : sale.status === "shipped" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                  Expédié (Sous séquestre)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  En attente
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {tab === "settings" && (
            <div className="max-w-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Paramètres de la boutique</h2>
                <p className="text-xs text-slate-400">
                  Modifiez les coordonnées, la description et les préférences de votre enseigne.
                </p>
              </div>

              <form onSubmit={saveSettings} className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nom commercial de la boutique
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Description / Bio de la boutique
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    placeholder="Présentez votre expertise, vos types de produits ou services..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Pays
                    </label>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: Cotonou, Abidjan..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow disabled:opacity-50"
                  >
                    {busy ? "Enregistrement..." : "Enregistrer les modifications"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE: PUBLIC STOREFRONT (Vitrine Acheteur) */}
      {(viewMode === "public" || !canManage) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Public Store Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Articles en vitrine</h2>
              <p className="text-xs text-slate-400">
                Explorez le catalogue de {supplier.business_name}. Commandes sécurisées avec protection séquestre.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Rechercher dans cette boutique..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-400 w-full sm:w-64"
              />

              {categories.length > 0 && (
                <select
                  value={catalogCategory}
                  onChange={(e) => setCatalogCategory(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200"
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-850/60 border border-slate-800 my-8">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-3xl mx-auto mb-4 text-slate-400">
                🏪
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Aucun produit disponible pour le moment
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                {supplier.business_name} prépare actuellement son catalogue de vente. Revenez très bientôt ou contactez directement le vendeur pour toute commande sur mesure.
              </p>
              {!isOwner && (
                <Link
                  href={`/marketplace/messages?recipientId=${encodeURIComponent(supplier.user_id)}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
                >
                  💬 Envoyer un message à {supplier.business_name}
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((p) => {
                const img = Array.isArray(p.media) && typeof p.media[0] === "string" ? p.media[0] : null;
                const isAff = Boolean(p.product_affiliations?.[0]?.is_active);

                return (
                  <div
                    key={p.id}
                    className="group flex flex-col justify-between rounded-2xl bg-slate-850 border border-slate-800 hover:border-amber-500/50 transition overflow-hidden shadow-lg"
                  >
                    <div>
                      {/* Thumbnail */}
                      <div className="relative aspect-square bg-slate-800 overflow-hidden">
                        {img ? (
                          <img
                            src={img}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl text-slate-600">
                            📦
                          </div>
                        )}

                        {p.is_boosted && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow">
                            ⭐ Vedette
                          </span>
                        )}

                        {isAff && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500 text-white shadow">
                            🤝 Affiliation
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          {p.category || "Article"}
                        </span>
                        <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-amber-400 transition mb-2">
                          {p.title}
                        </h3>
                        <div className="text-amber-400 font-extrabold text-base">
                          {formatPrice(p.price_xof || 0)}
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="p-4 pt-0">
                      <Link
                        href={`/marketplace/produits/${p.id}`}
                        className="block w-full py-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs text-center transition"
                      >
                        Voir le produit →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
