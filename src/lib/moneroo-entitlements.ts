import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function activateMonerooEntitlements(paymentId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const };
  const now = new Date();
  const results: Record<string, boolean> = {};

  const unlock = await supabase.from("jobs_unlocks").update({ status: "paid", paid_at: now.toISOString() }).eq("provider_payment_id", paymentId).in("status", ["pending", "paid"]).select("id").maybeSingle();
  results.jobsUnlock = Boolean(unlock.data);

  const jobSubscription = await supabase.from("jobs_subscriptions").select("id,plan_code").eq("provider_payment_id", paymentId).in("status", ["pending", "active"]).maybeSingle();
  if (jobSubscription.data) {
    const code = String(jobSubscription.data.plan_code || "");
    const end = new Date(now);
    if (code.includes("24h")) end.setHours(end.getHours() + 24); else if (code.includes("week")) end.setDate(end.getDate() + 7); else if (code.includes("month")) end.setDate(end.getDate() + 30);
    const updated = await supabase.from("jobs_subscriptions").update({ status: "active", starts_at: now.toISOString(), ends_at: end.toISOString() }).eq("id", jobSubscription.data.id).select("id").maybeSingle();
    results.jobsSubscription = Boolean(updated.data);
  }

  for (const table of ["jobs_boosts", "wab_boosts", "marketplace_boosts", "crowdfunding_boosts"]) {
    const pending = await supabase.from(table).select("id,duration_days,post_id").eq("provider_payment_id", paymentId).in("status", ["pending", "active"]).maybeSingle();
    if (pending.data) {
      const duration = Number(pending.data.duration_days || 7);
      const endsAt = new Date(now.getTime() + duration * 86400000).toISOString();
      const updated = await supabase.from(table).update({ status: "active", starts_at: now.toISOString(), ends_at: endsAt }).eq("id", pending.data.id).select("id").maybeSingle();
      results[table] = Boolean(updated.data);
      if (table === "wab_boosts" && pending.data.post_id) await supabase.from("wab_posts").update({ is_boosted: true, boost_ends_at: endsAt }).eq("id", pending.data.post_id);
    }
  }

  const marketplaceOrder = await supabase.from("marketplace_orders").update({ status: "paid", updated_at: now.toISOString() }).eq("provider_payment_id", paymentId).eq("status", "pending_payment").select("id").maybeSingle();
  results.marketplaceOrder = Boolean(marketplaceOrder.data);
  const installment = await supabase.from("marketplace_installments").update({ status: "paid", paid_at: now.toISOString() }).eq("provider_payment_id", paymentId).eq("status", "due").select("id").maybeSingle();
  results.marketplaceInstallment = Boolean(installment.data);

  return { configured: true as const, results };
}
