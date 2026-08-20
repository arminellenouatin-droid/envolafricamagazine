import crypto from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function hashToken(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }

export async function settleMarketplaceOrderByPayment(orderId: string, paymentId: string, amount: number, currency: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Base Marketplace indisponible.");
  const { data: order, error: orderError } = await supabase.from("marketplace_orders").select("id,buyer_id,product_id,total_xof,status,provider_payment_id").eq("id", orderId).single();
  if (orderError || !order) throw new Error("Commande Marketplace introuvable.");
  if (currency.toUpperCase() !== "XOF" || amount !== Number(order.total_xof)) throw new Error("Le montant Marketplace ne correspond pas à la commande.");
  if (order.status !== "paid" && order.status !== "received") {
    const { error } = await supabase.from("marketplace_orders").update({ status: "paid", provider_payment_id: paymentId, updated_at: new Date().toISOString() }).eq("id", order.id);
    if (error) throw error;
  }
  const { data: product, error: productError } = await supabase.from("marketplace_products").select("id,product_type,delivery_type,digital_file_url,digital_external_url,digital_access_instructions,digital_download_limit,training_access_days").eq("id", order.product_id).single();
  if (productError || !product) throw new Error("Produit Marketplace introuvable.");
  const digital = ["digital", "downloadable", "training"].includes(String(product.product_type)) || ["download", "external_link", "online"].includes(String(product.delivery_type));
  if (!digital) return { orderId: order.id, digital: false as const };
  const { data: existing } = await supabase.from("marketplace_download_tokens").select("id").eq("order_id", order.id).limit(1).maybeSingle();
  if (existing) return { orderId: order.id, digital: true as const, issued: false as const };
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const { error: tokenError } = await supabase.from("marketplace_download_tokens").insert({ order_id: order.id, product_id: product.id, buyer_id: order.buyer_id, token_hash: hashToken(rawToken), max_downloads: Math.min(50, Math.max(1, Number(product.digital_download_limit) || 5)), expires_at: new Date(Date.now() + (Number(product.training_access_days) || 365) * 24 * 60 * 60 * 1000).toISOString() });
  if (tokenError) throw tokenError;
  return { orderId: order.id, digital: true as const, issued: true as const, token: rawToken, instructions: product.digital_access_instructions || null };
}

export { hashToken };
