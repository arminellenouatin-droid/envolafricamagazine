"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import MarketplaceProductForm from "@/components/marketplace/MarketplaceProductForm";
import type { SupplierRecord } from "@/lib/marketplace-slug";
import { generateStoreSlug } from "@/lib/marketplace-slug";

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

type ManageTab = "catalogue" | "publish" | "boost" | "settings";

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
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");

  // Settings form state
  const [businessName, setBusinessName] = useState(supplier.business_name || "");
  const [description, setDescription] = useState(supplier.description || "");
  const [countryCode, setCountryCode] = useState(supplier.country_code || "BJ");
  const [city, setCity] = useState(supplier.city || "");
  const [callAvailable, setCallAvailable] = useState(Boolean(supplier.call_available));

  // Boost form state
  const [selectedBoostProductId, setSelectedBoostProductId] = useState(products[0]?.id || "");
  const [boostPlanDays, setBoostPlanDays] = useState(7);
  const [boostAmountXof, setBoostAmountXof] = useState(2500);

  const { formatPrice } = useLocale();
  const canonicalSlug = supplier.slug || generateStoreSlug(supplier.business_name);
  const vendorSlug = supplier.vendor_slug || "vendeur";
  const storeUrl = typeof window !== "undefined" ? `${window.location.origin}/marketplace/boutique/${vendorSlug}/${canonicalSlug}` : `https://envolafrica.vercel.app/marketplace/boutique/${vendorSlug}/${canonicalSlug}`;

  const copyStoreLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
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
      setMessage(`Produit ${newStatus === "published" ? "mis en ligne" : "placé en brouillon"}.`);
    } catch (e: any) {
      setError(e.message || "Erreur de mise à jour.");
    } finally {
      setBusy(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce produit ?")) return;
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
      setMessage("Produit supprimé.");
    } catch (e: any) {
      setError(e.message || "Erreur lors de la suppression.");
    } finally {
      setBusy(false);
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
      if (!res.ok) throw new Error(data.error || "Mise à jour de la boutique impossible.");
      if (data.supplier) {
        setSupplier(data.supplier);
      }
      setMessage("Informations de la boutique enregistrées avec succès !");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  };

  const handleBoost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoostProductId) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/marketplace/boosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: selectedBoostProductId,
          durationDays: boostPlanDays,
          amountXof: boostAmountXof,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'initier le boost.");
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setMessage("Demande de visibilité initiée.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur boost.");
    } finally {
      setBusy(false);
    }
  };

  // Filter products for catalog
  const filteredProducts = products.filter((p) => {
    const matchesSearch = !catalogSearch || p.title.toLowerCase().includes(catalogSearch.toLowerCase()) || (p.description || "").toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesCat = catalogCategory === "all" || p.category === catalogCategory;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];

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
                      window.location.href = `/marketplace/boutique/${match.slug}`;
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
              href="/marketplace/boutique"
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Vérification en cours
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

            {/* Actions: Shareable link box & Contact */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs">
                <span className="text-slate-400 truncate max-w-[190px] sm:max-w-[240px]">
                  {storeUrl}
                </span>
                <button
                  type="button"
                  onClick={copyStoreLink}
                  className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shrink-0"
                >
                  {copied ? "✓ Copié !" : "📋 Copier"}
                </button>
              </div>

              {!isOwner && (
                <Link
                  href={`/marketplace/messages?recipientId=${encodeURIComponent(supplier.user_id)}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold text-xs sm:text-sm transition"
                >
                  💬 Contacter le vendeur
                </Link>
              )}
            </div>
          </div>
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
              onClick={() => setTab("settings")}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition whitespace-nowrap border-b-2 ${
                tab === "settings"
                  ? "border-amber-400 text-amber-400 bg-slate-800/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              ⚙️ Paramètres de la boutique
            </button>
          </div>

          {/* TAB 1: CATALOGUE */}
          {tab === "catalogue" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Produits de {supplier.business_name}</h2>
                  <p className="text-xs text-slate-400">
                    Gérez vos articles, prix, stocks et visibilité en ligne pour cette boutique exclusivement.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab("publish")}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition self-start sm:self-auto"
                >
                  + Ajouter un nouveau produit
                </button>
              </div>

              {products.length === 0 ? (
                <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-800/40 border border-slate-700/60 my-6">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-3xl mx-auto mb-4">
                    🛍️
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Votre boutique {supplier.business_name} n&apos;a aucun produit pour l&apos;instant
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                    Aucun produit d&apos;autres comptes ou boutiques ne vient polluer votre vitrine. Ajoutez votre premier article pour commencer à vendre.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("publish")}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg"
                  >
                    + Publier mon premier article dans {supplier.business_name}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-850/60 shadow">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                      <tr>
                        <th className="p-3">Article</th>
                        <th className="p-3">Catégorie</th>
                        <th className="p-3">Prix</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {products.map((product) => (
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
                      ))}
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

          {/* TAB 3: BOOST STORE */}
          {tab === "boost" && (
            <div className="max-w-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Mettre en avant un produit</h2>
                <p className="text-xs text-slate-400">
                  Apparaissez en tête du catalogue Marketplace et augmentez vos commandes avec le badge vérifié sponsorisé.
                </p>
              </div>

              {products.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center">
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

          {/* TAB 4: SETTINGS */}
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
                return (
                  <div
                    key={p.id}
                    className="group bg-slate-850 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition overflow-hidden shadow-lg flex flex-col"
                  >
                    <Link href={`/marketplace/produits/${p.id}`} className="block relative aspect-square bg-slate-800 overflow-hidden">
                      {img ? (
                        <img
                          src={img}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-3xl">
                          🛍️
                        </div>
                      )}
                      {p.is_boosted && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow">
                          ★ RECOMMANDÉ
                        </span>
                      )}
                    </Link>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide mb-1">
                          {p.category || "Produit"}
                        </div>
                        <Link
                          href={`/marketplace/produits/${p.id}`}
                          className="font-bold text-white text-sm hover:text-amber-300 transition line-clamp-2 mb-2"
                        >
                          {p.title}
                        </Link>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-base font-extrabold text-amber-400">
                          {formatPrice(p.price_xof || 0)}
                        </div>
                        <Link
                          href={`/marketplace/produits/${p.id}`}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                        >
                          Commander
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Buyer Trust Guarantees */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-800">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-850/50 border border-slate-800">
              <span className="text-2xl">🛡️</span>
              <div>
                <h4 className="font-bold text-sm text-white">Séquestre Envol Africa</h4>
                <p className="text-xs text-slate-400 mt-0.5">Vos fonds sont protégés jusqu&apos;à la réception conforme de votre commande.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-850/50 border border-slate-800">
              <span className="text-2xl">📱</span>
              <div>
                <h4 className="font-bold text-sm text-white">Paiement Mobile Money</h4>
                <p className="text-xs text-slate-400 mt-0.5">MTN, Moov, Orange, Wave et cartes bancaires acceptés sans intermédiaire risqué.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-850/50 border border-slate-800">
              <span className="text-2xl">🤝</span>
              <div>
                <h4 className="font-bold text-sm text-white">Médiation & Litiges</h4>
                <p className="text-xs text-slate-400 mt-0.5">En cas de différend avec le vendeur, l&apos;arbitrage Envol Africa garantit le remboursement.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
