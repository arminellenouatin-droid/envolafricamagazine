"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";

type Supplier = {
  id: string;
  user_id: string;
  business_name: string;
  description?: string | null;
  country_code?: string | null;
  city?: string | null;
  logo_url?: string | null;
  certification_status: string;
  rating: number;
  products_count: number;
  published_count: number;
  owner?: { email?: string; nom?: string; prenom?: string } | null;
  created_at: string;
};

type Product = {
  id: string;
  supplier_id: string;
  supplier_name: string;
  title: string;
  slug: string;
  category: string;
  price_xof: number;
  stock_quantity: number;
  status: string;
  product_type?: string;
  delivery_type?: string;
  is_boosted: boolean;
  views_count: number;
  media?: any;
  created_at: string;
};

type Order = {
  id: string;
  product_id: string;
  product_title: string;
  supplier_id: string;
  supplier_name: string;
  buyer_id: string;
  buyer?: { email?: string; nom?: string; prenom?: string } | null;
  total_xof: number;
  payment_mode: string;
  status: string;
  received_at?: string | null;
  provider_payment_id?: string | null;
  created_at: string;
};

type Boost = {
  id: string;
  product_id: string;
  supplier_id: string;
  amount_xof: number;
  duration_days: number;
  status: string;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
};

type AdminKpis = {
  totalSuppliers: number;
  certifiedSuppliers: number;
  pendingCertifications: number;
  totalProducts: number;
  publishedProducts: number;
  pendingReviewProducts: number;
  totalOrders: number;
  disputedOrders: number;
  totalVolumeXof: number;
  escrowLockedXof: number;
  totalBoostsRevenueXof: number;
};

type TabType = "suppliers" | "products" | "orders" | "disputes" | "boosts";

