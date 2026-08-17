import { NextRequest, NextResponse } from "next/server";
import { initMonerooPayment, MonerooNotConfiguredError } from "@/lib/moneroo";
import { createPendingOrder, listMagazines, markOrderFailed, ProductionDatabaseNotConfiguredError } from "@/lib/core-db";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { SHIPPING_RATES } from "@/lib/constants";

const SUBSCRIPTION_PRICES: Record<string, number> = {
  mensuel: 2000,
  annuel: 42000,
  entreprise: 15000,
  soutien: 600000,
};

const FORMAT_PRICES: Record<string, number> = {
  cd_audio: 5000,
  numerique: 10000,
  papier: 16000,
  audio_pdf: 12000,
  audio_papier: 18000,
};

function getMagazinePrice(format: string) {
  const testPrice = Number(process.env.EAM_TEST_MAGAZINE_PRICE);
  if (process.env.EAM_PAYMENT_TEST_MODE === "true" && Number.isInteger(testPrice) && testPrice > 0) return testPrice;
  return FORMAT_PRICES[format] ?? FORMAT_PRICES.numerique;
}

export async function POST(req: NextRequest) {
  let createdOrderId: string | undefined;
  try {
    const body = await req.json();
    const { items, currency = "XOF", shippingCountry, affiliateCode, donAmount, phone } = body;
    const user = await getCurrentUserFromCookie();
    const magazines = await listMagazines();

    let total = 0;
    let description = "Commande Envol Africa Magazine";
    const orderItems: Array<Record<string, unknown>> = [];

    if (donAmount !== undefined && donAmount !== null) {
      const amount = Number(donAmount);
      if (!Number.isInteger(amount) || amount <= 0) return NextResponse.json({ error: "Montant du don invalide" }, { status: 400 });
      total = amount;
      description = `Don Envol Africa Magazine - ${amount} ${currency}`;
      orderItems.push({ type: "don", amount, price: amount });
    } else if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item || typeof item !== "object") return NextResponse.json({ error: "Ligne de commande invalide" }, { status: 400 });
        const line = item as { type?: string; magazineId?: string; format?: string; language?: string; planId?: string };
        if (line.type === "magazine") {
          const magazine = magazines.find((candidate) => candidate.id === line.magazineId);
          if (!magazine) return NextResponse.json({ error: "Magazine introuvable" }, { status: 404 });
          const price = getMagazinePrice(line.format ?? "numerique");
          total += price;
          orderItems.push({ type: "magazine", magazineId: magazine.id, format: line.format ?? "numerique", language: line.language ?? "fr", price });
        } else if (line.type === "subscription") {
          const price = SUBSCRIPTION_PRICES[line.planId ?? ""];
          if (!price) return NextResponse.json({ error: "Plan d’abonnement invalide" }, { status: 400 });
          total += price;
          orderItems.push({ type: "subscription", planId: line.planId, price });
          description = `Abonnement ${line.planId} Envol Africa`;
        } else {
          return NextResponse.json({ error: "Type de produit invalide" }, { status: 400 });
        }
      }
      if (shippingCountry) {
        const hasPrint = orderItems.some((item) => item.format === "papier" || item.format === "audio_papier");
        if (hasPrint) total += SHIPPING_RATES[shippingCountry] || SHIPPING_RATES.default;
      }
    } else {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    if (!Number.isInteger(total) || total <= 0) return NextResponse.json({ error: "Montant de commande invalide" }, { status: 400 });
    const orderId = uuidv4();
    createdOrderId = orderId;
    const shippingCost = shippingCountry ? (SHIPPING_RATES[shippingCountry] || SHIPPING_RATES.default) : 0;
    const order = await createPendingOrder({
      id: orderId,
      userId: user?.id || "guest",
      items: orderItems as never,
      total,
      currency: String(currency).toUpperCase(),
      status: "pending",
      affiliateCode: affiliateCode || req.cookies.get("eam_affiliate")?.value,
      shippingCountry,
      shippingCost,
    });

    // Le retour doit rester sur l’hôte qui a créé le checkout, jamais sur une ancienne URL d’environnement.
    const baseUrl = req.nextUrl.origin;
    const payment = await initMonerooPayment({
      amount: order.total,
      currency: order.currency,
      description,
      customer: {
        email: user?.email || body.email || "client@envolafrica.com",
        first_name: user?.prenom || body.firstName || "Client",
        last_name: user?.nom || body.lastName || "Envol",
        phone: user?.phone || phone || body.phone,
      },
      return_url: `${baseUrl}/panier?order_id=${orderId}&verify=1`,
      // Moneroo détecte automatiquement le pays et affiche les méthodes disponibles.
      // Aucun code pays ni méthode n’est imposé par EAM.
      metadata: { order_id: orderId, user_id: user?.id || "guest", affiliate: order.affiliateCode },
    });

    const { attachPaymentToOrder } = await import("@/lib/core-db");
    await attachPaymentToOrder(orderId, payment.id);
    return NextResponse.json({ orderId, checkout_url: payment.checkout_url, paymentId: payment.id, total: order.total, mock: payment.mock === true });
  } catch (error) {
    console.error(error);
    if (createdOrderId) {
      try { await markOrderFailed(createdOrderId); } catch (cleanupError) { console.error("Impossible de neutraliser la commande échouée", cleanupError); }
    }
    if (error instanceof ProductionDatabaseNotConfiguredError) return NextResponse.json({ error: "Base de données temporairement indisponible" }, { status: 503 });
    if (error instanceof MonerooNotConfiguredError) return NextResponse.json({ error: "Paiement temporairement indisponible" }, { status: 503 });
    return NextResponse.json({ error: "Erreur paiement" }, { status: 500 });
  }
}
