import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { marketplaceSeed } from "@/lib/marketplace-seed";

const PAGE_SIZE = 12;

export async function POST(request: NextRequest) {
  const { getCurrentUserFromCookie } = await import("@/lib/auth");
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { title?: string; description?: string; category?: string; countryCode?: string; city?: string; priceXof?: number; stockQuantity?: number; media?: unknown[]; installmentEnabled?: boolean; installmentMonthsMax?: number } | null;
  if (!body || typeof body.title !== "string" || body.title.trim().length < 3 || body.title.length > 180 || typeof body.category !== "string" || !Number.isInteger(body.priceXof) || Number(body.priceXof) < 0 || !Number.isInteger(body.stockQuantity) || Number(body.stockQuantity) < 0) return NextResponse.json({ error: "Informations produit invalides." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Catalogue temporairement indisponible." }, { status: 503 });
  const { data: supplier, error: supplierError } = await supabase.from("marketplace_suppliers").select("id").eq("user_id", user.id).single();
  if (supplierError || !supplier) return NextResponse.json({ error: "Créez d’abord votre boutique fournisseur." }, { status: 403 });
  const slug = `${body.title.trim().toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
  const media = Array.isArray(body.media) ? body.media.slice(0, 20) : [];
  const installmentEnabled = Boolean(body.installmentEnabled);
  const months = installmentEnabled ? Math.min(12, Math.max(1, Number(body.installmentMonthsMax) || 1)) : null;
  const { data, error } = await supabase.from("marketplace_products").insert({ supplier_id: supplier.id, title: body.title.trim(), slug, description: typeof body.description === "string" ? body.description.trim().slice(0, 6000) : null, category: body.category.trim().slice(0, 100), country_code: typeof body.countryCode === "string" ? body.countryCode.slice(0, 2).toUpperCase() : null, city: typeof body.city === "string" ? body.city.trim().slice(0, 120) : null, price_xof: body.priceXof, stock_quantity: body.stockQuantity, media, status: "pending_review", installment_enabled: installmentEnabled, installment_months_max: months }).select("id,slug,title,status,created_at").single();
  if (error) return NextResponse.json({ error: "Impossible de publier le produit." }, { status: 502 });
  return NextResponse.json({ product: data, notice: "Le produit est envoyé en revue technique avant publication. Les photos et vidéos sont acceptées, sous réserve de contrôle." }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.max(0, Number(params.get("page") || 0));
  const productId = (params.get("id") || "").trim();
  const query = (params.get("q") || "").trim();
  const category = params.get("category") || "Toutes les catégories";
  const country = params.get("country") || "";
  const supabase = getSupabaseAdmin();

  if (supabase) {
    let requestQuery = supabase
      .from("marketplace_products")
      .select("id,title,description,category,country_code,city,price_xof,media,installment_enabled,installment_months_max,is_boosted,boost_ends_at,marketplace_suppliers!inner(business_name,certification_status,rating)")
      .eq("status", "published")
      .order("is_boosted", { ascending: false })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (productId) requestQuery = requestQuery.eq("id", productId);
    if (query) requestQuery = requestQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    if (category && category !== "Toutes les catégories" && !productId) requestQuery = requestQuery.eq("category", category);
    if (country) requestQuery = requestQuery.eq("country_code", country);
    const { data, error } = await requestQuery;
    if (!error && data && data.length > 0) {
      return NextResponse.json({ products: data, page, hasMore: data.length === PAGE_SIZE, source: "supabase" });
    }
  }

  const filtered = marketplaceSeed.filter((product) => {
    const matchesId = !productId || product.id === productId;
    const matchesQuery = !query || `${product.title} ${product.description} ${product.supplier}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "Toutes les catégories" || product.category === category;
    const matchesCountry = !country || product.country === country;
    return matchesId && matchesQuery && matchesCategory && matchesCountry;
  });
  const start = page * PAGE_SIZE;
  return NextResponse.json({ products: filtered.slice(start, start + PAGE_SIZE), page, hasMore: start + PAGE_SIZE < filtered.length, source: "seed" });
}
