import { describe, it, expect, beforeEach } from "vitest";
import {
  holdMarketplaceOrderEscrow,
  releaseMarketplaceOrderEscrow,
  refundMarketplaceOrderEscrow,
  payMarketplaceInstallmentWithWallet,
  localMarketplaceStore,
} from "@/lib/marketplace/marketplace-escrow-service";
import {
  creditWallet,
  getOrCreateWallet,
} from "@/lib/wallet/financial-core";

describe("Phase 4 : Marketplace Envol Africa — Séquestre & Portefeuille Central", () => {
  let testIdx = 0;

  beforeEach(() => {
    testIdx++;
    localMarketplaceStore.orders.clear();
    localMarketplaceStore.suppliers.clear();
    localMarketplaceStore.installments.clear();
    localMarketplaceStore.conversations.clear();
  });

  it("1. Doit mettre en séquestre automatique les fonds de l'acheteur lors d'une commande", async () => {
    const buyerId = `buyer_p4_${testIdx}`;
    const sellerId = `seller_p4_${testIdx}`;
    const supplierId = `supp_p4_${testIdx}`;
    const orderId = `order_p4_${testIdx}`;

    localMarketplaceStore.suppliers.set(supplierId, {
      id: supplierId,
      user_id: sellerId,
      business_name: "Boutique Artisanale Envol",
    });

    // Créditer l'acheteur de 100 000 FCFA
    await creditWallet({
      userId: buyerId,
      amount: 100_000,
      type: "DEPOSIT",
      source: "deposit",
      sourceId: `dep_source_${testIdx}`,
      description: "Dépôt initial",
      reference: `DEP-${testIdx}-01`,
    });

    // Créer la commande en local
    localMarketplaceStore.orders.set(orderId, {
      id: orderId,
      buyer_id: buyerId,
      supplier_id: supplierId,
      total_xof: 60_000,
      status: "pending_payment",
    });

    const holdResult = await holdMarketplaceOrderEscrow({
      orderId,
      buyerId,
      amount: 60_000,
      description: "Achat d'artisanat",
    });

    expect(holdResult.success).toBe(true);
    expect(holdResult.holdId).toBeTruthy();
    expect(holdResult.reference).toContain("HOLD-MKT-");

    // Vérifier les soldes de l'acheteur
    const buyerWallet = await getOrCreateWallet(buyerId);
    expect(buyerWallet.availableBalance).toBe(40_000); // 100 000 - 60 000 bloqués
    expect(buyerWallet.heldBalance).toBe(60_000); // 60 000 bloqués en séquestre

    // La commande passe à l'état paid avec hold id
    const order = localMarketplaceStore.orders.get(orderId);
    expect(order.status).toBe("paid");
    expect(order.escrow_hold_id).toBe(holdResult.holdId);
  });

  it("2. Doit rejeter la mise en séquestre si le solde de l'acheteur est insuffisant", async () => {
    const buyerId = `buyer_p4_low_${testIdx}`;
    // Solde disponible : 10 000 FCFA
    await creditWallet({
      userId: buyerId,
      amount: 10_000,
      type: "DEPOSIT",
      source: "deposit",
      sourceId: `dep_source_low_${testIdx}`,
      description: "Dépôt faible",
      reference: `DEP-LOW-${testIdx}`,
    });

    await expect(
      holdMarketplaceOrderEscrow({
        orderId: `order_insufficient_${testIdx}`,
        buyerId,
        amount: 50_000,
      })
    ).rejects.toThrow("Solde insuffisant pour séquestre");
  });

  it("3. Doit libérer le séquestre vers le vendeur avec 5% de commission lors de la confirmation de livraison", async () => {
    const buyerId = `buyer_p4_${testIdx}`;
    const sellerId = `seller_p4_${testIdx}`;
    const supplierId = `supp_p4_${testIdx}`;
    const orderId = `order_p4_${testIdx}`;

    localMarketplaceStore.suppliers.set(supplierId, {
      id: supplierId,
      user_id: sellerId,
      business_name: "Boutique Artisanale Envol",
    });

    // Approvisionner et bloquer 50 000 FCFA
    await creditWallet({
      userId: buyerId,
      amount: 50_000,
      type: "DEPOSIT",
      source: "deposit",
      sourceId: `dep_source_02_${testIdx}`,
      description: "Fonds acheteur",
      reference: `DEP-02-${testIdx}`,
    });

    localMarketplaceStore.orders.set(orderId, {
      id: orderId,
      buyer_id: buyerId,
      supplier_id: supplierId,
      total_xof: 50_000,
      status: "pending_payment",
    });

    await holdMarketplaceOrderEscrow({
      orderId,
      buyerId,
      amount: 50_000,
    });

    // Confirmation de réception par l'acheteur
    const releaseRes = await releaseMarketplaceOrderEscrow({
      orderId,
      buyerOrAdminUserId: buyerId,
    });

    expect(releaseRes.success).toBe(true);
    expect(releaseRes.sellerUserId).toBe(sellerId);
    // 5% de 50 000 = 2 500 FCFA commission
    expect(releaseRes.platformFee).toBe(2_500);
    // Net vendeur = 50 000 - 2 500 = 47 500 FCFA
    expect(releaseRes.sellerAmount).toBe(47_500);

    // Vérifier les portefeuilles
    const buyerWallet = await getOrCreateWallet(buyerId);
    expect(buyerWallet.availableBalance).toBe(0);
    expect(buyerWallet.heldBalance).toBe(0);

    const sellerWallet = await getOrCreateWallet(sellerId);
    expect(sellerWallet.availableBalance).toBe(47_500);
    expect(sellerWallet.heldBalance).toBe(0);

    // Commande mise à jour
    const updatedOrder = localMarketplaceStore.orders.get(orderId);
    expect(updatedOrder.status).toBe("received");
    expect(updatedOrder.received_at).toBeTruthy();
  });

  it("4. Doit refuser la confirmation de livraison si un tiers non autorisé tente de la valider", async () => {
    const buyerId = `buyer_p4_${testIdx}`;
    const orderId = `order_p4_${testIdx}`;

    localMarketplaceStore.orders.set(orderId, {
      id: orderId,
      buyer_id: buyerId,
      supplier_id: "supp_01",
      total_xof: 20_000,
      status: "paid",
    });

    await expect(
      releaseMarketplaceOrderEscrow({
        orderId,
        buyerOrAdminUserId: "intruder_user_xyz",
      })
    ).rejects.toThrow("Seul l'acheteur ou un administrateur peut confirmer la livraison");
  });

  it("5. Doit permettre à un administrateur de débloquer la commande", async () => {
    const buyerId = `buyer_p4_${testIdx}`;
    const sellerId = `seller_p4_${testIdx}`;
    const supplierId = `supp_p4_${testIdx}`;
    const orderId = `order_p4_${testIdx}`;

    localMarketplaceStore.suppliers.set(supplierId, {
      id: supplierId,
      user_id: sellerId,
      business_name: "Boutique Artisanale Envol",
    });

    await creditWallet({
      userId: buyerId,
      amount: 20_000,
      type: "DEPOSIT",
      source: "deposit",
      sourceId: `dep_source_admin_${testIdx}`,
      description: "Dépôt",
      reference: `DEP-ADMIN-${testIdx}`,
    });

    localMarketplaceStore.orders.set(orderId, {
      id: orderId,
      buyer_id: buyerId,
      supplier_id: supplierId,
      total_xof: 20_000,
      status: "pending_payment",
    });

    await holdMarketplaceOrderEscrow({ orderId, buyerId, amount: 20_000 });

    const releaseRes = await releaseMarketplaceOrderEscrow({
      orderId,
      buyerOrAdminUserId: "admin_super_user",
    });

    expect(releaseRes.success).toBe(true);
    expect(releaseRes.sellerAmount).toBe(19_000); // 20 000 - 5% (1 000)
  });

  it("6. Doit rembourser l'intégralité du séquestre à l'acheteur en cas de litige ou annulation", async () => {
    const buyerId = `buyer_p4_${testIdx}`;
    const orderId = `order_p4_${testIdx}`;

    await creditWallet({
      userId: buyerId,
      amount: 40_000,
      type: "DEPOSIT",
      source: "deposit",
      sourceId: `dep_source_ref_${testIdx}`,
      description: "Dépôt",
      reference: `DEP-REFUND-${testIdx}`,
    });

    localMarketplaceStore.orders.set(orderId, {
      id: orderId,
      buyer_id: buyerId,
      supplier_id: "supp_01",
      total_xof: 40_000,
      status: "pending_payment",
    });

    await holdMarketplaceOrderEscrow({ orderId, buyerId, amount: 40_000 });

    // Annulation / litige
    const refundRes = await refundMarketplaceOrderEscrow({
      orderId,
      authorizedByUserId: buyerId,
      reason: "Produit non conforme retourné",
    });

    expect(refundRes.success).toBe(true);
    expect(refundRes.refundedAmount).toBe(40_000);
    expect(refundRes.buyerUserId).toBe(buyerId);

    // Solde de l'acheteur restauré
    const buyerWallet = await getOrCreateWallet(buyerId);
    expect(buyerWallet.availableBalance).toBe(40_000);
    expect(buyerWallet.heldBalance).toBe(0);

    const order = localMarketplaceStore.orders.get(orderId);
    expect(order.status).toBe("refunded");
  });

  it("7. Ne doit pas pouvoir rembourser une commande déjà livrée et confirmée", async () => {
    const buyerId = `buyer_p4_${testIdx}`;
    const orderId = `order_p4_${testIdx}`;

    localMarketplaceStore.orders.set(orderId, {
      id: orderId,
      buyer_id: buyerId,
      supplier_id: "supp_01",
      total_xof: 15_000,
      status: "received",
    });

    await expect(
      refundMarketplaceOrderEscrow({
        orderId,
        authorizedByUserId: buyerId,
      })
    ).rejects.toThrow("Impossible de rembourser une commande déjà livrée et libérée");
  });

  it("8. Doit permettre le règlement d'une mensualité d'échéancier (Installment) via Portefeuille Central", async () => {
    const buyerId = `buyer_p4_${testIdx}`;
    const orderId = `order_p4_${testIdx}`;
    const installmentId = `inst_p4_${testIdx}`;

    // Créditer l'acheteur pour payer la mensualité
    await creditWallet({
      userId: buyerId,
      amount: 30_000,
      type: "DEPOSIT",
      source: "deposit",
      sourceId: `dep_source_inst_${testIdx}`,
      description: "Dépôt pour mensualité",
      reference: `DEP-INST-${testIdx}`,
    });

    localMarketplaceStore.orders.set(orderId, {
      id: orderId,
      buyer_id: buyerId,
      supplier_id: "supp_01",
      total_xof: 60_000,
      status: "paid",
    });

    localMarketplaceStore.installments.set(installmentId, {
      id: installmentId,
      order_id: orderId,
      sequence_no: 2,
      principal_xof: 20_000,
      penalty_xof: 400, // 2% de pénalité de retard
      status: "due",
    });

    const payResult = await payMarketplaceInstallmentWithWallet({
      installmentId,
      buyerUserId: buyerId,
    });

    expect(payResult.success).toBe(true);
    expect(payResult.amountPaid).toBe(20_400); // 20 000 + 400
    expect(payResult.orderId).toBe(orderId);

    // Vérifier déduction du portefeuille
    const wallet = await getOrCreateWallet(buyerId);
    expect(wallet.availableBalance).toBe(9_600); // 30 000 - 20 400

    // Vérifier statut de la mensualité
    const updatedInst = localMarketplaceStore.installments.get(installmentId);
    expect(updatedInst.status).toBe("paid");
    expect(updatedInst.paid_at).toBeTruthy();
  });

  it("9. Doit rejeter le paiement d'une mensualité déjà payée", async () => {
    const buyerId = `buyer_p4_${testIdx}`;
    const orderId = `order_p4_${testIdx}`;
    const installmentId = `inst_p4_${testIdx}`;

    localMarketplaceStore.installments.set(installmentId, {
      id: installmentId,
      order_id: orderId,
      sequence_no: 1,
      principal_xof: 10_000,
      status: "paid",
    });

    await expect(
      payMarketplaceInstallmentWithWallet({
        installmentId,
        buyerUserId: buyerId,
      })
    ).rejects.toThrow("Cette mensualité est déjà réglée");
  });

  it("10. Doit refuser qu'un autre utilisateur règle l'échéance sans être l'acheteur", async () => {
    const buyerId = `buyer_p4_${testIdx}`;
    const orderId = `order_p4_${testIdx}`;
    const installmentId = `inst_p4_${testIdx}`;

    localMarketplaceStore.orders.set(orderId, {
      id: orderId,
      buyer_id: buyerId,
    });

    localMarketplaceStore.installments.set(installmentId, {
      id: installmentId,
      order_id: orderId,
      sequence_no: 1,
      principal_xof: 10_000,
      status: "due",
    });

    await expect(
      payMarketplaceInstallmentWithWallet({
        installmentId,
        buyerUserId: "impostor_user_id",
      })
    ).rejects.toThrow("Vous n'êtes pas l'acheteur de cette commande");
  });

  it("11. Doit supporter une commission personnalisée de la marketplace", async () => {
    const buyerId = `buyer_p4_${testIdx}`;
    const sellerId = `seller_p4_${testIdx}`;
    const supplierId = `supp_p4_${testIdx}`;
    const orderId = `order_p4_${testIdx}`;

    localMarketplaceStore.suppliers.set(supplierId, {
      id: supplierId,
      user_id: sellerId,
      business_name: "Boutique Artisanale Envol",
    });

    await creditWallet({
      userId: buyerId,
      amount: 100_000,
      type: "DEPOSIT",
      source: "deposit",
      sourceId: `dep_source_comm_${testIdx}`,
      description: "Dépôt",
      reference: `DEP-COMM-${testIdx}`,
    });

    localMarketplaceStore.orders.set(orderId, {
      id: orderId,
      buyer_id: buyerId,
      supplier_id: supplierId,
      total_xof: 100_000,
      status: "pending_payment",
    });

    await holdMarketplaceOrderEscrow({ orderId, buyerId, amount: 100_000 });

    // Appliquer une commission de 8% au lieu de 5%
    const releaseRes = await releaseMarketplaceOrderEscrow({
      orderId,
      buyerOrAdminUserId: buyerId,
      platformCommissionPercent: 8,
    });

    expect(releaseRes.platformFee).toBe(8_000);
    expect(releaseRes.sellerAmount).toBe(92_000);

    const sellerWallet = await getOrCreateWallet(sellerId);
    expect(sellerWallet.availableBalance).toBe(92_000);
  });
});
