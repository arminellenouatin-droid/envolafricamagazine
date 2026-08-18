import fs from "fs";
import path from "path";
import { getSupabaseAdmin, isProductionRuntime } from "@/lib/supabase-admin";

const FILE = path.join(process.cwd(), "src", "data", "wab-subscriptions.json");

export type WabSubscription = {
  id: string;
  userId: string;
  planId: "wab-business";
  amountXof: 5000;
  currency: "XOF";
  status: "pending" | "active" | "expired" | "cancelled" | "failed";
  paymentId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
};

function reconcile(items: WabSubscription[]) {
  const now = Date.now();
  return items.map((item) => item.status === "active" && item.endDate && Date.parse(item.endDate) <= now ? { ...item, status: "expired" as const } : item);
}

function mapRow(row: Record<string, unknown>): WabSubscription {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    planId: "wab-business",
    amountXof: 5000,
    currency: "XOF",
    status: String(row.status ?? "pending") as WabSubscription["status"],
    paymentId: typeof row.payment_id === "string" ? row.payment_id : undefined,
    startDate: typeof row.start_date === "string" ? row.start_date : undefined,
    endDate: typeof row.end_date === "string" ? row.end_date : undefined,
    createdAt: String(row.created_at),
  };
}

export async function readWabSubscriptions(userId?: string): Promise<WabSubscription[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    let query = supabase.from("wab_business_subscriptions").select("id,user_id,plan_id,amount_xof,currency,status,payment_id,start_date,end_date,created_at").order("created_at", { ascending: false }).limit(5000);
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query;
    if (error) throw error;
    return reconcile((data ?? []).map((row) => mapRow(row as Record<string, unknown>)));
  }
  if (isProductionRuntime()) throw new Error("Stockage Supabase des abonnements WAB non configuré.");
  try {
    if (!fs.existsSync(FILE)) {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, "[]\n");
    }
    const items = reconcile(JSON.parse(fs.readFileSync(FILE, "utf8")) as WabSubscription[]);
    return userId ? items.filter((item) => item.userId === userId) : items;
  } catch {
    return [];
  }
}

export async function writeWabSubscriptions(items: WabSubscription[]) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    for (const item of items) {
      const { error } = await supabase.from("wab_business_subscriptions").upsert({ id: item.id, user_id: item.userId, plan_id: item.planId, amount_xof: item.amountXof, currency: item.currency, status: item.status, payment_id: item.paymentId ?? null, start_date: item.startDate ?? null, end_date: item.endDate ?? null, created_at: item.createdAt }, { onConflict: "id" });
      if (error) throw error;
    }
    return;
  }
  if (isProductionRuntime()) throw new Error("Stockage Supabase des abonnements WAB non configuré.");
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2));
}

export async function getActiveWabBusinessSubscription(userId: string) {
  const items = await readWabSubscriptions(userId);
  return items.find((item) => item.planId === "wab-business" && item.status === "active" && (!item.endDate || Date.parse(item.endDate) > Date.now())) ?? null;
}
