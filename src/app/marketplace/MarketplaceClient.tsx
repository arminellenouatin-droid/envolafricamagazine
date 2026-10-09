"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { marketplaceCategories, type MarketplaceProduct } from "@/lib/marketplace-seed";
import PreviewFlipbook from "@/components/kiosque/PreviewFlipbook";
import { useLocale } from "@/components/LocaleProvider";

const countryOptions = [
  { code: "", label: "Tous les pays" },
  { code: "BJ", label: "Bénin" },
  { code: "CI", label: "Côte d’Ivoire" },
  { code: "CM", label: "Cameroun" },
  { code: "BF", label: "Burkina Faso" },
  { code: "SN", label: "Sénégal" },
  { code: "ML", label: "Mali" },
  { code: "TG", label: "Togo" },
];
const countryLabels = Object.fromEntries(countryOptions.map((country) => [country.code, country.label]));

type ProductMedia = { url: string; mimeType: string; name?: string };

export type WholesaleTier = { range: string; price: number; discountLabel: string; minQty: number };

export type ProductWithMeta = MarketplaceProduct & {
  isMagazine?: boolean;
  magazineId?: string;
  magazineNumero?: number;
  videoUrl?: string;
  videoMime?: string;
  media?: ProductMedia[];
  productType?: string;
  deliveryType?: string;
  moq?: number;
  leadTime?: string;
  isTradeAssurance?: boolean;
  isVerifiedSupplier?: boolean;
  wholesaleTiers?: WholesaleTier[];
};

type ApiProduct = Partial<MarketplaceProduct> & {
  id: string;
  title: string;
  description?: string;
  media?: unknown;
  product_video_url?: string;
  product_video_mime?: string;
  price_xof?: number;
  product_type?: string;
  delivery_type?: string;
  country_code?: string;
  installment_enabled?: boolean;
  installment_months_max?: number;
  is_boosted?: boolean;
  magazineId?: string;
  magazineNumero?: number;
  isMagazine?: boolean;
  moq?: number;
  lead_time?: string;
  marketplace_suppliers?:
    | { business_name: string; certification_status: string; rating: number }
    | { business_name: string; certification_status: string; rating: number }[];
};

type MarketplaceView = "products" | "vendors" | "certified";

