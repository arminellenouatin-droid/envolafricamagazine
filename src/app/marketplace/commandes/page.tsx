"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";

type Installment = {
  id: string;
  sequence_no: number;
  due_at: string;
  principal_xof: number;
  penalty_xof: number;
  paid_at: string | null;
  status: string;
};

type Order = {
  id: string;
  product_id: string;
  supplier_id?: string;
  total_xof: number;
  payment_mode: string;
  status: string;
  created_at: string;
  marketplace_products?: {
    title?: string;
    price_xof?: number;
    media?: unknown;
  } | null;
  marketplace_installments?: Installment[];
};

type Download = {
  id: string;
  order_id: string;
  download_count: number;
  max_downloads: number;
  expires_at: string;
  downloadUrl: string;
  marketplace_products?: {
    title?: string;
    product_type?: string;
    digital_access_instructions?: string | null;
  } | null;
};

export default function MarketplaceOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSupplier, setIsSupplier] = useState(false);
  const [activeTab, setActiveTab] = useState<"buyer" | "seller">("buyer");
  const [filterMode, setFilterMode] = useState<"all" | "installments" | "full">("all");
  const { formatPrice } = useLocale();

  const loadOrders = useCallback(async (tab: "buyer" | "seller", filter: string) => {
    setLoading(true);
    setError("");
    try {
      const url = new URL("/api/marketplace/orders", window.location.origin);
      if (tab === "seller") url.searchParams.set("role", "seller");
      if (filter === "installments") url.searchParams.set("filter", "installments");

      const [ordersResponse, downloadsResponse] = await Promise.all([
        fetch(url.toString(), { cache: "no-store" }),
        tab === "buyer" ? fetch("/api/marketplace/downloads", { cache: "no-store" }) : Promise.resolve(null),
      ]);

      if (ordersResponse.status === 401) {
        window.location.assign("/auth/login?next=/marketplace/commandes");
        return;
      }

      const ordersData = await ordersResponse.json();
      if (!ordersResponse.ok) throw new Error(ordersData.error || "Impossible de charger les commandes.");

      setOrders(ordersData.orders || []);
      if (typeof ordersData.isSupplier === "boolean") {
        setIsSupplier(ordersData.isSupplier);
      }

      if (downloadsResponse && downloadsResponse.ok) {
        const downloadsData = await downloadsResponse.json();
        setDownloads(downloadsData.downloads || []);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de charger vos commandes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get("filter");
    if (filter === "installments") {
      setFilterMode("installments");
    }
    const role = params.get("role");
    const initialTab = role === "seller" ? "seller" : "buyer";
    if (role === "seller") setActiveTab("seller");

    void loadOrders(initialTab, filter || "all");
  }, [loadOrders]);

  const handleTabChange = (tab: "buyer" | "seller") => {
    setActiveTab(tab);
    void loadOrders(tab, filterMode);
  };

  const handleFilterChange = (filter: "all" | "installments" | "full") => {
    setFilterMode(filter);
    void loadOrders(activeTab, filter);
  };

  const filteredOrders = orders.filter((o) => {
    if (filterMode === "installments") return o.payment_mode === "installment";
    if (filterMode === "full") return o.payment_mode === "full";
    return true;
  });

  return (
    <main className="min-h-screen bg-[#fcf9f8] px-4 py-10 text-[#2a211a] sm:px-6 md:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/marketplace" className="inline-flex items-center gap-1 text-xs font-bold text-[#9e001f] hover:underline">
            ← Retour au Marketplace
          </Link>
          <Link
            href="/marketplace/boutique"
            className="rounded-full border border-[#eadfce] bg-white px-4 py-1.5 text-xs font-bold text-[#2a211a] hover:bg-zinc-50"
          >
            Accéder à ma Boutique →
          </Link>
        </div>

        <div className="mt-6 rounded-[28px] bg-[#2a211a] p-6 text-white md:p-8 shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffca63]">Commandes & Règlements</p>
          <h1 className="mt-2 font-display text-3xl font-black">Gestion des commandes Marketplace</h1>
          <p className="mt-2 text-sm text-white/70 max-w-2xl">
            Retrouvez le suivi de vos commandes, les échéanciers de paiement échelonné et vos téléchargements sécurisés.
          </p>
        </div>

        {/* Sélecteur d'espace : Achats vs Ventes boutique */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfce] pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTabChange("buyer")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeTab === "buyer"
                  ? "bg-[#0A1931] text-white shadow-sm"
                  : "bg-white text-[#725f4d] border border-[#eadfce] hover:bg-zinc-50"
              }`}
            >
              🛍️ Mes Achats
            </button>
            {isSupplier && (
              <button
                type="button"
                onClick={() => handleTabChange("seller")}
                className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                  activeTab === "seller"
                    ? "bg-[#9e001f] text-white shadow-sm"
                    : "bg-white text-[#725f4d] border border-[#eadfce] hover:bg-zinc-50"
                }`}
              >
                🏪 Ventes de ma boutique
              </button>
            )}
          </div>

          {/* Filtres de paiement */}
          <div className="flex items-center gap-1.5 bg-white border border-[#eadfce] rounded-full p-1 text-xs">
            <button
              type="button"
              onClick={() => handleFilterChange("all")}
              className={`rounded-full px-3 py-1 font-bold ${filterMode === "all" ? "bg-[#eadfce] text-[#2a211a]" : "text-[#725f4d]"}`}
            >
              Toutes
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("installments")}
              className={`rounded-full px-3 py-1 font-bold ${filterMode === "installments" ? "bg-[#eadfce] text-[#2a211a]" : "text-[#725f4d]"}`}
            >
              ⏳ Paiement échelonné
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("full")}
              className={`rounded-full px-3 py-1 font-bold ${filterMode === "full" ? "bg-[#eadfce] text-[#2a211a]" : "text-[#725f4d]"}`}
            >
              Comptant
            </button>
          </div>
        </div>

        {loading && (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center text-sm text-[#806c58]">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#9e001f] border-t-transparent mb-3"></div>
            Chargement de vos commandes…
          </div>
        )}

        {error && <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}

        {!loading && !error && (
          <>
            {/* Accès numériques pour l'acheteur */}
            {activeTab === "buyer" && downloads.length > 0 && (
              <section className="mt-8 rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#087e8b]">download</span>
                  <h2 className="font-display text-xl font-black">Accès & Fichiers Numériques</h2>
                </div>
                <p className="mt-1 text-xs text-[#725f4d]">
                  Vos fichiers et instructions sont disponibles immédiatement après confirmation de paiement.
                </p>
                <div className="mt-4 space-y-3">
                  {downloads.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4"
                    >
                      <div>
                        <strong className="block text-sm font-black">{item.marketplace_products?.title || "Produit numérique"}</strong>
                        <span className="mt-1 block text-xs text-[#806c58]">
                          Téléchargements : {item.download_count}/{item.max_downloads} · Expire le {new Date(item.expires_at).toLocaleDateString("fr-FR")}
                        </span>
                        {item.marketplace_products?.digital_access_instructions && (
                          <span className="mt-2 block text-xs text-[#725f4d] italic">
                            💡 {item.marketplace_products.digital_access_instructions}
                          </span>
                        )}
                      </div>
                      <a
                        href={item.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-[#087e8b] px-4 py-2 text-xs font-black text-white hover:bg-[#066570]"
                      >
                        Télécharger / Accéder
                      </a>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Liste des commandes */}
            <section className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-black">
                  {activeTab === "buyer" ? "Historique de vos achats" : "Commandes reçues par votre boutique"}
                </h2>
                <span className="text-xs text-[#806c58] font-bold">
                  {filteredOrders.length} commande(s)
                </span>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-[#fff8f6] p-8 text-center text-sm text-[#806c58]">
                  Aucune commande correspondant à vos critères.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {filteredOrders.map((order) => {
                    const hasInstallments = Array.isArray(order.marketplace_installments) && order.marketplace_installments.length > 0;
                    return (
                      <article
                        key={order.id}
                        className="rounded-2xl border border-[#eadfce] bg-[#fffdfb] p-5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#a36300]">
                              Réf. #{order.id.slice(0, 8)}
                            </span>
                            <strong className="block text-base font-black text-[#2a211a] mt-0.5">
                              {order.marketplace_products?.title || "Article Marketplace"}
                            </strong>
                            <span className="mt-1 block text-xs text-[#806c58]">
                              Date : {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {order.payment_mode === "installment" ? "Échéancier en plusieurs fois" : "Paiement direct"}
                            </span>
                          </div>

                          <div className="text-right">
                            <strong className="block text-lg font-black text-[#9e001f]">
                              {formatPrice(order.total_xof)}
                            </strong>
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-black mt-1 ${
                                ["completed", "paid", "confirmed"].includes(order.status)
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Échéancier de paiement détaillé si mode installment */}
                        {hasInstallments && (
                          <div className="mt-4 pt-4 border-t border-[#eadfce]">
                            <p className="text-xs font-bold text-[#725f4d] mb-2">
                              🗓️ Calendrier des mensualités ({order.marketplace_installments!.length} échéances) :
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {order.marketplace_installments!.map((inst) => (
                                <div
                                  key={inst.id}
                                  className={`rounded-xl border p-2.5 text-xs ${
                                    inst.status === "paid"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                      : "border-[#eadfce] bg-white text-[#2a211a]"
                                  }`}
                                >
                                  <div className="flex justify-between font-bold">
                                    <span>Mensualité #{inst.sequence_no}</span>
                                    <span>{formatPrice(inst.principal_xof)}</span>
                                  </div>
                                  <div className="mt-1 flex justify-between text-[11px] text-[#806c58]">
                                    <span>Échéance : {new Date(inst.due_at).toLocaleDateString("fr-FR")}</span>
                                    <span className={inst.status === "paid" ? "font-bold text-emerald-700" : "font-bold text-amber-700"}>
                                      {inst.status === "paid" ? "Payée" : "À régler"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
