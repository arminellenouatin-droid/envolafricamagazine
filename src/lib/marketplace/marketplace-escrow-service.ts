import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  holdWalletEscrow,
  releaseHeldEscrow,
  refundHeldEscrow,
  debitWallet,
  creditWallet,
  getOrCreateWallet,
} from "@/lib/wallet/financial-core";

// Mémoire locale pour les tests et exécution hors-Supabase
interface LocalMarketplaceStore {
  orders: Map<string, any>;
  suppliers: Map<string, any>;
  installments: Map<string, any>;
  conversations: Map<string, any>;
}

export const localMarketplaceStore: LocalMarketplaceStore = {
  orders: new Map(),
  suppliers: new Map(),
  installments: new Map(),
  conversations: new Map(),
};

export const DEFAULT_MARKETPLACE_COMMISSION_PERCENT = 5; // 5% de frais de plateforme

/**
 * 1. Blocage automatique en séquestre lors d'une commande Marketplace
 */
export async function holdMarketplaceOrderEscrow(params: {
  orderId: string;
  buyerId: string;
  amount: number;
  description?: string;
  idempotencyKey?: string;
}): Promise<{
  success: boolean;
  holdId: string;
  reference: string;
  orderId: string;
}> {
  const { orderId, buyerId, amount, description = "Séquestre commande Marketplace" } = params;

  if (!orderId || !buyerId || amount <= 0) {
    throw new Error("Paramètres invalides pour la mise en séquestre de la commande");
  }

  // 1. Mise en séquestre dans le Financial Core
  const holdRes = await holdWalletEscrow({
    userId: buyerId,
    amount,
    reason: "marketplace_escrow",
    source: "marketplace_order",
    sourceId: orderId,
    description,
    reference: `HOLD-MKT-${orderId.slice(0, 8)}`,
    metadata: { orderId, buyerId },
  });

  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();

  // 2. Mise à jour de la commande
  if (supabase) {
    await supabase
      .from("marketplace_orders")
      .update({
        status: "paid",
        updated_at: now,
      })
      .eq("id", orderId);
  } else {
    const existing = localMarketplaceStore.orders.get(orderId) || { id: orderId, buyer_id: buyerId, total_xof: amount };
    existing.status = "paid";
    existing.escrow_hold_id = holdRes.holdId;
    existing.updated_at = now;
    localMarketplaceStore.orders.set(orderId, existing);
  }

  return {
    success: true,
    holdId: holdRes.holdId,
    reference: holdRes.reference,
    orderId,
  };
}

/**
 * 2. Libération du séquestre vers le vendeur à la confirmation de livraison
 */
export async function releaseMarketplaceOrderEscrow(params: {
  orderId: string;
  buyerOrAdminUserId: string;
  platformCommissionPercent?: number;
}): Promise<{
  success: boolean;
  orderId: string;
  sellerUserId: string;
  sellerAmount: number;
  platformFee: number;
}> {
  const { orderId, buyerOrAdminUserId, platformCommissionPercent = DEFAULT_MARKETPLACE_COMMISSION_PERCENT } = params;

  if (!orderId || !buyerOrAdminUserId) {
    throw new Error("Identifiants de commande et utilisateur requis");
  }

  const supabase = getSupabaseAdmin();
  let order: any = null;
  let supplier: any = null;

  if (supabase) {
    const { data: o, error: oErr } = await supabase
      .from("marketplace_orders")
      .select("id, buyer_id, supplier_id, total_xof, status, created_at")
      .eq("id", orderId)
      .maybeSingle();

    if (oErr) throw oErr;
    order = o;

    if (order?.supplier_id) {
      const { data: s } = await supabase
        .from("marketplace_suppliers")
        .select("id, user_id, business_name")
        .eq("id", order.supplier_id)
        .maybeSingle();
      supplier = s;
    }
  } else {
    order = localMarketplaceStore.orders.get(orderId);
    if (order?.supplier_id) {
      supplier = localMarketplaceStore.suppliers.get(order.supplier_id) || {
        id: order.supplier_id,
        user_id: `seller_${order.supplier_id}`,
        business_name: "Boutique Officielle",
      };
    }
  }

  if (!order) throw new Error("Commande introuvable");

  // Vérifier les droits : l'acheteur de la commande ou un admin
  if (order.buyer_id !== buyerOrAdminUserId && !buyerOrAdminUserId.startsWith("admin")) {
    throw new Error("Seul l'acheteur ou un administrateur peut confirmer la livraison");
  }

  const totalAmount = Number(order.total_xof || 0);
  const sellerUserId = supplier?.user_id || `seller_${order.supplier_id || "default"}`;
  const platformFee = Math.round((totalAmount * platformCommissionPercent) / 100);
  const sellerAmount = Math.max(0, totalAmount - platformFee);
  const now = new Date().toISOString();

  // Si un séquestre formel existe
  const holdId = order.escrow_hold_id;
  if (holdId) {
    await releaseHeldEscrow({
      holdId,
      recipientUserId: sellerUserId,
      platformFee,
      description: `Règlement vente Marketplace pour commande #${orderId}`,
    });
  } else {
    // Paiement direct crédité sur le portefeuille central du vendeur
    await creditWallet({
      userId: sellerUserId,
      amount: sellerAmount,
      type: "MARKETPLACE_ESCROW_RELEASE",
      source: "marketplace_order",
      sourceId: orderId,
      description: `Libération des fonds pour la commande #${orderId} (Net après ${platformCommissionPercent}% commission)`,
      reference: `REL-MKT-${orderId.slice(0, 8)}`,
    });
  }

  // Mise à jour de la commande
  if (supabase) {
    await supabase
      .from("marketplace_orders")
      .update({
        status: "received",
        received_at: now,
        updated_at: now,
      })
      .eq("id", orderId);

    // Mettre à jour la conversation liée si présente
    await supabase
      .from("marketplace_conversations")
      .update({
        status: "completed",
        updated_at: now,
      })
      .eq("order_id", orderId);
  } else {
    order.status = "received";
    order.received_at = now;
    order.updated_at = now;
    localMarketplaceStore.orders.set(orderId, order);
  }

  return {
    success: true,
    orderId,
    sellerUserId,
    sellerAmount,
    platformFee,
  };
}

