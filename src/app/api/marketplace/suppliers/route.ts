import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isPrismaConfigured, prisma } from "@/lib/prisma";

const CERTIFICATION_PRICE_XOF = 50000;

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service fournisseur indisponible." }, { status: 503 });

  // Supprimer la contrainte unique si prisma configuré en production
  if (isPrismaConfigured()) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS public.marketplace_suppliers DROP CONSTRAINT IF EXISTS marketplace_suppliers_user_id_key;`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_marketplace_suppliers_user_id ON public.marketplace_suppliers(user_id);`);
    } catch {}
  }

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");

  // Récupérer toutes les boutiques du vendeur
  const { data: stores, error } = await supabase
    .from("marketplace_suppliers")
    .select("id,user_id,business_name,description,country_code,city,certification_status,certification_expires_at,rating,call_available,created_at,updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Impossible de charger les boutiques." }, { status: 502 });

  const allStores = stores || [];

  // Compter le nombre de produits pour chaque boutique
  const storeIds = allStores.map((s) => s.id);
  const countsMap: Record<string, number> = {};

  if (storeIds.length > 0) {
    const { data: products } = await supabase
      .from("marketplace_products")
      .select("supplier_id")
      .in("supplier_id", storeIds);

    if (products) {
      for (const p of products) {
        countsMap[p.supplier_id] = (countsMap[p.supplier_id] || 0) + 1;
      }
    }
  }

  const storesWithStats = allStores.map((s) => ({
    ...s,
    products_count: countsMap[s.id] || 0,
  }));

  // Déterminer la boutique active demandée
  let activeStore = null;
  if (storeId) {
    activeStore = storesWithStats.find((s) => s.id === storeId) || null;
  }
  if (!activeStore && storesWithStats.length > 0) {
    activeStore = storesWithStats[0];
  }

  return NextResponse.json({
    supplier: activeStore, // Rétrocompatibilité
    suppliers: storesWithStats, // Liste de toutes les boutiques du vendeur
    totalStores: storesWithStats.length,
    certificationPriceXof: CERTIFICATION_PRICE_XOF,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const body = (await request.json().catch(() => null)) as {
    callAvailable?: boolean;
    call_available?: boolean;
    storeId?: string;
  } | null;

  const callAvailable = body?.callAvailable ?? body?.call_available;
  if (typeof callAvailable !== "boolean") {
    return NextResponse.json({ error: "Paramètre callAvailable requis." }, { status: 400 });
  }

  let query = supabase
    .from("marketplace_suppliers")
    .update({ call_available: callAvailable, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (body?.storeId) {
    query = query.eq("id", body.storeId);
  }

  const { data, error } = await query
    .select("id, user_id, business_name, call_available")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Impossible de mettre à jour la disponibilité." }, { status: 502 });
  return NextResponse.json({ supplier: data });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    businessName?: string;
    description?: string;
    countryCode?: string;
    city?: string;
    storeId?: string;
  } | null;

  if (
    !body ||
    typeof body.businessName !== "string" ||
    body.businessName.trim().length < 2 ||
    body.businessName.length > 160
  ) {
    return NextResponse.json({ error: "Nom commercial invalide (2 à 160 caractères)." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service fournisseur indisponible." }, { status: 503 });

  if (isPrismaConfigured()) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS public.marketplace_suppliers DROP CONSTRAINT IF EXISTS marketplace_suppliers_user_id_key;`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_marketplace_suppliers_user_id ON public.marketplace_suppliers(user_id);`);
    } catch {}
  }

  const storePayload = {
    user_id: user.id,
    business_name: body.businessName.trim(),
    description: typeof body.description === "string" ? body.description.trim().slice(0, 3000) : null,
    country_code: typeof body.countryCode === "string" ? body.countryCode.slice(0, 2).toUpperCase() : null,
    city: typeof body.city === "string" ? body.city.trim().slice(0, 120) : null,
    updated_at: new Date().toISOString(),
  };

  // Modification d'une boutique existante
  if (body.storeId) {
    const { data: updated, error: updateErr } = await supabase
      .from("marketplace_suppliers")
      .update(storePayload)
      .eq("id", body.storeId)
      .eq("user_id", user.id)
      .select("id,user_id,business_name,description,country_code,city,certification_status,certification_expires_at,rating,created_at,updated_at")
      .single();

    if (updateErr) return NextResponse.json({ error: "Impossible de modifier la boutique." }, { status: 502 });
    return NextResponse.json({ supplier: updated, certificationPriceXof: CERTIFICATION_PRICE_XOF });
  }

  // Création d'une NOUVELLE boutique
  const { data, error } = await supabase
    .from("marketplace_suppliers")
    .insert({
      ...storePayload,
      created_at: new Date().toISOString(),
    })
    .select("id,user_id,business_name,description,country_code,city,certification_status,certification_expires_at,rating,created_at,updated_at")
    .single();

  if (error) {
    // Si la contrainte unique est encore présente sur l'environnement, faire un update de repli
    if (error.code === "23505") {
      const { data: fallback, error: fallbackErr } = await supabase
        .from("marketplace_suppliers")
        .update(storePayload)
        .eq("user_id", user.id)
        .select("id,user_id,business_name,description,country_code,city,certification_status,certification_expires_at,rating,created_at,updated_at")
        .single();

      if (fallbackErr) return NextResponse.json({ error: "Impossible d'enregistrer la boutique." }, { status: 502 });
      return NextResponse.json({ supplier: fallback, certificationPriceXof: CERTIFICATION_PRICE_XOF }, { status: 201 });
    }
    return NextResponse.json({ error: "Impossible d’enregistrer la boutique : " + error.message }, { status: 502 });
  }

  return NextResponse.json({ supplier: data, certificationPriceXof: CERTIFICATION_PRICE_XOF }, { status: 201 });
}
