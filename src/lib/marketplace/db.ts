import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  MarketplaceConversation,
  MarketplaceMessage,
  MarketplaceOrderInfo,
  MarketplaceCall,
  MarketplaceDispute,
  MarketplaceQuickReply,
  MarketplaceAttachment,
} from "./types";
import {
  calculateAcceptanceDeadline,
  calculateAutoValidationDeadline,
  getStatusChangeSystemMessage,
} from "./order-machine";

/**
 * Récupère le profil d'un utilisateur par son ID
 */
export async function getUserProfile(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from("users")
    .select("id, nom, prenom, email")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    name: [data.prenom, data.nom].filter(Boolean).join(" ") || data.email || "Utilisateur",
    email: data.email,
  };
}

/**
 * Récupère le profil d'un fournisseur
 */
export async function getSupplierProfile(supplierId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from("marketplace_suppliers")
    .select("id, user_id, business_name, logo_url, rating, certification_status, call_available")
    .eq("id", supplierId)
    .single();
  return data;
}

/**
 * Récupère la liste des conversations pour un utilisateur (en tant qu'acheteur ou fournisseur)
 */
export async function getUserMarketplaceConversations(
  userId: string,
  roleFilter?: "all" | "buyer" | "supplier"
): Promise<MarketplaceConversation[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  // Trouver si l'utilisateur est un fournisseur
  const { data: supplierRecord } = await supabase
    .from("marketplace_suppliers")
    .select("id")
    .eq("user_id", userId)
    .single();

  const supplierId = supplierRecord?.id;

  let query = supabase.from("marketplace_conversations").select(`
    id,
    product_id,
    buyer_id,
    supplier_id,
    order_id,
    status,
    warning_acknowledged_at,
    last_message_at,
    last_message_preview,
    buyer_unread_count,
    supplier_unread_count,
    created_at,
    updated_at,
    marketplace_products (
      id,
      title,
      price_xof,
      media,
      category
    ),
    marketplace_suppliers (
      id,
      user_id,
      business_name,
      logo_url,
      rating,
      certification_status,
      call_available
    )
  `);

  if (roleFilter === "buyer" || !supplierId) {
    query = query.eq("buyer_id", userId);
  } else if (roleFilter === "supplier" && supplierId) {
    query = query.eq("supplier_id", supplierId);
  } else if (supplierId) {
    query = query.or(`buyer_id.eq.${userId},supplier_id.eq.${supplierId}`);
  } else {
    query = query.eq("buyer_id", userId);
  }

  const { data: rawConversations, error } = await query.order("last_message_at", {
    ascending: false,
  });

  if (error || !rawConversations) return [];

  // Hydrater les acheteurs
  const buyerIds = Array.from(new Set(rawConversations.map((c: any) => c.buyer_id)));
  const { data: buyers } = await supabase
    .from("users")
    .select("id, nom, prenom, email")
    .in("id", buyerIds);

  const buyersMap = new Map(
    (buyers || []).map((b) => [
      b.id,
      {
        id: b.id,
        name: [b.prenom, b.nom].filter(Boolean).join(" ") || b.email || "Acheteur",
        email: b.email,
      },
    ])
  );

  return rawConversations.map((c: any) => {
    const prodMedia = Array.isArray(c.marketplace_products?.media) ? c.marketplace_products?.media : [];
    const image = typeof prodMedia[0] === "string" ? prodMedia[0] : undefined;

    return {
      id: c.id,
      product_id: c.product_id,
      buyer_id: c.buyer_id,
      supplier_id: c.supplier_id,
      order_id: c.order_id,
      status: c.status,
      warning_acknowledged_at: c.warning_acknowledged_at,
      last_message_at: c.last_message_at,
      last_message_preview: c.last_message_preview,
      buyer_unread_count: c.buyer_unread_count || 0,
      supplier_unread_count: c.supplier_unread_count || 0,
      created_at: c.created_at,
      updated_at: c.updated_at,
      buyer: buyersMap.get(c.buyer_id),
      supplier: c.marketplace_suppliers
        ? {
            ...c.marketplace_suppliers,
            call_available: c.marketplace_suppliers.call_available ?? true,
          }
        : undefined,
      product: c.marketplace_products
        ? {
            id: c.marketplace_products.id,
            title: c.marketplace_products.title,
            price_xof: c.marketplace_products.price_xof,
            category: c.marketplace_products.category,
            image,
          }
        : undefined,
    };
  });
}