/**
 * 3. Remboursement du séquestre à l'acheteur en cas de litige ou annulation
 */
export async function refundMarketplaceOrderEscrow(params: {
  orderId: string;
  reason?: string;
  authorizedByUserId: string;
}): Promise<{
  success: boolean;
  orderId: string;
  refundedAmount: number;
  buyerUserId: string;
}> {
  const { orderId, reason = "Annulation de commande ou résolution de litige", authorizedByUserId } = params;

  if (!orderId || !authorizedByUserId) {
    throw new Error("Paramètres requis manquants pour le remboursement");
  }

  const supabase = getSupabaseAdmin();
  let order: any = null;

  if (supabase) {
    const { data, error } = await supabase
      .from("marketplace_orders")
      .select("id, buyer_id, total_xof, status")
      .eq("id", orderId)
      .maybeSingle();

    if (error) throw error;
    order = data;
  } else {
    order = localMarketplaceStore.orders.get(orderId);
  }

  if (!order) throw new Error("Commande introuvable");
  if (order.status === "received" || order.status === "completed") {
    throw new Error("Impossible de rembourser une commande déjà livrée et libérée");
  }

  const amount = Number(order.total_xof || 0);
  const buyerUserId = order.buyer_id;
  const now = new Date().toISOString();

  const holdId = order.escrow_hold_id;
  if (holdId) {
    await refundHeldEscrow({
      holdId,
      reason,
      reference: `REF-MKT-${orderId.slice(0, 8)}`,
    });
  } else {
    await creditWallet({
      userId: buyerUserId,
      amount,
      type: "MARKETPLACE_REFUND",
      source: "marketplace_order",
      sourceId: orderId,
      description: `Remboursement commande Marketplace #${orderId} : ${reason}`,
      reference: `REF-MKT-${orderId.slice(0, 8)}`,
    });
  }

  if (supabase) {
    await supabase
      .from("marketplace_orders")
      .update({
        status: "refunded",
        updated_at: now,
      })
      .eq("id", orderId);

    await supabase
      .from("marketplace_conversations")
      .update({
        status: "refunded",
        updated_at: now,
      })
      .eq("order_id", orderId);
  } else {
    order.status = "refunded";
    order.updated_at = now;
    localMarketplaceStore.orders.set(orderId, order);
  }

  return {
    success: true,
    orderId,
    refundedAmount: amount,
    buyerUserId,
  };
}

/**
 * 4. Règlement d'une mensualité d'échéancier (Installment) via le Portefeuille Central
 */
export async function payMarketplaceInstallmentWithWallet(params: {
  installmentId: string;
  buyerUserId: string;
}): Promise<{
  success: boolean;
  installmentId: string;
  amountPaid: number;
  orderId: string;
}> {
  const { installmentId, buyerUserId } = params;

  if (!installmentId || !buyerUserId) {
    throw new Error("Identifiant d'échéance et acheteur requis");
  }

  const supabase = getSupabaseAdmin();
  let installment: any = null;
  let order: any = null;

  if (supabase) {
    const { data: inst, error: instErr } = await supabase
      .from("marketplace_installments")
      .select("id, order_id, sequence_no, principal_xof, penalty_xof, status")
      .eq("id", installmentId)
      .maybeSingle();

    if (instErr) throw instErr;
    installment = inst;

    if (installment?.order_id) {
      const { data: ord } = await supabase
        .from("marketplace_orders")
        .select("id, buyer_id, supplier_id")
        .eq("id", installment.order_id)
        .maybeSingle();
      order = ord;
    }
  } else {
    installment = localMarketplaceStore.installments.get(installmentId);
    if (installment?.order_id) {
      order = localMarketplaceStore.orders.get(installment.order_id);
    }
  }

  if (!installment) throw new Error("Échéance introuvable");
  if (installment.status === "paid") throw new Error("Cette mensualité est déjà réglée");
  if (order && order.buyer_id !== buyerUserId) throw new Error("Vous n'êtes pas l'acheteur de cette commande");

  const amountToPay = Number(installment.principal_xof || 0) + Number(installment.penalty_xof || 0);

  // 1. Débit atomique du Portefeuille Central de l'acheteur
  await debitWallet({
    userId: buyerUserId,
    amount: amountToPay,
    type: "MARKETPLACE_INSTALLMENT",
    source: "marketplace_installment",
    sourceId: installmentId,
    description: `Règlement mensualité #${installment.sequence_no} de la commande #${installment.order_id}`,
    reference: `INST-DB-${Date.now()}-${installmentId.slice(0, 8)}`,
  });

  const now = new Date().toISOString();

  // 2. Mise à jour de l'échéance
  if (supabase) {
    await supabase
      .from("marketplace_installments")
      .update({
        status: "paid",
        paid_at: now,
      })
      .eq("id", installmentId);
  } else {
    installment.status = "paid";
    installment.paid_at = now;
    localMarketplaceStore.installments.set(installmentId, installment);
  }

  return {
    success: true,
    installmentId,
    amountPaid: amountToPay,
    orderId: installment.order_id,
  };
}
