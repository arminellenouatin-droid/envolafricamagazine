import type { MetadataRoute } from "next";
import { listPublishedArticles, listMagazines } from "@/lib/core-db";
import { listPublishedJobsOffers } from "@/lib/jobs-supabase";
import { readJobsDB } from "@/lib/jobs-db";
import { getCrowdProjects } from "@/lib/crowdfunding-supabase";
import { readCrowdDB } from "@/lib/crowdfunding-db";
import { getSupabaseCompetitions } from "@/lib/awards-supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://www.envolafrica.site";

  const now = new Date();

  // 1. Pages statiques publiques principales
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/kiosque`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/emploi`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/emploi/offres`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/emploi/candidats`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/marketplace`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/marketplace/boutique`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/financement`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/africa-awards`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/africa-awards/competitions`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/africa-awards/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/africa-awards/rankings`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/africa-awards/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/africa-awards/partners`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/africa-awards/press`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/africa-awards/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/africa-awards/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/wab`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/wab/salons`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/salons`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/abonnement`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/don`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/affiliation`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/service`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/a-propos`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/mentions-legales`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/politique-de-confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/conditions`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  // 2. Articles éditoriaux
  let articleUrls: MetadataRoute.Sitemap = [];
  try {
    const articles = await listPublishedArticles();
    articleUrls = articles.map((article: any) => ({
      url: `${baseUrl}/article/${encodeURIComponent(article.slug)}`,
      lastModified: article.publishedAt ? new Date(article.publishedAt) : new Date(article.createdAt || Date.now()),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error generating articles in sitemap:", error);
  }

  // 3. Magazines Kiosque
  let magazineUrls: MetadataRoute.Sitemap = [];
  try {
    const magazines = await listMagazines();
    magazineUrls = (magazines || []).map((mag: any) => ({
      url: `${baseUrl}/kiosque/${encodeURIComponent(mag.id)}`,
      lastModified: mag.updatedAt ? new Date(mag.updatedAt) : new Date(mag.createdAt || Date.now()),
      changeFrequency: "monthly",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error generating magazines in sitemap:", error);
  }

  // 4. Offres d'emploi Envol Africa Jobs (depuis Supabase en priorité)
  let jobUrls: MetadataRoute.Sitemap = [];
  try {
    const jobsResult = await listPublishedJobsOffers();
    const jobs = jobsResult.offers && jobsResult.offers.length > 0
      ? jobsResult.offers.filter((item: any) => !item.id.startsWith("job-"))
      : readJobsDB().offers.filter((item: any) => item.status === "published" && !item.id.startsWith("job-"));

    jobUrls = jobs.map((job: any) => ({
      url: `${baseUrl}/emploi/offres/${encodeURIComponent(job.id)}`,
      lastModified: job.publishedAt ? new Date(job.publishedAt) : (job.updatedAt ? new Date(job.updatedAt) : new Date(job.createdAt || Date.now())),
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error generating jobs in sitemap:", error);
  }

  // 5. Produits Marketplace (publiés uniquement, pas les seeds)
  let productUrls: MetadataRoute.Sitemap = [];
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: products } = await supabase
        .from("marketplace_products")
        .select("id,slug,updated_at,created_at,status")
        .eq("status", "published")
        .limit(200);

      if (products && products.length > 0) {
        productUrls = products
          .filter((p: any) => !String(p.id).startsWith("seed-"))
          .map((prod: any) => ({
            url: `${baseUrl}/marketplace/produits/${encodeURIComponent(prod.slug || prod.id)}`,
            lastModified: prod.updated_at ? new Date(prod.updated_at) : (prod.created_at ? new Date(prod.created_at) : new Date()),
            changeFrequency: "weekly",
            priority: 0.8,
          }));
      }
    }
  } catch (error) {
    console.error("Error generating products in sitemap:", error);
  }

  // 6. Projets Crowdfunding vérifiés (depuis Supabase en priorité)
  let projectUrls: MetadataRoute.Sitemap = [];
  try {
    const crowdResult = await getCrowdProjects({ statut: "en_cours" });
    const crowd = crowdResult.configured && crowdResult.projets.length > 0
      ? crowdResult.projets.filter((item: any) => !item.id.startsWith("seed-"))
      : readCrowdDB().projets.filter((item: any) => (item.statut === "en_cours" || item.statut === "finance") && !item.id.startsWith("seed-"));

    projectUrls = crowd.map((projet: any) => ({
      url: `${baseUrl}/financement/projets/${encodeURIComponent(projet.id)}`,
      lastModified: projet.createdAt ? new Date(projet.createdAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error generating crowd projects in sitemap:", error);
  }

  // 7. Compétitions Africa Awards (éditions actives uniquement)
  let competitionUrls: MetadataRoute.Sitemap = [];
  try {
    const awards = await getSupabaseCompetitions();
    if (awards?.competitions) {
      competitionUrls = awards.competitions
        .filter((comp: any) => !comp.slug.includes("2027") && !comp.slug.includes("2028") && !comp.slug.includes("2029"))
        .map((comp: any) => ({
          url: `${baseUrl}/africa-awards/competitions/${encodeURIComponent(comp.slug)}`,
          lastModified: comp.updated_at ? new Date(comp.updated_at) : (comp.created_at ? new Date(comp.created_at) : new Date()),
          changeFrequency: "weekly",
          priority: 0.8,
        }));
    }
  } catch (error) {
    console.error("Error generating awards competitions in sitemap:", error);
  }

  return [
    ...staticPages,
    ...articleUrls,
    ...magazineUrls,
    ...jobUrls,
    ...productUrls,
    ...projectUrls,
    ...competitionUrls,
  ];
}
