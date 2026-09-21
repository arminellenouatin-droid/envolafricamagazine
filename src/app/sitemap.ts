import type { MetadataRoute } from "next";
import { listPublishedArticles, listMagazines } from "@/lib/core-db";
import { readJobsDB } from "@/lib/jobs-db";
import { marketplaceSeed } from "@/lib/marketplace-seed";
import { readCrowdDB } from "@/lib/crowdfunding-db";
import { getSupabaseCompetitions } from "@/lib/awards-supabase";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://www.envolafrica.site";

  const staticLastMod = new Date("2026-09-20T00:00:00Z");

  // 1. Pages statiques publiques principales
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: staticLastMod, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/kiosque`, lastModified: staticLastMod, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/emploi`, lastModified: staticLastMod, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/emploi/offres`, lastModified: staticLastMod, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/emploi/candidats`, lastModified: staticLastMod, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/marketplace`, lastModified: staticLastMod, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/marketplace/boutique`, lastModified: staticLastMod, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/financement`, lastModified: staticLastMod, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/africa-awards`, lastModified: staticLastMod, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/africa-awards/competitions`, lastModified: staticLastMod, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/africa-awards/gallery`, lastModified: staticLastMod, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/africa-awards/rankings`, lastModified: staticLastMod, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/africa-awards/about`, lastModified: staticLastMod, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/africa-awards/partners`, lastModified: staticLastMod, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/africa-awards/press`, lastModified: staticLastMod, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/africa-awards/terms`, lastModified: staticLastMod, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/africa-awards/privacy`, lastModified: staticLastMod, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/wab`, lastModified: staticLastMod, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/wab/salons`, lastModified: staticLastMod, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/salons`, lastModified: staticLastMod, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/abonnement`, lastModified: staticLastMod, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/don`, lastModified: staticLastMod, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/affiliation`, lastModified: staticLastMod, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: staticLastMod, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/service`, lastModified: staticLastMod, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/a-propos`, lastModified: staticLastMod, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/mentions-legales`, lastModified: staticLastMod, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/politique-de-confidentialite`, lastModified: staticLastMod, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/conditions`, lastModified: staticLastMod, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/cookies`, lastModified: staticLastMod, changeFrequency: "yearly", priority: 0.4 },
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

  // 4. Offres d'emploi Envol Africa Jobs (exclure les identifiants de test seed job-*)
  let jobUrls: MetadataRoute.Sitemap = [];
  try {
    const jobs = readJobsDB().offers.filter((item: any) => item.status === "published" && !item.id.startsWith("job-"));
    jobUrls = jobs.map((job: any) => ({
      url: `${baseUrl}/emploi/offres/${encodeURIComponent(job.id)}`,
      lastModified: job.updatedAt ? new Date(job.updatedAt) : new Date(job.createdAt || Date.now()),
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error generating jobs in sitemap:", error);
  }

  // 5. Produits Marketplace (ne pas indexer les seed-* de démonstration)
  const productUrls: MetadataRoute.Sitemap = [];

  // 6. Projets Crowdfunding vérifiés
  let projectUrls: MetadataRoute.Sitemap = [];
  try {
    const crowd = readCrowdDB().projets.filter((item: any) => (item.statut === "en_cours" || item.statut === "finance") && !item.id.startsWith("seed-"));
    projectUrls = crowd.map((projet: any) => ({
      url: `${baseUrl}/financement/projets/${encodeURIComponent(projet.id)}`,
      lastModified: staticLastMod,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error generating crowd projects in sitemap:", error);
  }

  // 7. Compétitions Africa Awards (éditions actives uniquement, exclure projections lointaines 2027-2029)
  let competitionUrls: MetadataRoute.Sitemap = [];
  try {
    const awards = await getSupabaseCompetitions();
    if (awards?.competitions) {
      competitionUrls = awards.competitions
        .filter((comp: any) => !comp.slug.includes("2027") && !comp.slug.includes("2028") && !comp.slug.includes("2029"))
        .map((comp: any) => ({
          url: `${baseUrl}/africa-awards/competitions/${encodeURIComponent(comp.slug)}`,
          lastModified: staticLastMod,
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
