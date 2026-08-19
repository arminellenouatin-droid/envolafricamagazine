"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { marketplaceCategories, type MarketplaceProduct } from "@/lib/marketplace-seed";

const countryOptions = [{ code: "", label: "Tous les pays" }, { code: "BJ", label: "Bénin" }, { code: "CI", label: "Côte d’Ivoire" }, { code: "CM", label: "Cameroun" }, { code: "BF", label: "Burkina Faso" }, { code: "SN", label: "Sénégal" }, { code: "ML", label: "Mali" }, { code: "TG", label: "Togo" }];
const countryLabels = Object.fromEntries(countryOptions.map((country) => [country.code, country.label]));

type ApiProduct = Partial<MarketplaceProduct> & { id: string; title: string; description?: string; media?: unknown; product_video_url?: string; product_video_mime?: string; price_xof?: number; country_code?: string; installment_enabled?: boolean; installment_months_max?: number; is_boosted?: boolean; magazineId?: string; magazineNumero?: number; isMagazine?: boolean; marketplace_suppliers?: { business_name: string; certification_status: string; rating: number } | { business_name: string; certification_status: string; rating: number }[] };
type MarketplaceView = "products" | "vendors" | "certified";

function normalizeProduct(product: ApiProduct): MarketplaceProduct {
  const supplier = Array.isArray(product.marketplace_suppliers) ? product.marketplace_suppliers[0] : product.marketplace_suppliers;
  return { id: product.id, title: product.title, description: product.description || "", category: product.category || "Autres produits", supplier: supplier?.business_name || product.supplier || "Fournisseur Envol Africa", country: product.country_code ?? product.country ?? "", city: product.city || "", priceXof: product.price_xof ?? product.priceXof ?? 0, image: product.image || (Array.isArray(product.media) && typeof product.media[0] === "string" ? product.media[0] : ""), accent: product.accent || "#a36300", certified: Boolean(supplier?.certification_status === "certified" || product.certified), boosted: Boolean(product.is_boosted ?? product.boosted), installment: Boolean(product.installment_enabled ?? product.installment), months: product.installment_months_max ?? product.months ?? 0, ...(product.product_video_url ? { videoUrl: product.product_video_url, videoMime: product.product_video_mime } : {}), ...(product.isMagazine ? { isMagazine: true, magazineId: product.magazineId, magazineNumero: product.magazineNumero } : {}) } as MarketplaceProduct & { isMagazine?: boolean; magazineId?: string; magazineNumero?: number; videoUrl?: string; videoMime?: string };
}

function formatXof(value: number) { return new Intl.NumberFormat("fr-FR").format(value) + " XOF"; }

type ProductWithMeta = MarketplaceProduct & { isMagazine?: boolean; magazineId?: string; magazineNumero?: number; videoUrl?: string; videoMime?: string };

