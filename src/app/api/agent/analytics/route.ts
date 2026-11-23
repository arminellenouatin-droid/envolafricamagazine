import { NextRequest, NextResponse } from "next/server";
import { authenticateAgentRequest } from "@/lib/agent-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticateAgentRequest(req, "analytics:read");
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const client = getSupabaseAdmin();
  if (client) {
    try {
      const [
        articlesRes,
        magazinesRes,
        usersRes,
        ordersRes,
        donationsRes,
      ] = await Promise.all([
        client.from("articles").select("id, title, slug, views, likes, category, is_published, created_at"),
        client.from("magazines").select("id, numero, title, date, year, category"),
        client.from("users").select("id, role, country, subscription, created_at"),
        client.from("orders").select("id, total, currency, status, items, created_at"),
        client.from("donations").select("id, amount, currency, status"),
      ]);

      const articles = articlesRes.data || [];
      const magazines = magazinesRes.data || [];
      const users = usersRes.data || [];
      const orders = ordersRes.data || [];
      const donations = donationsRes.data || [];

      // Analyse Articles & Lectorat
      const publishedArticles = articles.filter((a) => a.is_published);
      const totalViews = publishedArticles.reduce((sum, a) => sum + (Number(a.views) || 0), 0);
      const totalLikes = publishedArticles.reduce((sum, a) => sum + (Number(a.likes) || 0), 0);

      const topArticles = [...publishedArticles]
        .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
        .slice(0, 5)
        .map((a) => ({
          title: a.title,
          slug: a.slug,
          views: Number(a.views) || 0,
          likes: Number(a.likes) || 0,
          category: a.category,
        }));

      // Distribution par catégories
      const categoryCounts: Record<string, { count: number; views: number }> = {};
      publishedArticles.forEach((a) => {
        const cat = a.category || "Autre";
        if (!categoryCounts[cat]) categoryCounts[cat] = { count: 0, views: 0 };
        categoryCounts[cat].count += 1;
        categoryCounts[cat].views += Number(a.views) || 0;
      });

      // Analyse Utilisateurs & Abonnés
      const activeSubscribers = users.filter((u) => u.subscription?.status === "active").length;
      const userCountries: Record<string, number> = {};
      users.forEach((u) => {
        const c = u.country || "Non renseigné";
        userCountries[c] = (userCountries[c] || 0) + 1;
      });

      // Analyse Financière & Ventes
      const paidOrders = orders.filter((o) => o.status === "paid");
      const totalRevenueXof = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const totalDonationsXof = donations
        .filter((d) => d.status === "paid")
        .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

      return NextResponse.json({
        success: true,
        generatedAt: new Date().toISOString(),
        overview: {
          totalUsers: users.length,
          activeSubscribers,
          totalArticles: articles.length,
          publishedArticles: publishedArticles.length,
          totalMagazines: magazines.length,
          totalReads: totalViews,
          totalLikes,
        },
        financials: {
          totalOrders: orders.length,
          paidOrders: paidOrders.length,
          conversionRate: orders.length > 0 ? `${((paidOrders.length / orders.length) * 100).toFixed(1)}%` : "0%",
          totalRevenueXof,
          totalDonationsXof,
          averageOrderValueXof: paidOrders.length > 0 ? Math.round(totalRevenueXof / paidOrders.length) : 0,
        },
        editorialInsights: {
          top5Articles: topArticles,
          categoryBreakdown: categoryCounts,
          latestMagazine: magazines[0] ? `N°${magazines[0].numero} - ${magazines[0].title}` : "Aucun",
        },
        audienceDemographics: {
          topCountries: Object.entries(userCountries)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([country, count]) => ({ country, count })),
        },
      });
    } catch (e: any) {
      console.error("[agent/analytics] Erreur d'analyse:", e);
      return NextResponse.json({ error: "Impossible de générer l'analyse de données" }, { status: 500 });
    }
  }

  // Fallback DB locale
  const db = readDB();
  const publishedArticles = db.articles.filter((a) => a.isPublished);
  const totalViews = publishedArticles.reduce((s, a) => s + (a.views || 0), 0);
  const paidOrders = db.orders.filter((o) => o.status === "paid");
  const revenue = paidOrders.reduce((s, o) => s + (o.total || 0), 0);

  return NextResponse.json({
    success: true,
    generatedAt: new Date().toISOString(),
    overview: {
      totalUsers: db.users.length,
      activeSubscribers: db.users.filter((u) => u.subscription?.status === "active").length,
      totalArticles: db.articles.length,
      publishedArticles: publishedArticles.length,
      totalMagazines: db.magazines.length,
      totalReads: totalViews,
      totalLikes: publishedArticles.reduce((s, a) => s + (a.likes || 0), 0),
    },
    financials: {
      totalOrders: db.orders.length,
      paidOrders: paidOrders.length,
      totalRevenueXof: revenue,
      totalDonationsXof: db.donations.filter((d) => d.status === "paid").reduce((s, d) => s + (d.amount || 0), 0),
    },
    editorialInsights: {
      top5Articles: [...publishedArticles]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)
        .map((a) => ({ title: a.title, slug: a.slug, views: a.views, likes: a.likes, category: a.category })),
      latestMagazine: db.magazines[0] ? `N°${db.magazines[0].numero} - ${db.magazines[0].title}` : "Aucun",
    },
  });
}