function normalizeProduct(product: ApiProduct): ProductWithMeta {
  const supplier = Array.isArray(product.marketplace_suppliers)
    ? product.marketplace_suppliers[0]
    : product.marketplace_suppliers;
  const rawMedia = Array.isArray(product.media) ? product.media : [];
  const media = rawMedia
    .map((item) => {
      if (typeof item === "string") return { url: item, mimeType: "image/*" };
      if (item && typeof item === "object") {
        const value = item as { url?: unknown; path?: unknown; mimeType?: unknown; name?: unknown };
        const url = typeof value.url === "string" ? value.url : typeof value.path === "string" ? value.path : "";
        return url
          ? {
              url,
              mimeType: typeof value.mimeType === "string" ? value.mimeType : "image/*",
              name: typeof value.name === "string" ? value.name : undefined,
            }
          : null;
      }
      return null;
    })
    .filter((item): item is ProductMedia => Boolean(item));

  const basePrice = product.price_xof ?? product.priceXof ?? 0;
  const moq = Number(product.moq || (product.product_type === "physical" || !product.product_type ? 10 : 1));
  const leadTime = product.lead_time || "3 - 7 jours";
  const isVerified = Boolean(supplier?.certification_status === "certified" || product.certified);

  const wholesaleTiers: WholesaleTier[] = [
    { range: `1 - ${Math.max(1, moq - 1)}`, price: basePrice, discountLabel: "Base", minQty: 1 },
    { range: `${moq} - 49`, price: Math.round(basePrice * 0.88), discountLabel: "-12%", minQty: moq },
    { range: "50+", price: Math.round(basePrice * 0.78), discountLabel: "-22%", minQty: 50 },
  ];

  return {
    id: product.id,
    title: product.title,
    description: product.description || "",
    category: product.category || "Autres produits",
    supplier: supplier?.business_name || product.supplier || "Fournisseur Envol Africa",
    country: product.country_code ?? product.country ?? "",
    city: product.city || "",
    priceXof: basePrice,
    image: product.image || media[0]?.url || "",
    media,
    accent: product.accent || "#a36300",
    productType: product.product_type || "physical",
    deliveryType: product.delivery_type || "shipping",
    certified: isVerified,
    boosted: Boolean(product.is_boosted ?? product.boosted),
    installment: Boolean(product.installment_enabled ?? product.installment),
    months: product.installment_months_max ?? product.months ?? 0,
    moq,
    leadTime,
    isTradeAssurance: true,
    isVerifiedSupplier: isVerified,
    wholesaleTiers,
    ...(product.product_video_url
      ? {
          videoUrl: product.product_video_url,
          videoMime: product.product_video_mime,
          media: [...media, { url: product.product_video_url, mimeType: product.product_video_mime || "video/mp4" }],
        }
      : {}),
    ...(product.isMagazine
      ? { isMagazine: true, magazineId: product.magazineId, magazineNumero: product.magazineNumero }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// RFQ Modal: Appel d'offres / Demande de Devis B2B style Alibaba
// ---------------------------------------------------------------------------
function RfqModal({ product, onClose }: { product: ProductWithMeta; onClose: () => void }) {
  const { formatPrice } = useLocale();
  const minQty = product.moq || 10;
  const [qty, setQty] = useState(minQty);
  const [port, setPort] = useState("Port autonome de Cotonou (Bénin)");
  const [customLogo, setCustomLogo] = useState(false);
  const [customPackaging, setCustomPackaging] = useState(false);
  const [sampleRequested, setSampleRequested] = useState(false);
  const [message, setMessage] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const unitPrice =
    qty >= 50
      ? Math.round(product.priceXof * 0.78)
      : qty >= 10
      ? Math.round(product.priceXof * 0.88)
      : product.priceXof;
  const totalEstimated = unitPrice * qty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rfq-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl border border-[#eadfce]">
        <div className="flex items-center justify-between border-b border-[#f0e7dc] pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fff4e0] text-[#a36300]">
              <span className="material-symbols-outlined text-[20px]">request_quote</span>
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a36300]">Appel d&apos;offres B2B · RFQ</p>
              <h3 id="rfq-modal-title" className="font-display text-lg font-black text-[#2a211a]">Demander un devis grossiste</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#f8f3ed] text-[#9e001f] hover:bg-[#ffdad8]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e9f7f5] text-[#087e8b]">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h4 className="mt-4 font-display text-xl font-black text-[#2a211a]">Devis RFQ transmis avec succès !</h4>
            <p className="mt-2 text-xs leading-5 text-[#725f4d]">
              Votre appel d&apos;offres (Réf: <strong className="text-[#a36300]">RFQ-EAM-{Math.floor(100000 + Math.random() * 900000)}</strong>) pour <strong>{qty} unités</strong> a été envoyé au fournisseur <strong>{product.supplier}</strong>.
            </p>
            <div className="mt-6 rounded-2xl bg-[#fffaf3] p-4 text-left border border-[#eadfce]">
              <p className="text-[11px] font-bold text-[#806c58]">Estimation préliminaire Trade Assurance :</p>
              <p className="font-display text-xl font-black text-[#9e001f]">{formatPrice(totalEstimated)}</p>
              <p className="text-[10px] text-[#806c58] mt-1">Fournisseur engagé à répondre sous 24h ouvrées avec proforma officiel.</p>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.assign(`/marketplace/messages?productId=${encodeURIComponent(product.id)}`);
                }}
                className="flex-1 rounded-full bg-[#9e001f] px-5 py-3 text-xs font-black text-white"
              >
                Ouvrir la négociation en direct
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[#eadfce] px-5 py-3 text-xs font-bold text-[#725f4d]"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-[#fbf8f5] p-3 border border-[#f0e7dc]">
              {product.image ? (
                <img src={product.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-xl bg-white text-xl">✦</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[#2a211a]">{product.title}</p>
                <p className="text-[11px] text-[#806c58]">Vendeur : {product.supplier}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full bg-[#fff4e0] px-2 py-0.5 text-[9px] font-black uppercase text-[#a36300]">MOQ: {minQty} pcs</span>
                  <span className="rounded-full bg-[#e9f7f5] px-2 py-0.5 text-[9px] font-black uppercase text-[#087e8b]">Trade Assurance</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-[#806c58]">Quantité souhaitée (Min: {minQty})</label>
                <input
                  type="number"
                  min={minQty}
                  value={qty}
                  onChange={(e) => setQty(Math.max(minQty, Number(e.target.value) || minQty))}
                  required
                  className="mt-1 h-11 w-full rounded-xl border border-[#eadfce] px-3 text-sm font-bold text-[#2a211a] outline-none focus:border-[#9e001f]"
                />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-[#806c58]">Port / Ville de livraison</label>
                <select
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-xs font-bold text-[#2a211a] outline-none focus:border-[#9e001f]"
                >
                  <option value="Port de Cotonou (Bénin)">Port autonome de Cotonou (Bénin)</option>
                  <option value="Port d'Abidjan (Côte d'Ivoire)">Port autonome d&apos;Abidjan (Côte d&apos;Ivoire)</option>
                  <option value="Port de Douala (Cameroun)">Port de Douala (Cameroun)</option>
                  <option value="Port de Dakar (Sénégal)">Port autonome de Dakar (Sénégal)</option>
                  <option value="Port de Lomé (Togo)">Port autonome de Lomé (Togo)</option>
                  <option value="Livraison par fret aérien">Fret Aérien Express (Aéroport)</option>
                  <option value="Livraison terrestre / frontière">Corridor terrestre sous-régional</option>
                </select>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-[#806c58]">Options de personnalisation B2B</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <label className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${customLogo ? "border-[#9e001f] bg-[#fff4f3] text-[#9e001f]" : "border-[#eadfce] text-[#725f4d]"}`}>
                  <input type="checkbox" checked={customLogo} onChange={(e) => setCustomLogo(e.target.checked)} className="sr-only" />
                  <span className="material-symbols-outlined text-[16px]">{customLogo ? "check_box" : "check_box_outline_blank"}</span>
                  Logo personnalisé (OEM)
                </label>
                <label className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${customPackaging ? "border-[#9e001f] bg-[#fff4f3] text-[#9e001f]" : "border-[#eadfce] text-[#725f4d]"}`}>
                  <input type="checkbox" checked={customPackaging} onChange={(e) => setCustomPackaging(e.target.checked)} className="sr-only" />
                  <span className="material-symbols-outlined text-[16px]">{customPackaging ? "check_box" : "check_box_outline_blank"}</span>
                  Packaging sur-mesure
                </label>
                <label className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${sampleRequested ? "border-[#9e001f] bg-[#fff4f3] text-[#9e001f]" : "border-[#eadfce] text-[#725f4d]"}`}>
                  <input type="checkbox" checked={sampleRequested} onChange={(e) => setSampleRequested(e.target.checked)} className="sr-only" />
                  <span className="material-symbols-outlined text-[16px]">{sampleRequested ? "check_box" : "check_box_outline_blank"}</span>
                  Demande d&apos;échantillon préalable
                </label>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-[#806c58]">Spécifications techniques & exigences</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex : Nous recherchons 50 pièces avec certification sanitaire et livraison avant le 15 du mois prochain..."
                rows={3}
                className="mt-1 w-full rounded-xl border border-[#eadfce] p-3 text-xs leading-5 text-[#2a211a] outline-none focus:border-[#9e001f]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-[#806c58]">Entreprise / Société acheteuse</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex : Africa Trading SARL"
                  required
                  className="mt-1 h-11 w-full rounded-xl border border-[#eadfce] px-3 text-xs text-[#2a211a] outline-none focus:border-[#9e001f]"
                />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-[#806c58]">Téléphone WhatsApp professionnel</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+229 / +225..."
                  required
                  className="mt-1 h-11 w-full rounded-xl border border-[#eadfce] px-3 text-xs text-[#2a211a] outline-none focus:border-[#9e001f]"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-[#fff8eb] p-3.5 border border-[#fed7aa] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-[#a36300]">Prix de gros estimé</p>
                <p className="text-xs text-[#806c58]">
                  {formatPrice(unitPrice)} / unité · Total: <strong className="text-[#9e001f] text-sm">{formatPrice(totalEstimated)}</strong>
                </p>
              </div>
              <span className="rounded-full bg-[#9e001f]/10 px-2.5 py-1 text-[10px] font-black text-[#9e001f]">
                {qty >= 50 ? "-22% Volume" : qty >= 10 ? "-12% Volume" : "Prix catalogue"}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-[#9e001f] px-6 py-3.5 text-xs font-black text-white shadow-lg hover:bg-[#c8102e] transition disabled:opacity-50"
              >
                {loading ? "Transmission du RFQ…" : "Envoyer l'appel d'offres au fournisseur"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[#eadfce] px-5 py-3.5 text-xs font-bold text-[#725f4d]"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Detail Modal: Fiche globale avec grille de prix de gros B2B
// ---------------------------------------------------------------------------
function ProductDetailModal({
  product,
  onClose,
  onRfq,
}: {
  product: ProductWithMeta;
  onClose: () => void;
  onRfq: (product: ProductWithMeta) => void;
}) {
  const { formatPrice } = useLocale();
  const [favorite, setFavorite] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState(0);

  const mediaItems: ProductMedia[] = product.media?.length
    ? product.media
    : product.videoUrl
    ? [{ url: product.videoUrl, mimeType: product.videoMime || "video/mp4" }]
    : product.image
    ? [{ url: product.image, mimeType: "image/*" }]
    : [];

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("eam_marketplace_favorites") || "[]") as string[];
    setFavorite(favorites.includes(product.id));
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, product.id]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem("eam_marketplace_favorites") || "[]") as string[];
    const next = favorites.includes(product.id) ? favorites.filter((id) => id !== product.id) : [...favorites, product.id];
    localStorage.setItem("eam_marketplace_favorites", JSON.stringify(next));
    setFavorite(next.includes(product.id));
  };

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("eam_cart") || "[]");
    cart.push(
      product.isMagazine
        ? {
            type: "magazine",
            magazineId: product.magazineId,
            format: "numerique",
            language: "fr",
            price: product.priceXof,
            title: product.title,
            cover: product.image,
            numero: product.magazineNumero,
          }
        : {
            type: "marketplace",
            productId: product.id,
            price: product.priceXof,
            title: product.title,
            image: product.image,
            installment: product.installment,
            months: product.months,
          }
    );
    localStorage.setItem("eam_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("eam-cart-updated"));
  };

  const openMagazinePreview = () => {
    if (product.isMagazine && product.magazineId) setPreviewOpen(true);
  };

  return (
    <>
      {previewOpen && product.isMagazine && product.magazineId && (
        <PreviewFlipbook
          title={product.title}
          cover={product.image || ""}
          previewUrl={`/api/magazines/${encodeURIComponent(product.magazineId)}/preview`}
          language="fr"
          onClose={() => setPreviewOpen(false)}
          onPurchase={() => {
            setPreviewOpen(false);
            addToCart();
          }}
        />
      )}
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-[#2a211a]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="marketplace-product-title"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-[28px] bg-[#fffdfb] shadow-2xl sm:rounded-[28px]">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eadfce] bg-[#fffdfb]/95 px-5 py-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#e9f7f5] px-2.5 py-1 text-[10px] font-black uppercase text-[#087e8b]">
                Trade Assurance EAM
              </span>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a36300]">Fiche Produit B2B</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la fiche produit"
              className="grid h-10 w-10 place-items-center rounded-full bg-[#f8f3ed] text-[#9e001f]"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="grid min-h-0 gap-6 p-5 md:grid-cols-[.95fr_1.05fr] md:p-7">
            {/* Visuals */}
            <div className="sticky top-0 self-start overflow-hidden rounded-[22px] bg-[#f5eee5]">
              <div className="relative aspect-square w-full">
                {mediaItems[activeMedia]?.mimeType.startsWith("video/") ? (
                  <video
                    src={mediaItems[activeMedia].url}
                    poster={product.image || undefined}
                    controls
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : mediaItems[activeMedia] ? (
                  <img
                    src={mediaItems[activeMedia].url}
                    alt={`${product.title} — média ${activeMedia + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-6xl">✦</div>
                )}
                {mediaItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveMedia((current) => (current - 1 + mediaItems.length) % mediaItems.length)}
                      aria-label="Média précédente"
                      className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#9e001f] shadow-lg"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMedia((current) => (current + 1) % mediaItems.length)}
                      aria-label="Média suivant"
                      className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#9e001f] shadow-lg"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/45 px-2 py-1">
                      {mediaItems.map((item, index) => (
                        <button
                          key={`${item.url}-${index}`}
                          type="button"
                          onClick={() => setActiveMedia(index)}
                          aria-label={`Afficher le média ${index + 1}`}
                          className={`h-2 w-2 rounded-full ${index === activeMedia ? "bg-white" : "bg-white/45"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div
                className="flex snap-x gap-2 overflow-x-auto p-3"
                onWheel={(event) => {
                  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) event.currentTarget.scrollLeft += event.deltaY;
                }}
              >
                {mediaItems.map((item, index) => (
                  <button
                    key={`${item.url}-thumb-${index}`}
                    type="button"
                    onClick={() => setActiveMedia(index)}
                    className={`relative h-16 w-16 shrink-0 snap-start overflow-hidden rounded-lg border-2 ${
                      index === activeMedia ? "border-[#9e001f]" : "border-transparent"
                    }`}
                    aria-label={`Sélectionner le média ${index + 1}`}
                  >
                    {item.mimeType.startsWith("video/") ? (
                      <>
                        <video src={item.url} muted playsInline className="h-full w-full object-cover" />
                        <span className="absolute inset-0 grid place-items-center text-white">
                          <span className="material-symbols-outlined text-[18px]">play_circle</span>
                        </span>
                      </>
                    ) : (
                      <img src={item.url} alt="" className="h-full w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Meta & Wholesale Info */}
            <div className="min-h-0 max-h-[calc(92vh-7rem)] overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-2">
                {product.certified && (
                  <span className="rounded-full bg-[#fef3c7] px-3 py-1 text-[10px] font-black uppercase text-[#92400e] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span> Fournisseur Vérifié Pro
                  </span>
                )}
                {product.boosted && (
                  <span className="rounded-full bg-[#ffca63] px-3 py-1 text-[10px] font-black uppercase text-[#513000]">
                    Boosté WAB
                  </span>
                )}
                <span className="rounded-full bg-[#e9f7f5] px-3 py-1 text-[10px] font-black uppercase text-[#087e8b]">
                  MOQ : {product.moq || 10} pièces
                </span>
              </div>

              <h2 id="marketplace-product-title" className="mt-3 font-display text-3xl font-black leading-tight text-[#2a211a]">
                {product.title}
              </h2>

              {/* Wholesale Tier Pricing Table style Alibaba */}
              <div className="mt-4 rounded-2xl bg-[#fff8eb] p-4 border border-[#fed7aa]">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#a36300]">Paliers de Prix de Gros (B2B)</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white p-2.5 shadow-sm border border-[#f0e7dc]">
                    <span className="block text-[11px] font-bold text-[#806c58]">1 - 9 pièces</span>
                    <strong className="mt-1 block text-sm font-black text-[#2a211a]">{formatPrice(product.priceXof)}</strong>
                    <span className="text-[10px] text-[#806c58]">Prix unitaire</span>
                  </div>
                  <div className="rounded-xl bg-white p-2.5 shadow-sm border border-[#f0e7dc]">
                    <span className="block text-[11px] font-bold text-[#806c58]">10 - 49 pièces</span>
                    <strong className="mt-1 block text-sm font-black text-[#9e001f]">
                      {formatPrice(Math.round(product.priceXof * 0.88))}
                    </strong>
                    <span className="rounded-full bg-[#ffdad8] px-1.5 py-0.5 text-[9px] font-black text-[#9e001f]">-12%</span>
                  </div>
                  <div className="rounded-xl bg-white p-2.5 shadow-sm border border-[#f0e7dc]">
                    <span className="block text-[11px] font-bold text-[#806c58]">50+ pièces</span>
                    <strong className="mt-1 block text-sm font-black text-[#9e001f]">
                      {formatPrice(Math.round(product.priceXof * 0.78))}
                    </strong>
                    <span className="rounded-full bg-[#ffdad8] px-1.5 py-0.5 text-[9px] font-black text-[#9e001f]">-22%</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#fff3f2] px-3 py-1 text-[10px] font-black uppercase text-[#9e001f]">
                  Expédition sous : {product.leadTime || "3 - 7 jours"}
                </span>
                <span className="rounded-full bg-[#e9f7f5] px-3 py-1 text-[10px] font-black uppercase text-[#087e8b]">
                  {product.deliveryType === "shipping" ? "Fret Maritime & Terrestre" : "Téléchargement protégé"}
                </span>
              </div>

              {product.installment && (
                <p className="mt-3 inline-flex rounded-full bg-[#f5eee4] px-3 py-2 text-xs font-bold text-[#765326]">
                  Paiement échelonné · jusqu’à {product.months} mois
                </p>
              )}

              <div className="mt-5 space-y-2 border-y border-[#eadfce] py-4 text-sm text-[#725f4d]">
                <p>
                  <strong className="text-[#2a211a]">Vendeur :</strong> {product.supplier}{" "}
                  {product.certified && <span className="text-[#087e8b] font-bold">✓ Entreprise vérifiée</span>}
                </p>
                {product.category && (
                  <p>
                    <strong className="text-[#2a211a]">Catégorie :</strong> {product.category}
                  </p>
                )}
                {product.country && (
                  <p>
                    <strong className="text-[#2a211a]">Origine / Expédition :</strong>{" "}
                    {countryLabels[product.country] || product.country}
                    {product.city ? ` · ${product.city}` : ""}
                  </p>
                )}
              </div>

              <p className="mt-5 whitespace-pre-line text-sm leading-6 text-[#725f4d]">
                {product.description || "Ce fournisseur présente ses produits certifiés sur la marketplace Envol Africa."}
              </p>

              {/* B2B Action Buttons */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRfq(product);
                  }}
                  className="rounded-full bg-[#a36300] px-5 py-3.5 text-xs font-black text-white shadow-lg hover:bg-[#855100] transition flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">request_quote</span>
                  Demander un devis (RFQ)
                </button>
                <button
                  type="button"
                  onClick={addToCart}
                  className="rounded-full bg-[#9e001f] px-5 py-3.5 text-xs font-black text-white hover:bg-[#c8102e] transition"
                >
                  Acheter au panier
                </button>
                {product.isMagazine && product.magazineId && (
                  <button
                    type="button"
                    onClick={openMagazinePreview}
                    className="rounded-full border border-[#9e001f] bg-[#fff6f5] px-5 py-3 text-sm font-black text-[#9e001f]"
                  >
                    <span className="material-symbols-outlined mr-1 align-middle text-[18px]">menu_book</span>
                    Aperçu
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleFavorite}
                  aria-pressed={favorite}
                  className="rounded-full border border-[#eadfce] bg-white px-5 py-3 text-xs font-black text-[#5c3d19]"
                >
                  <span className="material-symbols-outlined mr-1 align-middle text-[18px]">
                    {favorite ? "favorite" : "favorite_border"}
                  </span>
                  {favorite ? "Dans mes favoris" : "Ajouter aux favoris"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.assign(`/marketplace/messages?productId=${encodeURIComponent(product.id)}`);
                  }}
                  className="rounded-full border border-[#eadfce] bg-[#fffaf3] px-5 py-3 text-xs font-black text-[#5c3d19]"
                >
                  Contacter le fournisseur
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-[#eadfce] bg-white px-5 py-3 text-xs font-black text-[#725f4d]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Product Card: Carte produit B2B Alibaba
// ---------------------------------------------------------------------------
function ProductCard({
  product,
  onOpen,
  onRfq,
}: {
  product: ProductWithMeta;
  onOpen: (product: ProductWithMeta) => void;
  onRfq: (product: ProductWithMeta) => void;
}) {
  const { formatPrice } = useLocale();
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const favorites = JSON.parse(localStorage.getItem("eam_marketplace_favorites") || "[]") as string[];
      setFavorite(favorites.includes(product.id));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [product.id]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem("eam_marketplace_favorites") || "[]") as string[];
    const next = favorites.includes(product.id) ? favorites.filter((id) => id !== product.id) : [...favorites, product.id];
    localStorage.setItem("eam_marketplace_favorites", JSON.stringify(next));
    setFavorite(next.includes(product.id));
  };

  const openProduct = () => onOpen(product);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openProduct}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProduct();
        }
      }}
      className="group cursor-pointer overflow-hidden rounded-[22px] border border-[#eadfce] bg-white shadow-[0_12px_34px_rgba(74,48,18,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(74,48,18,0.13)] flex flex-col justify-between"
    >
      <div>
        <div
          className="relative aspect-[4/3] overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${product.accent}55, #f6eee2)` }}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-5xl" aria-hidden="true">
              ✦
            </div>
          )}
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {product.certified && (
              <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#92400e] shadow-sm flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">verified</span> Vérifié
              </span>
            )}
            <span className="rounded-full bg-[#e9f7f5] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#087e8b] shadow-sm">
              Trade Assurance
            </span>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleFavorite();
            }}
            aria-pressed={favorite}
            aria-label={`${favorite ? "Retirer" : "Ajouter"} ${product.title} ${favorite ? "des" : "aux"} favoris`}
            className={`absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm transition hover:bg-white ${
              favorite ? "text-[#9e001f]" : "text-[#6d5541] hover:text-[#9e001f]"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">{favorite ? "favorite" : "favorite_border"}</span>
          </button>
        </div>

        <div className="p-3.5">
          <div className="flex items-center justify-between text-[11px] text-[#806c58]">
            <span className="font-semibold truncate max-w-[140px]">{product.supplier}</span>
            <span className="font-bold text-[#a36300]">MOQ: {product.moq || 10} pcs</span>
          </div>

          <h3 className="mt-1 line-clamp-2 min-h-[40px] font-display text-[14px] font-extrabold leading-5 text-[#2a211a]">
            {product.title}
          </h3>

          <div className="mt-2.5 flex items-baseline justify-between gap-1">
            <div>
              <span className="font-display text-[16px] font-black text-[#9e001f]">{formatPrice(product.priceXof)}</span>
              <span className="block text-[10px] text-[#806c58]">1-9 pcs</span>
            </div>
            <div className="text-right">
              <span className="font-display text-[14px] font-bold text-[#a36300]">
                {formatPrice(Math.round(product.priceXof * 0.78))}
              </span>
              <span className="block text-[10px] font-bold text-[#087e8b]">dès 50 pcs (-22%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#f0e7dc] bg-[#fffaf3] p-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRfq(product);
          }}
          className="flex-1 rounded-full bg-[#a36300] py-1.5 px-3 text-[11px] font-black text-white shadow-sm hover:bg-[#855100] transition flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">request_quote</span> Devis RFQ
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openProduct();
          }}
          className="rounded-full border border-[#eadfce] bg-white py-1.5 px-3 text-[11px] font-bold text-[#725f4d] hover:bg-[#f8f3ed] transition"
        >
          Détails
        </button>
      </div>
    </article>
  );
}

function VendorProductCarousel({
  products,
  onOpen,
  onRfq,
}: {
  products: Array<ProductWithMeta>;
  onOpen: (product: ProductWithMeta) => void;
  onRfq: (product: ProductWithMeta) => void;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const move = (direction: number) => rowRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });

  return (
    <div className="relative mt-4">
      <div ref={rowRef} className="flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]">
        <div className="grid min-w-[220px] max-w-[220px] shrink-0 snap-start place-items-center rounded-[18px] border border-dashed border-[#cdbb9f] bg-[#fffaf3] p-5 text-center">
          <span className="material-symbols-outlined text-3xl text-[#a36300]">storefront</span>
          <p className="mt-2 text-xs font-bold text-[#725f4d]">Catalogue B2B de ce fournisseur</p>
          <p className="mt-1 text-[11px] text-[#806c58]">Commandes en gros avec Trade Assurance.</p>
        </div>
        {products.map((product) => (
          <div key={product.id} className="w-[230px] shrink-0 snap-start">
            <ProductCard product={product} onOpen={onOpen} onRfq={onRfq} />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => move(-1)}
        aria-label="Produits précédents"
        className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#9e001f] shadow-lg"
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        aria-label="Produits suivants"
        className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#9e001f] shadow-lg"
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main MarketplaceClient
// ---------------------------------------------------------------------------
export default function MarketplaceClient({ initialProducts = [] }: { initialProducts?: MarketplaceProduct[] }) {
  const { formatPrice } = useLocale();
  const [products, setProducts] = useState<Array<ProductWithMeta>>(initialProducts.map(normalizeProduct));
  const [viewMode, setViewMode] = useState<MarketplaceView>("products");
  const [b2bFilter, setB2bFilter] = useState<"all" | "verified" | "low_moq" | "ready_to_ship">("all");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [imageSearchPreview, setImageSearchPreview] = useState("");
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchMessage, setImageSearchMessage] = useState("");
  const [showIntro, setShowIntro] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(marketplaceCategories[0]);
  const [country, setCountry] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithMeta | null>(null);
  const [rfqProduct, setRfqProduct] = useState<ProductWithMeta | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem("eam_current_platform", "marketplace");
    } catch {}
  }, []);

  const loadProducts = useCallback(
    async (nextPage: number, replace = false) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(nextPage), q: query, category, country });
        const response = await fetch(`/api/marketplace/products?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("catalogue indisponible");
        const data = await response.json();
        const incoming = (data.products || []).map(normalizeProduct);
        setProducts((current) => (replace ? incoming : [...current, ...incoming]));
        setPage(nextPage);
        setHasMore(Boolean(data.hasMore));
      } catch {
        setError("Le catalogue rencontre un ralentissement. Réessayez dans un instant.");
      } finally {
        setLoading(false);
      }
    },
    [category, country, query]
  );

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const seen = window.localStorage.getItem("eam_marketplace_intro_seen_v1") === "true";
    if (desktop && !seen) {
      setShowIntro(true);
      window.localStorage.setItem("eam_marketplace_intro_seen_v1", "true");
    }
  }, []);

  useEffect(() => {
    loadProducts(0, true);
  }, [loadProducts]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && viewMode === "products") loadProducts(page + 1);
      },
      { rootMargin: "420px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadProducts, page, viewMode]);

  const handleImageSearch = async (file?: File) => {
    if (!file) return;
    setImageSearchLoading(true);
    setImageSearchMessage("");
    const objectUrl = URL.createObjectURL(file);
    setImageSearchPreview(objectUrl);
    const getAverageColor = (source: string | File) =>
      new Promise<[number, number, number]>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 1;
          canvas.height = 1;
          const context = canvas.getContext("2d");
          if (!context) return reject(new Error("canvas"));
          context.drawImage(image, 0, 0, 1, 1);
          const pixel = context.getImageData(0, 0, 1, 1).data;
          resolve([pixel[0], pixel[1], pixel[2]]);
        };
        image.onerror = () => reject(new Error("image"));
        image.src = typeof source === "string" ? source : URL.createObjectURL(source);
      });
    try {
      const target = await getAverageColor(file);
      const ranked = await Promise.all(
        products.map(async (product) => {
          try {
            const color = await getAverageColor(product.image);
            const distance = Math.sqrt(
              (target[0] - color[0]) ** 2 + (target[1] - color[1]) ** 2 + (target[2] - color[2]) ** 2
            );
            return { product, distance };
          } catch {
            return { product, distance: Number.MAX_SAFE_INTEGER };
          }
        })
      );
      setProducts(ranked.sort((a, b) => a.distance - b.distance).map((item) => item.product));
      setViewMode("products");
      setImageSearchMessage("Résultats rapprochés par analyse visuelle.");
    } catch {
      setImageSearchMessage("Cette image n’a pas pu être analysée.");
    } finally {
      setImageSearchLoading(false);
    }
  };

  // Filter products by viewMode and b2bFilter
  const filteredProducts = products.filter((product) => {
    if (viewMode === "certified" && !product.certified) return false;
    if (b2bFilter === "verified" && !product.certified) return false;
    if (b2bFilter === "low_moq" && (product.moq || 10) > 10) return false;
    return true;
  });

  const vendors = Array.from(new Set(filteredProducts.map((product) => product.supplier))).map((supplier) => ({
    supplier,
    products: filteredProducts.filter((product) => product.supplier === supplier),
  }));

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-24 text-[#2a211a]">
      {/* Alibaba Style Top B2B Announcement Ribbon */}
      <div className="border-b border-[#fed7aa] bg-[#fffaf0] py-2 px-4 text-center text-[11px] font-bold text-[#8a5700]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#f59e0b] px-2 py-0.5 text-[9px] font-black uppercase text-white">B2B Pro</span>
            <span>Place de marché grossiste pan-africaine · Commandes directes d&apos;usines & producteurs</span>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#087e8b]">verified_user</span> Trade Assurance EAM
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#a36300]">request_quote</span> Devis RFQ sous 24h
            </span>
            <Link href="/marketplace/vendre" className="font-black text-[#9e001f] hover:underline">
              Devenir Fournisseur Vérifié →
            </Link>
          </div>
        </div>
      </div>

      {showIntro && (
        <section className="relative hidden overflow-hidden bg-[#f2e7d8] md:block">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#ffca63]/30 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[#9e001f]/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-[1280px] gap-10 px-5 pb-12 pt-10 md:grid-cols-[1.05fr_.95fr] md:px-10 md:pb-16 md:pt-14 lg:gap-6 lg:px-16 lg:pb-7 lg:pt-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#80654b]">
                <Link href="/">Accueil</Link>
                <span>›</span>
                <span className="text-[#9e001f]">Marketplace B2B</span>
              </div>
              <p className="mt-9 font-display text-[11px] font-black uppercase tracking-[0.22em] text-[#a36300] lg:mt-3">
                Sourcing Pan-Africain · Vente en gros · Usines directes
              </p>
              <h1 className="mt-3 max-w-[650px] font-display text-[clamp(38px,6vw,64px)] font-black leading-[0.95] tracking-[-0.05em] text-[#2a211a] lg:text-[42px]">
                Le Sourcing Africain, <span className="text-[#9e001f]">façon B2B d&apos;Élite.</span>
              </h1>
              <p className="mt-6 max-w-[590px] text-[16px] leading-7 text-[#725f4d] lg:mt-3 lg:text-[14px] lg:leading-6">
                Connectez-vous directement aux fabricants et producteurs africains. Négociez vos devis en gros (RFQ), sécurisez vos paiements par séquestre bancaire Trade Assurance et organisez vos expéditions.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 lg:mt-4">
                <a
                  href="#catalogue"
                  className="rounded-full bg-[#9e001f] px-6 py-3 text-[12px] font-black text-white shadow-lg shadow-[#9e001f]/15"
                >
                  Explorer les offres grossistes
                </a>
                <Link
                  href="/marketplace/vendre"
                  className="rounded-full border border-[#bca486] bg-white/60 px-6 py-3 text-[12px] font-black text-[#5c3d19] hover:bg-white transition"
                >
                  Devenir Fournisseur Vérifié B2B
                </Link>
              </div>
              <div className="mt-9 grid max-w-[560px] grid-cols-3 gap-3 lg:mt-4">
                <div>
                  <p className="font-display text-2xl font-black text-[#9e001f]">54</p>
                  <p className="text-[11px] text-[#806c58]">pays connectés</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-black text-[#9e001f]">100%</p>
                  <p className="text-[11px] text-[#806c58]">Trade Assurance</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-black text-[#9e001f]">24h</p>
                  <p className="text-[11px] text-[#806c58]">délai réponse RFQ</p>
                </div>
              </div>
            </div>
            <div className="relative min-h-[330px] overflow-hidden rounded-[30px] border border-white/60 bg-[#2a211a] p-6 shadow-2xl md:min-h-[420px] lg:min-h-[220px] lg:p-5 text-white">
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, #ffca63 0 2px, transparent 3px), radial-gradient(circle at 70% 65%, #fff 0 1px, transparent 2px)",
                  backgroundSize: "42px 42px",
                }}
              />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                    Trade Assurance Garanti
                  </span>
                  <span className="material-symbols-outlined text-[38px] text-[#ffca63]">verified_user</span>
                </div>
                <div>
                  <p className="max-w-[330px] font-display text-3xl font-black leading-tight text-white lg:text-2xl">
                    Protection totale de l&apos;Acheteur & du Vendeur.
                  </p>
                  <p className="mt-3 max-w-[350px] text-xs leading-5 text-white/75">
                    Fonds bloqués sur compte séquestre jusqu&apos;à inspection et confirmation de livraison au port de destination.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-[#ffca63] px-3 py-1 text-[10px] font-black text-[#513000]">
                    Paiement Sécurisé Moneroo
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-black text-white">
                    Litiges Pris en Charge
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Catalogue Section */}
      <section id="catalogue" className="mx-auto max-w-[1280px] px-5 py-10 md:px-10 lg:px-16">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="font-display text-[11px] font-black uppercase tracking-[0.2em] text-[#a36300]">Le Catalogue B2B</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.04em]">Fournisseurs, Usines & Produits</h2>
            <p className="mt-2 text-sm text-[#806c58]">
              Comparez les MOQ, les tarifs de gros dégressifs et envoyez vos appels d&apos;offres en un clic.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-[#eadfce] bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("products")}
                className={`rounded-full px-4 py-2 text-[11px] font-black transition ${
                  viewMode === "products" ? "bg-[#9e001f] text-white" : "text-[#725f4d] hover:bg-[#f8f3ed]"
                }`}
              >
                Produits
              </button>
              <button
                type="button"
                onClick={() => setViewMode("vendors")}
                className={`rounded-full px-4 py-2 text-[11px] font-black transition ${
                  viewMode === "vendors" ? "bg-[#9e001f] text-white" : "text-[#725f4d] hover:bg-[#f8f3ed]"
                }`}
              >
                Fournisseurs
              </button>
              <button
                type="button"
                onClick={() => setViewMode("certified")}
                className={`rounded-full px-4 py-2 text-[11px] font-black transition ${
                  viewMode === "certified" ? "bg-[#9e001f] text-white" : "text-[#725f4d] hover:bg-[#f8f3ed]"
                }`}
              >
                Vérifiés Pro
              </button>
              <button
                type="button"
                onClick={() => setToolsOpen((open) => !open)}
                aria-expanded={toolsOpen}
                className={`rounded-full px-4 py-2 text-[11px] font-black transition ${
                  toolsOpen ? "bg-[#9e001f] text-white" : "text-[#725f4d] hover:bg-[#f8f3ed]"
                }`}
              >
                Boîte à outils
              </button>
            </div>
            <Link
              href="/marketplace/vendre"
              className="rounded-full bg-[#ffca63] px-4 py-2.5 text-[11px] font-black text-[#513000] shadow-sm hover:bg-[#ffd685] transition inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">add_business</span>Vendre
            </Link>
          </div>
        </div>

        {/* Search & B2B Filter Bar */}
        <div className="mt-7 rounded-[22px] border border-[#eadfce] bg-white p-3 md:p-4">
          <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr]">
            <div className="flex items-center gap-2">
              <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f8f3ed] px-4">
                <label
                  className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-[#a36300] transition hover:bg-[#fff8ed]"
                  title="Rechercher par image"
                  aria-label="Rechercher par image"
                >
                  <span className="material-symbols-outlined text-[20px]">image_search</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={imageSearchLoading}
                    onChange={(event) => void handleImageSearch(event.target.files?.[0])}
                  />
                </label>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un produit, matière première, fournisseur..."
                  className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                />
                <span className="material-symbols-outlined text-[20px] text-[#a36300]">search</span>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                aria-label="Ouvrir les filtres"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f8f3ed] text-[#9e001f] md:hidden"
              >
                <span className="material-symbols-outlined">filter_alt</span>
              </button>
            </div>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="hidden h-12 rounded-full bg-[#f8f3ed] px-4 text-[12px] font-bold text-[#5d4a39] outline-none md:block"
            >
              {marketplaceCategories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="hidden h-12 rounded-full bg-[#f8f3ed] px-4 text-[12px] font-bold text-[#5d4a39] outline-none md:block"
            >
              {countryOptions.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {filtersOpen && (
            <div className="grid gap-2 rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-3 md:hidden mt-3">
              <label className="text-[11px] font-black uppercase tracking-[0.12em] text-[#806c58]">
                Catégorie
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl bg-white px-3 text-xs font-bold text-[#5d4a39] outline-none"
                >
                  {marketplaceCategories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-black uppercase tracking-[0.12em] text-[#806c58]">
                Pays
                <select
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl bg-white px-3 text-xs font-bold text-[#5d4a39] outline-none"
                >
                  {countryOptions.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {/* Alibaba B2B Quick Filter Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#f0e7dc] pt-3">
            <span className="text-[11px] font-bold text-[#806c58]">Filtres B2B rapides :</span>
            <button
              type="button"
              onClick={() => setB2bFilter("all")}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                b2bFilter === "all" ? "bg-[#2a211a] text-white" : "bg-[#f8f3ed] text-[#725f4d] hover:bg-[#eadfce]"
              }`}
            >
              Tous les produits
            </button>
            <button
              type="button"
              onClick={() => setB2bFilter("verified")}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition flex items-center gap-1 ${
                b2bFilter === "verified" ? "bg-[#92400e] text-white" : "bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a]"
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">verified</span> Fournisseurs Vérifiés
            </button>
            <button
              type="button"
              onClick={() => setB2bFilter("low_moq")}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                b2bFilter === "low_moq" ? "bg-[#087e8b] text-white" : "bg-[#e9f7f5] text-[#087e8b] hover:bg-[#d1f0ec]"
              }`}
            >
              MOQ faible (≤ 10 pcs)
            </button>
            {imageSearchLoading && (
              <span className="text-[11px] font-semibold text-[#806c58]">Analyse de l’image en cours…</span>
            )}
            {imageSearchPreview && (
              <img
                src={imageSearchPreview}
                alt="Image de recherche"
                className="h-8 w-8 rounded-lg border border-[#eadfce] object-cover"
              />
            )}
            {imageSearchMessage && (
              <span className="text-[11px] font-semibold text-[#806c58]">{imageSearchMessage}</span>
            )}
          </div>
        </div>

        {/* Tools Drawer */}
        {toolsOpen && (
          <div className="mt-5 rounded-2xl border border-[#eadfce] bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a36300]">Espace Vendeur & Grossiste</p>
                <h3 className="font-display text-lg font-black">Boîte à outils Professionnelle</h3>
              </div>
              <button
                type="button"
                onClick={() => setToolsOpen(false)}
                aria-label="Fermer la boîte à outils"
                className="grid h-9 w-9 place-items-center rounded-full bg-[#f8f3ed] text-[#9e001f]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <Link
                href="/marketplace/vendre"
                className="rounded-xl border border-[#ffca63] bg-[#fffaf0] p-3 text-xs font-black text-[#8a5700] hover:bg-[#fff5e0] transition flex items-center justify-between"
              >
                <span>+ Ouvrir ma boutique B2B</span>
                <span className="material-symbols-outlined text-[16px]">add_business</span>
              </Link>
              <Link
                href="/marketplace/boutique"
                className="rounded-xl border border-[#eadfce] bg-[#fffaf3] p-3 text-xs font-bold text-[#5c3d19]"
              >
                Gérer mon catalogue
              </Link>
              <Link
                href="/marketplace/commandes"
                className="rounded-xl border border-[#eadfce] bg-[#fffaf3] p-3 text-xs font-bold text-[#5c3d19]"
              >
                Commandes & Livraisons
              </Link>
              <Link
                href="/marketplace/messages"
                className="rounded-xl border border-[#eadfce] bg-[#fffaf3] p-3 text-xs font-bold text-[#5c3d19]"
              >
                Négociations & Devis RFQ
              </Link>
              <Link
                href="/marketplace/admin"
                className="rounded-xl border border-[#eadfce] bg-[#fffaf3] p-3 text-xs font-bold text-[#5c3d19]"
              >
                Tableau de bord Vendeur
              </Link>
            </div>
          </div>
        )}

        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {/* Products Grid or Vendors View */}
        {viewMode === "products" || viewMode === "certified" ? (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpen={setSelectedProduct}
                onRfq={(p) => setRfqProduct(p)}
              />
            ))}
            {!filteredProducts.length && (
              <div className="col-span-full rounded-[24px] border border-dashed border-[#cdbb9f] bg-white p-12 text-center text-sm text-[#806c58]">
                Aucun produit ne correspond aux filtres actuels.
              </div>
            )}
          </div>
        ) : (
          <div className="mt-7 space-y-8">
            {vendors.map((vendor) => (
              <section key={vendor.supplier} className="rounded-[24px] border border-[#eadfce] bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a36300]">Fournisseur Certifié</p>
                      <span className="text-[#087e8b] font-bold text-xs">✓ Vérifié</span>
                    </div>
                    <h3 className="mt-1 font-display text-xl font-black text-[#2a211a]">{vendor.supplier}</h3>
                    <p className="mt-1 text-xs text-[#806c58]">
                      {vendor.products.length} produit{vendor.products.length > 1 ? "s" : ""} disponible{vendor.products.length > 1 ? "s" : ""} avec tarifs de gros dégressifs
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-3xl text-[#087e8b]">storefront</span>
                </div>
                <VendorProductCarousel
                  products={vendor.products}
                  onOpen={setSelectedProduct}
                  onRfq={(p) => setRfqProduct(p)}
                />
              </section>
            ))}
            {!vendors.length && (
              <div className="rounded-[24px] border border-dashed border-[#cdbb9f] bg-white p-12 text-center text-sm text-[#806c58]">
                Aucun fournisseur ne correspond aux critères.
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-[390px] animate-pulse rounded-[22px] bg-[#f1e8dc]" />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-4" />
        {!hasMore && products.length > 0 && (
          <p className="mt-8 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#a18c75]">
            Fin des résultats du catalogue
          </p>
        )}
      </section>

      {/* Selected Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onRfq={(p) => {
            setSelectedProduct(null);
            setRfqProduct(p);
          }}
        />
      )}

      {/* RFQ / Devis B2B Modal */}
      {rfqProduct && <RfqModal product={rfqProduct} onClose={() => setRfqProduct(null)} />}

      {/* Alibaba Style Trust & Guarantees */}
      <section className="border-y border-[#eadfce] bg-[#f5eee5]">
        <div className="mx-auto grid max-w-[1280px] gap-4 px-5 py-10 md:grid-cols-3 md:px-10 lg:px-16">
          <div className="rounded-[24px] bg-white p-6">
            <span className="material-symbols-outlined text-3xl text-[#087e8b]">verified_user</span>
            <h3 className="mt-4 font-display text-lg font-black">Trade Assurance EAM</h3>
            <p className="mt-2 text-sm leading-6 text-[#725f4d]">
              Vos fonds sont sécurisés jusqu&apos;à confirmation de la livraison au port désigné et conformité du contrôle qualité.
            </p>
          </div>
          <div className="rounded-[24px] bg-[#2a211a] p-6 text-white">
            <span className="material-symbols-outlined text-3xl text-[#ffca63]">request_quote</span>
            <h3 className="mt-4 font-display text-lg font-black">Devis B2B & Paliers de Gros</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Négociez directement les MOQ, les remises de volume (jusqu&apos;à -25%) et la personnalisation OEM de packaging.
            </p>
          </div>
          <div className="rounded-[24px] bg-[#9e001f] p-6 text-white">
            <span className="material-symbols-outlined text-3xl text-[#ffca63]">local_shipping</span>
            <h3 className="mt-4 font-display text-lg font-black">Logistique & Dédouanement</h3>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Expédition fluide sur les principaux ports (Cotonou, Abidjan, Douala, Dakar) avec transporteurs partenaires vérifiés.
            </p>
          </div>
        </div>
      </section>

      {/* Parcours Vendeur B2B Moderne, Simple & Passionnant style Alibaba */}
      <section id="publier" className="bg-[#2a211a] text-white py-16 px-5 md:px-10 lg:px-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="text-center max-w-2xl mx-auto">
            <span className="rounded-full bg-[#ffca63]/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#ffca63]">
              Rejoignez les Fabricants d&apos;Élite
            </span>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-black">
              Devenez Fournisseur Vérifié B2B
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Vendez en gros à des milliers d&apos;acheteurs, distributeurs et entreprises à travers les 54 pays africains et la diaspora.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffca63] text-xl font-black text-[#513000]">
                1
              </span>
              <h3 className="mt-5 font-display text-lg font-black text-white">Validation RCCM & Identité</h3>
              <p className="mt-2 text-xs leading-5 text-white/70">
                Audit de conformité de votre entreprise pour obtenir le label de confiance <strong className="text-[#ffca63]">Fournisseur Vérifié Pro</strong> et la couverture Trade Assurance.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffca63] text-xl font-black text-[#513000]">
                2
              </span>
              <h3 className="mt-5 font-display text-lg font-black text-white">Catalogue & Barèmes Dégressifs</h3>
              <p className="mt-2 text-xs leading-5 text-white/70">
                Publiez vos fiches produits avec vos quantités minimales (MOQ), délais de production, options de marquage logo et grilles de remises.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffca63] text-xl font-black text-[#513000]">
                3
              </span>
              <h3 className="mt-5 font-display text-lg font-black text-white">Appels d&apos;Offres & Ventes Sécurisées</h3>
              <p className="mt-2 text-xs leading-5 text-white/70">
                Recevez les devis RFQ, négociez en direct et recevez vos paiements garantis sans risque d&apos;impayé grâce au séquestre EAM.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/marketplace/vendre"
              className="inline-flex items-center gap-2 rounded-full bg-[#ffca63] px-8 py-4 text-xs font-black text-[#513000] shadow-xl hover:bg-[#ffd685] transition"
            >
              <span className="material-symbols-outlined text-[18px]">add_business</span>
              Ouvrir ma boutique Fournisseur Vérifié B2B
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