const formatXof = (val: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(val || 0);

export default function MarketplaceAdminClient({ initialTab = "suppliers" }: { initialTab?: TabType }) {
  const [tab, setTab] = useState<TabType>(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [boosts, setBoosts] = useState<Boost[]>([]);

  // Search & Filter state
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierStatusFilter, setSupplierStatusFilter] = useState("all");

  const [productSearch, setProductSearch] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState("all");

  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  const [, startTransition] = useTransition();

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/marketplace", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger les données Marketplace.");
      setKpis(data.kpis || null);
      setSuppliers(data.suppliers || []);
      setProducts(data.products || []);
      setOrders(data.orders || []);
      setBoosts(data.boosts || []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const switchTab = (newTab: TabType) => {
    startTransition(() => {
      setTab(newTab);
      setError("");
      setSuccess("");
    });
  };

  // Actions
  const updateSupplierStatus = async (supplierId: string, newStatus: string) => {
    setBusyId(supplierId);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_supplier_status",
          targetId: supplierId,
          status: newStatus,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Mise à jour impossible");
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplierId ? { ...s, certification_status: newStatus } : s))
      );
      setSuccess("Statut de certification mis à jour avec succès.");
    } catch (err: any) {
      setError(err.message || "Erreur de mise à jour.");
    } finally {
      setBusyId(null);
    }
  };

  const updateProductStatus = async (productId: string, newStatus: string) => {
    setBusyId(productId);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_product_status",
          targetId: productId,
          status: newStatus,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Mise à jour impossible");
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
      );
      setSuccess("Statut du produit mis à jour.");
    } catch (err: any) {
      setError(err.message || "Erreur de mise à jour.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer définitivement ce produit du catalogue ?")) return;
    setBusyId(productId);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "delete_product",
          targetId: productId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Suppression impossible");
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setSuccess("Produit supprimé du catalogue.");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression.");
    } finally {
      setBusyId(null);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setBusyId(orderId);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_order_status",
          targetId: orderId,
          status: newStatus,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Mise à jour impossible");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setSuccess(`Statut de la commande mis à jour : ${newStatus}.`);
    } catch (err: any) {
      setError(err.message || "Erreur de mise à jour.");
    } finally {
      setBusyId(null);
    }
  };

  // Filtered lists
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      supplierSearch === "" ||
      s.business_name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(supplierSearch.toLowerCase())) ||
      (s.owner?.email && s.owner.email.toLowerCase().includes(supplierSearch.toLowerCase())) ||
      (s.owner?.nom && s.owner.nom.toLowerCase().includes(supplierSearch.toLowerCase()));

    const matchesStatus =
      supplierStatusFilter === "all" || s.certification_status === supplierStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      productSearch === "" ||
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.supplier_name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()));

    const matchesStatus = productStatusFilter === "all" || p.status === productStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredOrders = orders.filter((o) => {
    return orderStatusFilter === "all" || o.status === orderStatusFilter;
  });

  const disputedOrders = orders.filter((o) => o.status === "disputed");

  return (
    <div className="space-y-6">
      {/* Messages */}
      {success && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess("")} className="font-bold hover:underline">✕</button>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-300 bg-red-50 p-4 text-xs font-semibold text-red-800">
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")} className="font-bold hover:underline">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Boutiques</span>
          <strong className="mt-1 block text-2xl font-black text-[#0A1931]">
            {kpis?.totalSuppliers ?? suppliers.length}
          </strong>
          <span className="text-[11px] text-emerald-700 font-bold">
            {kpis?.certifiedSuppliers ?? 0} certifiée(s)
          </span>
        </div>

        <div className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">À certifier</span>
          <strong className="mt-1 block text-2xl font-black text-[#a36300]">
            {kpis?.pendingCertifications ?? 0}
          </strong>
          <span className="text-[11px] text-zinc-500">Demande(s) en attente</span>
        </div>

        <div className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Produits</span>
          <strong className="mt-1 block text-2xl font-black text-[#0A1931]">
            {kpis?.totalProducts ?? products.length}
          </strong>
          <span className="text-[11px] text-zinc-500">
            {kpis?.publishedProducts ?? 0} en ligne
          </span>
        </div>

        <div className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Commandes</span>
          <strong className="mt-1 block text-2xl font-black text-[#0A1931]">
            {kpis?.totalOrders ?? orders.length}
          </strong>
          <span className="text-[11px] text-zinc-500">Toutes transactions</span>
        </div>

        <div className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Volume Ventes</span>
          <strong className="mt-1 block text-xl font-black text-[#9e001f]">
            {formatXof(kpis?.totalVolumeXof ?? 0)}
          </strong>
          <span className="text-[11px] text-zinc-500">Total payé</span>
        </div>

        <div className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Séquestre bloqué</span>
          <strong className="mt-1 block text-xl font-black text-[#087e8b]">
            {formatXof(kpis?.escrowLockedXof ?? 0)}
          </strong>
          <span className="text-[11px] text-zinc-500">Fonds protégés</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-2">
        <div className="flex overflow-x-auto gap-2 no-scrollbar">
          {[
            { id: "suppliers", label: `Vendeurs & Boutiques (${suppliers.length})`, icon: "🏪" },
            { id: "products", label: `Produits & Modération (${products.length})`, icon: "📦" },
            { id: "orders", label: `Commandes & Séquestre (${orders.length})`, icon: "💳" },
            { id: "disputes", label: `Litiges (${disputedOrders.length})`, icon: "⚖️" },
            { id: "boosts", label: `Boosts & Visibilité (${boosts.length})`, icon: "🚀" },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id as TabType)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-black transition-all ${
                  active
                    ? "bg-[#0A1931] text-white shadow-sm"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition"
        >
          {loading ? "Chargement…" : "↻ Actualiser"}
        </button>
      </div>

      {/* ============================================================ */}
      {/* 1. ONGLET : VENDEURS & BOUTIQUES */}
      {/* ============================================================ */}
      {tab === "suppliers" && (
        <section className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-black text-[#0A1931]">
                Toutes les boutiques et vendeurs de la plateforme
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Consultez les informations de chaque enseigne, son propriétaire, son nombre de produits et attribuez la certification officielle.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Rechercher boutique, vendeur, ville..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="h-9 rounded-full border border-zinc-200 px-3 text-xs outline-none focus:border-[#9e001f] w-56"
              />
              <select
                value={supplierStatusFilter}
                onChange={(e) => setSupplierStatusFilter(e.target.value)}
                className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-xs font-bold"
              >
                <option value="all">Tous les statuts</option>
                <option value="certified">✓ Certifié</option>
                <option value="pending">⏳ En attente</option>
                <option value="unverified">Non certifié</option>
                <option value="rejected">Rejeté / Suspendu</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="py-12 text-center text-xs text-zinc-400">Chargement des boutiques…</p>
          ) : filteredSuppliers.length === 0 ? (
            <p className="py-12 text-center text-xs text-zinc-500">Aucune boutique ne correspond aux critères.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-xs">
                <thead className="border-b border-zinc-100 uppercase text-[10px] font-black text-zinc-400">
                  <tr>
                    <th className="pb-3">Boutique</th>
                    <th className="pb-3">Vendeur / Propriétaire</th>
                    <th className="pb-3">Localisation</th>
                    <th className="pb-3 text-center">Produits</th>
                    <th className="pb-3">Certification</th>
                    <th className="pb-3 text-right">Actions de modération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredSuppliers.map((s) => {
                    const isCertified = s.certification_status === "certified";
                    const isPending = s.certification_status === "pending";
                    const isRejected = s.certification_status === "rejected";

                    return (
                      <tr key={s.id} className="hover:bg-zinc-50/75 transition">
                        <td className="py-3.5 pr-3">
                          <strong className="block text-sm font-black text-[#0A1931]">
                            {s.business_name}
                          </strong>
                          <span className="text-[11px] text-zinc-500 line-clamp-1 max-w-xs">
                            {s.description || "Aucune description"}
                          </span>
                        </td>

                        <td className="py-3.5 pr-3">
                          <strong className="block text-zinc-800">
                            {s.owner?.prenom || s.owner?.nom
                              ? `${s.owner?.prenom || ""} ${s.owner?.nom || ""}`.trim()
                              : "Utilisateur enregistré"}
                          </strong>
                          <span className="text-[11px] text-zinc-400">{s.owner?.email || "Email non renseigné"}</span>
                        </td>

                        <td className="py-3.5 pr-3 text-zinc-600">
                          {s.city ? `${s.city}, ` : ""}{s.country_code || "Afrique"}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="font-bold text-[#0A1931]">{s.products_count}</span>
                          <span className="text-[10px] text-zinc-400 block">({s.published_count} en ligne)</span>
                        </td>

                        <td className="py-3.5 pr-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                              isCertified
                                ? "bg-emerald-100 text-emerald-800"
                                : isPending
                                ? "bg-amber-100 text-amber-800"
                                : isRejected
                                ? "bg-red-100 text-red-800"
                                : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {isCertified ? "✓ Certifiée" : isPending ? "⏳ En attente" : isRejected ? "✕ Rejetée" : "Non certifiée"}
                          </span>
                        </td>

                        <td className="py-3.5 text-right space-x-1">
                          <select
                            disabled={busyId === s.id}
                            value={s.certification_status}
                            onChange={(e) => void updateSupplierStatus(s.id, e.target.value)}
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-bold outline-none cursor-pointer"
                          >
                            <option value="certified">Certifier</option>
                            <option value="pending">En attente</option>
                            <option value="unverified">Non certifié</option>
                            <option value="rejected">Rejeter / Suspendre</option>
                          </select>

                          <Link
                            href={`/marketplace?fournisseur=${encodeURIComponent(s.business_name)}`}
                            target="_blank"
                            className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-bold text-zinc-600 hover:bg-zinc-100"
                          >
                            Vitrine ↗
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* 2. ONGLET : PRODUITS & MODÉRATION */}
      {/* ============================================================ */}
      {tab === "products" && (
        <section className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-black text-[#0A1931]">
                Tous les produits mis en vente par les boutiques
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Vérifiez la conformité des offres, examinez les prix et désactivez ou supprimez les articles non conformes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Rechercher produit, boutique..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="h-9 rounded-full border border-zinc-200 px-3 text-xs outline-none focus:border-[#9e001f] w-56"
              />
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value)}
                className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-xs font-bold"
              >
                <option value="all">Tous les statuts</option>
                <option value="published">✓ En ligne</option>
                <option value="pending_review">⏳ En révision</option>
                <option value="draft">Brouillon</option>
                <option value="paused">En pause</option>
                <option value="archived">Archivé</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="py-12 text-center text-xs text-zinc-400">Chargement des produits…</p>
          ) : filteredProducts.length === 0 ? (
            <p className="py-12 text-center text-xs text-zinc-500">Aucun produit trouvé.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-xs">
                <thead className="border-b border-zinc-100 uppercase text-[10px] font-black text-zinc-400">
                  <tr>
                    <th className="pb-3">Article</th>
                    <th className="pb-3">Boutique</th>
                    <th className="pb-3">Prix</th>
                    <th className="pb-3">Stock</th>
                    <th className="pb-3">Statut</th>
                    <th className="pb-3 text-right">Modération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredProducts.map((p) => {
                    const isPublished = p.status === "published";
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/75 transition">
                        <td className="py-3.5 pr-3">
                          <strong className="block text-sm font-black text-[#0A1931]">
                            {p.title}
                          </strong>
                          <span className="text-[11px] text-zinc-400">
                            {p.category} {p.product_type ? `· ${p.product_type}` : ""}
                            {p.is_boosted && <span className="ml-2 text-amber-600 font-bold">⚡ Boosté</span>}
                          </span>
                        </td>

                        <td className="py-3.5 pr-3">
                          <span className="font-bold text-zinc-700">{p.supplier_name}</span>
                        </td>

                        <td className="py-3.5 pr-3 font-bold text-[#9e001f]">
                          {formatXof(p.price_xof)}
                        </td>

                        <td className="py-3.5 pr-3 text-zinc-600 font-medium">
                          {p.stock_quantity ?? "—"}
                        </td>

                        <td className="py-3.5 pr-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              isPublished
                                ? "bg-emerald-100 text-emerald-800"
                                : p.status === "pending_review"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {isPublished ? "En ligne" : p.status}
                          </span>
                        </td>

                        <td className="py-3.5 text-right space-x-1">
                          <select
                            disabled={busyId === p.id}
                            value={p.status}
                            onChange={(e) => void updateProductStatus(p.id, e.target.value)}
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-bold outline-none cursor-pointer"
                          >
                            <option value="published">Mettre en ligne</option>
                            <option value="draft">Brouillon</option>
                            <option value="pending_review">En révision</option>
                            <option value="archived">Archiver</option>
                          </select>

                          <Link
                            href={`/marketplace/produits/${p.id}`}
                            target="_blank"
                            className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-bold text-zinc-600 hover:bg-zinc-100"
                          >
                            Fiche ↗
                          </Link>

                          <button
                            type="button"
                            onClick={() => void deleteProduct(p.id)}
                            disabled={busyId === p.id}
                            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100"
                            title="Supprimer définitivement"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* 3. ONGLET : COMMANDES & SÉQUESTRE */}
      {/* ============================================================ */}
      {tab === "orders" && (
        <section className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-black text-[#0A1931]">
                Commandes clients & Gestion du Séquestre
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Suivez les paiements encaissés, débloquez les fonds après livraison ou gérez les remboursements en cas d&apos;annulation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-xs font-bold"
              >
                <option value="all">Tous les statuts</option>
                <option value="paid">Fonds bloqués (Séquestre)</option>
                <option value="shipped">Expédié</option>
                <option value="received">Livré / Fonds libérés</option>
                <option value="disputed">En litige</option>
                <option value="pending_payment">En attente de paiement</option>
                <option value="cancelled">Annulé / Remboursé</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="py-12 text-center text-xs text-zinc-400">Chargement des commandes…</p>
          ) : filteredOrders.length === 0 ? (
            <p className="py-12 text-center text-xs text-zinc-500">Aucune commande enregistrée.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-xs">
                <thead className="border-b border-zinc-100 uppercase text-[10px] font-black text-zinc-400">
                  <tr>
                    <th className="pb-3">Commande</th>
                    <th className="pb-3">Boutique & Vendeur</th>
                    <th className="pb-3">Acheteur</th>
                    <th className="pb-3">Montant XOF</th>
                    <th className="pb-3">Statut Séquestre</th>
                    <th className="pb-3 text-right">Action Administrateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50/75 transition">
                      <td className="py-3.5 pr-3">
                        <strong className="block text-zinc-900">{o.product_title}</strong>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(o.created_at).toLocaleDateString("fr-FR")} · {o.payment_mode === "installment" ? "Échelonné" : "Comptant"}
                        </span>
                      </td>

                      <td className="py-3.5 pr-3">
                        <span className="font-bold text-[#0A1931]">{o.supplier_name}</span>
                      </td>

                      <td className="py-3.5 pr-3">
                        <span className="block text-zinc-800">
                          {o.buyer?.prenom || o.buyer?.nom ? `${o.buyer?.prenom || ""} ${o.buyer?.nom || ""}`.trim() : "Acheteur"}
                        </span>
                        <span className="text-[10px] text-zinc-400">{o.buyer?.email || "—"}</span>
                      </td>

                      <td className="py-3.5 pr-3 font-bold text-[#9e001f]">
                        {formatXof(o.total_xof)}
                      </td>

                      <td className="py-3.5 pr-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                            o.status === "received"
                              ? "bg-emerald-100 text-emerald-800"
                              : o.status === "paid"
                              ? "bg-blue-100 text-blue-800"
                              : o.status === "shipped"
                              ? "bg-amber-100 text-amber-800"
                              : o.status === "disputed"
                              ? "bg-red-100 text-red-800"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {o.status === "received"
                            ? "Fonds libérés"
                            : o.status === "paid"
                            ? "Séquestre bloqué"
                            : o.status === "shipped"
                            ? "En expédition"
                            : o.status === "disputed"
                            ? "Litige ouvert"
                            : o.status}
                        </span>
                      </td>

                      <td className="py-3.5 text-right space-x-1">
                        {o.status !== "received" && (
                          <button
                            type="button"
                            onClick={() => void updateOrderStatus(o.id, "received")}
                            disabled={busyId === o.id}
                            className="rounded-lg bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-800 transition"
                            title="Libérer les fonds au vendeur"
                          >
                            Libérer fonds
                          </button>
                        )}

                        {o.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() => void updateOrderStatus(o.id, "cancelled")}
                            disabled={busyId === o.id}
                            className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-2 py-1 text-[11px] font-bold hover:bg-red-100 transition"
                            title="Annuler et rembourser l'acheteur"
                          >
                            Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* 4. ONGLET : LITIGES & ARBITRAGE */}
      {/* ============================================================ */}
      {tab === "disputes" && (
        <section className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-black text-[#0A1931]">
            Arbitrage des litiges acheteur / vendeur
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            En tant qu&apos;administrateur de confiance, vous tranchez les désaccords en examinant les preuves d&apos;expédition et de conformité.
          </p>

          {disputedOrders.length === 0 ? (
            <div className="mt-8 rounded-2xl bg-emerald-50 border border-emerald-200 p-8 text-center">
              <span className="text-3xl">🛡️</span>
              <p className="mt-3 font-bold text-emerald-900 text-sm">Aucun litige actif sur la plateforme Marketplace</p>
              <p className="mt-1 text-xs text-emerald-700">Toutes les transactions se déroulent normalement.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {disputedOrders.map((d) => (
                <div key={d.id} className="rounded-2xl border border-red-200 bg-[#fffdfd] p-5 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-red-100 text-red-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
                        Litige ouvert
                      </span>
                      <h3 className="mt-2 text-base font-black text-[#0A1931]">{d.product_title}</h3>
                      <p className="text-xs text-zinc-500">
                        Boutique : <strong>{d.supplier_name}</strong> · Acheteur : <strong>{d.buyer?.email || "Inconnu"}</strong>
                      </p>
                    </div>
                    <strong className="text-lg font-black text-[#9e001f]">{formatXof(d.total_xof)}</strong>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void updateOrderStatus(d.id, "received")}
                      disabled={busyId === d.id}
                      className="rounded-full bg-emerald-700 text-white px-4 py-2 text-xs font-black hover:bg-emerald-800 transition"
                    >
                      ✓ Arbitrer pour le vendeur (Libérer {formatXof(d.total_xof)})
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateOrderStatus(d.id, "cancelled")}
                      disabled={busyId === d.id}
                      className="rounded-full bg-red-700 text-white px-4 py-2 text-xs font-black hover:bg-red-800 transition"
                    >
                      ✕ Arbitrer pour l&apos;acheteur (Rembourser)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* 5. ONGLET : BOOSTS & VISIBILITÉ */}
      {/* ============================================================ */}
      {tab === "boosts" && (
        <section className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-black text-[#0A1931]">
                Campagnes de Boost Marketplace
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Historique des packs de visibilité souscrits par les vendeurs (7, 14 ou 30 jours) réglés via Moneroo.
              </p>
            </div>
            <div className="rounded-xl bg-[#fff8f6] border border-[#eadfce] px-4 py-2 text-right">
              <span className="text-[10px] text-[#806c58] font-bold block uppercase">Revenus Boosts</span>
              <strong className="text-sm font-black text-[#9e001f]">
                {formatXof(kpis?.totalBoostsRevenueXof ?? 0)}
              </strong>
            </div>
          </div>

          {boosts.length === 0 ? (
            <p className="py-12 text-center text-xs text-zinc-500">Aucun boost souscrit pour le moment.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-zinc-100 uppercase text-[10px] font-black text-zinc-400">
                  <tr>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Produit ID / Boutique</th>
                    <th className="pb-3">Durée</th>
                    <th className="pb-3">Montant payé</th>
                    <th className="pb-3 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {boosts.map((b) => (
                    <tr key={b.id} className="hover:bg-zinc-50/75 transition">
                      <td className="py-3 pr-3 text-zinc-500">
                        {new Date(b.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 pr-3 font-semibold text-zinc-800">
                        Produit : {b.product_id.slice(0, 8)}…
                      </td>
                      <td className="py-3 pr-3 font-bold text-zinc-700">
                        {b.duration_days} jours
                      </td>
                      <td className="py-3 pr-3 font-black text-[#9e001f]">
                        {formatXof(b.amount_xof)}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                            b.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : b.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