function ProductDetailModal({ product, onClose }: { product: ProductWithMeta; onClose: () => void }) {
  const [favorite, setFavorite] = useState(false);
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("eam_marketplace_favorites") || "[]") as string[];
    setFavorite(favorites.includes(product.id));
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [onClose, product.id]);
  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem("eam_marketplace_favorites") || "[]") as string[];
    const next = favorites.includes(product.id) ? favorites.filter((id) => id !== product.id) : [...favorites, product.id];
    localStorage.setItem("eam_marketplace_favorites", JSON.stringify(next));
    setFavorite(next.includes(product.id));
  };
  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("eam_cart") || "[]");
    cart.push(product.isMagazine ? { type: "magazine", magazineId: product.magazineId, format: "numerique", language: "fr", price: product.priceXof, title: product.title, cover: product.image, numero: product.magazineNumero } : { type: "marketplace", productId: product.id, price: product.priceXof, title: product.title, image: product.image, installment: product.installment, months: product.months });
    localStorage.setItem("eam_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("eam-cart-updated"));
  };
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#2a211a]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="marketplace-product-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-[28px] bg-[#fffdfb] shadow-2xl sm:rounded-[28px]"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eadfce] bg-[#fffdfb]/95 px-5 py-4 backdrop-blur"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a36300]">Fiche globale du produit</p><button type="button" onClick={onClose} aria-label="Fermer la fiche produit" className="grid h-10 w-10 place-items-center rounded-full bg-[#f8f3ed] text-[#9e001f]"><span className="material-symbols-outlined">close</span></button></div><div className="grid gap-6 p-5 md:grid-cols-[.95fr_1.05fr] md:p-7"><div className="overflow-hidden rounded-[22px] bg-[#f5eee5]">{product.videoUrl ? <video src={product.videoUrl} poster={product.image || undefined} controls playsInline className="aspect-square h-full w-full object-cover" /> : product.image ? <img src={product.image} alt={product.title} className="aspect-square h-full w-full object-cover" /> : <div className="grid aspect-square place-items-center text-6xl">✦</div>}</div><div><div className="flex flex-wrap gap-2">{product.certified && <span className="rounded-full bg-[#e9f7f5] px-3 py-1 text-[10px] font-black uppercase text-[#087e8b]">Certifié</span>}{product.boosted && <span className="rounded-full bg-[#ffca63] px-3 py-1 text-[10px] font-black uppercase text-[#513000]">Boosté</span>}</div><h2 id="marketplace-product-title" className="mt-3 font-display text-3xl font-black leading-tight text-[#2a211a]">{product.title}</h2><p className="mt-4 font-display text-2xl font-black text-[#9e001f]">{formatXof(product.priceXof)}</p>{product.installment && <p className="mt-3 inline-flex rounded-full bg-[#f5eee4] px-3 py-2 text-xs font-bold text-[#765326]">Paiement échelonné · jusqu’à {product.months} mois</p>}<div className="mt-5 space-y-2 border-y border-[#eadfce] py-4 text-sm text-[#725f4d]"><p><strong className="text-[#2a211a]">Vendeur :</strong> {product.supplier}</p>{product.category && <p><strong className="text-[#2a211a]">Catégorie :</strong> {product.category}</p>}{product.country && <p><strong className="text-[#2a211a]">Zone :</strong> {countryLabels[product.country] || product.country}{product.city ? ` · ${product.city}` : ""}</p>}</div><p className="mt-5 whitespace-pre-line text-sm leading-6 text-[#725f4d]">{product.description || "Ce vendeur présente ce produit sur la marketplace Envol Africa."}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={addToCart} className="rounded-full bg-[#9e001f] px-5 py-3 text-sm font-black text-white">Ajouter au panier</button><button type="button" onClick={toggleFavorite} aria-pressed={favorite} className="rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-black text-[#5c3d19]"><span className="material-symbols-outlined mr-1 align-middle text-[18px]">{favorite ? "favorite" : "favorite_border"}</span>{favorite ? "Retirer des favoris" : "Ajouter aux favoris"}</button><button type="button" onClick={() => { window.location.assign(`/marketplace/messages?productId=${encodeURIComponent(product.id)}`); }} className="rounded-full border border-[#eadfce] bg-[#fffaf3] px-5 py-3 text-sm font-black text-[#5c3d19]">Contacter le vendeur</button><button type="button" onClick={onClose} className="rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-black text-[#725f4d]">Continuer mes achats</button></div></div></div></div></div>;
}

function VendorProductCarousel({ products, onOpen }: { products: Array<ProductWithMeta>; onOpen: (product: ProductWithMeta) => void }) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const move = (direction: number) => rowRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  return <div className="relative mt-4"><div ref={rowRef} className="flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]"><div className="grid min-w-[220px] max-w-[220px] shrink-0 snap-start place-items-center rounded-[18px] border border-dashed border-[#cdbb9f] bg-[#fffaf3] p-5 text-center"><span className="material-symbols-outlined text-3xl text-[#a36300]">storefront</span><p className="mt-2 text-xs font-bold text-[#725f4d]">Produits de ce vendeur</p><p className="mt-1 text-[11px] text-[#806c58]">Faites défiler manuellement pour découvrir le catalogue.</p></div>{products.map((product) => <div key={product.id} className="w-[220px] shrink-0 snap-start"><ProductCard product={product} onOpen={onOpen} /></div>)}</div><button type="button" onClick={() => move(-1)} aria-label="Produits précédents" className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#9e001f] shadow-lg"><span className="material-symbols-outlined">chevron_left</span></button><button type="button" onClick={() => move(1)} aria-label="Produits suivants" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#9e001f] shadow-lg"><span className="material-symbols-outlined">chevron_right</span></button></div>;
}

