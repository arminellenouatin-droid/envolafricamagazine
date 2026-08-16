import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/db";
import crypto from "crypto";

export const dynamic = 'force-dynamic'; // Pas de cache pour webhook

// NOTE: Cette route doit être exemptée de protection CSRF
// Dans Next.js, pas de CSRF par défaut sur API routes, donc OK
// Mais si tu utilises nextjs-csrf ou similaire, ajoute cette route à la liste d'exclusions

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const receivedSignature = req.headers.get("x-moneroo-signature") || req.headers.get("X-Moneroo-Signature") || "";

    const webhookSecret = process.env.MONEROO_WEBHOOK_SECRET || "";

    // 2) Recalculer la signature attendue HMAC-SHA256.
    // La clé API Moneroo ne doit pas être réutilisée comme secret de webhook.
    if (!webhookSecret) {
      if (process.env.NODE_ENV === "production") {
        console.error("webhook: MONEROO_WEBHOOK_SECRET manquant en production");
        return NextResponse.json({ error: "Webhook non configuré" }, { status: 503 });
      }
      console.warn("webhook: MONEROO_WEBHOOK_SECRET manquant - vérification ignorée hors production");
    } else {
      if (!receivedSignature) {
        return NextResponse.json({ error: "Signature manquante" }, { status: 403 });
      }

      const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");
      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const receivedBuffer = Buffer.from(receivedSignature.trim(), "utf8");
      const isValid = expectedBuffer.length === receivedBuffer.length
        && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

      if (!isValid) {
        console.warn("webhook: signature invalide");
        return NextResponse.json({ error: "Signature invalide" }, { status: 403 });
      }
    }

    // 4) Traiter l'événement
    let event: any;
    try {
      event = JSON.parse(payload);
    } catch {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    if (!event || !event.event) {
      if (event.type) event.event = event.type; // compat
      else return NextResponse.json({ error: "Payload invalide, event manquant" }, { status: 400 });
    }

    const type = event.event;
    const data = event.data || event;

    console.log(`webhook reçu: type=${type} id=${data.id} amount=${data.amount}`);

    const db = readDB();

    // Fonction pour retrouver commande via metadata.order_id
    const findAndUpdateOrder = (orderId: string, newStatus: 'paid' | 'failed', paymentData: any) => {
      let found = false;
      for (const order of db.orders) {
        if (order.id === orderId || order.paymentId === paymentData.id) {
          found = true;
          if (type === 'payment.success') {
            order.status = 'paid';
            (order as any).paidAt = new Date().toISOString();
            order.paymentId = paymentData.id || order.paymentId;

            // Activation abonnement si présent
            const subItem = order.items.find(i=>i.type==="subscription");
            if (subItem && order.userId!=="guest") {
              const user = db.users.find(u=>u.id===order.userId);
              if (user) {
                const now = new Date();
                const end = new Date();
                if (['mensuel','entreprise','chef_entreprise'].includes(subItem.planId||'')) {
                  end.setMonth(end.getMonth()+1);
                } else {
                  end.setFullYear(end.getFullYear()+1);
                }
                (user as any).subscription = {
                  planId: subItem.planId,
                  status: 'active',
                  startDate: now.toISOString(),
                  endDate: end.toISOString(),
                  firstMonth: true,
                };
                if (user.role==="user") user.role="subscriber";
              }
            }

            // Commission affiliation - taux au moment vente
            if (order.affiliateCode) {
              const affUser = db.users.find(u=>u.affiliateCode===order.affiliateCode || u.id===order.affiliateCode);
              if (affUser && affUser.id!==order.userId) {
                const isSub = affUser.subscription?.status==="active" && new Date(affUser.subscription.endDate) > new Date();
                const rate = isSub ? 0.25 : 0.10;
                const commission = Math.round(order.total * rate);
                db.affiliateEarnings.push({
                  id: `earn_${Date.now()}`,
                  affiliateId: affUser.id,
                  orderId: order.id,
                  amount: order.total,
                  commission,
                  rate,
                  status: 'available',
                  createdAt: new Date().toISOString(),
                } as any);
              }
            }

            // Log paiement immuable
            if (!(db as any).payments) (db as any).payments = [];
            (db as any).payments.push({
              id: `pay_${Date.now()}`,
              order_id: order.id,
              provider: 'moneroo',
              provider_ref: paymentData.id,
              amount: paymentData.amount || order.total,
              currency: paymentData.currency || order.currency,
              status: 'confirme',
              webhook_signature_verified: true,
              raw_webhook_payload: paymentData,
              created_at: new Date().toISOString(),
            });
          } else if (type==='payment.failed' || type==='payment.cancelled') {
            order.status = 'failed';
          }
          break;
        }
      }
      if (!found && type==='payment.success') {
        console.warn(`webhook: commande non trouvée order_id=${orderId} payment_id=${paymentData.id}`);
      }
      writeDB(db);
      return found;
    };

    if (type === 'payment.success') {
      // Bonne pratique: re-vérifier via API Moneroo avant de livrer
      const orderId = data.metadata?.order_id || data.id;
      findAndUpdateOrder(orderId, 'paid', data);
    } else if (type === 'payment.failed' || type === 'payment.cancelled') {
      const orderId = data.metadata?.order_id || data.id;
      findAndUpdateOrder(orderId, 'failed', data);
    } else if (type === 'payment.initiated') {
      console.log(`webhook payment.initiated id=${data.id}`);
    } else if (type.startsWith('payout.')) {
      console.log(`webhook payout event ${type}`);
    }

    // 5) Toujours répondre 200 pour accuser réception (sinon Moneroo relance jusqu'à 3 fois toutes les 10min)
    return NextResponse.json({ ok: true }, { status: 200 });

  } catch (e) {
    console.error("webhook erreur", e);
    // Ne pas renvoyer 500 pour éviter boucle retry infinie, log et 200
    return NextResponse.json({ ok: true, warning: "Erreur traitée mais 200 pour éviter retry" }, { status: 200 });
  }
}

// GET pour tester que route est accessible en HTTPS sans auth (Moneroo ne peut pas se connecter si auth)
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Webhook Moneroo endpoint - POST avec signature HMAC-SHA256",
    url: "/api/webhooks/moneroo",
    method: "POST",
    headers: ["x-moneroo-signature"],
    docs: "https://docs.moneroo.io/webhooks"
  });
}
