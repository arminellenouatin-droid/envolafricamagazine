import type { MetadataRoute } from "next";
import { listPublishedArticles, listMagazines } from "@/lib/core-db";
import { readJobsDB } from "@/lib/jobs-db";
import { marketplaceSeed } from "@/lib/marketplace-seed";
import { readCrowdDB } from "@/lib/crowdfunding-db";
import { getSupabaseCompetitions } from "@/lib/awards-supabase";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://envolafrica.site";

  // 1. Pages statiques publiques principales
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/kiosque`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/emploi`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/emploi/offres`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/emploi/candidats`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/marketplace`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/marketplace/boutique`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/financement`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/africa-awards`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/africa-awards/competitions`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/africa-awards/gallery`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/africa-awards/rankings`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/africa-awards/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/africa-awards/partners`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/africa-awards/press`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/africa-awards/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/africa-awards/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/wab`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/wab/salons`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/salons`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/abonnement`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/don`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/affiliation`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/service`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/conditions`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
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

  // 4. Offres d'emploi Envol Africa Jobs
  let jobUrls: MetadataRoute.Sitemap = [];
  try {
    const jobs = readJobsDB().offers.filter((item: any) => item.status === "published");
    jobUrls = jobs.map((job: any) => ({
      url: `${baseUrl}/emploi/offres/${encodeURIComponent(job.id)}`,
      lastModified: job.updatedAt ? new Date(job.updatedAt) : new Date(job.createdAt || Date.now()),
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error generating jobs in sitemap:", error);
  }

  // 5. Produits Marketplace
  let productUrls: MetadataRoute.Sitemap = [];
  try {
    productUrls = marketplaceSeed.map((product: any) => ({
      url: `${baseUrl}/marketplace/produits/${encodeURIComponent(product.id)}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error generating marketplace in sitemap:", error);
  }

  // 6. Projets Crowdfunding
  let projectUrls: MetadataRoute.Sitemap = [];
  try {
    const crowd = readCrowdDB().projets.filter((item: any) => item.statut === "en_cours" || item.statut === "finance");
    projectUrls = crowd.map((projet: any) => ({
      url: `${baseUrl}/financement/projets/${encodeURIComponent(projet.id)}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error generating crowd projects in sitemap:", error);
  }

  // 7. Compétitions Africa Awards
  let competitionUrls: MetadataRoute.Sitemap = [];
  try {
    const awards = await getSupabaseCompetitions();
    if (awards?.competitions) {
      competitionUrls = awards.competitions.map((comp: any) => ({
        url: `${baseUrl}/africa-awards/competitions/${encodeURIComponent(comp.slug)}`,
        lastModified: new Date(),
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
