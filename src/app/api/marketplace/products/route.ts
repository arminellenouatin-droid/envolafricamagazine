import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { marketplaceSeed } from "@/lib/marketplace-seed";

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.max(0, Number(params.get("page") || 0));
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
    if (query) requestQuery = requestQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    if (category && category !== "Toutes les catégories") requestQuery = requestQuery.eq("category", category);
    if (country) requestQuery = requestQuery.eq("country_code", country);
    const { data, error } = await requestQuery;
    if (!error && data) {
      return NextResponse.json({ products: data, page, hasMore: data.length === PAGE_SIZE, source: "supabase" });
    }
  }

  const filtered = marketplaceSeed.filter((product) => {
    const matchesQuery = !query || `${product.title} ${product.description} ${product.supplier}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "Toutes les catégories" || product.category === category;
    const matchesCountry = !country || product.country === country;
    return matchesQuery && matchesCategory && matchesCountry;
  });
  const start = page * PAGE_SIZE;
  return NextResponse.json({ products: filtered.slice(start, start + PAGE_SIZE), page, hasMore: start + PAGE_SIZE < filtered.length, source: "seed" });
}
