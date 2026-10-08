import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie } from '@/lib/auth';
import { initMonerooPayment } from '@/lib/moneroo';
import { getMonerooMethodCodes } from '@/lib/payment-methods';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`wallet_deposit:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes. Veuillez patienter une minute.' }, { status: 429 });
  }

  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Veuillez vous connecter pour recharger votre portefeuille.' }, { status: 401 });
    }

    const body = await req.json();
    const rawAmount = Number(body.amount);

    if (!Number.isFinite(rawAmount) || rawAmount < 500) {
      return NextResponse.json({ error: 'Le montant minimum de rechargement est de 500 XOF.' }, { status: 400 });
    }

    if (rawAmount > 5_000_000) {
      return NextResponse.json({ error: 'Le montant maximum par recharge est de 5 000 000 XOF.' }, { status: 400 });
    }

    const amount = Math.round(rawAmount);
    const country = String(user.country || body.country || 'BJ').toUpperCase();
    const paymentMethods = getMonerooMethodCodes(country, 'XOF');
    const baseUrl = req.nextUrl.origin;
    const returnUrl = body.returnUrl || `${baseUrl}/compte/wallet?deposit_success=1`;

    const payment = await initMonerooPayment({
      amount,
      currency: 'XOF',
      description: `Recharge Portefeuille Envol Africa (${amount.toLocaleString('fr-FR')} XOF)`,
      customer: {
        email: user.email,
        first_name: user.prenom || 'Client',
        last_name: user.nom || 'Envol',
        phone: user.phone || body.phone,
        country,
      },
      return_url: returnUrl,
      ...(paymentMethods.length > 0 ? { methods: paymentMethods } : {}),
      metadata: {
        product: 'wallet_deposit',
        purpose: 'wallet_deposit',
        user_id: user.id,
        amount,
        currency: 'XOF',
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      checkoutUrl: payment.checkout_url,
      mock: (payment as any).mock,
    });
  } catch (error: any) {
    console.error('Erreur API Wallet Deposit:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de l’initialisation de la recharge' },
      { status: 500 }
    );
  }
}
