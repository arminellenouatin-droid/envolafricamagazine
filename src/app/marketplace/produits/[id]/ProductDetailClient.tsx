"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

type Product = {
  id: string; title: string; description: string; category: string; country_code?: string; country?: string; product_video_url?: string | null; product_video_mime?: string | null; product_video_size?: number | null;
  city?: string; price_xof?: number; priceXof?: number; image?: string; media?: unknown;
  installment_enabled?: boolean; installment?: boolean; installment_months_max?: number; months?: number;
  is_boosted?: boolean; boosted?: boolean; marketplace_suppliers?: { business_name: string; certification_status: string; rating: number };
  supplier?: string; certified?: boolean;
  product_affiliations?: Array<{ id: string; commission_rate: number; is_active: boolean }>;
};

const labels: Record<string, string> = { BJ: "Bénin", CI: "Côte d’Ivoire", CM: "Cameroun", BF: "Burkina Faso", SN: "Sénégal", ML: "Mali", TG: "Togo" };

export default function ProductDetailClient({
  id,
  initialProduct,
  refToken,
  currentUser,
}: {
  id: string;
  initialProduct?: Product | null;
  refToken?: string;
  currentUser?: { id: string; name?: string; email?: string } | null;
}) {
  const { formatPrice } = useLocale();
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [mode, setMode] = useState<"full" | "installment">("full");
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [affiliateCopied, setAffiliateCopied] = useState(false);

  useEffect(() => {
    if (initialProduct && initialProduct.id === id) {
      setProduct(initialProduct);
      setLoading(false);
      return;
    }
    fetch(`/api/marketplace/products?id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setProduct(data.products?.[0] || null))
      .finally(() => setLoading(false));
  }, [id, initialProduct]);

  if (loading) return <main className="mx-auto max-w-5xl px-5 py-24 text-center">Chargement du produit…</main>;
  if (!product) return <main className="mx-auto max-w-5xl px-5 py-24 text-center"><h1 className="text-2xl font-black">Produit introuvable</h1><Link className="mt-4 inline-block text-[#9e001f]" href="/marketplace">Retour au Marketplace</Link></main>;

  const supplier = Array.isArray(product.marketplace_suppliers) ? product.marketplace_suppliers[0] : product.marketplace_suppliers;
  const price = product.price_xof ?? product.priceXof ?? 0;
  const installment = product.installment_enabled ?? product.installment ?? false;
  const months = product.installment_months_max ?? product.months ?? 0;
  const image = product.image || (Array.isArray(product.media) && typeof product.media[0] === "string" ? product.media[0] : "");
  const supplierName = supplier?.business_name || product.supplier || "Fournisseur Envol Africa";

  const activeAffiliation = product.product_affiliations?.[0]?.is_active ? product.product_affiliations[0] : null;
  const affiliateRate = activeAffiliation?.commission_rate || 0.10;
  const affiliateCommission = Math.round(price * affiliateRate);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://envolafrica.vercel.app";
  const affiliateShareUrl = `${origin}/marketplace/produits/${product.id}?ref=${currentUser?.id || "ambassadeur"}`;

  const copyAffiliateLink = async () => {
    try {
      await navigator.clipboard.writeText(affiliateShareUrl);
      setAffiliateCopied(true);
      setTimeout(() => setAffiliateCopied(false), 2500);
    } catch {}
  };

  const startOrder = async () => {
    setOrderLoading(true);
    setOrderError("");
    try {
      const activeRef = refToken || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("ref") || undefined : undefined);
      const response = await fetch("/api/marketplace/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id, paymentMode: mode, months: mode === "installment" ? months : 1, referralToken: activeRef }) });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent(`/marketplace/produits/${product.id}${activeRef ? `?ref=${activeRef}` : ""}`)}`); return; }
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || "Impossible de préparer la commande.");
      window.location.assign(data.checkoutUrl);
    } catch (error) { setOrderError(error instanceof Error ? error.message : "Impossible de préparer la commande."); } finally { setOrderLoading(false); }
  };

  return <main className="min-h-screen bg-[#fcf9f8] px-5 py-10 text-[#2a211a] md:px-10 lg:px-16">
    <div className="mx-auto max-w-[1180px]">
      <nav className="mb-8 text-xs text-[#806c58]"><Link href="/marketplace" className="hover:text-[#9e001f]">Marketplace</Link> <span className="px-2">›</span> Produit</nav>
      <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div className="overflow-hidden rounded-[28px] border border-[#eadfce] bg-white shadow-sm">
          <div className="aspect-[4/3] bg-[#f2e7d8]">{product.product_video_url ? <video src={product.product_video_url} poster={image || undefined} controls playsInline preload="metadata" className="h-full w-full object-cover" aria-label={`Vidéo de présentation de ${product.title}`} /> : image ? <img src={image} alt={product.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-6xl text-[#a36300]">✦</div>}</div>
          <div className="flex flex-wrap gap-2 border-t border-[#eadfce] p-4 text-xs text-[#806c58]"><span className="rounded-full bg-[#f5eee4] px-3 py-1">Médias contrôlés</span>{product.product_video_url && <span className="rounded-full bg-[#e9f7f5] px-3 py-1 text-[#087e8b]">Vidéo produit</span>}<span className="rounded-full bg-[#f5eee4] px-3 py-1">Échange protégé</span></div>
        </div>
        <div>
          <div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#ffca63] px-3 py-1 text-[10px] font-black uppercase text-[#513000]">{product.is_boosted || product.boosted ? "Produit boosté" : product.category}</span>{product.certified || supplier?.certification_status === "certified" ? <span className="rounded-full bg-[#e9f7f5] px-3 py-1 text-[10px] font-black uppercase text-[#087e8b]">Fournisseur certifié</span> : null}</div>
          <h1 className="mt-4 font-display text-4xl font-black tracking-tight md:text-5xl">{product.title}</h1>
          <p className="mt-5 text-base leading-7 text-[#725f4d]">{product.description}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-[#806c58]"><span>{labels[product.country_code || product.country || ""] || product.country_code || product.country}</span><span>·</span><span>{product.city}</span><span>·</span><span>{product.category}</span></div>
          <div className="mt-8 rounded-[22px] bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-[#eadfce] dark:ring-slate-800 text-[#2a211a] dark:text-slate-100"><p className="text-xs font-bold uppercase tracking-widest text-[#806c58] dark:text-slate-400">Prix fournisseur</p><p className="mt-1 text-4xl font-black text-[#9e001f] dark:text-red-400">{formatPrice(price)}</p>{installment && <div className="mt-5"><p className="text-sm font-bold">Mode d’achat</p><div className="mt-2 grid gap-2 sm:grid-cols-2"><button onClick={() => setMode("full")} className={`rounded-xl border p-3 text-left text-xs font-bold ${mode === "full" ? "border-[#9e001f] bg-[#fff3f2] dark:bg-[#9e001f]/20 text-[#9e001f] dark:text-red-300" : "border-[#eadfce] dark:border-slate-700 text-[#2a211a] dark:text-slate-300"}`}>Paiement comptant<br /><span className="font-normal text-[#806c58] dark:text-slate-400">Livraison selon accord</span></button><button onClick={() => setMode("installment")} className={`rounded-xl border p-3 text-left text-xs font-bold ${mode === "installment" ? "border-[#9e001f] bg-[#fff3f2] dark:bg-[#9e001f]/20 text-[#9e001f] dark:text-red-300" : "border-[#eadfce] dark:border-slate-700 text-[#2a211a] dark:text-slate-300"}`}>Paiement échelonné<br /><span className="font-normal text-[#806c58] dark:text-slate-400">Jusqu’à {months} mois · produit réservé</span></button></div>{mode === "installment" && <p className="mt-3 rounded-lg bg-[#fff8ed] dark:bg-amber-950/30 p-3 text-xs leading-5 text-[#725f4d] dark:text-amber-200">Les échéances sont suivies sur le compte acheteur et fournisseur. La remise du produit et la libération des frais suivent les règles de réception et de paiement.</p>}</div>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><Link href={`/marketplace/messages?product=${encodeURIComponent(product.id)}`} className="rounded-full border border-[#cdbb9f] dark:border-slate-700 px-5 py-3 text-center text-xs font-black text-[#5c3d19] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Contacter le fournisseur</Link><button type="button" onClick={() => void startOrder()} disabled={orderLoading || (mode === "installment" && !installment)} className="rounded-full bg-[#9e001f] hover:bg-[#b00023] px-5 py-3 text-center text-xs font-black text-white disabled:opacity-60 transition shadow">{orderLoading ? "Préparation…" : mode === "installment" ? "Choisir l’échelonnement" : "Acheter en sécurité"}</button></div>{orderError && <p className="mt-3 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-800 dark:text-red-300">{orderError}</p>}</div>

          {/* Encadré Programme Ambassadeur & Affiliation */}
          {activeAffiliation && (
            <div className="mt-6 rounded-[22px] border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-slate-900/60 dark:to-slate-900/40 p-6 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/25 px-3 py-1 text-xs font-bold text-amber-950 dark:text-amber-300 border border-amber-500/40">
                  🤝 Programme Ambassadeur & Affiliation
                </span>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-400">
                  Commission : {Math.round(affiliateRate * 100)}%
                </span>
              </div>

              <h3 className="mt-3 text-lg font-black text-[#1a130f] dark:text-white">
                Gagnez jusqu&apos;à {formatPrice(affiliateCommission)} sur chaque vente !
              </h3>
              <p className="mt-1 text-xs leading-5 text-[#5c493a] dark:text-slate-300">
                Recommandez ce produit à vos proches ou sur vos réseaux sociaux (WhatsApp, Facebook, TikTok). Chaque commande validée vous rapporte {Math.round(affiliateRate * 100)}% de commission immédiatement créditée sur votre portefeuille.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 rounded-xl bg-white dark:bg-slate-950 border border-[#eadfce] dark:border-slate-700 px-3.5 py-2.5 font-mono text-xs text-[#5c3d19] dark:text-amber-300 truncate select-all">
                  {affiliateShareUrl}
                </div>
                <button
                  type="button"
                  onClick={copyAffiliateLink}
                  className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2.5 transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {affiliateCopied ? "✓ Lien affilié copié !" : "📋 Copier mon lien affilié"}
                </button>
              </div>

              {!currentUser && (
                <p className="mt-2 text-[11px] text-[#806c58] dark:text-slate-400">
                  💡 Conseil : <Link href={`/auth/login?next=${encodeURIComponent(`/marketplace/produits/${product.id}`)}`} className="underline font-semibold text-[#9e001f] dark:text-amber-400">Connectez-vous</Link> pour associer vos gains à votre portefeuille personnel.
                </p>
              )}
            </div>
          )}

          <div className="mt-6 rounded-[20px] border border-[#eadfce] bg-[#2a211a] p-5 text-sm leading-6 text-white/80"><strong className="text-white">Protection EAM :</strong> ne partagez aucun contact externe dans la messagerie. Les paiements et échanges hors plateforme ne sont pas couverts.</div>
          <p className="mt-5 text-sm text-[#806c58]">Fournisseur : <strong className="text-[#2a211a]">{supplierName}</strong>{supplier?.rating ? ` · ${supplier.rating}/5` : ""}</p>
        </div>
      </div>
    </div>
  </main>;
}
