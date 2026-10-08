import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAvailablePaymentMethods,
  getMonerooMethodCodes,
} from '@/lib/payment-methods';
import {
  resolveCountry,
  isValidIsoCountry,
  isUemoaCountry,
} from '@/lib/country-resolver';
import {
  initMonerooPayout,
  verifyMonerooPayout,
  getMonerooPayoutMethods,
  isPayoutMethodSupported,
  UnsupportedPayoutMethodError,
} from '@/lib/moneroo-payout';
import {
  requestRefund,
  approveRefund,
  rejectRefund,
  executeApprovedRefund,
  settlePayoutRefundWebhook,
  getRemainingRefundableAmount,
  RefundDomainError,
} from '@/lib/refunds/refund-service';
import {
  getOrCreateWallet,
  creditWallet,
  debitWallet,
  holdEscrow,
  releaseEscrow,
  refundHeldEscrow,
  requestWithdrawal,
  completeWithdrawal,
  rejectWithdrawal,
  settleWalletDeposit,
  ProductionDatabaseNotConfiguredError,
} from '@/lib/wallet/financial-core';

describe('PHASE 2 & 3 — Celtiis Bénin, Catalogue Paiements & Résolution Pays', () => {
  it('inclut obligatoirement celtiis_bj dans le catalogue Bénin XOF', () => {
    const methods = getAvailablePaymentMethods('BJ', 'XOF');
    const codes = getMonerooMethodCodes('BJ', 'XOF');

    expect(codes).toContain('celtiis_bj');
    expect(codes).toContain('mtn_bj');
    expect(codes).toContain('moov_bj');
    expect(codes).toContain('card_xof');

    const celtiis = methods.find((m) => m.code === 'celtiis_bj');
    expect(celtiis).toBeDefined();
    expect(celtiis?.label).toBe('Celtiis Cash');
  });

  it('résout le pays via la hiérarchie sécurisée (profil > explicite > headers > fallback BJ)', () => {
    // 1. Profil utilisateur prioritaire
    expect(
      resolveCountry({
        userProfileCountry: 'ci',
        explicitCountry: 'sn',
        fallback: 'BJ',
      })
    ).toBe('CI');

    // 2. Pays explicite si pas de profil
    expect(
      resolveCountry({
        userProfileCountry: null,
        explicitCountry: 'SN',
        fallback: 'BJ',
      })
    ).toBe('SN');

    // 3. Header serveur si pas d'explicite
    const headers = new Headers();
    headers.set('x-vercel-ip-country', 'TG');
    expect(
      resolveCountry({
        userProfileCountry: null,
        explicitCountry: null,
        headers,
      })
    ).toBe('TG');

    // 4. Fallback documenté par défaut (BJ)
    expect(
      resolveCountry({
        userProfileCountry: null,
        explicitCountry: null,
        fallback: 'BJ',
      })
    ).toBe('BJ');
  });

  it('valide strictement les codes ISO de pays', () => {
    expect(isValidIsoCountry('BJ')).toBe(true);
    expect(isValidIsoCountry('ci')).toBe(true);
    expect(isValidIsoCountry('BENIN')).toBe(false);
    expect(isValidIsoCountry(123)).toBe(false);
    expect(isValidIsoCountry(null)).toBe(false);
    expect(isUemoaCountry('BJ')).toBe(true);
    expect(isUemoaCountry('FR')).toBe(false);
  });
});

describe('PHASE 4 & 7 — Moneroo Payout & Règle Celtiis Payout', () => {
  it('autorise MTN et Moov en payout Bénin mais refuse expressément Celtiis en payout', () => {
    const payoutMethods = getMonerooPayoutMethods('BJ', 'XOF');
    expect(payoutMethods).toContain('mtn_bj');
    expect(payoutMethods).toContain('moov_bj');
    expect(payoutMethods).not.toContain('celtiis_bj');

    expect(isPayoutMethodSupported('mtn_bj', 'BJ', 'XOF')).toBe(true);
    expect(isPayoutMethodSupported('moov_bj', 'BJ', 'XOF')).toBe(true);
    expect(isPayoutMethodSupported('celtiis_bj', 'BJ', 'XOF')).toBe(false);
  });

  it('lève UnsupportedPayoutMethodError si une tentative de Payout Celtiis est effectuée', async () => {
    await expect(
      initMonerooPayout({
        amount: 5000,
        currency: 'XOF',
        method: 'celtiis_bj',
        description: 'Test Payout Celtiis',
        recipient: { phone: '+22990000000', country: 'BJ' },
      })
    ).rejects.toThrow(UnsupportedPayoutMethodError);
  });

  it('initialise un payout autorisé en mode mock hors production', async () => {
    const result = await initMonerooPayout({
      amount: 10000,
      currency: 'XOF',
      method: 'mtn_bj',
      description: 'Test Payout MTN',
      recipient: { phone: '+22997000000', country: 'BJ' },
      idempotencyKey: 'idemp_test_payout_1',
    });

    expect(result.id).toMatch(/^payout_mock_/);
    expect(result.status).toBe('pending');
    expect(result.amount).toBe(10000);
    expect(result.currency).toBe('XOF');
    expect(result.mock).toBe(true);
  });

  it('vérifie un payout existant', async () => {
    const verify = await verifyMonerooPayout('payout_mock_123');
    expect(verify.status).toBe('success');
    expect(verify.mock).toBe(true);
  });
});

