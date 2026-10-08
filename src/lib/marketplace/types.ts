export type MarketplaceConversationStatus =
  | "pre_purchase"
  | "order_pending_acceptance"
  | "order_rejected"
  | "in_progress"
  | "delivered_pending_validation"
  | "revision_requested"
  | "completed"
  | "disputed"
  | "refunded";

export type MarketplaceSenderRole = "buyer" | "supplier" | "system" | "admin";

export type MarketplaceMessageType =
  | "text"
  | "image"
  | "video"
  | "document"
  | "system"
  | "delivery"
  | "revision"
  | "call";

export interface MarketplaceAttachment {
  id: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  moderationStatus?: "pending" | "approved" | "rejected";
}

export interface MarketplaceMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: MarketplaceSenderRole;
  message_type: MarketplaceMessageType;
  body: string | null;
  media: MarketplaceAttachment[];
  is_delivery: boolean;
  delivery_assets: MarketplaceAttachment[];
  is_quick_reply: boolean;
  call_meta?: {
    call_type?: "audio" | "video";
    duration_seconds?: number;
    status?: string;
  };
  moderation_status: "pending" | "approved" | "rejected";
  moderation_reason?: string | null;
  read_at?: string | null;
  created_at: string;
  client_msg_id?: string;
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
  error?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface MarketplaceOrderInfo {
  id: string;
  product_id?: string;
  total_xof: number;
  status: string;
  payment_mode: "full" | "installment";
  acceptance_deadline?: string | null;
  auto_validation_deadline?: string | null;
  revisions_used: number;
  revisions_max: number;
  delivered_at?: string | null;
  disputed_at?: string | null;
  created_at: string;
}

export interface MarketplaceConversation {
  id: string;
  product_id?: string | null;
  buyer_id: string;
  supplier_id: string;
  order_id?: string | null;
  status: MarketplaceConversationStatus;
  warning_acknowledged_at?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  buyer_unread_count: number;
  supplier_unread_count: number;
  created_at: string;
  updated_at: string;
  buyer?: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  supplier?: {
    id: string;
    user_id: string;
    business_name: string;
    logo_url?: string;
    rating: number;
    certification_status: string;
    call_available: boolean;
  };
  product?: {
    id: string;
    title: string;
    price_xof: number;
    image?: string;
    category: string;
  };
  order?: MarketplaceOrderInfo | null;
}

export interface MarketplaceCall {
  id: string;
  conversation_id: string;
  caller_id: string;
  receiver_id: string;
  call_type: "audio" | "video";
  status: "initiated" | "ringing" | "accepted" | "rejected" | "missed" | "ended";
  duration_seconds: number;
  created_at: string;
  ended_at?: string | null;
}

export interface MarketplaceDispute {
  id: string;
  conversation_id: string;
  order_id?: string | null;
  opened_by: string;
  reason: "non_compliant" | "delays" | "bypass_attempt" | "abusive_behavior" | "other";
  description: string;
  status: "open" | "resolved" | "dismissed";
  decision?: "release_funds" | "refund_buyer" | "dismissed" | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface MarketplaceQuickReply {
  id: string;
  supplier_id: string;
  title: string;
  content: string;
  created_at: string;
}
