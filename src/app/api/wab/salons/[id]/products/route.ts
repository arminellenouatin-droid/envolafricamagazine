import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";
import { marketplaceSeed } from "@/lib/marketplace-seed";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readWabDB();
  const salon = db.salons.find((s) => s.id === id);
  if (!salon) return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });

  // Récupérer les produits du catalogue Marketplace
  let availableProducts: any[] = [];
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("marketplace_products")
        .select("id,title,price_xof,media,category,installment_enabled,installment_months_max,stock_quantity,status")
        .eq("status", "published")
        .limit(20);
      if (data && data.length > 0) {
        availableProducts = data.map((p) => ({
          id: p.id,
          title: p.title,
          priceXof: p.price_xof,
          image: Array.isArray(p.media) && p.media[0]?.path ? p.media[0].path : "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80",
          supplier: "Fournisseur WAB",
          installment: Boolean(p.installment_enabled),
          months: p.installment_months_max || 6,
          stock: p.stock_quantity,
        }));
      }
    } catch {}
  }

  // Fallback avec les produits Marketplace Seed
  if (availableProducts.length === 0) {
    availableProducts = marketplaceSeed.map((p) => ({
      id: p.id,
      title: p.title,
      priceXof: p.priceXof,
      image: p.image,
      supplier: p.supplier,
      installment: p.installment,
      months: p.months,
      stock: 25,
      certified: p.certified,
      boosted: p.boosted,
    }));
  }

  return NextResponse.json({
    pinnedProduct: salon.pinnedProduct || null,
    availableProducts,
    salesModeEnabled: Boolean(salon.salesModeEnabled),
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  const { id } = await params;
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const db = readWabDB();
  const salon = db.salons.find((s) => s.id === id);
  if (!salon) return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });

  if (salon.hostUserId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Seul l'hôte ou l'administrateur peut épingler un produit." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { productId, isFlash, flashDiscountPercent, flashMinutes } = body;

  if (!productId) {
    return NextResponse.json({ error: "Identifiant de produit requis." }, { status: 400 });
  }

  // Trouver le produit dans les graines ou supabase
  let found = marketplaceSeed.find((p) => p.id === productId);
  let title = found?.title || "Produit Marketplace WAB";
  let priceXof = found?.priceXof || 25000;
  let image = found?.image || "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80";
  let supplier = found?.supplier || salon.host;
  let installment = found?.installment || false;
  let months = found?.months || 6;

  // Calcul offre flash si demandée
  let flashPriceXof = undefined;
  let flashEndsAt = undefined;
  if (isFlash && Number(flashDiscountPercent) > 0) {
    const discount = Math.min(70, Math.max(5, Number(flashDiscountPercent)));
    flashPriceXof = Math.round(priceXof * (1 - discount / 100));
    const duration = Math.min(60, Math.max(1, Number(flashMinutes) || 10));
    flashEndsAt = new Date(Date.now() + duration * 60 * 1000).toISOString();
  }

  salon.pinnedProduct = {
    id: productId,
    title,
    priceXof,
    image,
    supplier,
    installment,
    months,
    isFlash: Boolean(isFlash),
    flashPriceXof,
    flashEndsAt,
  };
  salon.salesModeEnabled = true;

  writeWabDB(db);

  return NextResponse.json({
    success: true,
    pinnedProduct: salon.pinnedProduct,
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  const { id } = await params;
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const db = readWabDB();
  const salon = db.salons.find((s) => s.id === id);
  if (!salon) return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });

  if (salon.hostUserId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Seul l'hôte ou l'administrateur peut désépingler un produit." }, { status: 403 });
  }

  salon.pinnedProduct = null;
  writeWabDB(db);

  return NextResponse.json({ success: true, pinnedProduct: null });
}
