import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { initMonerooPayment } from "@/lib/moneroo";
import { generateStoreSlug, generateVendorSlug } from "@/lib/marketplace-slug";

const CERTIFICATION_PRICE_XOF = 50000;

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise pour certifier votre boutique." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Service de certification indisponible." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { storeId?: string } | null;
  const storeId = body?.storeId;

  if (!storeId || typeof storeId !== "string") {
    return NextResponse.json({ error: "Identifiant de boutique requis." }, { status: 400 });
  }

  // 1. Vérification de propriété stricte (Anti-IDOR)
  const { data: supplier, error: fetchErr } = await supabase
    .from("marketplace_suppliers")
    .select("id, user_id, business_name, country_code, city, certification_status")
    .eq("id", storeId)
    .maybeSingle();

  if (fetchErr || !supplier) {
    return NextResponse.json({ error: "Boutique introuvable." }, { status: 404 });
  }

  const isAdmin = ["admin", "administrateur", "gerant"].includes(user.role);
  if (supplier.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Vous n'avez pas l'autorisation de certifier cette boutique." }, { status: 403 });
  }

  if (supplier.certification_status === "certified") {
    return NextResponse.json({ error: "Cette boutique est déjà certifiée." }, { status: 400 });
  }

  const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const sSlug = generateStoreSlug(supplier.business_name);
  const vSlug = generateVendorSlug(user);
  const returnUrl = `${origin}/marketplace/boutique/${encodeURIComponent(vSlug)}/${encodeURIComponent(sSlug)}?certification=success`;

  try {
    const payment = await initMonerooPayment({
      amount: CERTIFICATION_PRICE_XOF,
      currency: "XOF",
      description: `Certification Vendeur Officiel — ${supplier.business_name}`,
      customer: {
        email: user.email,
        first_name: user.prenom || "Vendeur",
        last_name: user.nom || "Envol",
        phone: user.phone || undefined,
      },
      return_url: returnUrl,
      metadata: {
        product: "marketplace_certification",
        supplier_id: supplier.id,
        user_id: user.id,
        amount_xof: CERTIFICATION_PRICE_XOF,
      },
    });

    // Enregistrer l'ID de paiement sur la boutique
    await supabase
      .from("marketplace_suppliers")
      .update({
        certification_payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", supplier.id);

    return NextResponse.json({
      checkoutUrl: payment.checkout_url,
      paymentId: payment.id,
      amountXof: CERTIFICATION_PRICE_XOF,
    });
  } catch (paymentErr: any) {
    console.error("Moneroo certification init error:", paymentErr);
    return NextResponse.json(
      { error: "Impossible d'initialiser le paiement Moneroo. Veuillez réessayer." },
      { status: 502 }
    );
  }
}
