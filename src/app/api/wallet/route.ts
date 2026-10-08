import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie } from '@/lib/auth';
import { getWalletSummary } from '@/lib/wallet/financial-core';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const summary = await getWalletSummary(user.id);

    return NextResponse.json({
      success: true,
      wallet: summary.wallet,
      recentTransactions: summary.recentTransactions,
      totalTransactions: summary.totalTransactions,
      activeHolds: summary.activeHolds,
      allHolds: summary.allHolds,
      pendingWithdrawals: summary.pendingWithdrawals,
      allWithdrawals: summary.allWithdrawals,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        phone: user.phone,
        currency: user.currency || 'XOF',
      },
    });
  } catch (error: any) {
    console.error('Erreur API Wallet GET:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur interne lors de la récupération du portefeuille' },
      { status: 500 }
    );
  }
}
