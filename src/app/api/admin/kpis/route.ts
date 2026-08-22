import { NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const DAY = 24 * 60 * 60 * 1000;

export async function GET() {
  const access = await getCurrentUserForAdmin("gerant");
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });
  const client = getSupabaseAdmin();
  if (!client) return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });

  try {
    const now = Date.now();
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const activeSince = new Date(now - 15 * 60 * 1000).toISOString();
    const dayAgo = new Date(now - DAY).toISOString();

    const [usersResult, registrationsResult, activeResult, sessionsResult, analyticsResult, ordersResult, donationsResult] = await Promise.all([
      client.from("users").select("id", { count: "exact", head: true }),
      client.from("users").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      client.from("session_events").select("user_id").eq("event_type", "heartbeat").gte("occurred_at", activeSince).limit(5000),
      client.from("session_events").select("event_type,occurred_at", { count: "exact", head: true }).gte("occurred_at", dayAgo),
      client.from("analytics_events").select("event_name,platform,value,currency,occurred_at").gte("occurred_at", dayAgo).limit(10000),
      client.from("orders").select("total,currency,status,created_at").gte("created_at", dayAgo).limit(10000),
      client.from("donations").select("amount,currency,status,created_at").gte("created_at", dayAgo).limit(10000),
    ]);
    const firstError = [usersResult, registrationsResult, activeResult, sessionsResult, analyticsResult, ordersResult, donationsResult].find((result) => result.error)?.error;
    if (firstError) throw firstError;

    const activeUsers = new Set((activeResult.data || []).map((item) => item.user_id).filter(Boolean)).size;
    const orders = (ordersResult.data || []) as Array<{ total: number; currency: string; status: string; created_at: string }>;
    const donations = (donationsResult.data || []) as Array<{ amount: number; currency: string; status: string; created_at: string }>;
    const paidOrders = orders.filter((order) => order.status === "paid");
    const paidDonations = donations.filter((donation) => donation.status === "paid");
    const analytics = (analyticsResult.data || []) as Array<{ event_name: string; platform: string; value?: number; currency?: string }>;
    const financialByPlatform: Record<string, { count: number; total: number; currency: string }> = {};
    const addFinancial = (platform: string, amount: number, currency: string) => {
      const key = platform || "ecosystem";
      financialByPlatform[key] ||= { count: 0, total: 0, currency: currency || "XOF" };
      financialByPlatform[key].count += 1;
      financialByPlatform[key].total += Number(amount || 0);
    };
    paidOrders.forEach((order) => addFinancial("magazine", Number(order.total), order.currency));
    paidDonations.forEach((donation) => addFinancial("don", Number(donation.amount), donation.currency));
    analytics.filter((event) => ["purchase", "donation", "vote", "gift", "contribution"].includes(event.event_name) && event.value).forEach((event) => addFinancial(event.platform, Number(event.value), event.currency || "XOF"));

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      users: { total: usersResult.count || 0, activeNow: activeUsers, offline: Math.max(0, (usersResult.count || 0) - activeUsers), registrationsToday: registrationsResult.count || 0 },
      sessions: { eventsLast24h: sessionsResult.count || 0 },
      commerce: { ordersToday: paidOrders.length, revenueToday: paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0), abandonedCartsLast24h: analytics.filter((event) => event.event_name === "cart_abandoned").length },
      donations: { countToday: paidDonations.length, totalToday: paidDonations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0) },
      financialByPlatform,
    });
  } catch (error) {
    console.error("Admin KPI query failed", error);
    return NextResponse.json({ error: "Impossible de calculer les KPI" }, { status: 500 });
  }
}