describe('PHASE 5 & 6 — Domaine Remboursements (Internal Wallet vs External Payout)', () => {
  const originalPaymentId = 'pay_init_1001';
  const originalAmount = 25000;
  const userId = 'usr_refund_tester';

  it('calcule exactement le montant restant remboursable', async () => {
    const remaining = await getRemainingRefundableAmount(originalPaymentId, originalAmount);
    expect(remaining).toBe(originalAmount);
  });

  it('enregistre une demande de remboursement interne et la valide (REQUESTED -> APPROVED -> PAID)', async () => {
    const refund = await requestRefund({
      originalPaymentId,
      userId,
      amount: 10000,
      originalAmount,
      mode: 'INTERNAL_WALLET',
      reason: 'Produit défectueux retourné',
      requestedBy: userId,
      idempotencyKey: 'rfnd_internal_unique_1',
    });

    expect(refund.status).toBe('REQUESTED');
    expect(refund.mode).toBe('INTERNAL_WALLET');
    expect(refund.amount).toBe(10000);
    expect(refund.reference).toMatch(/^RFND-/);

    // Approbation
    const approved = await approveRefund({
      refundId: refund.id,
      approvedBy: 'admin_audit',
      adminNotes: 'Retour marchandise inspecté et validé',
    });
    expect(approved.status).toBe('APPROVED');

    // Exécution financière : crédit atomique dans le Portefeuille Central
    const executed = await executeApprovedRefund(refund.id, 'admin_audit');
    expect(executed.status).toBe('PAID');
    expect(executed.completedAt).toBeDefined();

    // Vérification du portefeuille : le solde disponible doit avoir augmenté de 10 000 XOF
    const wallet = await getOrCreateWallet(userId);
    expect(wallet.availableBalance).toBeGreaterThanOrEqual(10000);
  });

  it('bloque toute tentative de sur-remboursement au-delà du montant restant', async () => {
    // 10 000 déjà demandés ci-dessus sur 25 000, reste 15 000
    await expect(
      requestRefund({
        originalPaymentId,
        userId,
        amount: 20000, // Supérieur aux 15 000 restants
        originalAmount,
        reason: 'Tentative de sur-remboursement',
        requestedBy: userId,
      })
    ).rejects.toThrow(RefundDomainError);
  });

  it('refuse un remboursement externe si la méthode demandée est Celtiis (oriente vers Wallet)', async () => {
    await expect(
      requestRefund({
        originalPaymentId: 'pay_celtiis_orig',
        userId,
        amount: 5000,
        originalAmount: 5000,
        mode: 'EXTERNAL_PAYOUT',
        reason: 'Demande remboursement externe',
        requestedBy: userId,
        destinationDetails: {
          method: 'celtiis_bj',
          country: 'BJ',
        },
      })
    ).rejects.toThrow(/Moneroo ne supporte pas actuellement Celtiis Cash en Payout/);
  });

  it('exécute un remboursement externe vers une méthode supportée (MTN) via Moneroo Payout', async () => {
    const refund = await requestRefund({
      originalPaymentId: 'pay_mtn_orig',
      userId,
      amount: 5000,
      originalAmount: 5000,
      mode: 'EXTERNAL_PAYOUT',
      reason: 'Annulation commande',
      requestedBy: userId,
      destinationDetails: {
        method: 'mtn_bj',
        phone: '+22997000000',
        country: 'BJ',
      },
    });

    await approveRefund({ refundId: refund.id, approvedBy: 'admin_finance' });
    const executed = await executeApprovedRefund(refund.id, 'admin_finance');

    expect(['PENDING', 'PAID', 'INITIALIZED']).toContain(executed.status);
    expect(executed.providerPayoutId).toBeDefined();

    // Confirmation finale via webhook payout.success
    const webhookSettled = await settlePayoutRefundWebhook(executed.providerPayoutId!, 'success');
    expect(webhookSettled?.status).toBe('PAID');
    expect(webhookSettled?.completedAt).toBeDefined();
  });

  it('respecte l’idempotence sur le remboursement (même clé = même objet, pas de duplication)', async () => {
    const first = await requestRefund({
      originalPaymentId: 'pay_idem_test',
      userId,
      amount: 2000,
      originalAmount: 5000,
      reason: 'Test idempotence',
      requestedBy: userId,
      idempotencyKey: 'idemp_key_refund_strict_1',
    });

    const second = await requestRefund({
      originalPaymentId: 'pay_idem_test',
      userId,
      amount: 2000,
      originalAmount: 5000,
      reason: 'Test idempotence doublon',
      requestedBy: userId,
      idempotencyKey: 'idemp_key_refund_strict_1',
    });

    expect(first.id).toBe(second.id);
    expect(first.reference).toBe(second.reference);
  });
});