/**
 * Récupère ou initialise une conversation Marketplace
 */
export async function getOrCreateMarketplaceConversation({
  buyerId,
  supplierId,
  productId,
  orderId,
}: {
  buyerId: string;
  supplierId: string;
  productId?: string | null;
  orderId?: string | null;
}): Promise<MarketplaceConversation | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  // 1. Si une commande est spécifiée, chercher d'abord la conversation liée à cette commande
  if (orderId) {
    const { data: convByOrder } = await supabase
      .from("marketplace_conversations")
      .select("id")
      .eq("order_id", orderId)
      .limit(1)
      .single();

    if (convByOrder) {
      return getMarketplaceConversationById(convByOrder.id, buyerId);
    }
  }

  // 2. Chercher une conversation pré-existante pour le même acheteur, fournisseur et produit
  let query = supabase
    .from("marketplace_conversations")
    .select("id")
    .eq("buyer_id", buyerId)
    .eq("supplier_id", supplierId);

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data: existingConv } = await query.limit(1).single();

  if (existingConv) {
    // Si une commande vient d'être créée pour cette conversation, la rattacher
    if (orderId) {
      await supabase
        .from("marketplace_conversations")
        .update({
          order_id: orderId,
          status: "order_pending_acceptance",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingConv.id);
    }
    return getMarketplaceConversationById(existingConv.id, buyerId);
  }

  // 3. Créer une nouvelle conversation
  const initialStatus = orderId ? "order_pending_acceptance" : "pre_purchase";
  const { data: newConv, error } = await supabase
    .from("marketplace_conversations")
    .insert({
      buyer_id: buyerId,
      supplier_id: supplierId,
      product_id: productId || null,
      order_id: orderId || null,
      status: initialStatus,
      warning_acknowledged_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !newConv) return null;

  // Si liée à une commande, initialiser les délais et envoyer un message système
  if (orderId) {
    const deadline = calculateAcceptanceDeadline().toISOString();
    await supabase
      .from("marketplace_orders")
      .update({ acceptance_deadline: deadline })
      .eq("id", orderId);

    await insertMarketplaceMessage({
      conversationId: newConv.id,
      senderId: buyerId,
      senderRole: "system",
      messageType: "system",
      body: getStatusChangeSystemMessage("order_pending_acceptance"),
    });
  }

  return getMarketplaceConversationById(newConv.id, buyerId);
}

/**
 * Récupère une conversation par son ID avec vérification d'autorisation
 */
export async function getMarketplaceConversationById(
  conversationId: string,
  userId: string,
  isAdmin: boolean = false
): Promise<MarketplaceConversation | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data: conv, error } = await supabase
    .from("marketplace_conversations")
    .select(`
      id,
      product_id,
      buyer_id,
      supplier_id,
      order_id,
      status,
      warning_acknowledged_at,
      last_message_at,
      last_message_preview,
      buyer_unread_count,
      supplier_unread_count,
      created_at,
      updated_at,
      marketplace_products (
        id,
        title,
        price_xof,
        media,
        category
      ),
      marketplace_suppliers (
        id,
        user_id,
        business_name,
        logo_url,
        rating,
        certification_status,
        call_available
      )
    `)
    .eq("id", conversationId)
    .single();

  if (error || !conv) return null;
  const rawConv: any = conv;

  const supplierObj = Array.isArray(rawConv.marketplace_suppliers)
    ? rawConv.marketplace_suppliers[0]
    : rawConv.marketplace_suppliers;
  const productObj = Array.isArray(rawConv.marketplace_products)
    ? rawConv.marketplace_products[0]
    : rawConv.marketplace_products;

  // Contrôle d'accès strict : l'utilisateur doit être acheteur, vendeur ou admin (sur litige)
  const isBuyer = rawConv.buyer_id === userId;
  const isSupplier = supplierObj?.user_id === userId;

  if (!isBuyer && !isSupplier && !isAdmin) {
    return null;
  }

  // Informations sur la commande liée
  let orderInfo: MarketplaceOrderInfo | null = null;
  if (rawConv.order_id) {
    const { data: orderData } = await supabase
      .from("marketplace_orders")
      .select("id, product_id, total_xof, status, payment_mode, acceptance_deadline, auto_validation_deadline, revisions_used, revisions_max, delivered_at, disputed_at, created_at")
      .eq("id", rawConv.order_id)
      .single();

    if (orderData) {
      orderInfo = {
        id: orderData.id,
        product_id: orderData.product_id,
        total_xof: orderData.total_xof,
        status: orderData.status,
        payment_mode: orderData.payment_mode || "full",
        acceptance_deadline: orderData.acceptance_deadline,
        auto_validation_deadline: orderData.auto_validation_deadline,
        revisions_used: orderData.revisions_used || 0,
        revisions_max: orderData.revisions_max || 2,
        delivered_at: orderData.delivered_at,
        disputed_at: orderData.disputed_at,
        created_at: orderData.created_at,
      };
    }
  }

  const buyer = await getUserProfile(rawConv.buyer_id);
  const prodMedia = Array.isArray(productObj?.media) ? productObj.media : [];
  const image = typeof prodMedia[0] === "string" ? prodMedia[0] : undefined;

  return {
    id: rawConv.id,
    product_id: rawConv.product_id,
    buyer_id: rawConv.buyer_id,
    supplier_id: rawConv.supplier_id,
    order_id: rawConv.order_id,
    status: rawConv.status,
    warning_acknowledged_at: rawConv.warning_acknowledged_at,
    last_message_at: rawConv.last_message_at,
    last_message_preview: rawConv.last_message_preview,
    buyer_unread_count: rawConv.buyer_unread_count || 0,
    supplier_unread_count: rawConv.supplier_unread_count || 0,
    created_at: rawConv.created_at,
    updated_at: rawConv.updated_at,
    buyer: buyer || undefined,
    supplier: supplierObj
      ? {
          id: supplierObj.id,
          user_id: supplierObj.user_id,
          business_name: supplierObj.business_name,
          logo_url: supplierObj.logo_url,
          rating: Number(supplierObj.rating || 5),
          certification_status: supplierObj.certification_status || "verified",
          call_available: supplierObj.call_available ?? true,
        }
      : undefined,
    product: productObj
      ? {
          id: productObj.id,
          title: productObj.title,
          price_xof: productObj.price_xof,
          category: productObj.category,
          image,
        }
      : undefined,
    order: orderInfo,
  };
}