function ProductCard({ product, onOpen }: { product: ProductWithMeta; onOpen: (product: ProductWithMeta) => void }) {
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
  return <article role="button" tabIndex={0} onClick={openProduct} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openProduct(); } }} className="group cursor-pointer overflow-hidden rounded-[22px] border border-[#eadfce] bg-white shadow-[0_12px_34px_rgba(74,48,18,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(74,48,18,0.13)]">
    <div className="relative aspect-[4/3] overflow-hidden" style={{ background: `linear-gradient(135deg, ${product.accent}55, #f6eee2)` }}>
      {product.image ? <img src={product.image} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center text-5xl" aria-hidden="true">✦</div>}
      <div className="absolute left-3 top-3 flex gap-2">{product.boosted && <span className="rounded-full bg-[#ffca63] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#513000]">Boosté</span>}{product.certified && <span className="rounded-full bg-[#e9f7f5] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#087e8b]">Certifié</span>}</div>
      <button type="button" onClick={(event) => { event.stopPropagation(); toggleFavorite(); }} aria-pressed={favorite} aria-label={`${favorite ? "Retirer" : "Ajouter"} ${product.title} ${favorite ? "des" : "aux"} favoris`} className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm transition hover:bg-white ${favorite ? "text-[#9e001f]" : "text-[#6d5541] hover:text-[#9e001f]"}`}><span className="material-symbols-outlined text-[19px]">{favorite ? "favorite" : "favorite_border"}</span></button>
    </div>
    <div className="p-4 lg:p-3">
      <div className="flex items-start justify-between gap-3"><div><h3 className="mt-1 line-clamp-2 min-h-[44px] font-display text-[15px] font-extrabold leading-5 text-[#2a211a]">{product.title}</h3></div></div>
      <div className="mt-4 flex items-center justify-between gap-2"><span className="font-display text-[17px] font-black text-[#9e001f]">{formatXof(product.priceXof)}</span></div>
      {product.installment && <div className="mt-3 border-t border-[#f0e7dc] pt-3"><span className="inline-flex rounded-full bg-[#f5eee4] px-2 py-1 text-[10px] font-bold text-[#765326]">Paiement échelonné · jusqu’à {product.months} mois</span></div>}
    </div>
  </article>;
}

export default function MarketplaceClient() {
  const [products, setProducts] = useState<Array<MarketplaceProduct & { isMagazine?: boolean; magazineId?: string; magazineNumero?: number }>>([]);
  const [viewMode, setViewMode] = useState<MarketplaceView>("products");
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithMeta | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadProducts = useCallback(async (nextPage: number, replace = false) => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(nextPage), q: query, category, country });
      const response = await fetch(`/api/marketplace/products?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("catalogue indisponible");
      const data = await response.json();
      const incoming = (data.products || []).map(normalizeProduct);
      setProducts((current) => replace ? incoming : [...current, ...incoming]);
      setPage(nextPage); setHasMore(Boolean(data.hasMore));
    } catch { setError("Le catalogue rencontre un ralentissement. Réessayez dans un instant."); }
    finally { setLoading(false); }
  }, [category, country, query]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const seen = window.localStorage.getItem("eam_marketplace_intro_seen_v1") === "true";
    if (desktop && !seen) {
      setShowIntro(true);
      window.localStorage.setItem("eam_marketplace_intro_seen_v1", "true");
    }
  }, []);
  useEffect(() => { loadProducts(0, true); }, [loadProducts]);
  useEffect(() => { const node = sentinelRef.current; if (!node) return; const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting && hasMore && !loading && viewMode === "products") loadProducts(page + 1); }, { rootMargin: "420px" }); observer.observe(node); return () => observer.disconnect(); }, [hasMore, loading, loadProducts, page, viewMode]);

  const handleImageSearch = async (file?: File) => {
    if (!file) return;
    setImageSearchLoading(true);
    setImageSearchMessage("");
    const objectUrl = URL.createObjectURL(file);
    setImageSearchPreview(objectUrl);
    const getAverageColor = (source: string | File) => new Promise<[number, number, number]>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => { const canvas = document.createElement("canvas"); canvas.width = 1; canvas.height = 1; const context = canvas.getContext("2d"); if (!context) return reject(new Error("canvas")); context.drawImage(image, 0, 0, 1, 1); const pixel = context.getImageData(0, 0, 1, 1).data; resolve([pixel[0], pixel[1], pixel[2]]); };
      image.onerror = () => reject(new Error("image"));
      image.src = typeof source === "string" ? source : URL.createObjectURL(source);
    });
    try {
      const target = await getAverageColor(file);
      const ranked = await Promise.all(products.map(async (product) => { try { const color = await getAverageColor(product.image); const distance = Math.sqrt((target[0] - color[0]) ** 2 + (target[1] - color[1]) ** 2 + (target[2] - color[2]) ** 2); return { product, distance }; } catch { return { product, distance: Number.MAX_SAFE_INTEGER }; } }));
      setProducts(ranked.sort((a, b) => a.distance - b.distance).map((item) => item.product));
      setViewMode("products");
      setImageSearchMessage("Résultats rapprochés par analyse visuelle de l’image.");
    } catch { setImageSearchMessage("Cette image n’a pas pu être analysée. Essayez un autre fichier."); }
    finally { setImageSearchLoading(false); }
  };

  const certifiedProducts = products.filter((product) => product.certified);
  const vendors = Array.from(new Set(products.map((product) => product.supplier))).map((supplier) => ({ supplier, products: products.filter((product) => product.supplier === supplier) }));

  return <div className="min-h-screen bg-[#fcf9f8] pb-24 text-[#2a211a]">
    {showIntro && <section className="relative hidden overflow-hidden bg-[#f2e7d8] md:block">
      <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#ffca63]/30 blur-3xl" /><div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[#9e001f]/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-[1280px] gap-10 px-5 pb-12 pt-10 md:grid-cols-[1.05fr_.95fr] md:px-10 md:pb-16 md:pt-14 lg:gap-6 lg:px-16 lg:pb-7 lg:pt-6">
        <div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#80654b]"><Link href="/">Accueil</Link><span>›</span><span className="text-[#9e001f]">Marketplace</span></div><p className="mt-9 font-display text-[11px] font-black uppercase tracking-[0.22em] text-[#a36300] lg:mt-3">Acheter · vendre · grandir en Afrique</p><h1 className="mt-3 max-w-[650px] font-display text-[clamp(38px,6vw,70px)] font-black leading-[0.95] tracking-[-0.05em] text-[#2a211a] lg:text-[44px]">Le commerce africain, <span className="text-[#9e001f]">sans détour.</span></h1><p className="mt-6 max-w-[590px] text-[16px] leading-7 text-[#725f4d] lg:mt-3 lg:text-[14px] lg:leading-6">Découvrez des fournisseurs africains, échangez dans un espace protégé et achetez au comptant ou en paiement échelonné jusqu’à 12 mois.</p><div className="mt-8 flex flex-wrap gap-3 lg:mt-4"><a href="#catalogue" className="rounded-full bg-[#9e001f] px-6 py-3 text-[12px] font-black text-white shadow-lg shadow-[#9e001f]/15">Explorer le catalogue</a><a href="#publier" className="rounded-full border border-[#bca486] bg-white/60 px-6 py-3 text-[12px] font-black text-[#5c3d19]">Je suis fournisseur</a></div><div className="mt-9 grid max-w-[560px] grid-cols-3 gap-3 lg:mt-4"><div><p className="font-display text-2xl font-black text-[#9e001f]">7</p><p className="text-[11px] text-[#806c58]">pays représentés</p></div><div><p className="font-display text-2xl font-black text-[#9e001f]">12×</p><p className="text-[11px] text-[#806c58]">paiement flexible</p></div><div><p className="font-display text-2xl font-black text-[#9e001f]">100%</p><p className="text-[11px] text-[#806c58]">échanges protégés</p></div></div></div>
        <div className="relative min-h-[330px] overflow-hidden rounded-[30px] border border-white/60 bg-[#9e001f] p-6 shadow-2xl md:min-h-[420px] lg:min-h-[220px] lg:p-5"><div className="absolute inset-0 opacity-35" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #ffca63 0 2px, transparent 3px), radial-gradient(circle at 70% 65%, #fff 0 1px, transparent 2px)", backgroundSize: "42px 42px" }} /><div className="relative flex h-full flex-col justify-between"><div className="flex items-center justify-between"><span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white">Marketplace EAM</span><span className="material-symbols-outlined text-[38px] text-[#ffca63]">storefront</span></div><div><p className="max-w-[330px] font-display text-4xl font-black leading-[0.95] text-white lg:text-3xl">Des produits. Des preuves. Des relations durables.</p><p className="mt-4 max-w-[350px] text-sm leading-6 text-white/75 lg:mt-2 lg:text-xs lg:leading-5">Les produits boostés remontent aussi dans le réseau professionnel WAB.</p></div><div className="flex gap-2"><span className="rounded-full bg-[#ffca63] px-3 py-1.5 text-[10px] font-black text-[#513000]">Certifié 50 000 XOF/an</span><span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black text-white">Paiement sécurisé</span></div></div></div>
      </div>
    </section>}

    <section id="catalogue" className="mx-auto max-w-[1280px] px-5 py-10 md:px-10 lg:px-16"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="font-display text-[11px] font-black uppercase tracking-[0.2em] text-[#a36300]">Le catalogue</p><h2 className="mt-2 font-display text-3xl font-black tracking-[-0.04em]">Trouvez votre prochaine opportunité</h2><p className="mt-2 text-sm text-[#806c58]">Les produits boostés apparaissent en premier, sans remplacer la pertinence de votre recherche.</p></div><div className="flex rounded-full border border-[#eadfce] bg-white p-1 shadow-sm"><button type="button" onClick={() => setViewMode("products")} className={`rounded-full px-4 py-2 text-[11px] font-black transition ${viewMode === "products" ? "bg-[#9e001f] text-white" : "text-[#725f4d] hover:bg-[#f8f3ed]"}`}>Produits</button><button type="button" onClick={() => setViewMode("vendors")} className={`rounded-full px-4 py-2 text-[11px] font-black transition ${viewMode === "vendors" ? "bg-[#9e001f] text-white" : "text-[#725f4d] hover:bg-[#f8f3ed]"}`}>Vendeurs</button><button type="button" onClick={() => setViewMode("certified")} className={`rounded-full px-4 py-2 text-[11px] font-black transition ${viewMode === "certified" ? "bg-[#9e001f] text-white" : "text-[#725f4d] hover:bg-[#f8f3ed]"}`}>Certifiés</button><button type="button" onClick={() => setToolsOpen((open) => !open)} aria-expanded={toolsOpen} className={`rounded-full px-4 py-2 text-[11px] font-black transition ${toolsOpen ? "bg-[#9e001f] text-white" : "text-[#725f4d] hover:bg-[#f8f3ed]"}`}>Boîte à outils</button></div></div>
      <div className="mt-7 rounded-[22px] border border-[#eadfce] bg-white p-3 md:p-4"><div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr]"><div className="flex items-center gap-2"><div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f8f3ed] px-4"><label className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-[#a36300] transition hover:bg-[#fff8ed]" title="Rechercher par image" aria-label="Rechercher par image"><span className="material-symbols-outlined text-[20px]">image_search</span><input type="file" accept="image/*" className="sr-only" disabled={imageSearchLoading} onChange={(event) => void handleImageSearch(event.target.files?.[0])} /></label><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un produit, une entreprise..." className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" /><span className="material-symbols-outlined text-[20px] text-[#a36300]">search</span></div><button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} aria-label="Ouvrir les filtres" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f8f3ed] text-[#9e001f] md:hidden"><span className="material-symbols-outlined">filter_alt</span></button></div><select value={category} onChange={(event) => setCategory(event.target.value)} className="hidden h-12 rounded-full bg-[#f8f3ed] px-4 text-[12px] font-bold text-[#5d4a39] outline-none md:block">{marketplaceCategories.map((item) => <option key={item}>{item}</option>)}</select><select value={country} onChange={(event) => setCountry(event.target.value)} className="hidden h-12 rounded-full bg-[#f8f3ed] px-4 text-[12px] font-bold text-[#5d4a39] outline-none md:block">{countryOptions.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></div>{filtersOpen && <div className="grid gap-2 rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-3 md:hidden"><label className="text-[11px] font-black uppercase tracking-[0.12em] text-[#806c58]">Catégorie<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 h-10 w-full rounded-xl bg-white px-3 text-xs font-bold text-[#5d4a39] outline-none">{marketplaceCategories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-[11px] font-black uppercase tracking-[0.12em] text-[#806c58]">Pays<select value={country} onChange={(event) => setCountry(event.target.value)} className="mt-1 h-10 w-full rounded-xl bg-white px-3 text-xs font-bold text-[#5d4a39] outline-none">{countryOptions.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label></div>}<div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#f0e7dc] pt-3">{imageSearchLoading && <span className="text-[11px] font-semibold text-[#806c58]">Analyse de l’image en cours…</span>}{imageSearchPreview && <img src={imageSearchPreview} alt="Image utilisée pour la recherche" className="h-9 w-9 rounded-lg border border-[#eadfce] object-cover" />}{imageSearchMessage && <span className="text-[11px] font-semibold text-[#806c58]">{imageSearchMessage}</span>}</div></div>
      {toolsOpen && <div className="mt-5 rounded-2xl border border-[#eadfce] bg-white p-4 shadow-lg"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a36300]">Marketplace EAM</p><h3 className="font-display text-lg font-black">Boîte à outils</h3></div><button type="button" onClick={() => setToolsOpen(false)} aria-label="Fermer la boîte à outils" className="grid h-9 w-9 place-items-center rounded-full bg-[#f8f3ed] text-[#9e001f]"><span className="material-symbols-outlined">close</span></button></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Link href="/marketplace/boutique" className="rounded-xl border border-[#eadfce] bg-[#fffaf3] p-3 text-xs font-bold text-[#5c3d19]">Ma boutique</Link><Link href="/marketplace/commandes" className="rounded-xl border border-[#eadfce] bg-[#fffaf3] p-3 text-xs font-bold text-[#5c3d19]">Mes commandes</Link><Link href="/marketplace/messages" className="rounded-xl border border-[#eadfce] bg-[#fffaf3] p-3 text-xs font-bold text-[#5c3d19]">Messages Marketplace</Link><Link href="/marketplace/admin" className="rounded-xl border border-[#eadfce] bg-[#fffaf3] p-3 text-xs font-bold text-[#5c3d19]">Administration vendeur</Link></div></div>}
      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {viewMode === "products" || viewMode === "certified" ? <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{(viewMode === "certified" ? certifiedProducts : products).map((product) => <ProductCard key={product.id} product={product} onOpen={setSelectedProduct} />)}{viewMode === "certified" && !certifiedProducts.length && <div className="col-span-full rounded-[24px] border border-dashed border-[#cdbb9f] bg-white p-12 text-center text-sm text-[#806c58]">Aucun produit certifié ne correspond aux filtres actuels.</div>}</div> : <div className="mt-7 space-y-8">{vendors.map((vendor) => <section key={vendor.supplier} className="rounded-[24px] border border-[#eadfce] bg-white p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a36300]">Vendeur</p><h3 className="mt-1 font-display text-xl font-black text-[#2a211a]">{vendor.supplier}</h3><p className="mt-1 text-xs text-[#806c58]">{vendor.products.length} produit{vendor.products.length > 1 ? "s" : ""} disponible{vendor.products.length > 1 ? "s" : ""}</p></div><span className="material-symbols-outlined text-3xl text-[#087e8b]">storefront</span></div><VendorProductCarousel products={vendor.products} onOpen={setSelectedProduct} /></section>)}{!vendors.length && <div className="rounded-[24px] border border-dashed border-[#cdbb9f] bg-white p-12 text-center text-sm text-[#806c58]">Aucun vendeur ne correspond aux filtres actuels.</div>}</div>}
      {loading && <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="h-[390px] animate-pulse rounded-[22px] bg-[#f1e8dc]" />)}</div>}
      {!loading && !products.length && <div className="mt-8 rounded-[24px] border border-dashed border-[#cdbb9f] bg-white p-12 text-center"><span className="material-symbols-outlined text-4xl text-[#a36300]">search_off</span><h3 className="mt-3 font-display text-lg font-black">Aucun produit ne correspond à cette recherche</h3><p className="mt-2 text-sm text-[#806c58]">Essayez une autre catégorie ou recherchez un fournisseur africain.</p></div>}
      <div ref={sentinelRef} className="h-4" />{!hasMore && products.length > 0 && <p className="mt-8 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#a18c75]">Vous êtes arrivé au bout du catalogue actuel</p>}
    </section>

    {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    <section className="border-y border-[#eadfce] bg-[#f5eee5]"><div className="mx-auto grid max-w-[1280px] gap-4 px-5 py-10 md:grid-cols-3 md:px-10 lg:px-16"><div className="rounded-[24px] bg-white p-6"><span className="material-symbols-outlined text-3xl text-[#087e8b]">verified_user</span><h3 className="mt-4 font-display text-lg font-black">Certification fournisseur</h3><p className="mt-2 text-sm leading-6 text-[#725f4d]">Une certification annuelle à 50 000 XOF renforce la confiance et identifie les entreprises contrôlées par Envol Africa.</p><a href="#publier" className="mt-5 inline-flex text-[12px] font-black text-[#9e001f]">Comprendre la certification →</a></div><div className="rounded-[24px] bg-[#2a211a] p-6 text-white"><span className="material-symbols-outlined text-3xl text-[#ffca63]">campaign</span><h3 className="mt-4 font-display text-lg font-black">Boost + diffusion WAB</h3><p className="mt-2 text-sm leading-6 text-white/70">Mettez un produit en avant et amplifiez sa visibilité dans le réseau professionnel World Africa Business.</p><a href="#publier" className="mt-5 inline-flex text-[12px] font-black text-[#ffca63]">Booster un produit →</a></div><div className="rounded-[24px] bg-[#9e001f] p-6 text-white"><span className="material-symbols-outlined text-3xl text-[#ffca63]">calendar_month</span><h3 className="mt-4 font-display text-lg font-black">Acheter en plusieurs tranches</h3><p className="mt-2 text-sm leading-6 text-white/75">Jusqu’à 12 mois. Le produit reste réservé jusqu’au paiement complet, sauf accord explicite du fournisseur.</p><a href="#securite" className="mt-5 inline-flex text-[12px] font-black text-[#ffca63]">Voir les règles →</a></div></div></section>

    <section id="securite" className="mx-auto max-w-[1280px] px-5 py-12 md:px-10 lg:px-16"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><div><p className="font-display text-[11px] font-black uppercase tracking-[0.2em] text-[#a36300]">Notre cadre de confiance</p><h2 className="mt-2 font-display text-3xl font-black">Acheter sans sortir de la plateforme</h2><p className="mt-4 text-sm leading-6 text-[#725f4d]">Les coordonnées, liens externes et moyens de contournement sont bloqués dans la messagerie. Les images et documents passent par une analyse technique avant transmission.</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-[18px] border border-[#eadfce] bg-white p-5"><span className="material-symbols-outlined text-[#9e001f]">shield</span><p className="mt-3 text-sm font-bold">Alerte anti-contournement</p><p className="mt-1 text-xs leading-5 text-[#806c58]">En dehors d’EAM, les échanges et paiements ne sont plus couverts par notre protection.</p></div><div className="rounded-[18px] border border-[#eadfce] bg-white p-5"><span className="material-symbols-outlined text-[#9e001f]">document_scanner</span><p className="mt-3 text-sm font-bold">Médias modérés</p><p className="mt-1 text-xs leading-5 text-[#806c58]">Les fournisseurs peuvent montrer leurs produits ; la transmission est contrôlée avant envoi.</p></div><div className="rounded-[18px] border border-[#eadfce] bg-white p-5"><span className="material-symbols-outlined text-[#9e001f]">payments</span><p className="mt-3 text-sm font-bold">Paiements traçables</p><p className="mt-1 text-xs leading-5 text-[#806c58]">Chaque échéance, pénalité et confirmation est visible dans les comptes acheteur et fournisseur.</p></div><div className="rounded-[18px] border border-[#eadfce] bg-white p-5"><span className="material-symbols-outlined text-[#9e001f]">local_shipping</span><p className="mt-3 text-sm font-bold">Libération après réception</p><p className="mt-1 text-xs leading-5 text-[#806c58]">Les frais fournisseur sont libérés après confirmation de réception, sauf accord prévu.</p></div></div></div></section>

    <section id="publier" className="bg-[#2a211a] text-white"><div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center md:px-10 lg:px-16"><div><p className="font-display text-[11px] font-black uppercase tracking-[0.2em] text-[#ffca63]">Pour les fournisseurs</p><h2 className="mt-2 font-display text-3xl font-black">Vendez au-delà de vos frontières</h2><p className="mt-2 max-w-[620px] text-sm leading-6 text-white/70">Publiez vos produits, activez le paiement échelonné, obtenez votre certification et présentez vos offres à la communauté WAB.</p></div><Link href="/auth/login?next=/marketplace#publier" className="shrink-0 rounded-full bg-[#ffca63] px-6 py-3 text-[12px] font-black text-[#513000]">Créer ma boutique</Link></div></section>
  </div>;
}
