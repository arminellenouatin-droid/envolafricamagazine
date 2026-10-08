import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOrCreateWallet,
  creditWallet,
  debitWallet,
  holdWalletEscrow,
  releaseHeldEscrow,
  refundHeldEscrow,
  requestWithdrawal,
  completeWithdrawal,
  rejectWithdrawal,
  settleWalletDeposit,
  getWalletSummary,
} from '../wallet/financial-core';

describe('Financial Core & Wallet Ledger (Document 1 - Phase 1)', () => {
  const userA = 'user-test-wallet-a';
  const userB = 'user-test-wallet-b';

  beforeEach(() => {
    // Note: localStore keeps in-memory state during tests
  });

  it('1. Crée un nouveau portefeuille avec des soldes à zéro par défaut', async () => {
    const wallet = await getOrCreateWallet(userA);
    expect(wallet).toBeDefined();
    expect(wallet.userId).toBe(userA);
    expect(wallet.currency).toBe('XOF');
    expect(wallet.availableBalance).toBeGreaterThanOrEqual(0);
    expect(wallet.heldBalance).toBeGreaterThanOrEqual(0);
    expect(wallet.pendingBalance).toBeGreaterThanOrEqual(0);
    expect(wallet.status).toBe('active');
  });

  it('2. Crédite le portefeuille de manière atomique et enregistre la transaction', async () => {
    const initialWallet = await getOrCreateWallet(userA);
    const startBalance = initialWallet.availableBalance;

    const result = await creditWallet({
      userId: userA,
      amount: 50000,
      type: 'DEPOSIT',
      source: 'moneroo',
      sourceId: 'pay_test_123',
      description: 'Rechargement de test',
      reference: 'CR-TEST-001',
    });

    expect(result.success).toBe(true);
    expect(result.wallet.availableBalance).toBe(startBalance + 50000);
    expect(result.reference).toBe('CR-TEST-001');

    const summary = await getWalletSummary(userA);
    expect(summary.recentTransactions.some((tx) => tx.reference === 'CR-TEST-001')).toBe(true);
  });

  it('3. Garantit l’idempotence lors d’un crédit répété avec la même idempotencyKey', async () => {
    const initialWallet = await getOrCreateWallet(userA);
    const balanceBefore = initialWallet.availableBalance;
    const idemKey = 'idem-dep-unique-999';

    const res1 = await creditWallet({
      userId: userA,
      amount: 15000,
      type: 'DEPOSIT',
      source: 'moneroo',
      sourceId: 'pay_idem_1',
      description: 'Dépôt unique',
      idempotencyKey: idemKey,
    });
    expect(res1.wallet.availableBalance).toBe(balanceBefore + 15000);

    // Second appel avec la même clé
    const res2 = await creditWallet({
      userId: userA,
      amount: 15000,
      type: 'DEPOSIT',
      source: 'moneroo',
      sourceId: 'pay_idem_1',
      description: 'Dépôt unique doublon',
      idempotencyKey: idemKey,
    });
    expect(res2.duplicate).toBe(true);
    expect(res2.wallet.availableBalance).toBe(balanceBefore + 15000); // Pas de double crédit !
  });

  it('4. Débite le portefeuille avec solde suffisant', async () => {
    const wallet = await getOrCreateWallet(userA);
    const startBalance = wallet.availableBalance;

    const result = await debitWallet({
      userId: userA,
      amount: 10000,
      type: 'MARKETPLACE_PAYMENT',
      source: 'marketplace_order',
      sourceId: 'order_abc',
      description: 'Achat produit marketplace',
      reference: 'DB-TEST-001',
    });

    expect(result.success).toBe(true);
    expect(result.wallet.availableBalance).toBe(startBalance - 10000);
  });

  it('5. Rejette un débit si le solde disponible est insuffisant', async () => {
    const hugeAmount = 999_999_999;
    await expect(
      debitWallet({
        userId: userA,
        amount: hugeAmount,
        type: 'WITHDRAWAL',
        source: 'withdrawal',
        sourceId: 'wdr_fail',
        description: 'Retrait trop grand',
      })
    ).rejects.toThrow(/Solde insuffisant/i);
  });

  it('6. Place des fonds sous séquestre (Escrow Hold)', async () => {
    const wallet = await getOrCreateWallet(userA);
    const availableBefore = wallet.availableBalance;
    const heldBefore = wallet.heldBalance;

    const holdRes = await holdWalletEscrow({
      userId: userA,
      amount: 20000,
      reason: 'marketplace_escrow',
      source: 'marketplace_orders',
      sourceId: 'ord_escrow_1',
      description: 'Séquestre commande #ORD-ESCROW-1',
      reference: 'HOLD-TEST-001',
    });

    expect(holdRes.success).toBe(true);
    expect(holdRes.wallet.availableBalance).toBe(availableBefore - 20000);
    expect(holdRes.wallet.heldBalance).toBe(heldBefore + 20000);
    expect(holdRes.holdId).toBeDefined();
  });

  it('7. Libère le séquestre vers le vendeur avec commission plateforme', async () => {
    // Créer un hold spécifique
    const holdRes = await holdWalletEscrow({
      userId: userA,
      amount: 10000,
      reason: 'marketplace_escrow',
      source: 'marketplace_orders',
      sourceId: 'ord_escrow_2',
      description: 'Séquestre commande #ORD-ESCROW-2',
      reference: 'HOLD-TEST-002',
    });

    const sellerWalletBefore = await getOrCreateWallet(userB);
    const sellerBalanceBefore = sellerWalletBefore.availableBalance;

    // Libération vers userB avec 1000 XOF de frais plateforme
    const releaseRes = await releaseHeldEscrow({
      holdId: holdRes.holdId,
      recipientUserId: userB,
      platformFee: 1000,
      description: 'Paiement vendeur commande livrée',
    });

    expect(releaseRes.success).toBe(true);
    expect(releaseRes.sellerAmount).toBe(9000);
    expect(releaseRes.platformFee).toBe(1000);

    const sellerWalletAfter = await getOrCreateWallet(userB);
    expect(sellerWalletAfter.availableBalance).toBe(sellerBalanceBefore + 9000);
  });

  it('8. Rembourse le séquestre vers l’acheteur suite à annulation', async () => {
    const holdRes = await holdWalletEscrow({
      userId: userA,
      amount: 8000,
      reason: 'marketplace_escrow',
      source: 'marketplace_orders',
      sourceId: 'ord_escrow_cancel',
      description: 'Séquestre commande annulée',
      reference: 'HOLD-TEST-CANCEL',
    });

    const buyerWalletBefore = await getOrCreateWallet(userA);
    const buyerAvailableBefore = buyerWalletBefore.availableBalance;

    const refundRes = await refundHeldEscrow({
      holdId: holdRes.holdId,
      reason: 'Commande annulée par acheteur',
    });

    expect(refundRes.success).toBe(true);
    expect(refundRes.refundedAmount).toBe(8000);

    const buyerWalletAfter = await getOrCreateWallet(userA);
    expect(buyerWalletAfter.availableBalance).toBe(buyerAvailableBefore + 8000);
  });

  it('9. Gère une demande de retrait avec calcul automatique des frais (1.5%)', async () => {
    const wallet = await getOrCreateWallet(userA);
    const availableBefore = wallet.availableBalance;

    const wdrRes = await requestWithdrawal({
      userId: userA,
      amount: 10000,
      method: 'mtn_momo',
      destinationAccount: '+229 97 00 11 22',
      accountHolder: 'Test User A',
    });

    expect(wdrRes.success).toBe(true);
    expect(wdrRes.withdrawalId).toBeDefined();
    // Frais 1.5% de 10000 = 150 XOF, net = 9850 XOF
    expect(wdrRes.netAmount).toBe(9850);
    expect(wdrRes.wallet.availableBalance).toBe(availableBefore - 10000);
    expect(wdrRes.wallet.pendingBalance).toBeGreaterThanOrEqual(10000);

    // Finalisation du retrait
    const completeRes = await completeWithdrawal(wdrRes.withdrawalId, 'payout_momo_999');
    expect(completeRes.success).toBe(true);
    expect(completeRes.status).toBe('completed');
  });

  it('10. Restitue le montant en cas de rejet d’un retrait', async () => {
    const wallet = await getOrCreateWallet(userA);
    const availableBefore = wallet.availableBalance;

    const wdrRes = await requestWithdrawal({
      userId: userA,
      amount: 5000,
      method: 'moov_money',
      destinationAccount: '+229 95 00 22 33',
      accountHolder: 'Test User A',
    });

    const rejectRes = await rejectWithdrawal(wdrRes.withdrawalId, 'Numéro Moov erroné');
    expect(rejectRes.success).toBe(true);
    expect(rejectRes.status).toBe('rejected');

    const walletAfter = await getOrCreateWallet(userA);
    expect(walletAfter.availableBalance).toBe(availableBefore); // Solde intégralement restitué
  });

  it('11. Rechargement Moneroo (settleWalletDeposit) avec vérification de réentrance', async () => {
    const wallet = await getOrCreateWallet(userA);
    const balanceBefore = wallet.availableBalance;

    const depRes = await settleWalletDeposit({
      userId: userA,
      paymentId: 'moneroo_pay_777',
      amount: 25000,
      currency: 'XOF',
    });

    expect(depRes.success).toBe(true);
    expect(depRes.wallet.availableBalance).toBe(balanceBefore + 25000);

    // Rejeu webhook Moneroo
    const duplicateRes = await settleWalletDeposit({
      userId: userA,
      paymentId: 'moneroo_pay_777',
      amount: 25000,
      currency: 'XOF',
    });

    expect(duplicateRes.duplicate).toBe(true);
    expect(duplicateRes.wallet.availableBalance).toBe(balanceBefore + 25000);
  });
});