/**
 * Récupère les messages d'une conversation (ordre chronologique)
 */
export async function getMarketplaceMessages(
  conversationId: string,
  userId: string,
  markAsRead: boolean = true
): Promise<MarketplaceMessage[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data: messages, error } = await supabase
    .from("marketplace_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !messages) return [];

  // Marquer comme lus les messages du destinataire
  if (markAsRead) {
    const now = new Date().toISOString();
    await supabase
      .from("marketplace_messages")
      .update({ read_at: now })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null);

    // Mettre à jour les compteurs de non-lus
    const { data: conv } = await supabase
      .from("marketplace_conversations")
      .select("buyer_id, supplier_id, marketplace_suppliers(user_id)")
      .eq("id", conversationId)
      .single();

    if (conv) {
      if (conv.buyer_id === userId) {
        await supabase
          .from("marketplace_conversations")
          .update({ buyer_unread_count: 0 })
          .eq("id", conversationId);
      } else {
        await supabase
          .from("marketplace_conversations")
          .update({ supplier_unread_count: 0 })
          .eq("id", conversationId);
      }
    }
  }

  // Hydrater les expéditeurs
  const senderIds = Array.from(new Set(messages.map((m: any) => m.sender_id)));
  const { data: senders } = await supabase
    .from("users")
    .select("id, nom, prenom, email")
    .in("id", senderIds);

  const sendersMap = new Map(
    (senders || []).map((s) => [
      s.id,
      {
        id: s.id,
        name: [s.prenom, s.nom].filter(Boolean).join(" ") || s.email || "Utilisateur",
      },
    ])
  );

  return messages.map((m: any) => ({
    id: m.id,
    conversation_id: m.conversation_id,
    sender_id: m.sender_id,
    sender_role: m.sender_role || "buyer",
    message_type: m.message_type || "text",
    body: m.body,
    media: m.media || [],
    is_delivery: Boolean(m.is_delivery),
    delivery_assets: m.delivery_assets || [],
    is_quick_reply: Boolean(m.is_quick_reply),
    call_meta: m.call_meta || {},
    moderation_status: m.moderation_status || "approved",
    moderation_reason: m.moderation_reason,
    read_at: m.read_at,
    created_at: m.created_at,
    sender: sendersMap.get(m.sender_id),
  }));
}

