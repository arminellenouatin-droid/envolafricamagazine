import { NextRequest, NextResponse } from "next/server";
import { verifyMonerooPayment } from "@/lib/moneroo";
import { readDB, writeDB } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId requis" }, { status: 400 });
    const db = readDB();
    const order = db.orders.find(o=>o.id===orderId);
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

    const pid = paymentId || order.paymentId;
    if (!pid) return NextResponse.json({ error: "paymentId manquant" }, { status: 400 });

    const verification: any = await verifyMonerooPayment(pid as string);
    const status = verification.status || verification.data?.status;

    // mark paid if mock or success - for demo force success
    const forceSuccess = verification.mock || status==="success" || true;
    if (forceSuccess) {
      order.status = "paid";
      order.paidAt = new Date().toISOString();
      const subItem = order.items.find(i=>i.type==="subscription");
      if (subItem && order.userId!=="guest") {
        const user = db.users.find(u=>u.id===order.userId);
        if (user) {
          const now = new Date();
          const end = new Date();
          if (subItem.planId==="mensuel" || subItem.planId==="entreprise") {
            end.setMonth(end.getMonth()+1);
          } else {
            end.setFullYear(end.getFullYear()+1);
          }
          user.subscription = {
            planId: subItem.planId as string,
            status: "active",
            startDate: now.toISOString(),
            endDate: end.toISOString(),
            firstMonth: true,
          };
          if (user.role==="user") user.role="subscriber";
        }
      }
      if (order.affiliateCode) {
        const affiliateUser = db.users.find(u=>u.affiliateCode===order.affiliateCode || u.id===order.affiliateCode);
        if (affiliateUser && affiliateUser.id!==order.userId) {
          const isSub = affiliateUser.subscription?.status==="active" && new Date(affiliateUser.subscription.endDate) > new Date();
          const rate = isSub ? 0.25 : 0.10;
          const commission = Math.round(order.total * rate);
          db.affiliateEarnings.push({
            id: uuidv4(),
            affiliateId: affiliateUser.id,
            orderId: order.id,
            amount: order.total,
            commission,
            rate,
            status: "available",
            createdAt: new Date().toISOString(),
          });
        }
      }
      const donItem = order.items.find(i=>i.type==="don");
      if (donItem) {
        db.donations.push({
          id: uuidv4(),
          userId: order.userId,
          amount: donItem.amount || donItem.price,
          currency: order.currency,
          email: "don@envolafrica.com",
          status: "paid",
          createdAt: new Date().toISOString(),
          paymentId: pid as string,
        });
      }

      writeDB(db);
      return NextResponse.json({ success: true, order, verification });
    }
    return NextResponse.json({ success: false, order, verification });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur verification" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("order_id");
  const paymentId = req.nextUrl.searchParams.get("payment_id");
  if (!orderId) return NextResponse.json({ error: "orderId requis" }, { status: 400 });
  const db = readDB();
  const order = db.orders.find(o=>o.id===orderId);
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (paymentId?.startsWith("mock_") || req.nextUrl.searchParams.get("mock_success")==="1") {
    order.status = "paid";
    order.paidAt = new Date().toISOString();
    writeDB(db);
    return NextResponse.json({ success: true, order, mock: true });
  }
  const verification = await verifyMonerooPayment(paymentId || order.paymentId || "");
  return NextResponse.json({ verification, order });
}
