import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie } from '@/lib/auth';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { requestWithdrawal } from '@/lib/wallet/financial-core';
import type { WithdrawalMethod } from '@/lib/wallet/types';
import { assertKYCVerifiedForWithdrawal, logAMLMovement } from '@/lib/kyc/kyc-service';

export const dynamic = 'force-dynamic';

const ALLOWED_METHODS: WithdrawalMethod[] = [
  'mtn_momo',
  'moov_money',
  'orange_money',
  'wave',
  'bank_transfer',
  'celtiis_cash',
];

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`wallet_withdraw:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes de retrait. Veuillez patienter.' }, { status: 429 });
  }

  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Veuillez vous connecter pour demander un retrait.' }, { status: 401 });
    }

    const body = await req.json();
    const rawAmount = Number(body.amount);
    const method = body.method as WithdrawalMethod;
    const destinationAccount = String(body.destinationAccount || '').trim();
    const accountHolder = String(body.accountHolder || '').trim();

    if (!Number.isFinite(rawAmount) || rawAmount < 1000) {
      return NextResponse.json({ error: 'Le montant minimum de retrait est de 1 000 XOF.' }, { status: 400 });
    }

    if (!ALLOWED_METHODS.includes(method)) {
      return NextResponse.json({ error: 'Moyen de retrait invalide.' }, { status: 400 });
    }

    if (!destinationAccount || destinationAccount.length < 5) {
      return NextResponse.json(
        { error: 'Veuillez saisir un numéro de compte ou de téléphone valide pour le retrait.' },
        { status: 400 }
      );
    }

    if (!accountHolder || accountHolder.length < 2) {
      return NextResponse.json(
        { error: 'Veuillez renseigner le nom complet du titulaire du compte.' },
        { status: 400 }
      );
    }

    const amount = Math.round(rawAmount);

    // CONTRÔLE DE SÉCURITÉ OBLIGATOIRE : CONFORMITÉ KYC & AML
    const userAgent = req.headers.get('user-agent') || undefined;
    await assertKYCVerifiedForWithdrawal(user.id, {
      movementType: 'retrait_wallet',
      amount,
      ipAddress: ip,
      userAgent,
    });

    const result = await requestWithdrawal({
      userId: user.id,
      amount,
      method,
      destinationAccount,
      accountHolder,
      metadata: {
        userEmail: user.email,
        userName: `${user.prenom} ${user.nom}`.trim(),
        requestedVia: 'web',
        clientIp: ip,
      },
    });

    // JOURNALISATION AUDIT AML AVEC TRAÇABILITÉ IP
    await logAMLMovement({
      userId: user.id,
      userEmail: user.email,
      userName: `${user.prenom} ${user.nom}`.trim(),
      type: 'retrait_wallet',
      montant: amount,
      devise: 'XOF',
      ipAddress: ip,
      userAgent,
      kycVerified: true,
      statut: 'succes',
      referenceExterne: result.reference,
      details: {
        withdrawalId: result.withdrawalId,
        method,
        destinationAccount,
        accountHolder,
      },
    });

    return NextResponse.json({
      success: true,
      withdrawalId: result.withdrawalId,
      reference: result.reference,
      netAmount: result.netAmount,
      wallet: result.wallet,
      message: 'Demande de retrait enregistrée avec succès. Elle sera traitée dans les plus brefs délais.',
    });
  } catch (error: any) {
    console.error('Erreur API Wallet Withdraw:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la demande de retrait' },
      { status: 400 }
    );
  }
}
