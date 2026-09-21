import { NextResponse } from "next/server";
import { listPublishedArticles } from "@/lib/core-db";

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string) {
  return (unsafe || "").replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://www.envolafrica.site";
  const articles = await listPublishedArticles().catch(() => []);

  const itemsXml = articles.slice(0, 50).map((article: any) => {
    const title = escapeXml(article.title || "");
    const description = escapeXml((article.summary || article.content || "").replace(/<[^>]*>/g, "").slice(0, 300));
    const url = `${baseUrl}/article/${encodeURIComponent(article.slug)}`;
    const pubDate = new Date(article.publishedAt || article.createdAt || Date.now()).toUTCString();
    const author = escapeXml(article.author || "Envol Africa Magazine");
    const category = escapeXml(article.category || "Économie");

    return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${author}</author>
      <category>${category}</category>
      <description>${description}</description>
    </item>`;
  }).join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Envol Africa Magazine</title>
    <link>${baseUrl}</link>
    <description>Le magazine économique panafricain de référence : analyses, enquêtes, opportunités d'affaires en Afrique.</description>
    <language>fr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