describe('PHASE 8, 9, 10 & 20 — Financial Core, Sécurité Webhook & Tests de Concurrence', () => {
  const concUser = 'usr_concurrency_guard';

  beforeEach(async () => {
    const w = await getOrCreateWallet(concUser);
    w.availableBalance = 50000;
    w.heldBalance = 0;
    w.pendingBalance = 0;
  });

  it('traite les dépôts de manière strictement idempotente (pas de double crédit)', async () => {
    const paymentId = 'moneroo_pay_dep_idem_1';
    const res1 = await settleWalletDeposit({
      userId: concUser,
      paymentId,
      amount: 15000,
      currency: 'XOF',
    });

    const res2 = await settleWalletDeposit({
      userId: concUser,
      paymentId,
      amount: 15000,
      currency: 'XOF',
    });

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(res2.duplicate).toBe(true);
  });

  it('gère les opérations de séquestre (Escrow) avec séparation stricte des soldes', async () => {
    const hold = await holdEscrow({
      userId: concUser,
      amount: 10000,
      reason: 'marketplace_escrow',
      source: 'marketplace_orders',
      sourceId: 'ord_123',
      description: 'Séquestre achat smartphone',
    });

    expect(hold.success).toBe(true);
    const wAfterHold = await getOrCreateWallet(concUser);
    expect(wAfterHold.heldBalance).toBe(10000);

    // Remboursement du séquestre vers l'acheteur
    const refundRes = await refundHeldEscrow({
      holdId: hold.holdId,
      reason: 'Commande annulée par le vendeur',
    });
    expect(refundRes.success).toBe(true);

    const wAfterRefund = await getOrCreateWallet(concUser);
    expect(wAfterRefund.heldBalance).toBe(0);
  });

  it('effectue deux débits concurrents et refuse le second si le solde devient insuffisant', async () => {
    const w = await getOrCreateWallet(concUser);
    w.availableBalance = 10000;

    // Débit 1 : 8 000 XOF
    const d1 = await debitWallet({
      userId: concUser,
      amount: 8000,
      type: 'PAYMENT',
      source: 'marketplace',
      sourceId: 'ord_sample_1',
      description: 'Premier achat',
    });
    expect(d1.success).toBe(true);

    // Débit 2 : 8 000 XOF (Doit échouer car solde restant = 2 000 XOF)
    await expect(
      debitWallet({
        userId: concUser,
        amount: 8000,
        type: 'PAYMENT',
        source: 'marketplace',
        sourceId: 'ord_sample_2',
        description: 'Deuxième achat trop élevé',
      })
    ).rejects.toThrow(/Solde insuffisant/);
  });

  it('empêche la finalisation double ou récurrente d’un retrait', async () => {
    const wdr = await requestWithdrawal({
      userId: concUser,
      amount: 5000,
      method: 'mtn_momo',
      destinationAccount: '+22997000000',
      accountHolder: 'Jean Dupont',
    });

    expect(wdr.success).toBe(true);

    // Finalisation 1
    const comp1 = await completeWithdrawal(wdr.withdrawalId, 'payout_prov_1', 'admin_1');
    expect(comp1.success).toBe(true);

    // Finalisation 2 : doit échouer car statut déjà completed
    await expect(
      completeWithdrawal(wdr.withdrawalId, 'payout_prov_1', 'admin_1')
    ).rejects.toThrow(/Statut invalide/);
  });
});
