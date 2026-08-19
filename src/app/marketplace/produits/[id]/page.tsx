"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

 type Product = {
  id: string; title: string; description: string; category: string; country_code?: string; country?: string;
  city?: string; price_xof?: number; priceXof?: number; image?: string; media?: unknown;
  installment_enabled?: boolean; installment?: boolean; installment_months_max?: number; months?: number;
  is_boosted?: boolean; boosted?: boolean; marketplace_suppliers?: { business_name: string; certification_status: string; rating: number };
  supplier?: string; certified?: boolean;
};

const labels: Record<string, string> = { BJ: "Bénin", CI: "Côte d’Ivoire", CM: "Cameroun", BF: "Burkina Faso", SN: "Sénégal", ML: "Mali", TG: "Togo" };
const money = (value: number) => new Intl.NumberFormat("fr-FR").format(value) + " XOF";

export default function MarketplaceProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"full" | "installment">("full");
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    fetch(`/api/marketplace/products?id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setProduct(data.products?.[0] || null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="mx-auto max-w-5xl px-5 py-24 text-center">Chargement du produit…</main>;
  if (!product) return <main className="mx-auto max-w-5xl px-5 py-24 text-center"><h1 className="text-2xl font-black">Produit introuvable</h1><Link className="mt-4 inline-block text-[#9e001f]" href="/marketplace">Retour au Marketplace</Link></main>;

  const supplier = Array.isArray(product.marketplace_suppliers) ? product.marketplace_suppliers[0] : product.marketplace_suppliers;
  const price = product.price_xof ?? product.priceXof ?? 0;
  const installment = product.installment_enabled ?? product.installment ?? false;
  const months = product.installment_months_max ?? product.months ?? 0;
  const image = product.image || (Array.isArray(product.media) && typeof product.media[0] === "string" ? product.media[0] : "");
  const supplierName = supplier?.business_name || product.supplier || "Fournisseur Envol Africa";
  const startOrder = async () => {
    setOrderLoading(true);
    setOrderError("");
    try {
      const response = await fetch("/api/marketplace/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id, paymentMode: mode, months: mode === "installment" ? months : 1 }) });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent(`/marketplace/produits/${product.id}`)}`); return; }
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || "Impossible de préparer la commande.");
      window.location.assign(data.checkoutUrl);
    } catch (error) { setOrderError(error instanceof Error ? error.message : "Impossible de préparer la commande."); } finally { setOrderLoading(false); }
  };

  return <main className="min-h-screen bg-[#fcf9f8] px-5 py-10 text-[#2a211a] md:px-10 lg:px-16">
    <div className="mx-auto max-w-[1180px]">
      <nav className="mb-8 text-xs text-[#806c58]"><Link href="/marketplace" className="hover:text-[#9e001f]">Marketplace</Link> <span className="px-2">›</span> Produit</nav>
      <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div className="overflow-hidden rounded-[28px] border border-[#eadfce] bg-white shadow-sm">
          <div className="aspect-[4/3] bg-[#f2e7d8]">{image ? <img src={image} alt={product.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-6xl text-[#a36300]">✦</div>}</div>
          <div className="flex gap-2 border-t border-[#eadfce] p-4 text-xs text-[#806c58]"><span className="rounded-full bg-[#f5eee4] px-3 py-1">Médias contrôlés</span><span className="rounded-full bg-[#f5eee4] px-3 py-1">Échange protégé</span></div>
        </div>
        <div>
          <div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#ffca63] px-3 py-1 text-[10px] font-black uppercase text-[#513000]">{product.is_boosted || product.boosted ? "Produit boosté" : product.category}</span>{product.certified || supplier?.certification_status === "certified" ? <span className="rounded-full bg-[#e9f7f5] px-3 py-1 text-[10px] font-black uppercase text-[#087e8b]">Fournisseur certifié</span> : null}</div>
          <h1 className="mt-4 font-display text-4xl font-black tracking-tight md:text-5xl">{product.title}</h1>
          <p className="mt-5 text-base leading-7 text-[#725f4d]">{product.description}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-[#806c58]"><span>{labels[product.country_code || product.country || ""] || product.country_code || product.country}</span><span>·</span><span>{product.city}</span><span>·</span><span>{product.category}</span></div>
          <div className="mt-8 rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-[#eadfce]"><p className="text-xs font-bold uppercase tracking-widest text-[#806c58]">Prix fournisseur</p><p className="mt-1 text-4xl font-black text-[#9e001f]">{money(price)}</p>{installment && <div className="mt-5"><p className="text-sm font-bold">Mode d’achat</p><div className="mt-2 grid gap-2 sm:grid-cols-2"><button onClick={() => setMode("full")} className={`rounded-xl border p-3 text-left text-xs font-bold ${mode === "full" ? "border-[#9e001f] bg-[#fff3f2]" : "border-[#eadfce]"}`}>Paiement comptant<br /><span className="font-normal text-[#806c58]">Livraison selon accord</span></button><button onClick={() => setMode("installment")} className={`rounded-xl border p-3 text-left text-xs font-bold ${mode === "installment" ? "border-[#9e001f] bg-[#fff3f2]" : "border-[#eadfce]"}`}>Paiement échelonné<br /><span className="font-normal text-[#806c58]">Jusqu’à {months} mois · produit réservé</span></button></div>{mode === "installment" && <p className="mt-3 rounded-lg bg-[#fff8ed] p-3 text-xs leading-5 text-[#725f4d]">Les échéances sont suivies sur le compte acheteur et fournisseur. La remise du produit et la libération des frais suivent les règles de réception et de paiement.</p>}</div>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><Link href={`/marketplace/messages?product=${encodeURIComponent(product.id)}`} className="rounded-full border border-[#cdbb9f] px-5 py-3 text-center text-xs font-black text-[#5c3d19]">Contacter le fournisseur</Link><button type="button" onClick={() => void startOrder()} disabled={orderLoading || (mode === "installment" && !installment)} className="rounded-full bg-[#9e001f] px-5 py-3 text-center text-xs font-black text-white disabled:opacity-60">{orderLoading ? "Préparation…" : mode === "installment" ? "Choisir l’échelonnement" : "Acheter en sécurité"}</button></div>{orderError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800">{orderError}</p>}</div>
          <div className="mt-6 rounded-[20px] border border-[#eadfce] bg-[#2a211a] p-5 text-sm leading-6 text-white/80"><strong className="text-white">Protection EAM :</strong> ne partagez aucun contact externe dans la messagerie. Les paiements et échanges hors plateforme ne sont pas couverts.</div>
          <p className="mt-5 text-sm text-[#806c58]">Fournisseur : <strong className="text-[#2a211a]">{supplierName}</strong>{supplier?.rating ? ` · ${supplier.rating}/5` : ""}</p>
        </div>
      </div>
    </div>
  </main>;
}

