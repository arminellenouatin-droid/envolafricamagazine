import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";
import { initMonerooPayment } from "@/lib/moneroo";

export const COIN_PACKS = [
  { id: "pack-100", coins: 100, priceXof: 1000, label: "Pack Découverte", popular: false },
  { id: "pack-500", coins: 500, priceXof: 4500, label: "Pack Pro (Bonus 10%)", popular: true },
  { id: "pack-1200", coins: 1200, priceXof: 10000, label: "Pack VIP (Bonus 20%)", popular: false },
  { id: "pack-3000", coins: 3000, priceXof: 24000, label: "Pack Élite (Bonus 25%)", popular: false },
];

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ coins: 0, transactions: [], packs: COIN_PACKS });
  }

  const db = readWabDB();
  const profile = db.profiles.find((p) => p.userId === user.id);
  const coins = profile?.coins !== undefined ? profile.coins : 50; // 50 coins d'essai offerts à la bienvenue

  const transactions = (db.coinTransactions || [])
    .filter((tx) => tx.userId === user.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 50);

  return NextResponse.json({
    coins,
    packs: COIN_PACKS,
    transactions,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise pour cette opération." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body.action || "recharge";
  const db = readWabDB();

  let profile = db.profiles.find((p) => p.userId === user.id);
  if (!profile) {
    profile = {
      id: uuid(),
      userId: user.id,
      fullName: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email || "Utilisateur WAB",
      headline: "Membre du réseau World Africa Business",
      about: "",
      country: user.country || "Afrique",
      coins: 50,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.profiles.push(profile);
  } else if (profile.coins === undefined) {
    profile.coins = 50;
  }

  // ==========================================
  // ACTION 1 : RECHARGE DE COINS
  // ==========================================
  if (action === "recharge") {
    const packId = body.packId;
    let coinsToAdd = 0;
    let amountXof = 0;

    const pack = COIN_PACKS.find((p) => p.id === packId);
    if (pack) {
      coinsToAdd = pack.coins;
      amountXof = pack.priceXof;
    } else if (Number.isInteger(body.coins) && body.coins >= 50 && Number.isInteger(body.priceXof)) {
      coinsToAdd = body.coins;
      amountXof = body.priceXof;
    } else {
      return NextResponse.json({ error: "Pack de recharge invalide." }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const txId = uuid();

    try {
      const payment = await initMonerooPayment({
        amount: amountXof,
        currency: "XOF",
        description: `Recharge de ${coinsToAdd} Coins WAB Live`,
        customer: {
          email: user.email,
          first_name: user.prenom || "Abonné",
          last_name: user.nom || "WAB",
          phone: user.phone,
        },
        return_url: `${origin}/wab/coins/callback?tx_id=${txId}&coins=${coinsToAdd}`,
        metadata: {
          action: "wab_coins_recharge",
          user_id: user.id,
          coins: coinsToAdd,
          amount_xof: amountXof,
          tx_id: txId,
        },
      });

      // Si mode test/mock direct ou paiement complété
      if ((payment as any).mock || body.instantSimulation) {
        profile.coins = (profile.coins || 0) + coinsToAdd;
        profile.updatedAt = new Date().toISOString();

        db.coinTransactions.unshift({
          id: txId,
          userId: user.id,
          type: "recharge",
          amountCoins: coinsToAdd,
          amountXof,
          paymentId: payment.id,
          status: "completed",
          createdAt: new Date().toISOString(),
          metadata: { packId, mock: true },
        });

        writeWabDB(db);

        return NextResponse.json({
          success: true,
          coins: profile.coins,
          added: coinsToAdd,
          message: `Félicitations ! Vos ${coinsToAdd} Coins WAB ont été crédités sur votre compte.`,
        });
      }

      // Enregistrement de la transaction en attente
      db.coinTransactions.unshift({
        id: txId,
        userId: user.id,
        type: "recharge",
        amountCoins: coinsToAdd,
        amountXof,
        paymentId: payment.id,
        status: "pending",
        createdAt: new Date().toISOString(),
        metadata: { packId },
      });
      writeWabDB(db);

      return NextResponse.json({
        checkoutUrl: payment.checkout_url,
        paymentId: payment.id,
        txId,
      });
    } catch (err: any) {
      return NextResponse.json({ error: "Impossible d'initialiser le paiement Moneroo pour la recharge." }, { status: 502 });
    }
  }

  // ==========================================
  // ACTION 2 : ENVOI DE CADEAU VIRTUEL DANS UN SALON
  // ==========================================
  if (action === "send_gift") {
    const { salonId, giftType, coinsCost, quantity } = body;
    const qty = Math.max(1, Math.min(99, Number(quantity) || 1));
    const totalCoins = (Number(coinsCost) || 5) * qty;

    if (!salonId || !giftType || totalCoins <= 0) {
      return NextResponse.json({ error: "Paramètres de cadeau invalides." }, { status: 400 });
    }

    const salon = db.salons.find((s) => s.id === salonId);
    if (!salon) {
      return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });
    }

    // Vérifier solde du donateur
    const currentCoins = profile.coins || 0;
    if (currentCoins < totalCoins) {
      return NextResponse.json(
        {
          error: `Solde de Coins insuffisant (${currentCoins} Coins disponibles, ${totalCoins} requis).`,
          required: totalCoins,
          available: currentCoins,
        },
        { status: 402 }
      );
    }

    // 1. Débit atomique du spectateur
    profile.coins = currentCoins - totalCoins;
    profile.updatedAt = new Date().toISOString();

    // 2. Calcul des gains créateur selon les paramètres globaux (PRD Section 9.4)
    const settings = db.liveSettings || {
      coinRateXof: 10,
      giftCommissionRate: 0.30,
      salesCommissionRate: 0.10,
      minWithdrawalXof: 5000,
      retentionDaysReplay: 30,
    };

    const grossXof = totalCoins * settings.coinRateXof;
    const commissionXof = Math.round(grossXof * settings.giftCommissionRate);
    const netCreatorXof = grossXof - commissionXof;

    // 3. Crédit du portefeuille créateur de l'hôte
    let creatorWallet = db.creatorWallets.find((w) => w.userId === salon.hostUserId);
    if (!creatorWallet) {
      creatorWallet = {
        userId: salon.hostUserId,
        availableXof: netCreatorXof,
        pendingXof: 0,
        totalEarnedXof: netCreatorXof,
        totalCoinsReceived: totalCoins,
        updatedAt: new Date().toISOString(),
      };
      db.creatorWallets.push(creatorWallet);
    } else {
      creatorWallet.availableXof += netCreatorXof;
      creatorWallet.totalEarnedXof += netCreatorXof;
      creatorWallet.totalCoinsReceived = (creatorWallet.totalCoinsReceived || 0) + totalCoins;
      creatorWallet.updatedAt = new Date().toISOString();
    }

    // 4. Enregistrement des transactions ledger
    const giftTxId = uuid();
    db.coinTransactions.unshift({
      id: giftTxId,
      userId: user.id,
      type: "gift_sent",
      amountCoins: totalCoins,
      amountXof: grossXof,
      status: "completed",
      createdAt: new Date().toISOString(),
      metadata: { salonId, giftType, quantity: qty, recipientUserId: salon.hostUserId },
    });

    db.coinTransactions.unshift({
      id: uuid(),
      userId: salon.hostUserId,
      type: "gift_received",
      amountCoins: totalCoins,
      amountXof: netCreatorXof,
      status: "completed",
      createdAt: new Date().toISOString(),
      metadata: { salonId, giftType, quantity: qty, senderUserId: user.id, commissionXof },
    });

    // 5. Mise à jour des stats du salon
    if (!salon.stats) {
      salon.stats = { peakViewers: salon.participants, totalViews: salon.participants, totalCoinsReceived: 0, totalSalesXof: 0 };
    }
    salon.stats.totalCoinsReceived = (salon.stats.totalCoinsReceived || 0) + totalCoins;

    // 6. Ajout du message spécial cadeau dans le chat
    const donorName = `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email?.split("@")[0] || "Spectateur";
    const giftMessage = {
      id: uuid(),
      salonId,
      userId: user.id,
      author: donorName,
      authorAvatarUrl: profile.avatarUrl,
      content: `🎁 a envoyé ${qty > 1 ? `${qty}x ` : ""}${giftType} (${totalCoins} Coins) !`,
      giftType,
      giftAmount: totalCoins,
      createdAt: new Date().toISOString(),
    };
    db.salonMessages.push(giftMessage);

    writeWabDB(db);

    return NextResponse.json({
      success: true,
      remainingCoins: profile.coins,
      giftMessage,
      totalCoinsSent: totalCoins,
      creatorNetEarnedXof: netCreatorXof,
    });
  }

  return NextResponse.json({ error: "Action non reconnue." }, { status: 400 });
}
