import type { Metadata } from "next";
import { listPublishedArticles } from "@/lib/core-db";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Recherche | Envol Africa Magazine",
  description: "Rechercher des articles, analyses économiques et opportunités dans Envol Africa Magazine.",
  robots: {
    index: false,
    follow: true,
  },
};

type SearchPageProps = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = ((await searchParams).q || "").trim();
  const rawArticles = await listPublishedArticles();

  const articles = rawArticles.map((article: any) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    category: article.category,
    author: article.author,
    image: article.image,
    views: article.views || 0,
    likes: article.likes || 0,
    createdAt: article.createdAt,
    publishedAt: article.publishedAt,
    tags: article.tags || [],
  }));

  return (
    <main className="min-h-screen bg-[#fcf9f8] px-5 py-12 md:px-10 md:py-16">
      <SearchClient initialArticles={articles} initialQuery={query} />
    </main>
  );
}
