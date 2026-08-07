import { NextRequest, NextResponse } from "next/server";
import { initMonerooPayment } from "@/lib/moneroo";
import { readDB, writeDB } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { CURRENCIES, SHIPPING_RATES } from "@/lib/constants";

async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const decoded = verifyToken(token);
    if (!decoded) return null;
    const db = readDB();
    return db.users.find(u=>u.id===decoded.id) || null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, currency = "XOF", shippingCountry, affiliateCode, donAmount } = body;
    
    const user = await getUser();
    const db = readDB();

    let total = 0;
    let description = "Commande Envol Africa Magazine";
    let orderItems: any[] = [];

    if (donAmount) {
      total = donAmount;
      description = `Don Envol Africa Magazine - ${donAmount} ${currency}`;
      orderItems = [{ type: 'don', amount: donAmount, price: donAmount }];
    } else if (items && items.length>0) {
      // calculate
      for (const it of items) {
        if (it.type === 'magazine') {
          const mag = db.magazines.find(m=>m.id===it.magazineId);
          if (!mag) continue;
          // price logic
          const formatPriceMap: Record<string, number> = { cd_audio:5000, numerique:10000, papier:16000, audio_pdf:12000, audio_papier:18000 };
          const price = formatPriceMap[it.format] || 10000;
          total += price;
          orderItems.push({ ...it, price });
        } else if (it.type === 'subscription') {
          const planMap: Record<string, number> = { mensuel:2000, annuel:42000, entreprise:15000, soutien:600000 };
          // first month price logic
          const price = planMap[it.planId] || 5000;
          total += price;
          orderItems.push({ ...it, price });
          description = `Abonnement ${it.planId} Envol Africa`;
        }
      }
      if (shippingCountry) {
        const shipCost = SHIPPING_RATES[shippingCountry] || SHIPPING_RATES.default;
        const hasPrint = orderItems.some(i=>i.format==='papier' || i.format==='audio_papier');
        if (hasPrint) total += shipCost;
      }
    } else {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    // create pending order
    const orderId = uuidv4();
    const order = {
      id: orderId,
      userId: user?.id || "guest",
      items: orderItems,
      total,
      currency,
      status: "pending" as const,
      affiliateCode: affiliateCode || (req.cookies.get("eam_affiliate")?.value),
      shippingCountry,
      shippingCost: shippingCountry ? (SHIPPING_RATES[shippingCountry]||SHIPPING_RATES.default) : 0,
      createdAt: new Date().toISOString(),
    };
    db.orders.push(order);
    writeDB(db);

    // moneroo init
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin || "http://localhost:3000";
    const paymentData = {
      amount: total,
      currency,
      description,
      customer: {
        email: user?.email || body.email || "client@envolafrica.com",
        first_name: user?.prenom || body.firstName || "Client",
        last_name: user?.nom || body.lastName || "Envol",
        phone: user?.phone || body.phone,
      },
      return_url: `${baseUrl}/panier?order_id=${orderId}&verify=1`,
      methods: ["card", "mtn_bj", "mtn_ci", "orange_ci", "moov_bj", "wave", "mtn", "orange_sn"],
      metadata: {
        order_id: orderId,
        user_id: user?.id || "guest",
        affiliate: order.affiliateCode,
      }
    };

    const payment = await initMonerooPayment(paymentData);
    // update order with paymentId
    const db2 = readDB();
    const ord = db2.orders.find(o=>o.id===orderId);
    if (ord) { ord.paymentId = payment.id; writeDB(db2); }

    return NextResponse.json({ orderId, checkout_url: payment.checkout_url, paymentId: payment.id, total, mock: payment.mock });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur paiement" }, { status: 500 });
  }
}