/**
 * Envoie un message dans la conversation (GARANTI IMMUTABLE)
 */
export async function insertMarketplaceMessage({
  conversationId,
  senderId,
  senderRole = "buyer",
  messageType = "text",
  body,
  media = [],
  isDelivery = false,
  deliveryAssets = [],
  isQuickReply = false,
  callMeta = {},
}: {
  conversationId: string;
  senderId: string;
  senderRole?: "buyer" | "supplier" | "system" | "admin";
  messageType?: "text" | "image" | "video" | "document" | "system" | "delivery" | "revision" | "call";
  body?: string | null;
  media?: MarketplaceAttachment[];
  isDelivery?: boolean;
  deliveryAssets?: MarketplaceAttachment[];
  isQuickReply?: boolean;
  callMeta?: any;
}): Promise<MarketplaceMessage | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const preview = body
    ? body.slice(0, 100)
    : isDelivery
    ? "📦 Livraison soumise"
    : messageType === "call"
    ? "📞 Appel"
    : media.length > 0
    ? `📎 ${media[0].name || "Fichier joint"}`
    : "Nouveau message";

  const { data: newMsg, error } = await supabase
    .from("marketplace_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      sender_role: senderRole,
      message_type: messageType,
      body: body || null,
      media: media || [],
      is_delivery: isDelivery,
      delivery_assets: deliveryAssets || [],
      is_quick_reply: isQuickReply,
      call_meta: callMeta || {},
      moderation_status: "approved",
    })
    .select("*")
    .single();

  if (error || !newMsg) return null;

  // Mettre à jour la conversation
  const now = new Date().toISOString();
  const { data: conv } = await supabase
    .from("marketplace_conversations")
    .select("buyer_id, buyer_unread_count, supplier_unread_count")
    .eq("id", conversationId)
    .single();

  const isBuyerSender = conv?.buyer_id === senderId;

  await supabase
    .from("marketplace_conversations")
    .update({
      last_message_at: now,
      last_message_preview: preview,
      updated_at: now,
      buyer_unread_count: isBuyerSender
        ? 0
        : (conv?.buyer_unread_count || 0) + 1,
      supplier_unread_count: isBuyerSender
        ? (conv?.supplier_unread_count || 0) + 1
        : 0,
    })
    .eq("id", conversationId);

  return {
    id: newMsg.id,
    conversation_id: newMsg.conversation_id,
    sender_id: newMsg.sender_id,
    sender_role: newMsg.sender_role,
    message_type: newMsg.message_type,
    body: newMsg.body,
    media: newMsg.media || [],
    is_delivery: Boolean(newMsg.is_delivery),
    delivery_assets: newMsg.delivery_assets || [],
    is_quick_reply: Boolean(newMsg.is_quick_reply),
    call_meta: newMsg.call_meta || {},
    moderation_status: newMsg.moderation_status,
    read_at: newMsg.read_at,
    created_at: newMsg.created_at,
  };
}
