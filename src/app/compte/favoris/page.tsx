"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export default function FavorisPage() {
  const { formatPrice } = useLocale();
  const [favs, setFavs] = useState<string[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "articles" | "products">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : { favorites: [] }))
      .then(async (d) => {
        let ids = (d.favorites || []) as string[];
        try {
          const localMarketFavs = JSON.parse(localStorage.getItem("eam_marketplace_favorites") || "[]") as string[];
          if (localMarketFavs.length > 0) {
            ids = Array.from(new Set([...ids, ...localMarketFavs]));
          }
          const localArtFavs = JSON.parse(localStorage.getItem("eam_favorites") || "[]");
          const localArtIds = localArtFavs.map((item: any) => (typeof item === "string" ? item : item.id)).filter(Boolean);
          if (localArtIds.length > 0) {
            ids = Array.from(new Set([...ids, ...localArtIds]));
          }
        } catch {}

        setFavs(ids);

        if (ids.length > 0) {
          const [artRes, prodRes] = await Promise.all([
            fetch("/api/articles").then((r) => (r.ok ? r.json() : { articles: [] })).catch(() => ({ articles: [] })),
            fetch("/api/marketplace/products").then((r) => (r.ok ? r.json() : { products: [] })).catch(() => ({ products: [] })),
          ]);

          const matchedArticles = (artRes.articles || []).filter((art: any) => ids.includes(art.id));
          const matchedProducts = (prodRes.products || []).filter((prd: any) => ids.includes(prd.id));

          setArticles(matchedArticles);
          setProducts(matchedProducts);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const removeFav = async (id: string, type: "article" | "product") => {
    await fetch(`/api/favorites?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    try {
      if (type === "article") {
        const local = JSON.parse(localStorage.getItem("eam_favorites") || "[]");
        localStorage.setItem("eam_favorites", JSON.stringify(local.filter((f: any) => (typeof f === "string" ? f !== id : f.id !== id))));
      } else {
        const local = JSON.parse(localStorage.getItem("eam_marketplace_favorites") || "[]") as string[];
        localStorage.setItem("eam_marketplace_favorites", JSON.stringify(local.filter((f) => f !== id)));
        const meta = JSON.parse(localStorage.getItem("eam_saved_products_meta") || "{}");
        delete meta[id];
        localStorage.setItem("eam_saved_products_meta", JSON.stringify(meta));
      }
      window.dispatchEvent(new Event("eam-favorites-updated"));
      window.dispatchEvent(new Event("storage"));
    } catch {}

    setFavs((prev) => prev.filter((f) => f !== id));
    if (type === "article") {
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const totalCount = articles.length + products.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif font-black text-[24px] text-[#0A1931] dark:text-white">Mes favoris</h1>
        <div className="bg-white dark:bg-slate-900 rounded-[20px] border p-10 text-center text-zinc-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif font-black text-[24px] text-[#0A1931] dark:text-white">
          Mes favoris • {totalCount}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === "all" ? "bg-[#9e001f] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Tous ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("articles")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === "articles" ? "bg-[#9e001f] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Articles ({articles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === "products" ? "bg-[#9e001f] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Produits ({products.length})
          </button>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[20px] border p-10 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-xl">❤️</div>
          <div className="font-bold mt-4 text-[#0A1931] dark:text-white">Aucun favori enregistré</div>
          <p className="text-[13px] text-zinc-500 mt-1 max-w-[340px] mx-auto">
            Sauvegardez vos articles préférés et vos produits de la Marketplace pour les retrouver facilement à tout moment.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/"
              className="inline-block h-10 px-5 rounded-full bg-[#0A1931] text-white text-[13px] font-bold leading-[40px] hover:bg-[#1a2e4d]"
            >
              Découvrir les articles
            </Link>
            <Link
              href="/marketplace"
              className="inline-block h-10 px-5 rounded-full bg-[#9e001f] text-white text-[13px] font-bold leading-[40px] hover:bg-[#b00023]"
            >
              Explorer le Marketplace
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {(activeTab === "all" || activeTab === "articles") && articles.length > 0 && (
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#9e001f] mb-3">Articles enregistrés</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {articles.map((a: any) => (
                  <div key={a.id} className="bg-white dark:bg-slate-900 rounded-[16px] border p-4 flex gap-3 shadow-sm">
                    <img src={a.image} alt={a.title} className="w-20 h-20 rounded-[12px] object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/article/${a.slug}`} className="font-bold text-[13px] leading-tight hover:text-[#9e001f] block truncate">
                        {a.title}
                      </Link>
                      <div className="text-[11px] text-zinc-500 mt-1">{a.category} • {a.readingTime || 5} min</div>
                      <button onClick={() => removeFav(a.id, "article")} className="mt-2 text-[11px] font-bold text-red-600 hover:underline">
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === "all" || activeTab === "products") && products.length > 0 && (
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#a36300] mb-3">Produits Marketplace</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {products.map((p: any) => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 rounded-[16px] border border-amber-200 dark:border-slate-800 p-4 flex gap-3 shadow-sm">
                    <img
                      src={p.image || (Array.isArray(p.media) ? p.media[0] : "") || "/logo-reduit.png"}
                      alt={p.title}
                      className="w-20 h-20 rounded-[12px] object-cover shrink-0 bg-amber-50"
                    />
                    <div className="flex-1 min-w-0">
                      <Link href={`/marketplace/produits/${p.id}`} className="font-bold text-[13px] leading-tight hover:text-[#9e001f] block truncate">
                        {p.title}
                      </Link>
                      <div className="text-xs font-black text-[#9e001f] mt-1">{formatPrice(p.price_xof || p.priceXof || 0)}</div>
                      <div className="text-[11px] text-zinc-500">{p.category}</div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Link href={`/marketplace/produits/${p.id}`} className="text-[11px] font-bold text-[#087e8b] hover:underline">
                          Voir produit
                        </Link>
                        <button onClick={() => removeFav(p.id, "product")} className="text-[11px] font-bold text-red-600 hover:underline">
                          Retirer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
